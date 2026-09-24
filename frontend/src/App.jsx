import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Layers, UploadCloud, MessageSquare, FileText, Shield, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  const isGatewayConnected = health?.gateway;
  const isAiServiceOnline = health?.ai_service?.status === 'HEALTHY';

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon-box">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="title-primary">Adaptive Domain-Aware RAG</h1>
            <p className="subtitle">Strict Grounding • Dynamic Domain Isolation • Adaptive Retrieval</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Gateway Status Badge */}
          <div className={`badge ${isGatewayConnected ? 'badge-success' : 'badge-danger'}`}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isGatewayConnected ? 'var(--success)' : 'var(--danger)'
            }} />
            <span>Gateway: {isGatewayConnected ? 'Port 5000' : 'Disconnected'}</span>
          </div>

          {/* AI Engine Status Badge */}
          <div className={`badge ${isAiServiceOnline ? 'badge-success' : 'badge-warning'}`}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isAiServiceOnline ? 'var(--success)' : 'var(--warning)'
            }} />
            <span>AI Service: {isAiServiceOnline ? 'Port 8000' : 'Offline'}</span>
          </div>

          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ padding: '5px 8px' }}
            title="Refresh status"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* AI Service Offline Warning Banner */}
      {!isAiServiceOnline && !loading && (
        <div style={{
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          color: 'var(--warning)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8125rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>AI Service Unreachable:</strong> Start the Python service in terminal with <code>cd ai-service; python app.py</code> to enable document uploads and grounded chat.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          <Layers size={15} />
          <span>Domains ({domains.length})</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={15} />
          <span>Ingestion</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={15} />
          <span>Grounded Chat</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={15} />
          <span>Repository ({documents.length})</span>
        </button>
      </nav>

      {/* Main View Display */}
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
