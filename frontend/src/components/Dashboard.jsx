import React from 'react';
import { Database, Layers, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Dashboard({ health, domains, documents, onNavigate }) {
  const totalChunks = domains.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const isQdrantReady = health?.ai_service?.qdrant?.is_connected;

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#818cf8" />
            Active Domains
          </div>
          <div className="metric-value">{domains.length}</div>
          <div className="metric-detail">Dynamically extensible namespaces</div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#06b6d4" />
            Indexed Documents
          </div>
          <div className="metric-value">{documents.length}</div>
          <div className="metric-detail">{totalChunks} total vector chunks stored</div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="#10b981" />
            Vector Engine
          </div>
          <div className="metric-value" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isQdrantReady ? (
              <>
                <CheckCircle2 size={24} color="#10b981" />
                <span>Qdrant Cloud</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={24} color="#6366f1" />
                <span>Local Vector Store</span>
              </>
            )}
          </div>
          <div className="metric-detail">BGE-M3 1024-dim dense + sparse payload</div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#f59e0b" />
            Evidence Gate
          </div>
          <div className="metric-value" style={{ fontSize: '1.4rem', color: '#f59e0b' }}>
            Strict Refusal
          </div>
          <div className="metric-detail">Anti-hallucination pre-check active</div>
        </div>
      </div>

      {/* Domain Quick Overview */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600 }}>Active Knowledge Domains</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Each domain is isolated in Qdrant with dedicated payload filtering</p>
          </div>
          <button className="btn-primary" onClick={() => onNavigate('domains')}>
            Manage Domains
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {domains.map((dom) => (
            <div key={dom.id} className="glass-panel glass-panel-interactive" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-domain">{dom.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dom.chunk_count} chunks</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{dom.description}</p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {dom.document_count || 0} documents indexed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Guarantees */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
          System Grounding Contract
        </h3>
        <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Strict Evidence Gate</strong>: Gemini 3.5 Flash is NEVER called when sufficient supporting evidence is missing.</span>
          </li>
          <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Adaptive Chunking</strong>: Documents are automatically analyzed for tables, code, and hierarchy to select optimal chunking.</span>
          </li>
          <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Dynamic Extensibility</strong>: Add new domains at runtime without re-indexing existing knowledge bases.</span>
          </li>
          <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Transformer Reranker</strong>: BGE Reranker v2-M3 ranks candidate chunks before context optimization.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
