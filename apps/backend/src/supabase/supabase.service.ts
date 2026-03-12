import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow('SUPABASE_URL'),
      this.configService.getOrThrow('SUPABASE_ANON_KEY'),
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getClientWithAuth(token: string): SupabaseClient {
    return createClient(
      this.configService.getOrThrow('SUPABASE_URL'),
      this.configService.getOrThrow('SUPABASE_ANON_KEY'),
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );
  }
}
