import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FoldersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { data, error } = await supabase
      .from('folders')
      .select('id, name, icon, color, created_at')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data;
  }

  async create(
    body: { name: string; icon?: string; color?: string },
    userId: string,
    token: string,
  ) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name: body.name,
        icon: body.icon || null,
        color: body.color || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { deleted: true };
  }
}
