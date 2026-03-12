const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// On Chrome 116+, configure the side panel to open automatically when the
// user clicks the extension icon. This replaces the need for an onClicked
// handler for the primary UI and removes the conflict with default_popup.
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err: Error) => {
      // setPanelBehavior not supported — fall back to onClicked handler below
      console.warn('[background] sidePanel.setPanelBehavior not supported, using onClicked fallback:', err.message);
    });
}

// Fallback for browsers/versions that don't support sidePanel.setPanelBehavior
// (e.g. Firefox, older Chromium builds). The onClicked event only fires when
// no default_popup is set in the manifest.
chrome.action.onClicked.addListener((tab) => {
  // Store the active tab info so the popup window can snap it reliably
  if (tab?.url && tab?.title) {
    chrome.storage.local
      .set({ _lastClickedTab: { url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl } })
      .catch((err: Error) => {
        console.warn('[background] Failed to store tab info for snap fallback:', err.message);
      });
  }
  // Open a floating popup window as the fallback UI
  chrome.windows.create({
    url: chrome.runtime.getURL('index.html'),
    type: 'popup',
    width: 420,
    height: 700,
  });
});

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; data?: { url: string; title: string; favIconUrl?: string } },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; data?: unknown; error?: string }) => void,
  ): boolean => {
    if (message.type === 'SNAP_CURRENT_TAB') {
      handleSnap(message.data!)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true; // keep channel open for async response
    }
    if (message.type === 'SNAP_CURRENT_PAGE') {
      // Service workers have no "current window", so use lastFocusedWindow to
      // find the active tab in the most recently focused browser window.
      chrome.tabs
        .query({ active: true, lastFocusedWindow: true })
        .then(async ([tab]) => {
          if (tab?.url && tab?.title) {
            return handleSnap({ url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });
          }
          // Fallback: when a floating popup window is focused it has no tabs,
          // so check the stored tab info that was captured on icon click.
          const stored = await chrome.storage.local.get('_lastClickedTab');
          const storedTab = stored._lastClickedTab as
            | { url: string; title: string; favIconUrl?: string }
            | undefined;
          if (storedTab?.url && storedTab?.title) {
            return handleSnap(storedTab);
          }
          throw new Error('No active tab found');
        })
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
      return true;
    }
    return false;
  },
);

async function handleSnap(data: {
  url: string;
  title: string;
  favIconUrl?: string;
}) {
  const storage = await chrome.storage.local.get('authToken');
  const token = (storage.authToken as { access_token?: string } | undefined)?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BASE_URL}/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: data.url,
      title: data.title,
      favicon_url: data.favIconUrl,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to snap bookmark');
  }

  return response.json();
}
