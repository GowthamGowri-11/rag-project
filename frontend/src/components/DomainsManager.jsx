import React, { useState } from 'react';
import { PlusCircle, Layers, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { createDomain } from '../services/api';

export default function DomainsManager({ domains, onRefreshDomains }) {
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
      setFeedback({ type: 'success', message: `Domain "${name}" created successfully.` });
      await onRefreshDomains();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
      {/* Creation Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 className="panel-title">
          <PlusCircle size={18} color="#818cf8" />
          Create New Domain
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Domains dynamically partition the knowledge base in Qdrant with zero system recompilation.
        </p>

        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.84rem',
            background: feedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            color: feedback.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`
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
              placeholder="e.g. Legal, Clinical, Finance, RFC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe scope of knowledge (e.g. Statutory legal clauses, case law)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Registering Domain...' : 'Register Domain'}
          </button>
        </form>
      </div>

      {/* Domain Registry Grid */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="panel-title">
              <Layers size={18} color="#06b6d4" />
              Dynamic Domain Registry
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Queries matching these domains retrieve exclusively from their isolated vectors.
            </p>
          </div>
          <span className="badge badge-strategy">{domains.length} Registered</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {domains.map((dom) => (
            <div key={dom.id} className="glass-panel glass-panel-interactive" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-domain">{dom.name}</span>
                <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {dom.chunk_count} Chunks
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '40px' }}>
                {dom.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>ID: {dom.id}</span>
                <span>{dom.document_count || 0} Docs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
