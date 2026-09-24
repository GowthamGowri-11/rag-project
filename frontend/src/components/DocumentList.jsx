import React from 'react';
import { Trash2, FileText, UploadCloud } from 'lucide-react';
import { deleteDocument } from '../services/api';

export default function DocumentList({ documents = [], onRefresh }) {
  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete "${filename}" and purge all its vectors from Qdrant?`)) {
      return;
    }
    try {
      await deleteDocument(docId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">
            <FileText size={16} color="var(--primary)" />
            <span>Document Repository</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            All multi-format documents parsed, adaptively chunked, and vector-indexed across domains.
          </p>
        </div>
        <span className="badge badge-info">{documents.length} Indexed Documents</span>
      </div>

      <div className="panel-body" style={{ padding: 0 }}>
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              No documents indexed yet
            </p>
            <p style={{ fontSize: '0.75rem' }}>
              Go to the Ingestion tab to upload your first knowledge files.
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Domain</th>
                  <th>Format</th>
                  <th>Strategy</th>
                  <th>Chunks</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.document_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {doc.filename}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{doc.domain}</span>
                    </td>
                    <td style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {doc.document_type}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {doc.chunking_strategy}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {doc.chunk_count}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatBytes(doc.file_size_bytes)}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        READY
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(doc.document_id, doc.filename)}
                        className="btn-danger"
                        title="Delete from Qdrant"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
