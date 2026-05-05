import { HVAC_SYSTEM_PROMPT } from './constants.js';
import { getFaultCodeContext } from './data/fault-codes.js';
import { retrieveKnowledge, formatFeedbackContext } from './data/knowledge-rag.js';

// ── API URL - auto-detect production vs development ────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
const TOKEN_KEY = 'arctic_token';

function authHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function isApiConfigured() {
  return true;
}

// Build system prompt with RAG knowledge injection
export function buildSystemPrompt(brand = '', intake = {}) {
  let prompt = HVAC_SYSTEM_PROMPT;

  const faultContext = getFaultCodeContext(brand);
  if (faultContext) {
    prompt += `\n\nBRAND-SPECIFIC FAULT CODES FOR ${brand.toUpperCase()}:${faultContext}`;
  }

  const ragContext = retrieveKnowledge({ ...intake, brand });
  if (ragContext) {
    prompt += ragContext;
  }

  return prompt;
}

export function buildSystemPromptWithFeedback(brand = '', intake = {}, feedbackEntries = []) {
  let prompt = buildSystemPrompt(brand, intake);

  const feedbackContext = formatFeedbackContext(feedbackEntries);
  if (feedbackContext) {
    prompt += feedbackContext;
  }

  return prompt;
}

// ── Claude API call via backend proxy (API key stays server-side) ──────────────
export async function callClaude(messages, systemPrompt, isJson = false) {
  const response = await fetch(`${API_BASE}/api/claude`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ messages, systemPrompt, isJson }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    // Auto-logout on 401 - token is invalid/expired
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('arctic_user');
      window.location.reload();
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(err?.error || `API error ${response.status}`);
  }

  const data = await response.json();

  if (data.type === 'json') return data.result;
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
