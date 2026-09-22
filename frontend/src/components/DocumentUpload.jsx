import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Cpu, Layers } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocumentUpload({ domains, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(domains[0]?.id || 'rag');
  const [customDomain, setCustomDomain] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const targetDomain = customDomain.trim() ? customDomain.trim().toLowerCase() : selectedDomain;
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadDocument(file, targetDomain);
      setUploadResult(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, marginBottom: '8px' }}>
          Adaptive Document Ingestion
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Upload multi-format documents (PDF, DOCX, TXT, MD, HTML, CSV, JSON, Code). The document analyzer will detect structural characteristics and dynamically select the optimal chunking strategy.
        </p>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-danger-bg)',
            color: 'var(--status-danger)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Domain Selection */}
          <div className="form-group">
            <label className="form-label">Assign Knowledge Domain *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select
                className="form-select"
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setCustomDomain('');
                }}
                disabled={isUploading}
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    Domain: {d.name} ({d.chunk_count} chunks)
                  </option>
                ))}
              </select>

              <input
                type="text"
                className="form-input"
                placeholder="Or type new domain name..."
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            className={`drop-zone ${file ? 'active' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: '24px' }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.csv,.json,.py,.js,.ts,.java,.cpp,.c,.go,.rs,.sql"
            />
            <UploadCloud size={44} color="#818cf8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
              {file ? file.name : 'Click to select or drag & drop file'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports PDF, DOCX, TXT, Markdown, HTML, CSV, JSON, and Source Code (up to 25MB)
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Cpu className="spin-icon" size={18} />
                <span>Running Document Analyzer & Vector Pipeline...</span>
              </>
            ) : (
              <span>Ingest & Index in Qdrant</span>
            )}
          </button>
        </form>

        {/* Ingestion Results & Telemetry */}
        {uploadResult && (
          <div className="glass-panel" style={{ marginTop: '28px', padding: '24px', background: 'rgba(12, 17, 28, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CheckCircle2 size={22} color="#10b981" />
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>
                Document Ingestion Complete
              </h4>
              <span className="badge badge-answered" style={{ marginLeft: 'auto' }}>
                READY
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <span className="telemetry-key" style={{ display: 'block', fontSize: '0.75rem' }}>Chunking Strategy</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{uploadResult.chunking_strategy}</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <span className="telemetry-key" style={{ display: 'block', fontSize: '0.75rem' }}>Total Chunks</span>
                <strong>{uploadResult.chunk_count} passages</strong>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <span className="telemetry-key" style={{ display: 'block', fontSize: '0.75rem' }}>Domain</span>
                <span className="badge badge-domain">{uploadResult.domain}</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <span className="telemetry-key" style={{ display: 'block', fontSize: '0.75rem' }}>Pipeline Latency</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{uploadResult.telemetry?.total_latency_ms}ms</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Embeddings: BGE-M3 (1024-dim dense + sparse) • Target: Qdrant payload indexed on domain
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
