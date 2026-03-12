import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow('SUPABASE_URL'),
      this.configService.getOrThrow('SUPABASE_ANON_KEY'),
    );

    // Admin client uses the service role key — grants full DB access,
    // used only for privileged operations like first-user bootstrapping.
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (serviceRoleKey) {
      this.adminClient = createClient(
        this.configService.getOrThrow('SUPABASE_URL'),
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /** Returns the service-role admin client. Throws if the key is not configured. */
  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — admin operations are unavailable');
    }
    return this.adminClient;
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
