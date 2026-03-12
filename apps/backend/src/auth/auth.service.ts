import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async signUp(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${this.configService.get('APP_URL')}/auth/callback`,
      },
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async signIn(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async getOAuthUrl(provider: 'github' | 'google') {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${this.configService.get('API_URL')}/auth/oauth/callback?provider=${provider}`,
        skipBrowserRedirect: true, // Important pour récupérer l'URL
      },
    });

    if (error) throw error;
    return { url: data.url };
  }

  async exchangeCodeForSession(code: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) throw error;
    return { user: data.user, session: data.session };
  }

  async verifyToken(token: string) {
    const supabase = this.supabaseService.getClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) throw error;
    return user;
  }

  async refreshSession(refreshToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw error;
    return { session: data.session };
  }

  async signOut(token: string) {
    const supabase = this.supabaseService.getClientWithAuth(token);
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }
}
