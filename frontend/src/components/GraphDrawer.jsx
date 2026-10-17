import React, { useState } from 'react';

export default function GraphDrawer({ isOpen, onClose, latestTrace }) {
  if (!isOpen) return null;

  const [selectedNode, setSelectedNode] = useState('router_node');

  const nodes = [
    {
      id: 'router_node',
      title: 'Router Node',
      icon: '🧭',
      role: 'Intent Classification & Edge Selection',
      color: '#6366F1',
      description: 'Examines the user query to determine whether vector retrieval is required or if it is a general conversational intent.',
      input: 'RAGState: { question, chat_history }',
      output: 'RAGState: { route: "retrieve" | "direct" | "empty_kb" }'
    },
    {
      id: 'retriever_node',
      title: 'Retriever Node',
      icon: '🔍',
      role: 'ChromaDB Dense Vector Retrieval',
      color: '#06B6D4',
      description: 'Executes cosine similarity search against indexed document chunks in ChromaDB with lexical term-overlap score boosting.',
      input: 'RAGState: { question, top_k=4 }',
      output: 'RAGState: { retrieved_docs: [ chunks with similarity scores ] }'
    },
    {
      id: 'synthesizer_node',
      title: 'Synthesizer Node',
      icon: '⚡',
      role: 'LLM Grounded Response Generation',
      color: '#10B981',
      description: 'Generates factual, grounded answers strictly anchored in retrieved candidate passages using the configured LLM or built-in offline extractive engine.',
      input: 'RAGState: { question, retrieved_docs, llm_config }',
      output: 'RAGState: { answer: markdown string }'
    },
    {
      id: 'verifier_node',
      title: 'Verifier Node',
      icon: '🛡️',
      role: 'Grounding Verification & Citations',
      color: '#8B5CF6',
      description: 'Verifies claims, maps exact citation badges with document filenames, pages, and calculates confidence scores.',
      input: 'RAGState: { answer, retrieved_docs }',
      output: 'RAGState: { citations: [ citation objects ], confidence: float }'
    }
  ];

  const activeNodeInfo = nodes.find(n => n.id === selectedNode) || nodes[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 16, 0.8)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
      padding: '1.5rem'
    }} className="animate-fade-in" onClick={onClose}>
      <div
        className="glass-panel animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧭</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                LangGraph 2.0 State Machine Topology
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cyclic StateGraph orchestration with dynamic routing and grounded verification
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {/* Visual Flow Pipeline Chart */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflowX: 'auto'
        }}>
          {/* Start Pill */}
          <div style={{
            padding: '0.4rem 0.8rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}>
            START
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>➔</span>

          {nodes.map((node, i) => {
            const isSelected = selectedNode === node.id;
            return (
              <React.Fragment key={node.id}>
                <div
                  onClick={() => setSelectedNode(node.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${isSelected ? node.color : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: isSelected ? `0 0 20px ${node.color}55` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{node.icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>{node.title}</div>
                  <div style={{ fontSize: '0.65rem', color: node.color, fontWeight: 600 }}>{node.id}</div>
                </div>
                {i < nodes.length - 1 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>➔</span>
                )}
              </React.Fragment>
            );
          })}

          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>➔</span>

          {/* End Pill */}
          <div style={{
            padding: '0.4rem 0.8rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}>
            END
          </div>
        </div>

        {/* Selected Node Details Card */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          border: `1px solid ${activeNodeInfo.color}44`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{activeNodeInfo.icon}</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
              {activeNodeInfo.title}
            </h4>
            <span className="pill-badge" style={{
              background: `${activeNodeInfo.color}22`,
              border: `1px solid ${activeNodeInfo.color}55`,
              color: activeNodeInfo.color,
              fontSize: '0.65rem'
            }}>
              {activeNodeInfo.role}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#E2E8F0', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            {activeNodeInfo.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Input State:</span>
              <code style={{ color: '#67E8F9' }}>{activeNodeInfo.input}</code>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Output State:</span>
              <code style={{ color: '#A5B4FC' }}>{activeNodeInfo.output}</code>
            </div>
          </div>
        </div>

        {/* Latest Execution Trace Log */}
        {latestTrace && latestTrace.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              ⚡ Latest Query Execution Trace:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {latestTrace.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10B981' }}>✓</span>
                  <span style={{ color: '#818CF8', fontWeight: 600 }}>{st.node}:</span>
                  <span style={{ color: '#D1D5DB' }}>{st.summary}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Close Graph Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
