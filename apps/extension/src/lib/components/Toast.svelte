<script lang="ts">
  import { onMount } from 'svelte';

  let toasts = $state<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);
  let nextId = 0;

  function addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = nextId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  // Expose globally via custom events
  onMount(() => {
    const handler = (e: CustomEvent) => addToast(e.detail.message, e.detail.type);
    window.addEventListener('snaapit-toast' as any, handler);
    return () => window.removeEventListener('snaapit-toast' as any, handler);
  });
</script>

{#if toasts.length > 0}
  <div class="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[360px]">
    {#each toasts as toast (toast.id)}
      <div
        class="px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-slide-in"
        class:bg-green-600={toast.type === 'success'}
        class:bg-red-500={toast.type === 'error'}
        class:bg-[#c15f3c]={toast.type === 'info'}
        class:text-white={true}
      >
        {toast.message}
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes slide-in {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-in {
    animation: slide-in 0.2s ease-out;
  }
</style>
