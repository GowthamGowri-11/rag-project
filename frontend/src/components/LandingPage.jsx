import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Layers, 
  Cpu, 
  GitBranch, 
  Play,
  CheckCircle2,
  Sliders,
  FileCheck,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';

export default function LandingPage({ domains = [], documents = [], health = null, onNavigate }) {
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [isSimulatingRoadmap, setIsSimulatingRoadmap] = useState(false);
  const [activePlaygroundScenario, setActivePlaygroundScenario] = useState('grounded');

  const totalChunks = domains.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const isAiServiceOnline = health?.ai_service?.status === 'HEALTHY';
  const isQdrantReady = !!health?.ai_service?.qdrant?.is_connected;

  // 6 Intelligence Processing Stages
  const roadmapStages = [
    {
      number: '01',
      title: 'Query Understanding',
      subtitle: 'Semantic Intent Extraction',
      tagline: 'NLU • Entity Recognition • Complexity Scoring',
      desc: 'Advanced natural language understanding analyzes user queries to extract semantic intent, identify key entities, assess query complexity, and detect domain hints for optimal routing.',
      model: 'Query Analyzer • Intent Classifier • Entity Extractor',
      outputPreview: 'Input: Natural language query ➔ Output: Structured intent + entities + complexity score'
    },
    {
      number: '02',
      title: 'Domain Routing',
      subtitle: 'Intelligent Context Isolation',
      tagline: 'Zero cross-domain information leakage',
      desc: 'Smart domain detection routes queries to the appropriate knowledge partition. Payload-level filtering ensures complete isolation between domains, preventing unauthorized data access.',
      model: 'Domain Router • Payload Filter • Access Controller',
      outputPreview: 'Input: Query + domain hint ➔ Output: Isolated namespace selection with access validation'
    },
    {
      number: '03',
      title: 'Hybrid Search',
      subtitle: 'Multi-Strategy Retrieval',
      tagline: 'Dense semantic + Sparse lexical fusion',
      desc: 'Adaptive retrieval engine dynamically selects between dense vector search, sparse keyword matching, or hybrid fusion based on query characteristics for maximum recall.',
      model: 'Retrieval Router • Dense Retriever • Sparse Retriever • Hybrid Fusion',
      outputPreview: 'Input: Analyzed query ➔ Output: Top 30-50 candidate passages from vector store'
    },
    {
      number: '04',
      title: 'Neural Reranking',
      subtitle: 'Precision Relevance Scoring',
      tagline: 'Cross-attention relevance modeling',
      desc: 'BGE Reranker v2-M3 cross-encoder performs deep query-passage interaction analysis, computing precision relevance scores to select the most semantically aligned candidates.',
      model: 'BGE Reranker v2-M3 • Cross-Encoder Scoring',
      outputPreview: 'Input: 30-50 candidates ➔ Output: Top 5-10 passages with confidence scores'
    },
    {
      number: '05',
      title: 'Evidence Validation',
      subtitle: 'Confidence Threshold Gating',
      tagline: 'Score ≥ 0.45 required for generation',
      desc: 'Strict evidence gate validates top reranking scores against confidence threshold. Insufficient evidence triggers immediate refusal without LLM invocation, guaranteeing zero hallucination.',
      model: 'Evidence Checker • Threshold Validator • Refusal Generator',
      outputPreview: 'Threshold Check: Score ≥ 0.45 ? PASS (invoke LLM) : REFUSE (0 tokens spent)'
    },
    {
      number: '06',
      title: 'Grounded Generation',
      subtitle: 'Source-Attributed Synthesis',
      tagline: 'Full citation traceability',
      desc: 'Gemini synthesizes responses exclusively from verified context passages. Every statement is grounded in retrieved evidence with complete source attribution including document, page, and chunk metadata.',
      model: 'Gemini Flash • Context Optimizer • Citation Formatter',
      outputPreview: 'Input: Verified passages ➔ Output: Grounded answer + full source citations + telemetry'
    }
  ];

  const handleSimulateRoadmap = () => {
    if (isSimulatingRoadmap) return;
    setIsSimulatingRoadmap(true);
    setActiveMilestone(0);

    let current = 0;
    const interval = setInterval(() => {
      current = (current + 1) % roadmapStages.length;
      setActiveMilestone(current);
      // Complete one full loop (back to 0) then stop
      if (current === 0) {
        clearInterval(interval);
        setTimeout(() => setIsSimulatingRoadmap(false), 400);
      }
    }, 4000);
  };

  // Playground Test Scenarios
  const scenarios = {
    grounded: {
      name: 'Evidence-Based Query',
      tag: 'VERIFICATION PASSED',
      tagColor: 'var(--emerald)',
      tagBg: 'var(--emerald-subtle)',
      query: 'Explain how neural reranking improves retrieval precision',
      verdict: 'PASSED • Confidence: 0.94 / 1.0',
      status: 'ANSWERED',
      strategy: 'hybrid (dense + sparse)',
      latency: '287ms',
      answer: 'Neural reranking employs a cross-encoder architecture that performs deep query-passage interaction analysis. Unlike bi-encoders that encode queries and passages independently, the cross-encoder models the semantic relationship between query and passage jointly, enabling more nuanced relevance assessment and significantly higher precision in selecting the most contextually appropriate passages.',
      sources: [
        { name: 'Neural_IR_Architectures.pdf', score: '0.94 match', chunk: 'chunk_rerank_07', excerpt: 'Cross-encoder reranking models provide superior semantic relevance scoring compared to bi-encoder retrieval through joint query-passage encoding...' }
      ]
    },
    refusal: {
      name: 'Out-of-Domain Knowledge Gap',
      tag: 'EVIDENCE INSUFFICIENT',
      tagColor: 'var(--amber)',
      tagBg: 'var(--amber-subtle)',
      query: 'Compare quantum entanglement theories in contemporary physics research',
      verdict: 'GATE BLOCKED • No relevant passages found',
      status: 'NO_EVIDENCE',
      strategy: 'none (pre-generation refusal)',
      latency: '12ms (Zero LLM invocation)',
      answer: 'I cannot provide a response to this query as there is insufficient supporting evidence in your indexed knowledge base. The system\'s grounding protocol prevents speculative answers outside documented sources to ensure factual accuracy and eliminate hallucination risk.',
      sources: []
    },
    isolation: {
      name: 'Domain-Scoped Retrieval',
      tag: 'NAMESPACE ISOLATED',
      tagColor: 'var(--indigo)',
      tagBg: 'var(--indigo-subtle)',
      query: 'Retrieve policy documents from the "Compliance" domain only',
      verdict: 'PASSED • Domain filter applied',
      status: 'ANSWERED',
      strategy: 'dense vector (payload-filtered)',
      latency: '315ms',
      answer: 'Within the Compliance domain, three key policy documents govern operational procedures: (1) Data Retention Policy v3.2 mandating 7-year archival, (2) Access Control Framework requiring dual-factor authentication, and (3) Audit Trail Standards specifying immutable logging. All retrieved passages were strictly filtered to the Compliance namespace using Qdrant payload constraints.',
      sources: [
        { name: 'Compliance_Policy_v3.2.docx', score: '0.89 match', chunk: 'chunk_comp_15', excerpt: 'Data retention policies require a minimum 7-year archival period for all financial records with dual-signature approval...' }
      ]
    }
  };

  const currentScenario = scenarios[activePlaygroundScenario];

  return (
    <div className="landing-container page-fade-in">
      {/* Hero Section */}
      <section className="hero-grid">
        <div className="hero-left">
          <div className="hero-brand-row">
            <img src="/atlyx-logo.png?v=3" alt="" className="hero-mark" />
            <span className="hero-brand-label">ATLYX-AI</span>
          </div>

          <div className="hero-rule" aria-hidden="true" />

          <h1 className="hero-title">
            Intelligence Grounded in <em>Truth</em>,
            <br />
            Not Hallucination.
          </h1>

          <p className="hero-subtitle">
            An enterprise retrieval-augmented generation engine with dynamic domain isolation
            and cross-encoder evidence verification. When verified evidence is absent,
            ATLYX-AI refuses rather than speculating — delivering answers you can trust.
          </p>

          <ul className="hero-proofs">
            <li>
              <ShieldCheck size={15} />
              <span>Strict evidence gate</span>
            </li>
            <li>
              <Layers size={15} />
              <span>Domain isolation</span>
            </li>
            <li>
              <Search size={15} />
              <span>Hybrid retrieval</span>
            </li>
          </ul>

          {typeof onNavigate === 'function' && (
            <div className="hero-actions">
              <button
                type="button"
                className="btn-atlyx-primary"
                onClick={() => onNavigate('chat')}
              >
                <img src="/atlyx-logo.png?v=3" alt="" className="inline-logo-icon" />
                <span>Open AI Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Hero Right: Intelligence Pipeline Visualizer */}
        <div className="pipeline-visualizer-card">
          <div className="pipeline-header">
            <div className="pipeline-title">
              <img src="/atlyx-logo.png" alt="" className="inline-logo-icon" />
              <span>Neural Processing Pipeline</span>
            </div>

            <span className="node-badge" style={{ backgroundColor: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
              REAL-TIME
            </span>
          </div>

          <div className="pipeline-flow">
            <div className="node-row">
              <div className="node-icon-box" style={{ backgroundColor: 'var(--indigo-subtle)', color: 'var(--indigo)' }}>
                <Search size={18} />
              </div>
              <div className="node-info">
                <div className="node-name">1. Semantic Query Analysis</div>
                <div className="node-meta">Intent extraction & entity recognition</div>
              </div>
              <span className="node-badge" style={{ backgroundColor: 'var(--indigo-subtle)', color: 'var(--indigo)' }}>
                ACTIVE
              </span>
            </div>

            <div className="node-row">
              <div className="node-icon-box" style={{ backgroundColor: 'var(--amber-subtle)', color: 'var(--amber)' }}>
                <GitBranch size={18} />
              </div>
              <div className="node-info">
                <div className="node-name">2. Multi-Vector Fusion Retrieval</div>
                <div className="node-meta">Dense 1024-dim + Sparse BM25 hybrid search</div>
              </div>
              <span className="node-badge" style={{ backgroundColor: 'var(--amber-subtle)', color: 'var(--amber)' }}>
                BGE-M3
              </span>
            </div>

            <div className="node-row">
              <div className="node-icon-box" style={{ backgroundColor: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
                <Sliders size={18} />
              </div>
              <div className="node-info">
                <div className="node-name">3. Neural Relevance Reranking</div>
                <div className="node-meta">Cross-encoder confidence scoring</div>
              </div>
              <span className="node-badge" style={{ backgroundColor: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
                v2-M3
              </span>
            </div>

            <div className="node-row">
              <div className="node-icon-box" style={{ backgroundColor: 'var(--atlyx-subtle)', color: 'var(--atlyx-accent)' }}>
                <ShieldCheck size={18} />
              </div>
              <div className="node-info">
                <div className="node-name">4. Evidence Confidence Gating</div>
                <div className="node-meta">Blocks LLM on insufficient evidence</div>
              </div>
              <span className="node-badge" style={{ backgroundColor: 'var(--atlyx-subtle)', color: 'var(--atlyx-accent)' }}>
                STRICT
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Metrics — four separate cards with live platform data */}
      <section className="telemetry-strip" aria-label="Platform metrics">
        <article className="telemetry-item">
          <div className="telemetry-label">
            <Database size={13} color="var(--indigo)" />
            <span>Knowledge Repository</span>
          </div>
          <div className="telemetry-value">{documents.length}</div>
          <div className="telemetry-desc">{totalChunks.toLocaleString()} semantic segments indexed</div>
        </article>

        <article className="telemetry-item">
          <div className="telemetry-label">
            <Layers size={13} color="var(--atlyx-accent)" />
            <span>Neural Partitions</span>
          </div>
          <div className="telemetry-value">{domains.length}</div>
          <div className="telemetry-desc">Context-isolated domain spaces</div>
        </article>

        <article className="telemetry-item">
          <div className="telemetry-label">
            <Cpu size={13} color="var(--emerald)" />
            <span>AI Engine</span>
          </div>
          <div className={`telemetry-value telemetry-value--status ${isAiServiceOnline ? '' : 'is-offline'}`}>
            <span className={`status-dot ${isAiServiceOnline ? 'online' : 'offline'}`} />
            <span>{isAiServiceOnline ? 'Healthy' : 'Offline'}</span>
          </div>
          <div className="telemetry-desc">
            {isAiServiceOnline ? 'Python AI service on port 8000' : 'Start ai-service to enable retrieval'}
          </div>
        </article>

        <article className="telemetry-item">
          <div className="telemetry-label">
            <ShieldCheck size={13} color="var(--amber)" />
            <span>Grounding Status</span>
          </div>
          <div className={`telemetry-value telemetry-value--ok ${isQdrantReady ? '' : 'is-offline'}`}>
            {isQdrantReady ? 'Enforced' : 'Pending'}
          </div>
          <div className="telemetry-desc">
            {isQdrantReady
              ? 'Zero hallucination guarantee active'
              : 'Waiting for Qdrant vector store connection'}
          </div>
        </article>
      </section>

      {/* ==========================================================================
          INTELLIGENT QUERY PROCESSING FLOW
          ========================================================================== */}
      <section className="roadmap-section">
        <div className="roadmap-header-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--atlyx-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Intelligence Architecture
              </span>
            </div>
            <h2 className="section-headline">Multi-Stage Query Processing Pipeline</h2>
            <p className="section-subhead">
              Explore how queries flow through semantic analysis, adaptive retrieval, neural reranking, and evidence validation before generation.
            </p>
          </div>

          <button
            onClick={handleSimulateRoadmap}
            disabled={isSimulatingRoadmap}
            className="btn-atlyx-primary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            <Play size={13} fill="#ffffff" />
            <span>{isSimulatingRoadmap ? 'Running Simulation...' : 'Simulate Query Flow'}</span>
          </button>
        </div>

        <div className="roadmap-canvas">
          {/* Visual Milestone Pathway */}
          <div className="roadmap-timeline">
            <div className="roadmap-track" />

            {roadmapStages.map((stg, idx) => (
              <button
                key={idx}
                className={`roadmap-milestone ${activeMilestone === idx ? 'active' : ''}`}
                onClick={() => setActiveMilestone(idx)}
              >
                <div className="milestone-node">
                  {stg.number}
                </div>
                <div className="milestone-title">{stg.title}</div>
                <div className="milestone-tag">{stg.tagline}</div>
              </button>
            ))}
          </div>

          {/* Detailed Stage Deep-Dive Inspection Card */}
          <div className="roadmap-detail-card">
            <div>
              <div className="detail-eyebrow">
                <img src="/atlyx-logo.png" alt="" className="inline-logo-icon inline-logo-icon--sm" />
                <span>Stage {roadmapStages[activeMilestone].number} Deep Dive</span>
              </div>

              <h3 className="detail-heading">{roadmapStages[activeMilestone].title}: {roadmapStages[activeMilestone].subtitle}</h3>

              <p className="detail-text">{roadmapStages[activeMilestone].desc}</p>

              <div className="detail-checklist">
                <div className="detail-check-item">
                  <Cpu size={14} color="var(--indigo)" style={{ flexShrink: 0 }} />
                  <span><strong>Core Engine:</strong> {roadmapStages[activeMilestone].model}</span>
                </div>
                <div className="detail-check-item">
                  <ShieldCheck size={14} color="var(--emerald)" style={{ flexShrink: 0 }} />
                  <span><strong>Guarantee:</strong> Deterministic processing with full audit trail</span>
                </div>
              </div>
            </div>

            {/* Visual Box on the Right of Roadmap Detail */}
            <div className="detail-visual-box">
              <div className="visual-box-header">
                <span>DATA TRANSFORMATION</span>
                <span style={{ color: 'var(--atlyx-accent)' }}>LIVE FLOW</span>
              </div>

              <div className="code-snippet">
                {roadmapStages[activeMilestone].outputPreview}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Select different stage nodes above to explore each processing phase in detail.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          INTERACTIVE QUERY TESTING PLAYGROUND
          ========================================================================== */}
      <section className="playground-section">
        <div>
          <h2 className="section-headline">Live Query Testing Playground</h2>
          <p className="section-subhead">
            Experience how the system handles verified queries, out-of-domain requests, and domain-isolated retrieval in real-time.
          </p>
        </div>

        <div className="playground-card">
          {/* Scenario Selector Chips */}
          <div className="scenario-chips-row">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Test Scenario:
            </span>

            <button
              className={`scenario-chip ${activePlaygroundScenario === 'grounded' ? 'active' : ''}`}
              onClick={() => setActivePlaygroundScenario('grounded')}
            >
              <CheckCircle2 size={14} color="var(--emerald)" />
              <span>1. Evidence-Based Query</span>
            </button>

            <button
              className={`scenario-chip ${activePlaygroundScenario === 'refusal' ? 'active' : ''}`}
              onClick={() => setActivePlaygroundScenario('refusal')}
            >
              <AlertTriangle size={14} color="var(--amber)" />
              <span>2. Knowledge Gap Refusal</span>
            </button>

            <button
              className={`scenario-chip ${activePlaygroundScenario === 'isolation' ? 'active' : ''}`}
              onClick={() => setActivePlaygroundScenario('isolation')}
            >
              <Filter size={14} color="var(--indigo)" />
              <span>3. Domain-Scoped Retrieval</span>
            </button>
          </div>

          {/* Interactive Result Simulation Box */}
          <div className="playground-result-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: currentScenario.tagBg, color: currentScenario.tagColor, marginRight: '8px' }}>
                  {currentScenario.tag}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  "{currentScenario.query}"
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span className="telemetry-pill">Latency: {currentScenario.latency}</span>
                <span className="telemetry-pill">Strategy: {currentScenario.strategy}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.94rem', lineHeight: '1.68', color: 'var(--text-primary)' }}>
              {currentScenario.answer}
            </div>

            {currentScenario.sources.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Verified Source Citations:
                </div>
                {currentScenario.sources.map((src, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', backgroundColor: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileCheck size={14} color="var(--atlyx-accent)" />
                      <span style={{ fontWeight: 600 }}>{src.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({src.chunk})</span>
                    </div>
                    <span style={{ color: 'var(--emerald)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{src.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
