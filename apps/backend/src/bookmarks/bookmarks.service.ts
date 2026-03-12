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

    if (error) throw error;
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

    if (error) throw error;
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

    const queryEmbedding = await this.openAiService.generateEmbedding(query);

    // Try pgvector RPC first (fast, requires pgvector extension in Supabase)
    try {
      const { data, error } = await supabase.rpc('match_bookmarks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit,
        p_user_id: userId,
      });

      if (!error) return data ?? [];
      // If the RPC doesn't exist or pgvector isn't enabled, fall through to JS fallback
      console.warn('[search] pgvector RPC failed, falling back to JS cosine similarity:', error.message);
    } catch (rpcError) {
      console.warn('[search] pgvector unavailable, using JS fallback:', rpcError.message);
    }

    // JS fallback: fetch all bookmarks with their stored embeddings and rank in-process
    const { data: allBookmarks, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id, url, title, description, favicon_url, folder_id, tags, created_at, embedding')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const results = (allBookmarks ?? [])
      .map((b) => {
        const embedding = normalizeEmbedding(b.embedding);
        return {
          ...b,
          embedding,
        };
      })
      .filter((b) => b.embedding.length > 0)
      .map((b) => ({
        ...b,
        similarity: cosineSimilarity(queryEmbedding, b.embedding),
        embedding: undefined, // don't expose raw embedding to client
      }))
      .filter((b) => b.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
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

    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { deleted: true };
  }
}
