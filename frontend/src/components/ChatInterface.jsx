import React, { useState } from 'react';
import { Send, ShieldAlert, CheckCircle, Activity, BookOpen, Layers, Terminal, Sparkles, Filter } from 'lucide-react';
import { queryRAG } from '../services/api';

export default function ChatInterface({ domains }) {
  const [queryText, setQueryText] = useState('');
  const [domainOverride, setDomainOverride] = useState('');
  const [strategyOverride, setStrategyOverride] = useState('');
  const [loading, setLoading] = useState(false);
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
  const [activeTelemetry, setActiveTelemetry] = useState(null);

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
      setActiveTelemetry(response.telemetry);
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
    <div className="chat-layout">
      {/* Chat Conversation Area */}
      <div className="glass-panel chat-main">
        {/* Chat Header Filters */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Scope:
          </span>
          <select
            className="form-select"
            style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
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
            style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
            value={strategyOverride}
            onChange={(e) => setStrategyOverride(e.target.value)}
          >
            <option value="">Adaptive Retrieval (Auto)</option>
            <option value="dense">Dense Vector Only</option>
            <option value="sparse">Sparse Lexical Only</option>
            <option value="hybrid">Hybrid Fusion</option>
          </select>
        </div>

        {/* Message List */}
        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-ai'}`}
              onClick={() => m.telemetry && setActiveTelemetry(m.telemetry)}
            >
              {/* AI Metadata Tags */}
              {m.role === 'assistant' && m.status && m.id !== 'welcome' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {m.status === 'ANSWERED' ? (
                    <span className="badge badge-answered">
                      <CheckCircle size={12} /> ANSWERED (GROUNDED)
                    </span>
                  ) : m.status === 'NO_EVIDENCE' ? (
                    <span className="badge badge-no-evidence">
                      <ShieldAlert size={12} /> NO_EVIDENCE (LLM REFUSED)
                    </span>
                  ) : (
                    <span className="badge badge-failed">{m.status}</span>
                  )}

                  {m.domain && (
                    <span className="badge badge-domain">
                      Domain: {m.domain}
                    </span>
                  )}

                  {m.strategy && (
                    <span className="badge badge-strategy">
                      {m.strategy.toUpperCase()}
                    </span>
                  )}

                  {m.telemetry && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                      {m.telemetry.total_query_latency_ms}ms
                    </span>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>{m.text}</div>

              {/* Gate Reason on Refusal */}
              {m.gateReason && (
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--status-warning)', fontStyle: 'italic' }}>
                  Evidence Gate: {m.gateReason}
                </div>
              )}

              {/* Sources Accordion */}
              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14} color="#818cf8" /> Retransmitted Sources ({m.sources.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {m.sources.map((src, idx) => (
                      <div key={idx} className="citation-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                          <span>{src.document_name}</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>
                            {src.relevance_score ? `Score: ${(src.relevance_score).toFixed(2)}` : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {src.page ? `Page ${src.page} • ` : ''}
                          {src.section ? `Section: ${src.section} • ` : ''}
                          Domain: {src.domain}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message-bubble message-ai" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="#818cf8" className="spin-icon" />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Executing Query Analyzer → Retrieval Router → Reranker → Evidence Gate...
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="chat-input-box">
          <input
            type="text"
            className="query-input"
            placeholder="Ask a question grounded exclusively in your indexed documents..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={!queryText.trim() || loading}>
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Inspector / Observability Sidebar */}
      <div className="glass-panel inspector-panel">
        <h3 className="panel-title">
          <Activity size={18} color="#06b6d4" />
          Execution Telemetry
        </h3>

        {activeTelemetry ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Evidence Status</span>
              <div style={{ marginTop: '4px' }}>
                {activeTelemetry.evidence_status === 'PASS' ? (
                  <span className="badge badge-answered">PASS - Grounded Generation</span>
                ) : (
                  <span className="badge badge-no-evidence">FAIL - LLM Inhibited</span>
                )}
              </div>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">Retrieval Mode</span>
              <span className="telemetry-val">{activeTelemetry.retrieval_strategy}</span>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">Detected Domain</span>
              <span className="telemetry-val">{activeTelemetry.domain_detected || 'Global'}</span>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">Candidate Chunks</span>
              <span className="telemetry-val">{activeTelemetry.candidate_count}</span>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">Evidence Score</span>
              <span className="telemetry-val">{(activeTelemetry.evidence_score).toFixed(3)}</span>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">Retrieval Latency</span>
              <span className="telemetry-val">{activeTelemetry.retrieval_latency_ms}ms</span>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">Reranking Latency</span>
              <span className="telemetry-val">{activeTelemetry.reranking_latency_ms}ms</span>
            </div>

            <div className="telemetry-row">
              <span className="telemetry-key">LLM Generation</span>
              <span className="telemetry-val">{activeTelemetry.llm_latency_ms}ms</span>
            </div>

            <div className="telemetry-row" style={{ borderTop: '1px solid var(--border-card)', marginTop: '8px', paddingTop: '10px' }}>
              <span className="telemetry-key" style={{ fontWeight: 600 }}>Total Pipeline</span>
              <span className="telemetry-val" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {activeTelemetry.total_query_latency_ms}ms
              </span>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Anti-hallucination verification: Reranker confidence and evidence density are strictly checked before any prompt is passed to Gemini 3.5 Flash.
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '40px' }}>
            Submit a query to inspect live pipeline latency, domain matching, candidate counts, and evidence gate decisions.
          </div>
        )}
      </div>
    </div>
  );
}
