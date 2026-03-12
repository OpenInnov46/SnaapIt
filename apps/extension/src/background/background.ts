const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Use explicit onClicked handler so it works across all Chromium forks.
// If chrome.sidePanel is available, try to open the panel; otherwise fall back
// to a floating popup window (Firefox, older Chromium builds, Arc, etc.).
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel) {
    chrome.sidePanel
      .open({ tabId: tab.id! })
      .catch(() => {
        // sidePanel.open() not supported in this build — fall back to popup
        chrome.windows.create({
          url: chrome.runtime.getURL('index.html'),
          type: 'popup',
          width: 420,
          height: 700,
        });
      });
  } else {
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 420,
      height: 700,
    });
  }
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
      // Background does the tab query so it works reliably from any extension context
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => {
          if (!tab?.url || !tab?.title) throw new Error('No active tab found');
          return handleSnap({ url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });
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
