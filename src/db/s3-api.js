// Auto-detect: in production (same origin) use '/api', in dev use localhost backend
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const TOKEN_KEY = 'arctic_token';

// Helper: get auth headers
function authHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// Helper: handle 401 - auto-logout on expired/invalid token
function handle401(res) {
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('arctic_user');
    window.location.reload();
  }
}

// ── Save job to S3 via backend ─────────────────────────────────────────────────
export async function saveJob(job) {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(job),
  });
  handle401(res);
  if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
  return res.json();
}

// ── Get all jobs from S3 via backend ───────────────────────────────────────────
export async function getJobs() {
  const res = await fetch(`${API_URL}/jobs`, { headers: authHeaders() });
  handle401(res);
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to load jobs');
  return res.json();
}

// ── Get single job ─────────────────────────────────────────────────────────────
export async function getJobById(id) {
  const res = await fetch(`${API_URL}/jobs/${id}`, { headers: authHeaders() });
  handle401(res);
  if (!res.ok) throw new Error((await res.json()).error || 'Job not found');
  return res.json();
}

// ── Update job status ──────────────────────────────────────────────────────────
export async function updateJobStatus(id, status) {
  const res = await fetch(`${API_URL}/jobs/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  });
  handle401(res);
  if (!res.ok) throw new Error((await res.json()).error || 'Status update failed');
  return res.json();
}

// ── Upload file to S3 via backend ──────────────────────────────────────────────
export async function uploadJobFile(jobId, file, phase = 'photos') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('phase', phase);

  const res = await fetch(`${API_URL}/jobs/${jobId}/files`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return res.json();
}

// ── Check if backend is reachable ──────────────────────────────────────────────
export async function isBackendAvailable() {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Save feedback for fine-tuning ──────────────────────────────────────────────
export async function saveFeedback(feedback) {
  const res = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(feedback),
  });
  handle401(res);
  if (!res.ok) throw new Error((await res.json()).error || 'Feedback save failed');
  return res.json();
}

// ── Get all feedback entries ───────────────────────────────────────────────────
export async function getFeedbackEntries() {
  const res = await fetch(`${API_URL}/feedback`, { headers: authHeaders() });
  handle401(res);
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to load feedback');
  return res.json();
}
