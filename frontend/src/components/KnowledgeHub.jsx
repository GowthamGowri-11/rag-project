import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Layers, 
  Trash2, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Search,
  Filter,
  RefreshCw,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { uploadDocument, createDomain, deleteDocument } from '../services/api';

export default function KnowledgeHub({ domains = [], documents = [], onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('upload'); // 'upload' | 'documents' | 'domains'
  
  // Upload State
  const [file, setFile] = useState(null);
  const [targetDomain, setTargetDomain] = useState(domains[0]?.id || 'rag');
  const [customDomainName, setCustomDomainName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Domain Creation State
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  const [domainFeedback, setDomainFeedback] = useState(null);

  // Document Search / Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadResult(null);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select or drop a file to ingest.');
      return;
    }

    const domainCandidate = customDomainName.trim() || targetDomain || 'rag';
    const cleanDomain = domainCandidate.toLowerCase().replace(/\s+/g, '_');

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await uploadDocument(file, cleanDomain);
      setUploadResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onRefresh) onRefresh();
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Check if AI service is running on port 8000.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateDomainSubmit = async (e) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    setIsCreatingDomain(true);
    setDomainFeedback(null);

    try {
      await createDomain(newDomainName.trim(), newDomainDesc.trim());
      setNewDomainName('');
      setNewDomainDesc('');
      setDomainFeedback({ type: 'success', text: `Domain "${newDomainName}" registered successfully in Qdrant.` });
      if (onRefresh) onRefresh();
    } catch (err) {
      setDomainFeedback({ type: 'error', text: err.message || 'Failed to create domain.' });
    } finally {
      setIsCreatingDomain(false);
    }
  };

  const handleDeleteDocument = async (docId, filename) => {
    if (!window.confirm(`Permanently remove "${filename}" and purge all its vectors from Qdrant?`)) {
      return;
    }
    try {
      await deleteDocument(docId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = !domainFilter || doc.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="hub-container page-fade-in">
      {/* Sub Tabs */}
      <div className="hub-tabs">
        <button
          className={`hub-tab-btn ${activeSubTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('upload')}
        >
          <UploadCloud size={16} />
          <span>Ingest Document</span>
        </button>

        <button
          className={`hub-tab-btn ${activeSubTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('documents')}
        >
          <FileText size={16} />
          <span>Document Library ({documents.length})</span>
        </button>

        <button
          className={`hub-tab-btn ${activeSubTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('domains')}
        >
          <Layers size={16} />
          <span>Domain Partitions ({domains.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: INGESTION */}
      {activeSubTab === 'upload' && (
        <div className="hub-panel">
          <div style={{ marginBottom: '24px' }}>
            <h2 className="hub-panel-title">Adaptive Multi-Format Ingestion</h2>
            <p className="hub-panel-desc">
              Upload PDF, DOCX, Markdown, Code, CSV, or HTML. The analyzer evaluates structural density and automatically selects optimal chunking strategies.
            </p>
          </div>

          {uploadError && (
            <div style={{
              backgroundColor: 'var(--rose-subtle)',
              border: '1px solid var(--rose-border)',
              color: 'var(--rose)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.84rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Ingestion Error:</strong> {uploadError}
              </div>
            </div>
          )}

          {uploadResult && (
            <div style={{
              backgroundColor: 'var(--emerald-subtle)',
              border: '1px solid var(--emerald-border)',
              color: 'var(--emerald)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.84rem'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Ingestion Successful:</strong> Indexed {uploadResult.chunks_stored || uploadResult.chunk_count || 0} chunks into domain "{uploadResult.domain || targetDomain}".
                <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>
                  Strategy applied: {uploadResult.chunking_strategy || 'adaptive'} • Document is immediately searchable in grounded chat.
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleUploadSubmit}>
            {/* Domain Selection Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Target Knowledge Domain
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#ffffff' }}
                  value={targetDomain}
                  onChange={(e) => {
                    setTargetDomain(e.target.value);
                    setCustomDomainName('');
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Or Create New Domain Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Legal, Clinical, Finance..."
                  value={customDomainName}
                  onChange={(e) => setCustomDomainName(e.target.value)}
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              className={`dropzone-atlyx ${file ? 'active' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '24px' }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                    setUploadError(null);
                    setUploadResult(null);
                  }
                }}
                accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.csv,.json,.py,.js,.ts,.java,.cpp,.go,.rs,.sql"
              />

              {!file ? (
                <>
                  <UploadCloud size={38} color="var(--atlyx-accent)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Click to browse or drop knowledge documents
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Supported: PDF, DOCX, TXT, Markdown, CSV, JSON, Source Code (up to 25MB)
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                  <FileText size={30} color="var(--atlyx-accent)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {formatBytes(file.size)} • Ready to ingest & partition
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-atlyx-primary"
              disabled={!file || isUploading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {isUploading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Ingesting & Reranking Vectors...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Ingest into Domain Vector Store</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* SUB-VIEW 2: DOCUMENT LIBRARY */}
      {activeSubTab === 'documents' && (
        <div className="hub-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <h2 className="hub-panel-title">Indexed Document Repository</h2>
              <p className="hub-panel-desc">
                All multi-format documents partitioned, chunked, and vector-indexed across domains.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />

              <select
                className="filter-select"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                <option value="">All Domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {documents.length === 0 ? 'No documents indexed yet.' : 'No matching documents found.'}
              </div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                Use the Ingest Document tab to add files.
              </div>
            </div>
          ) : (
            <div className="modern-table-wrapper">
              <table className="modern-table">
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
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.document_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {doc.filename}
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-full)', 
                          backgroundColor: 'var(--bg-subtle)', 
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)'
                        }}>
                          {doc.domain}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {doc.document_type}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {doc.chunking_strategy}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {doc.chunk_count}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {formatBytes(doc.file_size_bytes)}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--emerald-subtle)',
                          color: 'var(--emerald)',
                          border: '1px solid var(--emerald-border)'
                        }}>
                          READY
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteDocument(doc.document_id, doc.filename)}
                          className="btn-icon-subtle"
                          style={{ color: 'var(--rose)', borderColor: 'var(--rose-border)' }}
                          title="Purge vectors from Qdrant"
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
      )}

      {/* SUB-VIEW 3: DOMAIN PARTITIONS */}
      {activeSubTab === 'domains' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          {/* Creation Panel */}
          <div className="hub-panel">
            <div style={{ marginBottom: '20px' }}>
              <h2 className="hub-panel-title">Register Domain</h2>
              <p className="hub-panel-desc">
                Partitions vectors dynamically in Qdrant with isolated payload filtering.
              </p>
            </div>

            {domainFeedback && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.82rem',
                backgroundColor: domainFeedback.type === 'success' ? 'var(--emerald-subtle)' : 'var(--rose-subtle)',
                color: domainFeedback.type === 'success' ? 'var(--emerald)' : 'var(--rose)',
                border: `1px solid ${domainFeedback.type === 'success' ? 'var(--emerald-border)' : 'var(--rose-border)'}`
              }}>
                {domainFeedback.text}
              </div>
            )}

            <form onSubmit={handleCreateDomainSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Domain Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical, Security, Legal"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  required
                  disabled={isCreatingDomain}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Domain Scope & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe scope of knowledge partition..."
                  value={newDomainDesc}
                  onChange={(e) => setNewDomainDesc(e.target.value)}
                  disabled={isCreatingDomain}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-atlyx-primary"
                disabled={!newDomainName.trim() || isCreatingDomain}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <PlusCircle size={15} />
                <span>{isCreatingDomain ? 'Registering...' : 'Create Domain Partition'}</span>
              </button>
            </form>
          </div>

          {/* Registered Domains List */}
          <div className="hub-panel">
            <div style={{ marginBottom: '20px' }}>
              <h2 className="hub-panel-title">Active Knowledge Domains</h2>
              <p className="hub-panel-desc">
                Each domain is an isolated vector namespace in Qdrant with zero cross-contamination.
              </p>
            </div>

            {domains.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Layers size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <p>No active domains registered yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {domains.map((dom) => (
                  <div
                    key={dom.id}
                    style={{
                      padding: '14px 18px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {dom.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {dom.description || 'Dedicated knowledge partition'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}>
                        {dom.document_count || 0} docs
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--atlyx-subtle)',
                        border: '1px solid var(--atlyx-border)',
                        color: 'var(--atlyx-accent)'
                      }}>
                        {dom.chunk_count || 0} chunks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
