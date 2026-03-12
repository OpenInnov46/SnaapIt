import * as api from '../api';

// Svelte 5 runes-based state
let bookmarks = $state<any[]>([]);
let searchResults = $state<any[]>([]);
let isLoading = $state(false);
let totalCount = $state(0);

export function getBookmarksState() {
  return {
    get bookmarks() { return bookmarks; },
    get searchResults() { return searchResults; },
    get isLoading() { return isLoading; },
    get totalCount() { return totalCount; },
  };
}

export async function loadBookmarks(page = 1) {
  isLoading = true;
  try {
    const result = await api.getBookmarks(page);
    bookmarks = result.bookmarks;
    totalCount = result.total;
  } catch (err) {
    console.error('Failed to load bookmarks:', err);
  } finally {
    isLoading = false;
  }
}

export async function searchBookmarks(query: string) {
  if (!query.trim()) {
    searchResults = [];
    return;
  }
  isLoading = true;
  try {
    searchResults = await api.searchBookmarks(query);
  } catch (err) {
    console.error('Failed to search bookmarks:', err);
  } finally {
    isLoading = false;
  }
}

export async function snapCurrentPage(tabInfo: {
  url: string;
  title: string;
  favIconUrl?: string;
}) {
  isLoading = true;
  try {
    const result = await api.snapBookmark({
      url: tabInfo.url,
      title: tabInfo.title,
      favicon_url: tabInfo.favIconUrl,
    });
    // Prepend the new bookmark to the list
    bookmarks = [result, ...bookmarks];
    totalCount++;
    return result;
  } catch (err) {
    console.error('Failed to snap bookmark:', err);
    throw err;
  } finally {
    isLoading = false;
  }
}
