import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Layers, UploadCloud, MessageSquare, FileText, Shield, Activity, RefreshCw } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DomainsManager from './components/DomainsManager';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';
import { fetchHealth, fetchDomains, fetchDocuments } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [domains, setDomains] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [h, doms, docs] = await Promise.allSettled([
        fetchHealth(),
        fetchDomains(),
        fetchDocuments()
      ]);
      if (h.status === 'fulfilled') setHealth(h.value);
      if (doms.status === 'fulfilled') setDomains(doms.value);
      if (docs.status === 'fulfilled') setDocuments(docs.value);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // 15s poll for background indexing sync
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon-box">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="title-primary">Adaptive Domain-Aware RAG</h1>
            <p className="subtitle">Strict Grounding • Dynamic Domain Isolation • Adaptive Retrieval</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Health Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: health?.status === 'HEALTHY' ? '#10b981' : '#f59e0b'
            }} />
            <span>{health?.status === 'HEALTHY' ? 'Gateway Connected' : 'Checking System...'}</span>
          </div>

          <button
            onClick={loadData}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem'
            }}
            title="Refresh state"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs" style={{ marginBottom: '24px' }}>
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          <Layers size={16} />
          <span>Domains ({domains.length})</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={16} />
          <span>Ingestion Pipeline</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>Grounded Chat</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={16} />
          <span>Repository ({documents.length})</span>
        </button>
      </nav>

      {/* Main View Area */}
      <main>
        {activeTab === 'dashboard' && (
          <Dashboard
            health={health}
            domains={domains}
            documents={documents}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'domains' && (
          <DomainsManager
            domains={domains}
            onRefreshDomains={loadData}
          />
        )}

        {activeTab === 'upload' && (
          <DocumentUpload
            domains={domains}
            onUploadSuccess={loadData}
          />
        )}

        {activeTab === 'chat' && (
          <ChatInterface
            domains={domains}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentList
            documents={documents}
            onRefresh={loadData}
          />
        )}
      </main>
    </div>
  );
}
