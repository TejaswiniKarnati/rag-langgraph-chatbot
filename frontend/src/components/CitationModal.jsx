import React from 'react';

export default function CitationModal({ citation, onClose }) {
  if (!citation) return null;

  const scorePercent = Math.round((citation.score || 0.8) * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 16, 0.75)',
      backdropFilter: 'blur(12px)',
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
          maxWidth: '560px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📑</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Source Grounding Citation
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Verifiable passage retrieved from ChromaDB vector index
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            ✕
          </button>
        </div>

        {/* Metadata Pill bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Document</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>{citation.filename}</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 0.5rem' }} />
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Page</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#A5B4FC' }}>Page {citation.page || 1}</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 0.5rem' }} />
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Relevance Score</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8' }}>{scorePercent}% match</span>
          </div>
        </div>

        {/* Passage Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: '#E2E8F0',
          fontStyle: 'italic',
          borderLeft: '4px solid var(--primary)'
        }}>
          "{citation.snippet || citation.content || 'Passage text not available.'}"
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
