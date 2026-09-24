import React, { useState } from 'react';
import { PlusCircle, Layers, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { createDomain } from '../services/api';

export default function DomainsManager({ domains = [], onRefreshDomains }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      await createDomain(name.trim(), description.trim());
      setName('');
      setDescription('');
      setFeedback({ type: 'success', message: `Domain "${name}" registered successfully.` });
      if (onRefreshDomains) await onRefreshDomains();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create domain' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
      {/* Creation Card */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <PlusCircle size={16} color="var(--primary)" />
            <span>Create New Domain</span>
          </h3>
        </div>

        <div className="panel-body">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Domains dynamically partition the knowledge base in Qdrant with zero vector re-indexing required.
          </p>

          {feedback && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.8125rem',
              backgroundColor: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
            }}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Domain Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Legal, Clinical, Finance, Security"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scope Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe scope of knowledge (e.g. Technical RFCs, patient protocols)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Registering...' : 'Register Domain'}
            </button>
          </form>
        </div>
      </div>

      {/* Domain Registry Grid */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Layers size={16} color="var(--info)" />
              <span>Registered Knowledge Domains</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Queries scoped to these domains retrieve exclusively from their isolated vectors.
            </p>
          </div>
          <span className="badge badge-info">{domains.length} Registered</span>
        </div>

        <div className="panel-body">
          {domains.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              No custom domains registered yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {domains.map((dom) => (
                <div
                  key={dom.id}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-page)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{dom.name}</strong>
                      <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        id: {dom.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {dom.description || 'No description provided.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-neutral">{dom.document_count || 0} documents</span>
                    <span className="badge badge-info">{dom.chunk_count || 0} chunks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
