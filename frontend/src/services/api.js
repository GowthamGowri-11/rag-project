const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return await res.json();
}

export async function fetchDomains() {
  const res = await fetch(`${API_BASE}/domains`);
  if (!res.ok) throw new Error(`Failed to fetch domains: ${res.status}`);
  return await res.json();
}

export async function createDomain(name, description) {
  const res = await fetch(`${API_BASE}/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create domain');
  }
  return await res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return await res.json();
}

export async function uploadDocument(file, domain) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', domain);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload document');
  }
  return await res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete document: ${res.status}`);
  return await res.json();
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Query failed');
  }
  return await res.json();
}
