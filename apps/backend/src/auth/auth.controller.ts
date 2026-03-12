// auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query, Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Email/Password - Sign Up
  @Post('signup')
  async signUp(@Body() body: { email: string; password: string; fullName?: string }) {
    try {
      const result = await this.authService.signUp(body.email, body.password, body.fullName);
      return {
        success: true,
        user: result.user,
        session: result.session,
        isAdmin: result.isAdmin,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Sign up failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Email/Password - Sign In
  @Post('signin')
  async signIn(@Body() body: { email: string; password: string }) {
    try {
      const result = await this.authService.signIn(body.email, body.password);
      return {
        success: true,
        user: result.user,
        session: result.session,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Sign in failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // OAuth - Get provider URL (pour GitHub/Google)
  @Get('oauth/url')
  async getOAuthUrl(@Query('provider') provider: 'github' | 'google') {
    try {
      const { url } = await this.authService.getOAuthUrl(provider);
      return { url };
    } catch (error) {
      throw new HttpException(
        'Failed to get OAuth URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // auth/auth.controller.ts
  @Get('oauth/callback')
  async handleOAuthCallback(@Query('code') code: string, @Query('error') error: string, @Query('error_description') errorDesc: string, @Res() res) {
    const styles = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #c15f3c 0%, #a94f2f 100%); }
      .container { text-align: center; background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 20px 60px rgba(193, 95, 60, 0.3); max-width: 400px; }
      .icon { font-size: 3rem; margin-bottom: 1rem; }
      h1 { color: #1a1a1a; margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 600; }
      p { color: #6b6b6b; font-size: 0.875rem; }
      .spinner { border: 3px solid #f4f3ee; border-top: 3px solid #c15f3c; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;

    // OAuth error from provider
    if (error) {
      res.send(`<!DOCTYPE html><html><head><title>Snaapit - Auth Error</title><style>${styles}</style></head><body><div class="container"><div class="icon">✕</div><h1>Authentication Failed</h1><p>${errorDesc || error}</p></div><script>setTimeout(()=>window.close(),3000)</script></body></html>`);
      return;
    }

    // PKCE flow: code is in the query string — exchange it server-side
    if (code) {
      try {
        const { user, session } = await this.authService.exchangeCodeForSession(code);
        const sessionJson = JSON.stringify(session).replace(/</g, '\\u003c');
        const userJson = JSON.stringify({
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || {},
        }).replace(/</g, '\\u003c');

        res.send(`<!DOCTYPE html>
<html>
  <head><title>Snaapit - Authentication</title><style>${styles}</style></head>
  <body>
    <div class="container">
      <div id="content"><div class="spinner"></div><h1>Signing in...</h1><p>This window will close automatically.</p></div>
    </div>
    <script>
      (function() {
        const session = ${sessionJson};
        const user = ${userJson};
        if (window.opener) {
          window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session, user }, '*');
          document.getElementById('content').innerHTML = '<div class="icon">✓</div><h1>Success!</h1><p>Signed in as ' + user.email + '<br>Closing window...</p>';
          setTimeout(() => window.close(), 1500);
        } else {
          document.getElementById('content').innerHTML = '<div class="icon">✓</div><h1>Signed In!</h1><p>You can close this window.</p>';
        }
      })();
    </script>
  </body>
</html>`);
      } catch (err) {
        res.send(`<!DOCTYPE html><html><head><title>Snaapit - Auth Error</title><style>${styles}</style></head><body><div class="container"><div class="icon">✕</div><h1>Authentication Failed</h1><p>${err.message || 'Could not exchange code'}</p></div><script>setTimeout(()=>window.close(),3000)</script></body></html>`);
      }
      return;
    }

    // Implicit flow: tokens are in the URL hash fragment — handled client-side
    res.send(`<!DOCTYPE html>
<html>
  <head><title>Snaapit - Authentication</title><style>${styles}</style></head>
  <body>
    <div class="container">
      <div id="content"><div class="spinner"></div><h1>Signing in...</h1><p>This window will close automatically.</p></div>
    </div>
    <script>
      (function() {
        try {
          const hash = window.location.hash.substring(1);
          if (!hash) { showError('Authentication failed — no token received'); return; }
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const hashError = params.get('error');
          if (hashError) { showError(params.get('error_description') || hashError); return; }
          if (!accessToken) { showError('No access token received'); return; }
          const session = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: parseInt(params.get('expires_in')) || 3600,
            expires_at: parseInt(params.get('expires_at')) || Math.floor(Date.now() / 1000) + 3600,
            token_type: params.get('token_type') || 'bearer'
          };
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const user = { id: payload.sub, email: payload.email, user_metadata: payload.user_metadata || {} };
          if (window.opener) {
            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session, user }, '*');
            showSuccess(user.email);
          } else {
            showError('Could not communicate with extension');
          }
        } catch (err) { showError('An unexpected error occurred'); }
      })();
      function showSuccess(email) {
        document.getElementById('content').innerHTML = '<div class="icon">✓</div><h1>Success!</h1><p>Signed in as ' + email + '<br>Closing window...</p>';
        setTimeout(() => window.close(), 1500);
      }
      function showError(message) {
        document.getElementById('content').innerHTML = '<div class="icon">✕</div><h1>Error</h1><p>' + message + '</p>';
        setTimeout(() => window.close(), 3000);
      }
    </script>
  </body>
</html>`);
  }

  // Verify token (pour valider depuis l'extension)
  @Post('verify')
  async verifyToken(@Body() body: { token: string }) {
    try {
      const user = await this.authService.verifyToken(body.token);
      return { success: true, user };
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  // Refresh session
  @Post('refresh')
  async refreshSession(@Body() body: { refreshToken: string }) {
    try {
      const result = await this.authService.refreshSession(body.refreshToken);
      return {
        success: true,
        session: result.session,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to refresh session',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // Sign out
  @Post('signout')
  async signOut(@Body() body: { token: string }) {
    try {
      await this.authService.signOut(body.token);
      return { success: true };
    } catch (error) {
      throw new HttpException('Sign out failed', HttpStatus.BAD_REQUEST);
    }
  }
}
