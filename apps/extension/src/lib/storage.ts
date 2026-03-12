/**
 * Safe wrappers around chrome.storage.local that degrade gracefully when
 * the code runs outside of a Chrome extension context (e.g. Vite dev server).
 */

function isExtension(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome?.storage?.local
  );
}

export async function storageGet(keys: string | string[]): Promise<Record<string, unknown>> {
  if (!isExtension()) return {};
  return chrome.storage.local.get(keys);
}

export async function storageSet(items: Record<string, unknown>): Promise<void> {
  if (!isExtension()) return;
  return chrome.storage.local.set(items);
}

export async function storageRemove(keys: string | string[]): Promise<void> {
  if (!isExtension()) return;
  return chrome.storage.local.remove(keys);
}
