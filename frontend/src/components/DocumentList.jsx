import React from 'react';
import { Trash2, FileText, Layers, Clock, HardDrive, CheckCircle2 } from 'lucide-react';
import { deleteDocument } from '../services/api';

export default function DocumentList({ documents, onRefresh }) {
  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Remove "${filename}" and purge all its chunks from Qdrant?`)) {
      return;
    }
    try {
      await deleteDocument(docId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 className="panel-title">
            <FileText size={18} color="#818cf8" />
            Document Repository
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            All multi-format documents parsed, adaptively chunked, and vector-indexed across domains.
          </p>
        </div>
        <span className="badge badge-strategy">{documents.length} Indexed Documents</span>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p>No documents uploaded yet. Head to "Ingestion" to upload your first knowledge files.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Domain</th>
                <th>Format</th>
                <th>Chunking Strategy</th>
                <th>Chunks</th>
                <th>Size</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.document_id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {doc.filename}
                  </td>
                  <td>
                    <span className="badge badge-domain">{doc.domain}</span>
                  </td>
                  <td style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    {doc.document_type}
                  </td>
                  <td>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>
                      {doc.chunking_strategy}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {doc.chunk_count}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td>
                    <span className="badge badge-answered" style={{ fontSize: '0.7rem' }}>
                      READY
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(doc.document_id, doc.filename)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--status-danger)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title="Purge from Qdrant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
