import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Cpu, X, Layers, Clock } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocumentUpload({ domains = [], onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('rag');
  const [customDomain, setCustomDomain] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Sync selectedDomain when domains list updates
  useEffect(() => {
    if (domains && domains.length > 0 && (!selectedDomain || selectedDomain === 'rag')) {
      setSelectedDomain(domains[0].id);
    }
  }, [domains]);

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

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file to upload.');
      return;
    }

    const domainCandidate = customDomain.trim() || selectedDomain || (domains[0]?.id) || 'rag';
    const targetDomain = domainCandidate.trim().toLowerCase().replace(/\s+/g, '_');

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
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Check if AI service is running on port 8000.');
    } finally {
      setIsUploading(false);
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
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <UploadCloud size={18} color="var(--primary)" />
              <span>Adaptive Document Ingestion</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Upload multi-format documents. The analyzer detects structural density and selects the optimal chunking strategy.
            </p>
          </div>
        </div>

        <div className="panel-body">
          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.8125rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Ingestion Error:</strong> {error}
                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Tip: Ensure Python AI service is running on port 8000 and the document is not an empty or unreadable scan.
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Domain Selection */}
            <div className="form-group">
              <label className="form-label">Target Knowledge Domain</label>
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
                  {domains.length === 0 ? (
                    <option value="rag">Domain: RAG (Default)</option>
                  ) : (
                    domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        Domain: {d.name} ({d.chunk_count || 0} chunks)
                      </option>
                    ))
                  )}
                </select>

                <input
                  type="text"
                  className="form-input"
                  placeholder="Or create new domain (e.g. Legal, Finance)..."
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`drop-zone ${file ? 'active' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '20px' }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.csv,.json,.py,.js,.ts,.java,.cpp,.c,.go,.rs,.sql"
              />

              {!file ? (
                <>
                  <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Click to browse or drag & drop files here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Supported: PDF, DOCX, TXT, Markdown, HTML, CSV, JSON, and Source Code (up to 25MB)
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <FileText size={28} color="var(--primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatBytes(file.size)} • Ready to ingest
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      marginLeft: '12px',
                      padding: '4px'
                    }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.875rem' }}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Cpu className="spin-icon" size={16} />
                  <span>Analyzing, Chunking & Storing in Qdrant...</span>
                </>
              ) : (
                <span>Ingest & Index Document</span>
              )}
            </button>
          </form>

          {/* Success Ingestion Result Card */}
          {uploadResult && (
            <div style={{
              marginTop: '24px',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <CheckCircle2 size={18} color="var(--success)" />
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Document Ingested Successfully
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Strategy Selected</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--info)' }}>
                    {uploadResult.chunking_strategy}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Chunks Generated</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    {uploadResult.chunk_count}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Target Domain</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    {uploadResult.domain}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Processing</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--success)' }}>
                    {uploadResult.telemetry?.total_latency_ms || 0} ms
                  </div>
                </div>
              </div>

              {/* Stage breakdown */}
              {uploadResult.telemetry && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>Parse: {uploadResult.telemetry.load_time_ms}ms</span>
                  <span>Analyze: {uploadResult.telemetry.analyzer_time_ms}ms</span>
                  <span>Chunk: {uploadResult.telemetry.chunking_time_ms}ms</span>
                  <span>Embed (BGE-M3): {uploadResult.telemetry.embedding_time_ms}ms</span>
                  <span>Qdrant Store: {uploadResult.telemetry.storage_time_ms}ms</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
