import React, { useState } from 'react';
import { Send, ShieldAlert, CheckCircle2, BookOpen, Filter, Trash2, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { queryRAG } from '../services/api';

export default function ChatInterface({ domains = [] }) {
  const [queryText, setQueryText] = useState('');
  const [domainOverride, setDomainOverride] = useState('');
  const [strategyOverride, setStrategyOverride] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [expandedTelemetry, setExpandedTelemetry] = useState({});
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      status: 'READY',
      text: 'Adaptive Domain-Aware RAG is initialized. Ask questions strictly grounded in your indexed knowledge domains. If evidence is insufficient, the system will explicitly refuse to answer without invoking the LLM.',
      sources: [],
      telemetry: null
    }
  ]);

  const toggleSources = (msgId) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleTelemetry = (msgId) => {
    setExpandedTelemetry((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        status: 'READY',
        text: 'Chat history cleared. System ready for queries.',
        sources: [],
        telemetry: null
      }
    ]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || loading) return;

    const userPrompt = queryText.trim();
    setQueryText('');

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: userPrompt
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await queryRAG(
        userPrompt,
        domainOverride || null,
        strategyOverride || null
      );

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        status: response.status,
        domain: response.domain,
        strategy: response.retrieval_strategy,
        text: response.answer,
        sources: response.sources || [],
        telemetry: response.telemetry,
        gateReason: response.gate_reason || response.refusal_reason
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        status: 'FAILED',
        text: `Pipeline error: ${err.message}`,
        sources: [],
        telemetry: null
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Top Filter & Action Bar */}
      <div className="chat-toolbar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Scope:
          </span>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem' }}
            value={domainOverride}
            onChange={(e) => setDomainOverride(e.target.value)}
          >
            <option value="">Auto-Detect Domain</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>Domain: {d.name}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem' }}
            value={strategyOverride}
            onChange={(e) => setStrategyOverride(e.target.value)}
          >
            <option value="">Retrieval: Adaptive (Auto)</option>
            <option value="dense">Dense Vector Retrieval</option>
            <option value="sparse">Sparse Lexical Retrieval</option>
            <option value="hybrid">Hybrid Fusion Retrieval</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          title="Clear conversation"
        >
          <Trash2 size={13} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="message-user">
                {msg.text}
              </div>
            );
          }

          // Assistant Message
          const isAnswered = msg.status === 'ANSWERED';
          const isRefused = msg.status === 'NO_EVIDENCE';
          const isFailed = msg.status === 'FAILED';

          return (
            <div key={msg.id} className="message-assistant">
              {/* Header Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAnswered && (
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} /> Grounded Answer
                    </span>
                  )}
                  {isRefused && (
                    <span className="badge badge-warning">
                      <ShieldAlert size={12} /> Strict Refusal (Zero Hallucination)
                    </span>
                  )}
                  {isFailed && (
                    <span className="badge badge-danger">
                      Pipeline Error
                    </span>
                  )}
                  {msg.status === 'READY' && (
                    <span className="badge badge-neutral">System Ready</span>
                  )}

                  {msg.domain && (
                    <span className="badge badge-neutral">Domain: {msg.domain}</span>
                  )}
                  {msg.strategy && (
                    <span className="badge badge-info">{msg.strategy}</span>
                  )}
                </div>
              </div>

              {/* Body Text */}
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>

              {/* Sources Toggle & Content */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-muted)', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => toggleSources(msg.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--info)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Supporting Sources ({msg.sources.length})</span>
                    {expandedSources[msg.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {expandedSources[msg.id] && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.sources.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-muted)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.document_name}</span>
                            {s.page && <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>p. {s.page}</span>}
                            {s.section && <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>§ {s.section}</span>}
                          </div>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            Score: {(s.relevance_score || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Telemetry Toggle & Content */}
              {msg.telemetry && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleTelemetry(msg.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Inspect Pipeline Latency & Gates</span>
                    {expandedTelemetry[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {expandedTelemetry[msg.id] && (
                    <div style={{
                      marginTop: '6px',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.72rem',
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>Model: <strong>gemini-3.5-flash</strong></span>
                      <span>Total: <strong>{msg.telemetry.total_query_latency_ms}ms</strong></span>
                      <span>Retrieve: <strong>{msg.telemetry.retrieval_latency_ms}ms</strong></span>
                      <span>Rerank: <strong>{msg.telemetry.reranking_latency_ms}ms</strong></span>
                      <span>Candidates: <strong>{msg.telemetry.candidate_count}</strong></span>
                      <span>Gate Score: <strong>{(msg.telemetry.evidence_score || 0).toFixed(2)}</strong></span>
                      <span>LLM: <strong>{msg.telemetry.llm_latency_ms}ms</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="message-assistant" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu className="spin-icon" size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Executing retrieval router, cross-encoder reranker, and evidence gate...
            </span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="form-input"
          style={{ flex: 1 }}
          placeholder="Ask a question strictly grounded in uploaded knowledge..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!queryText.trim() || loading}
          style={{ padding: '8px 16px' }}
        >
          <Send size={14} />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
