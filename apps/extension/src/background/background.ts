const BASE_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SNAP_CURRENT_TAB') {
    handleSnap(message.data)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }
});

async function handleSnap(data: {
  url: string;
  title: string;
  favIconUrl?: string;
}) {
  const storage = await chrome.storage.local.get('authToken');
  const token = storage.authToken?.access_token;

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
