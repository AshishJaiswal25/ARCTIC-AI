// ── API URL - auto-detect production vs development ────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
export const TOKEN_KEY = 'arctic_token';

export function authHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Claude API call — intake sent to server, RAG + prompt built server-side ───
export async function callClaude(messages, intake, isJson = false) {
  const response = await fetch(`${API_BASE}/api/claude`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ messages, intake, isJson }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('arctic_user');
      window.location.reload();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(err?.error || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

// ── Photo analysis via backend proxy ───────────────────────────────────────────
export async function analyzePhoto(imageBase64, mimeType, context = '') {
  const response = await fetch(`${API_BASE}/api/claude/vision`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ imageBase64, mimeType, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Vision API error ${response.status}`);
  }

  return response.json();
}
