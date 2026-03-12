import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenAiService } from '../openai/openai.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

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
    const embedding = await this.openAiService.generateEmbedding(textForEmbedding);

    // Get existing folders for smart classification
    const { data: existingFolders } = await supabase
      .from('folders')
      .select('id, name')
      .eq('user_id', userId);

    const folderNames = (existingFolders || []).map((f) => f.name);

    // Generate tags and folder suggestion
    const { tags, suggestedFolder } =
      await this.openAiService.generateTagsAndFolder(
        dto.title,
        dto.description || '',
        dto.url,
        folderNames,
      );

    // Find or create the suggested folder
    let folderId: string | null = null;
    const existingFolder = (existingFolders || []).find(
      (f) => f.name.toLowerCase() === suggestedFolder.toLowerCase(),
    );

    if (existingFolder) {
      folderId = existingFolder.id;
    } else {
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
        embedding: JSON.stringify(embedding),
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

    const { data, error } = await supabase.rpc('match_bookmarks', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
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
