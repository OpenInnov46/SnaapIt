<script lang="ts">
  import { onMount, getContext } from "svelte";
  import type { Page } from '../lib/types';
  const { goto } = getContext<{ goto: (page: Page) => void }>('router');
  import Zap from '@lucide/svelte/icons/zap';
  import * as api from '../lib/api';
  import { toast } from '../lib/toast';
  import { storageRemove } from '../lib/storage';

  let theme = $state('light');
  let searchQuery = $state('');
  let activeView = $state('recent');

  let bookmarks = $state<any[]>([]);
  let searchResults = $state<any[]>([]);
  let folders = $state<any[]>([]);
  let totalCount = $state(0);
  let isLoading = $state(false);
  let snapStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');

  const isDark = $derived(theme === 'dark');

  // Items to display — search results or recent bookmarks
  const displayItems = $derived(
    activeView === 'search' && searchResults.length > 0
      ? searchResults
      : bookmarks
  );

  onMount(async () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    theme = savedTheme;
    await loadData();
  });

  async function loadData() {
    isLoading = true;
    try {
      const [bookmarkResult, folderResult] = await Promise.all([
        api.getBookmarks(),
        api.getFolders(),
      ]);
      bookmarks = bookmarkResult.bookmarks;
      totalCount = bookmarkResult.total;
      folders = folderResult;
    } catch (err: any) {
      toast(err.message === 'Not authenticated' ? 'Please sign in again' : 'Failed to load bookmarks', 'error');
    } finally {
      isLoading = false;
    }
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }

  async function snapCurrentPage() {
    snapStatus = 'loading';
    try {
      // Delegate to background worker so tab query works reliably in side panel context
      const response = await new Promise<{ success: boolean; data?: any; error?: string }>(
        (resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'SNAP_CURRENT_PAGE' }, (res) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(res);
          });
        }
      );
      if (!response.success) throw new Error(response.error || 'Failed to snap');
      bookmarks = [response.data, ...bookmarks];
      totalCount++;
      snapStatus = 'success';
      toast('Bookmark snapped!', 'success');
      setTimeout(() => (snapStatus = 'idle'), 2000);
    } catch (err: any) {
      snapStatus = 'error';
      toast(err.message || 'Failed to snap page', 'error');
      setTimeout(() => (snapStatus = 'idle'), 2000);
    }
  }

  function openDashboard() {
    const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3001';
    window.open(`${dashboardUrl}/dashboard`, '_blank');
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      activeView = 'recent';
      searchResults = [];
      return;
    }
    activeView = 'search';
    isLoading = true;
    try {
      searchResults = await api.searchBookmarks(searchQuery);
    } catch (err: any) {
      toast('Search failed', 'error');
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteBookmark(id);
      bookmarks = bookmarks.filter((b) => b.id !== id);
      totalCount--;
      toast('Bookmark deleted', 'success');
    } catch (err: any) {
      toast('Failed to delete bookmark', 'error');
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  async function handleSignOut() {
    await storageRemove(['authToken', 'user']);
    goto('');
  }

  function getFaviconEmoji(url: string) {
    if (url.includes('github')) return '🐙';
    if (url.includes('stackoverflow')) return '📚';
    if (url.includes('youtube')) return '🎬';
    if (url.includes('twitter') || url.includes('x.com')) return '🐦';
    return '🔗';
  }

  function getHostname(url: string) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
</script>

<div
  class="w-full h-screen flex flex-col"
  class:bg-[#ffffff]={!isDark}
  class:bg-[#1a1a1a]={isDark}
  class:text-[#1a1a1a]={!isDark}
  class:text-[#f4f3ee]={isDark}
>
  <!-- Header -->
  <div
    class="flex-shrink-0 px-5 py-4 border-b"
    class:border-[#e8e7e2]={!isDark}
    class:border-[#3a3a3a]={isDark}
    style="background: linear-gradient(135deg, #c15f3c 0%, #a94f2f 100%)"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center justify-center gap-2 mb-3">
        <div class="text-4xl">
          <Zap class="text-white size-8" />
        </div>
        <h1 class="text-2xl font-bold text-[#f4f3ee]">
          Snaapit
        </h1>
      </div>
      <button
        onclick={toggleTheme}
        class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
      >
        {#if isDark}
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        {:else}
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        {/if}
      </button>
    </div>

    <!-- Search bar -->
    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        onkeydown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Search your bookmarks semantically..."
        class="w-full px-4 py-2.5 pl-10 rounded-xl text-sm transition-all outline-none"
        class:bg-white={!isDark}
        class:bg-[#27272a]={isDark}
        class:text-[#1a1a1a]={!isDark}
        class:text-white={isDark}
        class:placeholder-gray-500={!isDark}
        class:placeholder-gray-400={isDark}
      />
      <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#b1ada1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  </div>

  <!-- Quick Actions -->
  <div
    class="flex-shrink-0 px-5 py-3 flex gap-2 border-b"
    class:border-[#e8e7e2]={!isDark}
    class:border-[#3a3a3a]={isDark}
  >
    <button
      onclick={snapCurrentPage}
      disabled={snapStatus === 'loading'}
      class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
      style="background: {snapStatus === 'success' ? '#10b981' : snapStatus === 'error' ? '#ef4444' : '#c15f3c'}"
    >
      {#if snapStatus === 'loading'}
        <span class="animate-spin">⏳</span> Snapping...
      {:else if snapStatus === 'success'}
        <span>✓</span> Snapped!
      {:else if snapStatus === 'error'}
        <span>✕</span> Failed
      {:else}
        <span>⚡</span> Snap This
      {/if}
    </button>
    <button
      onclick={openDashboard}
      aria-label="Open dashboard"
      title="Open dashboard"
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      class:bg-[#f4f3ee]={!isDark}
      class:bg-[#27272a]={isDark}
      class:hover:bg-[#e8e7e2]={!isDark}
      class:hover:bg-[#3f3f46]={isDark}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>
  </div>

  <!-- Tabs -->
  <div
    class="flex-shrink-0 px-5 py-2 flex gap-1 border-b"
    class:border-[#e8e7e2]={!isDark}
    class:border-[#3a3a3a]={isDark}
  >
    <button
      onclick={() => { activeView = 'recent'; searchResults = []; searchQuery = ''; }}
      class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
      class:bg-[#c15f3c]={activeView === 'recent'}
      class:text-white={activeView === 'recent'}
      class:hover:bg-[#f4f3ee]={activeView !== 'recent' && !isDark}
      class:hover:bg-[#27272a]={activeView !== 'recent' && isDark}
    >
      Recent
    </button>
    <button
      onclick={() => activeView = 'collections'}
      class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
      class:bg-[#c15f3c]={activeView === 'collections'}
      class:text-white={activeView === 'collections'}
      class:hover:bg-[#f4f3ee]={activeView !== 'collections' && !isDark}
      class:hover:bg-[#27272a]={activeView !== 'collections' && isDark}
    >
      Collections
    </button>
    {#if activeView === 'search'}
      <span class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#c15f3c] text-white">
        Search Results
      </span>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="flex items-center justify-center h-32">
        <div class="text-sm" class:text-[#6b6b6b]={!isDark} class:text-[#b1ada1]={isDark}>
          Loading...
        </div>
      </div>
    {:else if activeView === 'recent' || activeView === 'search'}
      <!-- Bookmarks List -->
      <div class="p-3 space-y-2">
        {#if displayItems.length === 0}
          <div class="text-center py-8">
            <p class="text-sm" class:text-[#6b6b6b]={!isDark} class:text-[#b1ada1]={isDark}>
              {activeView === 'search' ? 'No results found' : 'No bookmarks yet. Snap your first page!'}
            </p>
          </div>
        {/if}
        {#each displayItems as bookmark}
          <div
            class="p-3 rounded-xl cursor-pointer transition-all hover:shadow-md group"
            class:bg-white={!isDark}
            class:bg-[#27272a]={isDark}
            class:hover:bg-[#f4f3ee]={!isDark}
            class:hover:bg-[#3f3f46]={isDark}
            style="border: 1px solid {isDark ? '#3a3a3a' : '#e8e7e2'}"
          >
            <div class="flex items-start gap-3">
              <div class="text-xl flex-shrink-0">
                {#if bookmark.favicon_url}
                  <img src={bookmark.favicon_url} alt="" class="w-5 h-5 rounded" />
                {:else}
                  {getFaviconEmoji(bookmark.url)}
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h3 class="text-sm font-semibold truncate">{bookmark.title}</h3>
                  {#if bookmark.similarity}
                    <div
                      class="px-2 py-0.5 rounded-md text-xs font-semibold text-white flex-shrink-0"
                      style="background: #10b981"
                    >
                      {Math.round(bookmark.similarity * 100)}%
                    </div>
                  {/if}
                </div>
                {#if bookmark.description}
                  <p
                    class="text-xs line-clamp-2 mb-2"
                    class:text-[#6b6b6b]={!isDark}
                    class:text-[#b1ada1]={isDark}
                  >
                    {bookmark.description}
                  </p>
                {/if}
                {#if bookmark.tags?.length > 0}
                  <div class="flex items-center gap-2 flex-wrap">
                    {#each bookmark.tags.slice(0, 3) as tag}
                      <span
                        class="px-2 py-0.5 rounded-md text-xs"
                        class:bg-[#f4f3ee]={!isDark}
                        class:bg-[#3f3f46]={isDark}
                      >
                        {tag}
                      </span>
                    {/each}
                  </div>
                {/if}
                <div class="flex items-center justify-between mt-2">
                  <span
                    class="text-xs"
                    class:text-[#6b6b6b]={!isDark}
                    class:text-[#b1ada1]={isDark}
                  >
                    {formatDate(bookmark.created_at)}
                  </span>
                  <div class="flex items-center gap-2">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      class="text-xs font-medium flex items-center gap-1 hover:opacity-70"
                      style="color: #c15f3c"
                    >
                      {getHostname(bookmark.url)}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <button
                      onclick={() => handleDelete(bookmark.id)}
                      class="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-500 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if activeView === 'collections'}
      <!-- Collections -->
      <div class="p-4 space-y-3">
        {#if folders.length === 0}
          <div class="text-center py-8">
            <p class="text-sm" class:text-[#6b6b6b]={!isDark} class:text-[#b1ada1]={isDark}>
              No collections yet. They'll be created automatically when you snap bookmarks!
            </p>
          </div>
        {/if}
        {#each folders as folder}
          <div
            class="p-4 rounded-xl cursor-pointer transition-all hover:shadow-md"
            class:bg-white={!isDark}
            class:bg-[#27272a]={isDark}
            class:hover:bg-[#f4f3ee]={!isDark}
            class:hover:bg-[#3f3f46]={isDark}
            style="border: 1px solid {isDark ? '#3a3a3a' : '#e8e7e2'}"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-3 h-3 rounded-full"
                  style="background: {folder.color || '#c15f3c'}"
                ></div>
                <div>
                  <h3 class="text-sm font-semibold">{folder.name}</h3>
                </div>
              </div>
              <svg class="w-5 h-5 text-[#b1ada1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Footer Stats -->
  <div
    class="flex-shrink-0 px-5 py-3 border-t flex items-center justify-between text-xs"
    class:bg-[#ffffff]={!isDark}
    class:bg-[#1a1a1a]={isDark}
    class:border-[#e8e7e2]={!isDark}
    class:border-[#3a3a3a]={isDark}
    class:text-[#6b6b6b]={!isDark}
    class:text-[#b1ada1]={isDark}
  >
    <span>{totalCount} total snaps</span>
    <button
      onclick={handleSignOut}
      class="hover:opacity-70 transition-opacity"
      style="color: #c15f3c"
    >
      Sign out
    </button>
  </div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
