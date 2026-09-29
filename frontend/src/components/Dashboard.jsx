import React from 'react';
import { 
  Brain, 
  Cpu, 
  Search, 
  Shield, 
  Zap, 
  ArrowRight, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Target,
  Filter,
  Layers3
} from 'lucide-react';

export default function Dashboard({ health, domains, documents, onNavigate }) {
  const totalChunks = domains.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const isQdrantReady = health?.ai_service?.qdrant?.is_connected;
  const totalDocuments = documents.length;
  const avgChunksPerDoc = totalDocuments > 0 ? Math.round(totalChunks / totalDocuments) : 0;

  // Calculate system health score
  const calculateHealthScore = () => {
    let score = 0;
    if (health?.gateway) score += 33;
    if (health?.ai_service?.status === 'HEALTHY') score += 34;
    if (isQdrantReady) score += 33;
    return score;
  };

  const healthScore = calculateHealthScore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Intelligence Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '16px' 
      }}>
        {/* Knowledge Repository */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fef9f5 100%)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #d96b43 0%, #eb815a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(217, 107, 67, 0.25)'
            }}>
              <Brain size={22} color="#ffffff" />
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--emerald)',
              background: 'var(--emerald-subtle)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--emerald-border)'
            }}>
              ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px' }}>
            {totalDocuments}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Knowledge Sources
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {totalChunks.toLocaleString()} vectorized segments indexed
          </div>
        </div>

        {/* Neural Domains */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
        onClick={() => onNavigate('hub')}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}>
              <Layers3 size={22} color="#ffffff" />
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px' }}>
            {domains.length}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Neural Domains
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Isolated context partitions
          </div>
        </div>

        {/* Retrieval Performance */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}>
              <Zap size={22} color="#ffffff" />
            </div>
            <TrendingUp size={16} color="var(--emerald)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px' }}>
            {avgChunksPerDoc}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Avg. Chunk Density
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Per document granularity
          </div>
        </div>

        {/* System Health */}
        <div style={{
          background: healthScore === 100 ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: healthScore === 100 
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: healthScore === 100 
                ? '0 4px 12px rgba(5, 150, 105, 0.25)' 
                : '0 4px 12px rgba(217, 119, 6, 0.25)'
            }}>
              <Shield size={22} color="#ffffff" />
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: healthScore === 100 ? 'var(--emerald)' : 'var(--amber)',
              background: healthScore === 100 ? 'var(--emerald-subtle)' : 'var(--amber-subtle)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: healthScore === 100 ? '1px solid var(--emerald-border)' : '1px solid var(--amber-border)'
            }}>
              {healthScore}%
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px' }}>
            {healthScore === 100 ? 'Optimal' : 'Degraded'}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            System Health
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isQdrantReady ? 'All services operational' : 'Limited functionality'}
          </div>
        </div>
      </div>

      {/* Intelligence Pipeline Flow */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <img src="/atlyx-logo.png" alt="" className="inline-logo-icon" />
            Intelligent Processing Pipeline
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Multi-stage semantic processing with adaptive retrieval and strict grounding verification
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {/* Stage 1 */}
          <div style={{
            background: 'linear-gradient(135deg, #fef9f5 0%, #ffffff 100%)',
            border: '1px solid var(--atlyx-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.borderColor = 'var(--atlyx-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'var(--atlyx-border)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--atlyx-accent)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                01
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Semantic Analysis
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Query Processing
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Intent extraction, entity recognition, and complexity scoring to route queries intelligently
            </p>
          </div>

          {/* Stage 2 */}
          <div style={{
            background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)',
            border: '1px solid var(--indigo-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.borderColor = 'var(--indigo)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'var(--indigo-border)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--indigo)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                02
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Hybrid Retrieval
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Multi-Vector Search
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Dense + sparse fusion retrieval across domain-isolated vector partitions with BGE-M3
            </p>
          </div>

          {/* Stage 3 */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1px solid var(--emerald-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.borderColor = 'var(--emerald)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'var(--emerald-border)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--emerald)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                03
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Neural Reranking
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cross-Encoder Scoring
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              BGE Reranker v2-M3 cross-encodes top candidates for precision relevance scoring
            </p>
          </div>

          {/* Stage 4 */}
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
            border: '1px solid var(--amber-border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.borderColor = 'var(--amber)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'var(--amber-border)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--amber)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                04
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Evidence Gating
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Grounding Verification
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Strict confidence threshold validation blocks LLM calls on insufficient evidence
            </p>
          </div>
        </div>
      </div>

      {/* Domain Registry Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Knowledge Domains */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Knowledge Domains
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Isolated context namespaces
              </p>
            </div>
            <button 
              style={{
                background: 'var(--atlyx-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => onNavigate('hub')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--atlyx-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--atlyx-accent)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Manage</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {domains.length === 0 ? (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '32px 20px',
              textAlign: 'center'
            }}>
              <AlertCircle size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No domains configured yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {domains.slice(0, 3).map((domain) => (
                <div
                  key={domain.id}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = 'var(--atlyx-accent)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {domain.name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'var(--indigo-subtle)',
                        color: 'var(--indigo)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--indigo-border)'
                      }}>
                        {domain.document_count || 0} docs
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'var(--emerald-subtle)',
                        color: 'var(--emerald)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--emerald-border)'
                      }}>
                        {domain.chunk_count || 0} chunks
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {domain.description || 'Specialized knowledge partition'}
                  </div>
                </div>
              ))}
              {domains.length > 3 && (
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <button
                    style={{
                      background: 'transparent',
                      color: 'var(--atlyx-accent)',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 12px'
                    }}
                    onClick={() => onNavigate('hub')}
                  >
                    View all {domains.length} domains →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grounding Guarantees */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Grounding Guarantees
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Zero-hallucination safeguards
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Evidence Threshold Validation
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Confidence scores below 0.45 trigger automatic refusal without LLM invocation
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Contextual Deduplication
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Redundant passages filtered before generation to maximize context relevance
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Source-Attributed Responses
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Every answer includes verifiable citations with document metadata and scores
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={20} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Domain Isolation Enforcement
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Payload-level filtering prevents cross-domain information leakage in responses
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
