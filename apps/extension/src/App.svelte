<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import type { Page } from './lib/types';
  import SignIn from './routes/SignIn.svelte';
  import SignUp from './routes/SignUp.svelte';
  import Home from './routes/Home.svelte';
  import Toast from './lib/components/Toast.svelte';
  import { storageGet } from './lib/storage';

  let page = $state<Page>('');
  let ready = $state(false);

  function goto(route: Page) {
    page = route;
  }

  setContext<{ goto: (page: Page) => void }>('router', { goto });

  onMount(async () => {
    try {
      const result = await storageGet('authToken');
      if (result.authToken) {
        page = 'home';
      }
    } catch (e) {
      console.error('Auth check error:', e);
    }
    ready = true;
  });
</script>

<Toast />

{#if !ready}
  <div class="flex min-h-screen items-center justify-center bg-[#fafafa]">
    <div class="text-sm text-[#6b6b6b]">Loading...</div>
  </div>
{:else if page === ''}
  <SignIn />
{:else if page === 'signup'}
  <SignUp />
{:else}
  <Home />
{/if}