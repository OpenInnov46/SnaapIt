import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async signUp(email: string, password: string, fullName?: string) {
    const adminClient = this.supabaseService.getAdminClient();

    // Count existing users to determine if this is the first account
    const { data: usersPage, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (listError) throw listError;

    const isFirstUser = usersPage.users.length === 0;

    if (isFirstUser) {
      // First account: auto-confirm email and grant admin role
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName ?? '', role: 'admin' },
      });
      if (error) throw error;
      // Sign them in immediately so a session is returned
      const supabase = this.supabaseService.getClient();
      const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      return { user: data.user, session: session.session, isAdmin: true };
    }

    // Subsequent users: create via admin client (avoids public rate limits).
    // email_confirm: true skips the confirmation email entirely.
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? '' },
    });

    if (error) throw error;

    // Sign them in immediately so the client gets a usable session
    const supabase = this.supabaseService.getClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    return { user: data.user, session: signInData.session, isAdmin: false };
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
