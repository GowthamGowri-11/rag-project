const API_BASE = '/api';

/**
 * Safely parses response JSON or falls back to text/status message.
 * Prevents "Unexpected end of JSON input" errors when gateway or proxy returns empty or non-JSON errors.
 */
async function handleResponse(res, defaultErrorMsg = 'Request failed') {
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Body is not JSON (e.g. plain text or HTML error)
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || text || `${defaultErrorMsg} (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return data !== null ? data : {};
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return await handleResponse(res, 'Health check failed');
}

export async function fetchDomains() {
  const res = await fetch(`${API_BASE}/domains`);
  return await handleResponse(res, 'Failed to fetch domains');
}

export async function createDomain(name, description) {
  const res = await fetch(`${API_BASE}/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  return await handleResponse(res, 'Failed to create domain');
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  return await handleResponse(res, 'Failed to fetch documents');
}

export async function uploadDocument(file, domain) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', domain);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  return await handleResponse(res, 'Failed to upload document');
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE'
  });
  return await handleResponse(res, 'Failed to delete document');
}

export async function queryRAG(query, domainOverride = null, strategyOverride = null) {
  const res = await fetch(`${API_BASE}/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      domain_override: domainOverride || null,
      retrieval_strategy_override: strategyOverride || null
    })
  });
  return await handleResponse(res, 'Query pipeline failed');
}

