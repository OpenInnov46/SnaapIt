import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenAiService } from '../openai/openai.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

/** Cosine similarity between two equal-length vectors (JS fallback for pgvector). */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function normalizeEmbedding(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is number => typeof v === 'number');
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is number => typeof v === 'number');
      }
    } catch {
      return [];
    }
  }

  return [];
}

@Injectable()
export class BookmarksService {
  constructor(
    private supabaseService: SupabaseService,
    private openAiService: OpenAiService,
  ) {}

  async create(dto: CreateBookmarkDto, userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    // Generate embedding from concatenated text
    const textForEmbedding = [dto.title, dto.description, dto.url]
      .filter(Boolean)
      .join(' ');

    let embedding: number[] = [];
    let tags: string[] = [];
    let suggestedFolder = 'Uncategorized';

    try {
      embedding = await this.openAiService.generateEmbedding(textForEmbedding);

      // Get existing folders for smart classification
      const { data: existingFolders } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', userId);

      const folderNames = (existingFolders || []).map((f) => f.name);

      // Generate tags and folder suggestion
      const aiResult = await this.openAiService.generateTagsAndFolder(
        dto.title,
        dto.description || '',
        dto.url,
        folderNames,
      );
      tags = aiResult.tags;
      suggestedFolder = aiResult.suggestedFolder;
    } catch (aiError) {
      console.warn('[create] AI enrichment failed, saving bookmark without tags/embedding:', aiError.message);
    }

    // Get or create the suggested folder (re-fetch outside AI try-catch to always have fresh data)
    const { data: foldersForPlacement } = await supabase
      .from('folders')
      .select('id, name')
      .eq('user_id', userId);

    // Find or create the suggested folder
    let folderId: string | null = null;
    const existingFolder = (foldersForPlacement || []).find(
      (f) => f.name.toLowerCase() === suggestedFolder.toLowerCase(),
    );

    if (existingFolder) {
      folderId = existingFolder.id;
    } else if (suggestedFolder !== 'Uncategorized') {
      const { data: newFolder } = await supabase
        .from('folders')
        .insert({ user_id: userId, name: suggestedFolder })
        .select('id')
        .single();
      if (newFolder) folderId = newFolder.id;
    }

    // Insert the bookmark
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        url: dto.url,
        title: dto.title,
        description: dto.description || null,
        favicon_url: dto.favicon_url || null,
        folder_id: folderId,
        tags,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
      })
      .select('id, url, title, description, favicon_url, folder_id, tags, created_at')
      .single();

    if (error) throw new Error(error.message || 'Failed to save bookmark');
    return data;
  }

  async findAll(userId: string, token: string, page = 1, limit = 20) {
    const supabase = this.supabaseService.getClientWithAuth(token);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('bookmarks')
      .select(
        'id, url, title, description, favicon_url, folder_id, tags, created_at, updated_at',
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message || 'Failed to fetch bookmarks');
    return { bookmarks: data, total: count };
  }

  async search(
    query: string,
    userId: string,
    token: string,
    threshold = 0.5,
    limit = 10,
  ) {
    const supabase = this.supabaseService.getClientWithAuth(token);
    const queryLower = query.toLowerCase().trim();

    // 1. Text search — fast ILIKE on title, description, url
    const { data: textMatches } = await supabase
      .from('bookmarks')
      .select('id, url, title, description, favicon_url, folder_id, tags, created_at')
      .eq('user_id', userId)
      .or(`title.ilike.%${queryLower}%,description.ilike.%${queryLower}%,url.ilike.%${queryLower}%`);

    // Build a map of text matches with computed text similarity
    const textMatchMap = new Map<string, number>();
    for (const b of textMatches ?? []) {
      const titleLower = (b.title || '').toLowerCase();
      const urlLower = (b.url || '').toLowerCase();
      const descLower = (b.description || '').toLowerCase();

      let textScore: number;
      if (titleLower === queryLower || urlLower === queryLower) {
        textScore = 1.0; // exact match
      } else if (titleLower.includes(queryLower) || urlLower.includes(queryLower)) {
        // Partial match — score based on how much of the field the query covers
        const bestField = titleLower.includes(queryLower) ? titleLower : urlLower;
        textScore = 0.8 + 0.2 * (queryLower.length / bestField.length);
      } else if (descLower.includes(queryLower)) {
        textScore = 0.7;
      } else {
        textScore = 0.6;
      }
      textMatchMap.set(b.id, textScore);
    }

    // 2. Semantic search via embeddings
    let semanticResults: Array<{ id: string; similarity: number; [k: string]: any }> = [];
    try {
      const queryEmbedding = await this.openAiService.generateEmbedding(query);

      const { data, error } = await supabase.rpc('match_bookmarks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit * 2,
        p_user_id: userId,
      });

      if (!error) {
        semanticResults = data ?? [];
      } else {
        console.warn('[search] pgvector RPC failed, using JS fallback:', error.message);
        // JS fallback
        const { data: allBookmarks } = await supabase
          .from('bookmarks')
          .select('id, url, title, description, favicon_url, folder_id, tags, created_at, embedding')
          .eq('user_id', userId);

        semanticResults = (allBookmarks ?? [])
          .map((b) => ({ ...b, embedding: normalizeEmbedding(b.embedding) }))
          .filter((b) => b.embedding.length > 0)
          .map((b) => ({
            ...b,
            similarity: cosineSimilarity(queryEmbedding, b.embedding),
            embedding: undefined,
          }))
          .filter((b) => b.similarity >= threshold);
      }
    } catch (embeddingError) {
      console.warn('[search] Embedding generation failed, using text-only results:', embeddingError.message);
    }

    // 3. Merge results — text score takes priority, semantic fills in
    const mergedMap = new Map<string, any>();

    // Add text matches first
    for (const b of textMatches ?? []) {
      mergedMap.set(b.id, { ...b, similarity: textMatchMap.get(b.id) || 0.6 });
    }

    // Merge semantic results — use best score between text and semantic
    for (const b of semanticResults) {
      const existing = mergedMap.get(b.id);
      if (existing) {
        existing.similarity = Math.max(existing.similarity, b.similarity);
      } else {
        const { embedding, ...rest } = b;
        mergedMap.set(b.id, rest);
      }
    }

    return Array.from(mergedMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async update(
    id: string,
    updates: Partial<{ title: string; description: string; tags: string[]; folder_id: string }>,
    userId: string,
    token: string,
  ) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { data, error } = await supabase
      .from('bookmarks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to update bookmark');
    return data;
  }

  async remove(id: string, userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message || 'Failed to delete bookmark');
    return { deleted: true };
  }
}
