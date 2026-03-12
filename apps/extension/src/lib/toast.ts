export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  window.dispatchEvent(
    new CustomEvent('snaapit-toast', { detail: { message, type } }),
  );
}
