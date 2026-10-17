import React from 'react';
import logoSvg from '../assets/logo.svg';

export default function Navbar({
  user,
  stats,
  onOpenGraph,
  onOpenSettings,
  onLogout,
  sidebarOpen,
  onToggleSidebar
}) {
  return (
    <header style={{
      height: '64px',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'relative',
      zIndex: 40
    }}>
      {/* Left: Sidebar toggle + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          className="btn-icon"
          title={sidebarOpen ? "Collapse Knowledge Sidebar" : "Expand Knowledge Sidebar"}
          style={{ width: '36px', height: '36px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={logoSvg} alt="Logo" style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em'
              }}>
                Synapse RAG
              </span>
              <span className="pill-badge pill-indigo" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                LangGraph 2.0
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Agentic Question & Answer Engine
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live ChromaDB Knowledge Base Health Pill */}
      <div style={{ display: 'none', md: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.8rem'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 10px #10B981'
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>Knowledge Base:</span>
          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
            {stats.documents_count || 0} {stats.documents_count === 1 ? 'Doc' : 'Docs'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: '#06B6D4', fontWeight: 600 }}>
            {stats.total_chunks || 0} Chunks
          </span>
        </div>
      </div>

      {/* Right: Actions and User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onOpenGraph}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          title="Inspect LangGraph State Machine Architecture"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span style={{ display: 'inline' }}>LangGraph Flow</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="btn-icon"
          title="LLM Settings & API Keys"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* User Pill & Logout */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-card)',
            padding: '0.3rem 0.5rem 0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{user.avatar || '👤'}</span>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF' }}>{user.full_name || user.username}</div>
              <div style={{ fontSize: '0.65rem', color: '#818CF8' }}>{user.role || 'Member'}</div>
            </div>
            <button
              onClick={onLogout}
              className="btn-icon"
              title="Sign Out"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#FDA4AF',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                marginLeft: '0.2rem'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
