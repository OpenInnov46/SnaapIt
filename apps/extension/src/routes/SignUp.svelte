<script lang="ts">
  import { onMount, getContext } from "svelte";
  import type { Page } from '../lib/types';
  const { goto } = getContext<{ goto: (page: Page) => void }>('router');
  import Zap from '@lucide/svelte/icons/zap';
  import { storageSet } from '../lib/storage';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  let theme = $state('light');
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let acceptTerms = $state(false);
  let isLoading = $state(false);
  let error = $state('');
  let success = $state('');
  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3001';

  const isDark = $derived(theme === 'dark');

  onMount(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    theme = savedTheme;

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  });

  async function handleAuthMessage(event: MessageEvent) {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const allowedOrigins = [backendUrl, 'https://snaapit.app', 'https://snaapit.com'];
    const isAllowed = allowedOrigins.some(o => event.origin.startsWith(o)) || event.origin.startsWith('http://localhost');
    if (!isAllowed) return;
    if (event.data.type === 'SUPABASE_AUTH_SUCCESS') {
      await storageSet({
        authToken: event.data.session,
        user: event.data.user
      });
      goto('home');
    }
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }

  type OAuthPopupHandle = {
    close: () => void;
    isClosed: () => Promise<boolean>;
  };

  async function openOAuthPopup(url: string, title: string): Promise<OAuthPopupHandle> {
    const width = 520;
    const height = 700;

    if (typeof chrome !== 'undefined' && chrome.windows?.create) {
      const created = await chrome.windows.create({
        url,
        type: 'popup',
        width,
        height,
        focused: true,
        setSelfAsOpener: true,
      });

      if (!created?.id) {
        throw new Error('Failed to open OAuth popup.');
      }

      const id = created.id;
      return {
        close: () => {
          chrome.windows.remove(id).catch(() => undefined);
        },
        isClosed: async () => {
          try {
            await chrome.windows.get(id);
            return false;
          } catch {
            return true;
          }
        },
      };
    }

    const minLeft = (window.screen as any).availLeft ?? 0;
    const minTop = (window.screen as any).availTop ?? 0;
    const maxLeft = minLeft + window.screen.availWidth - width;
    const maxTop = minTop + window.screen.availHeight - height;
    const desiredLeft = Math.floor(window.screenX + (window.outerWidth - width) / 2);
    const desiredTop = Math.floor(window.screenY + (window.outerHeight - height) / 2);
    const left = Math.min(maxLeft, Math.max(minLeft, desiredLeft));
    const top = Math.min(maxTop, Math.max(minTop, desiredTop));

    const popup = window.open(
      url,
      title,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups.');
    }

    popup.focus();
    return {
      close: () => popup.close(),
      isClosed: async () => popup.closed,
    };
  }

  function monitorOAuthPopup(popup: OAuthPopupHandle, timeoutMessage: string) {
    const closeCheck = setInterval(() => {
      popup.isClosed().then((closed) => {
        if (!closed) return;
        clearInterval(closeCheck);
        if (isLoading) {
          isLoading = false;
          error = 'Authentication canceled.';
        }
      });
    }, 500);

    setTimeout(() => {
      clearInterval(closeCheck);
      popup.isClosed().then((closed) => {
        if (closed) return;
        popup.close();
        error = timeoutMessage;
        isLoading = false;
      });
    }, 300000);
  }

  async function handleEmailSignup(e: Event) {
    e.preventDefault();
    error = '';
    success = '';

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }

    if (!acceptTerms) {
      error = 'You must accept the terms and conditions';
      return;
    }

    isLoading = true;

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // Backend now returns a session for all users — log them in directly
      if (data.session) {
        await storageSet({
          authToken: data.session,
          user: data.user
        });
        goto('home');
      } else {
        success = 'Account created! Please sign in.';
      }
    } catch (err: any) {
      error = err.message || 'Failed to create account';
    } finally {
      isLoading = false;
    }
  }

  async function handleGoogleSignup() {
    try {
      isLoading = true;
      error = '';
      const response = await fetch(`${API_URL}/auth/oauth/url?provider=google`);
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to get OAuth URL');

      const popup = await openOAuthPopup(data.url, 'Google Sign Up');

      monitorOAuthPopup(popup, 'Sign up timeout. Please try again.');
    } catch (err: any) {
      error = err.message || 'Failed to sign up with Google';
      isLoading = false;
    }
  }

  async function handleGithubSignup() {
    try {
      isLoading = true;
      error = '';
      const response = await fetch(`${API_URL}/auth/oauth/url?provider=github`);
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to get OAuth URL');

      const popup = await openOAuthPopup(data.url, 'GitHub Sign Up');

      monitorOAuthPopup(popup, 'Sign up timeout. Please try again.');
    } catch (err: any) {
      error = err.message || 'Failed to sign up with GitHub';
      isLoading = false;
    }
  }
