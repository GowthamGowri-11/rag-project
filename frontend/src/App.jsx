import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  MessageSquare, 
  Layers, 
  Database, 
  RefreshCw, 
  Plus, 
  Compass, 
  Server,
  Activity,
  ChevronDown,
  X
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import ChatInterface from './components/ChatInterface';
import KnowledgeHub from './components/KnowledgeHub';
import { fetchHealth, fetchDomains, fetchDocuments } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chat' | 'hub'
  const [health, setHealth] = useState(null);
  const [domains, setDomains] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState('');

  const loadData = async () => {
    try {
      const [h, doms, docs] = await Promise.allSettled([
        fetchHealth(),
        fetchDomains(),
        fetchDocuments()
      ]);
      if (h.status === 'fulfilled' && h.value) setHealth(h.value);
      if (doms.status === 'fulfilled' && Array.isArray(doms.value)) setDomains(doms.value);
      if (docs.status === 'fulfilled' && Array.isArray(docs.value)) setDocuments(docs.value);
    } catch (err) {
      console.warn('Data sync notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const drawerRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        if (!event.target.closest('.status-summary-pill')) {
          setShowStatusDrawer(false);
        }
      }
    }
    if (showStatusDrawer) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDrawer]);

  const isGatewayOnline = !!health?.gateway;
  const isAiServiceOnline = health?.ai_service?.status === 'HEALTHY';
  const isQdrantReady = !!health?.ai_service?.qdrant?.is_connected;

  const handleStartChatWithPrompt = (prompt) => {
    setPrefilledPrompt(prompt);
    setActiveTab('chat');
  };

  const handleNewChat = () => {
    setPrefilledPrompt('');
    setActiveTab('chat');
  };

  return (
    <div className="app-shell">
      {/* Top Sleek Navigation Bar */}
      <header className="navbar">
        {/* Left: Brand Identity */}
        <div className="nav-brand" onClick={() => setActiveTab('overview')}>
          <div className="brand-icon-box">
            <img src="/atlyx-logo.png" alt="ATLYX-AI" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <span className="brand-name">ATLYX-AI</span>
            <span className="brand-badge">Strict Grounding</span>
          </div>
        </div>

        {/* Center: Navigation Control */}
        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Compass size={14} />
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={14} />
            <span>ATLYX Chat</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'hub' ? 'active' : ''}`}
            onClick={() => setActiveTab('hub')}
          >
            <Layers size={14} />
            <span>Knowledge Hub ({documents.length})</span>
          </button>
        </nav>

        {/* Right: Live Telemetry & Actions */}
        <div className="nav-actions">
          {/* Micro Status Summary Pill */}
          <div 
            className="status-summary-pill"
            onClick={() => setShowStatusDrawer(!showStatusDrawer)}
            title="Click to view backend service status"
          >
            <span 
              className={`status-dot ${isAiServiceOnline ? 'online' : (isGatewayOnline ? 'degraded' : 'offline')}`} 
            />
            <span>
              {isAiServiceOnline ? 'Services Ready' : (isGatewayOnline ? 'Gateway Port 5000' : 'Offline')}
            </span>
            <ChevronDown size={12} />
          </div>

          {/* Quick Action: New Chat */}
          <button
            className="btn-atlyx-primary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={handleNewChat}
          >
            <Plus size={14} />
            <span>New Query</span>
          </button>
        </div>

        {/* Service Status Drawer Dropdown */}
        {showStatusDrawer && (
          <div className="service-status-drawer" ref={drawerRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                System Architecture Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={loadData}
                  className="btn-icon-subtle"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  title="Refresh Health"
                >
                  <RefreshCw size={11} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowStatusDrawer(false)}
                  className="btn-icon-subtle"
                  style={{ 
                    padding: '4px', 
                    borderRadius: 'var(--radius-full)', 
                    color: 'var(--text-secondary)',
                    lineHeight: 1
                  }}
                  title="Close Status Drawer"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="service-drawer-row">
              <span style={{ color: 'var(--text-secondary)' }}>Express Gateway</span>
              <span style={{ 
                color: isGatewayOnline ? 'var(--success)' : 'var(--danger)', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span className={`status-dot ${isGatewayOnline ? 'online' : 'offline'}`} />
                {isGatewayOnline ? 'Port 5000 (Active)' : 'Disconnected'}
              </span>
            </div>

            <div className="service-drawer-row">
              <span style={{ color: 'var(--text-secondary)' }}>Python AI Engine</span>
              <span style={{ 
                color: isAiServiceOnline ? 'var(--success)' : 'var(--warning)', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span className={`status-dot ${isAiServiceOnline ? 'online' : 'degraded'}`} />
                {isAiServiceOnline ? 'Port 8000 (Healthy)' : 'Offline / Standby'}
              </span>
            </div>

            <div className="service-drawer-row">
              <span style={{ color: 'var(--text-secondary)' }}>Qdrant Cloud Store</span>
              <span style={{ 
                color: isQdrantReady ? 'var(--success)' : 'var(--text-muted)', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span className={`status-dot ${isQdrantReady ? 'online' : 'offline'}`} />
                {isQdrantReady ? 'Connected' : 'Pending Engine'}
              </span>
            </div>

            {!isAiServiceOnline && (
              <div style={{
                marginTop: '4px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}>
                To enable live embeddings & reranking, launch the AI service:
                <code style={{ display: 'block', marginTop: '4px', color: 'var(--atlyx-accent)', fontFamily: 'var(--font-mono)' }}>
                  python ai-service/app.py
                </code>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main View Area */}
      <main className="main-content">
        {activeTab === 'overview' && (
          <LandingPage
            domains={domains}
            documents={documents}
            health={health}
            onNavigate={(tab) => setActiveTab(tab)}
            onStartChatWithPrompt={handleStartChatWithPrompt}
          />
        )}

        {activeTab === 'chat' && (
          <ChatInterface
            domains={domains}
            initialPrompt={prefilledPrompt}
          />
        )}

        {activeTab === 'hub' && (
          <KnowledgeHub
            domains={domains}
            documents={documents}
            onRefresh={loadData}
          />
        )}
      </main>
    </div>
  );
}
