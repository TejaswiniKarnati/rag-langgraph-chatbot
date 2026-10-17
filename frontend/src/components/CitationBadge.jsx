import React from 'react';

export default function CitationBadge({ citation, onClick }) {
  const scorePercent = Math.round((citation.score || 0.8) * 100);

  return (
    <button
      onClick={() => onClick(citation)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-full)',
        padding: '0.2rem 0.65rem',
        fontSize: '0.75rem',
        color: '#C7D2FE',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        margin: '0.25rem 0.35rem 0.25rem 0'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
        e.currentTarget.style.transform = 'none';
      }}
      title={`Source: ${citation.filename} • Match: ${scorePercent}%`}
    >
      <span style={{ fontSize: '0.85rem' }}>📄</span>
      <span style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {citation.filename}
      </span>
      <span style={{ color: '#818CF8', fontSize: '0.7rem' }}>
        p.{citation.page || 1}
      </span>
      <span style={{
        background: 'rgba(6, 182, 212, 0.2)',
        color: '#67E8F9',
        fontSize: '0.65rem',
        padding: '0.05rem 0.35rem',
        borderRadius: '99px',
        fontWeight: 700
      }}>
        {scorePercent}%
      </span>
    </button>
  );
}