</script>

<div
  class="min-h-screen flex items-center justify-center p-4 w-[350px]"
  class:bg-[#fafafa]={!isDark}
  class:bg-[#0f0f0f]={isDark}
>
  <!-- Background gradient -->
  <div
    class="absolute inset-0 pointer-events-none"
    style="background: linear-gradient(135deg, {isDark ? 'rgba(193, 95, 60, 0.05)' : 'rgba(193, 95, 60, 0.03)'} 0%, transparent 50%)"
  ></div>

  <div class="w-full max-w-md relative z-10">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex items-center justify-center gap-2 mb-3">
        <div class="text-4xl">
          <Zap class="text-[#c15f3c] h-6 w-6" />
        </div>
        <h1 class="text-3xl font-bold" class:text-[#1a1a1a]={!isDark} class:text-[#f4f3ee]={isDark}>
          Snaapit
        </h1>
      </div>
      <p class="text-lg" class:text-[#6b6b6b]={!isDark} class:text-[#b1ada1]={isDark}>
        Create your account and start organizing
      </p>
    </div>

    <!-- Card -->
    <div
      class="rounded-2xl shadow-xl p-8 border"
      class:bg-white={!isDark}
      class:bg-[#1a1a1a]={isDark}
      class:border-[#e8e7e2]={!isDark}
      class:border-[#3a3a3a]={isDark}
    >
      <!-- OAuth Buttons -->
      <div class="space-y-3 mb-6">
        <button
          onclick={handleGoogleSignup}
          class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border"
          class:bg-white={!isDark}
          class:bg-[#27272a]={isDark}
          class:border-[#e8e7e2]={!isDark}
          class:border-[#3a3a3a]={isDark}
          class:hover:bg-[#f4f3ee]={!isDark}
          class:hover:bg-[#3f3f46]={isDark}
          class:text-[#1a1a1a]={!isDark}
          class:text-[#f4f3ee]={isDark}
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <button
          onclick={handleGithubSignup}
          class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border"
          class:bg-white={!isDark}
          class:bg-[#27272a]={isDark}
          class:border-[#e8e7e2]={!isDark}
          class:border-[#3a3a3a]={isDark}
          class:hover:bg-[#f4f3ee]={!isDark}
          class:hover:bg-[#3f3f46]={isDark}
          class:text-[#1a1a1a]={!isDark}
          class:text-[#f4f3ee]={isDark}
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Sign up with GitHub
        </button>
      </div>

      <!-- Divider -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t" class:border-[#e8e7e2]={!isDark} class:border-[#3a3a3a]={isDark}></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span
            class="px-2 text-xs font-medium"
            class:bg-white={!isDark}
            class:bg-[#1a1a1a]={isDark}
            class:text-[#6b6b6b]={!isDark}
            class:text-[#b1ada1]={isDark}
          >
            Or sign up with email
          </span>
        </div>
      </div>

      <!-- Email/Password Form -->
      <form onsubmit={handleEmailSignup} class="space-y-4">
        {#if error}
          <div
            class="p-3 rounded-lg text-sm"
            style="background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.2)"
          >
            {error}
          </div>
        {/if}

        {#if success}
          <div
            class="p-3 rounded-lg text-sm"
            style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2)"
          >
            {success}
          </div>
        {/if}

        <div>
          <label
            for="name"
            class="block text-sm font-medium mb-2"
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            bind:value={name}
            required
            placeholder="John Doe"
            class="w-full px-4 py-3 rounded-xl border transition-all outline-none"
            class:bg-white={!isDark}
            class:bg-[#27272a]={isDark}
            class:border-[#e8e7e2]={!isDark}
            class:border-[#3a3a3a]={isDark}
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
            class:focus:border-[#c15f3c]={true}
          />
        </div>

        <div>
          <label
            for="email"
            class="block text-sm font-medium mb-2"
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            placeholder="you@example.com"
            class="w-full px-4 py-3 rounded-xl border transition-all outline-none"
            class:bg-white={!isDark}
            class:bg-[#27272a]={isDark}
            class:border-[#e8e7e2]={!isDark}
            class:border-[#3a3a3a]={isDark}
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
            class:focus:border-[#c15f3c]={true}
          />
        </div>

        <div>
          <label
            for="password"
            class="block text-sm font-medium mb-2"
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl border transition-all outline-none"
            class:bg-white={!isDark}
            class:bg-[#27272a]={isDark}
            class:border-[#e8e7e2]={!isDark}
            class:border-[#3a3a3a]={isDark}
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
            class:focus:border-[#c15f3c]={true}
          />
          <p
            class="mt-1 text-xs"
            class:text-[#6b6b6b]={!isDark}
            class:text-[#b1ada1]={isDark}
          >
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium mb-2"
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl border transition-all outline-none"
            class:bg-white={!isDark}
            class:bg-[#27272a]={isDark}
            class:border-[#e8e7e2]={!isDark}
            class:border-[#3a3a3a]={isDark}
            class:text-[#1a1a1a]={!isDark}
            class:text-[#f4f3ee]={isDark}
            class:focus:border-[#c15f3c]={true}
          />
        </div>

        <!-- Terms and conditions -->
        <div class="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            bind:checked={acceptTerms}
            class="mt-1 w-4 h-4 rounded cursor-pointer"
            style="accent-color: #c15f3c"
          />
          <label
            for="terms"
            class="text-sm cursor-pointer"
            class:text-[#6b6b6b]={!isDark}
            class:text-[#b1ada1]={isDark}
          >
            I agree to the
            <a
              href={`${dashboardUrl}/terms`}
              target="_blank"
              rel="noreferrer"
              class="font-medium hover:opacity-80 transition-opacity"
              style="color: #c15f3c"
            >
              Terms of Service
            </a>
            and
            <a
              href={`${dashboardUrl}/privacy`}
              target="_blank"
              rel="noreferrer"
              class="font-medium hover:opacity-80 transition-opacity"
              style="color: #c15f3c"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          class="w-full px-4 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style="background: linear-gradient(135deg, #c15f3c 0%, #a94f2f 100%)"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <!-- Sign in link -->
      <p class="mt-6 text-center text-sm" class:text-[#6b6b6b]={!isDark} class:text-[#b1ada1]={isDark}>
        Already have an account?
        <button
          onclick={() => goto('')}
          class="font-medium hover:opacity-80 transition-opacity cursor-pointer border-none bg-transparent p-0 inline"
          style="color: #c15f3c"
        >
          Sign in
        </button>
      </p>
    </div>

    <!-- Theme toggle -->
    <button
      onclick={toggleTheme}
      class="mt-6 mx-auto flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
      class:bg-white={!isDark}
      class:bg-[#27272a]={isDark}
      class:text-[#1a1a1a]={!isDark}
      class:text-[#f4f3ee]={isDark}
      class:hover:bg-[#f4f3ee]={!isDark}
      class:hover:bg-[#3f3f46]={isDark}
    >
      {#if isDark}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span class="text-sm">Light mode</span>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span class="text-sm">Dark mode</span>
      {/if}
    </button>
  </div>
</div>

<style>
    input::placeholder {
        opacity: 0.5;
    }

    input:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(193, 95, 60, 0.1);
    }

    input[type="checkbox"] {
        cursor: pointer;
    }
</style>