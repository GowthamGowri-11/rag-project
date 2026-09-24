import React from 'react';
import { Database, Layers, FileText, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Dashboard({ health, domains, documents, onNavigate }) {
  const totalChunks = domains.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const isQdrantReady = health?.ai_service?.qdrant?.is_connected;

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-label">
            <Layers size={14} color="var(--info)" />
            <span>Active Domains</span>
          </div>
          <div className="metric-value">{domains.length}</div>
          <div className="metric-detail">Isolated vector namespaces</div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-label">
            <FileText size={14} color="var(--info)" />
            <span>Indexed Documents</span>
          </div>
          <div className="metric-value">{documents.length}</div>
          <div className="metric-detail">{totalChunks} total vector chunks stored</div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-label">
            <Database size={14} color="var(--success)" />
            <span>Vector Engine</span>
          </div>
          <div className="metric-value" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isQdrantReady ? 'var(--success)' : 'var(--info)'
            }} />
            <span>{isQdrantReady ? 'Qdrant Cloud' : 'Qdrant Active'}</span>
          </div>
          <div className="metric-detail">BGE-M3 1024-dim dense + sparse payload</div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-label">
            <ShieldCheck size={14} color="var(--warning)" />
            <span>Evidence Gate</span>
          </div>
          <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--warning)' }}>
            Strict Grounding
          </div>
          <div className="metric-detail">Refuses unevidenced general queries</div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Active Knowledge Domains */}
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Active Knowledge Domains</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Partitioned in Qdrant with isolated payload filtering
              </p>
            </div>
            <button className="btn-secondary" onClick={() => onNavigate('domains')}>
              <span>Manage</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="panel-body">
            {domains.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No active domains registered yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {domains.map((dom) => (
                  <div
                    key={dom.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-page)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{dom.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {dom.description || 'Dedicated knowledge partition'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-neutral">{dom.document_count || 0} docs</span>
                      <span className="badge badge-info">{dom.chunk_count || 0} chunks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Grounding Contract */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">System Grounding Contract</h3>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Strict Evidence Gate</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Gemini 3.5 Flash is NEVER called when sufficient supporting evidence is missing in the vector base.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Adaptive Chunking</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Files are analyzed for tables, code, and heading hierarchy to dynamically select optimal chunking.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Dynamic Extensibility</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Add new domains at runtime with zero vector re-indexing required for existing domains.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Cross-Encoder Reranking</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  BGE Reranker v2-M3 scores candidate passages down to top 5–10 before context optimization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
