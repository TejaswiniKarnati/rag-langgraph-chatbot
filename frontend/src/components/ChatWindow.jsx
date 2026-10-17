import React, { useRef, useEffect, useState } from 'react';
import { marked } from 'marked';
import CitationBadge from './CitationBadge';
import logoSvg from '../assets/logo.svg';

export default function ChatWindow({
  messages,
  loading,
  user,
  onOpenCitation,
  onStarterClick
}) {
  const scrollRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMarkdown = (content) => {
    try {
      return { __html: marked.parse(content || '') };
    } catch {
      return { __html: content };
    }
  };

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      {messages.length === 0 ? (
        /* Empty Welcome Hero Canvas */
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '720px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '2rem 1rem'
        }} className="animate-fade-in">
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))',
            border: '2px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <img src={logoSvg} alt="Synapse Logo" style={{ width: '52px', height: '52px' }} />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Ask anything about your Knowledge Base
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '580px', marginBottom: '2rem', lineHeight: 1.6 }}>
            Powered by <strong style={{ color: '#818CF8' }}>LangGraph 2.0</strong>, <strong style={{ color: '#38BDF8' }}>ChromaDB</strong>, and FastAPI.
            Ask questions, explore verifiable citations, and inspect real-time agentic graph decisions.
          </p>

          {/* Feature Highlight Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            width: '100%',
            textAlign: 'left',
            marginBottom: '2rem'
          }}>
            <div
              className="glass-card"
              style={{ padding: '1.1rem', cursor: 'pointer' }}
              onClick={() => onStarterClick('What is LangGraph and how does it work?')}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>🧭</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                LangGraph State Machine
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Explore cyclic graph routing, state dictionaries, and node workflows.
              </div>
            </div>

            <div
              className="glass-card"
              style={{ padding: '1.1rem', cursor: 'pointer' }}
              onClick={() => onStarterClick('Explain the difference between RAG and Fine-Tuning')}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                RAG vs Fine-Tuning
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Compare retrieval grounding vs parametric model fine-tuning.
              </div>
            </div>

            <div
              className="glass-card"
              style={{ padding: '1.1rem', cursor: 'pointer' }}
              onClick={() => onStarterClick('What are the security principles for authentication?')}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>🛡️</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                Security & Authentication
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Learn about salted hashes, session tokens, and RBAC authorization.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Message History Thread */
        messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '900px',
                width: '100%',
                margin: '0 auto'
              }}
              className="animate-slide-up"
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3))',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0.2rem'
                }}>
                  <img src={logoSvg} alt="AI" style={{ width: '22px', height: '22px' }} />
                </div>
              )}

              {/* Message Content Bubble */}
              <div style={{
                maxWidth: isUser ? '75%' : '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{
                  padding: isUser ? '0.85rem 1.25rem' : '1.25rem 1.4rem',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: isUser
                    ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                    : 'rgba(17, 24, 39, 0.75)',
                  backdropFilter: 'blur(16px)',
                  border: isUser ? 'none' : '1px solid var(--border-card)',
                  boxShadow: isUser
                    ? '0 4px 15px rgba(79, 70, 229, 0.3)'
                    : '0 4px 20px rgba(0, 0, 0, 0.4)',
                  color: '#FFFFFF'
                }}>
                  {/* Markdown or Plain Text */}
                  {isUser ? (
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                    />
                  )}

                  {/* Verifiable Citations */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        <span>📑</span>
                        <span>Verifiable Sources ({msg.citations.length})</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {msg.citations.map((c, cIdx) => (
                          <CitationBadge
                            key={cIdx}
                            citation={c}
                            onClick={onOpenCitation}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LangGraph Trace Accordion */}
                  {!isUser && msg.steps && msg.steps.length > 0 && (
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px dashed var(--border-subtle)'
                    }}>
                      <button
                        onClick={() => setExpandedTraceIndex(expandedTraceIndex === index ? null : index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#818CF8',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          padding: '0.2rem 0',
                          fontWeight: 600
                        }}
                      >
                        <span>🧭</span>
                        <span>
                          {expandedTraceIndex === index ? 'Hide LangGraph Trace' : `View LangGraph Trace (${msg.steps.length} steps)`}
                        </span>
                        <span style={{ fontSize: '0.65rem' }}>{expandedTraceIndex === index ? '▲' : '▼'}</span>
                      </button>

                      {expandedTraceIndex === index && (
                        <div style={{
                          marginTop: '0.5rem',
                          background: 'rgba(0, 0, 0, 0.35)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }} className="animate-fade-in">
                          {msg.steps.map((st, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="pill-badge pill-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                {st.node}
                              </span>
                              <div style={{ flex: 1, color: '#D1D5DB' }}>
                                <strong>{st.action}:</strong> {st.summary}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-bar: Actions (Copy, Route, Timestamp) */}
                {!isUser && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 0.5rem',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {msg.route && (
                        <span className="pill-badge pill-indigo" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          route: {msg.route}
                        </span>
                      )}
                      {msg.confidence !== undefined && msg.confidence > 0 && (
                        <span style={{ color: '#10B981', fontWeight: 600 }}>
                          {Math.round(msg.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedIndex === index ? '#10B981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px'
                      }}
                      title="Copy response to clipboard"
                    >
                      {copiedIndex === index ? (
                        <span>✓ Copied!</span>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                  marginTop: '0.2rem'
                }}>
                  {user ? user.avatar || '🧑‍💻' : '👤'}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Loading Indicator */}
      {loading && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto'
        }} className="animate-fade-in">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3))',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img src={logoSvg} alt="AI" style={{ width: '22px', height: '22px' }} />
          </div>

          <div style={{
            padding: '1rem 1.4rem',
            borderRadius: '4px 18px 18px 18px',
            background: 'rgba(17, 24, 39, 0.75)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818CF8', animation: 'pulseGlow 1s infinite' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06B6D4', animation: 'pulseGlow 1s infinite 0.2s' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A78BFA', animation: 'pulseGlow 1s infinite 0.4s' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Executing LangGraph RAG pipeline...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
