import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSendMessage, disabled, onClearChat, hasMessages }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const starterPrompts = [
    "What is LangGraph and how does it work?",
    "Explain the difference between RAG and Fine-Tuning",
    "What are the security principles for authentication?",
    "How does ChromaDB retrieve candidate chunks?"
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt) => {
    if (disabled) return;
    onSendMessage(prompt);
  };

  return (
    <div style={{
      padding: '0.75rem 1.5rem 1.25rem',
      background: 'linear-gradient(180deg, transparent 0%, rgba(11, 15, 25, 0.95) 30%)',
      position: 'relative',
      zIndex: 20
    }}>
      {/* Starter Prompts Bar (visible when no messages or as quick pills) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.65rem',
        scrollbarWidth: 'none'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
          💡 Try asking:
        </span>
        {starterPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(p)}
            disabled={disabled}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.65rem',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.5rem 0.65rem 0.5rem 1rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a question about your knowledge base... (Shift + Enter for new line)"
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            resize: 'none',
            maxHeight: '160px',
            padding: '0.4rem 0'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {hasMessages && (
            <button
              type="button"
              onClick={onClearChat}
              disabled={disabled}
              className="btn-icon"
              title="Clear Conversation History"
              style={{ width: '38px', height: '38px', borderRadius: '10px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="btn-primary"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              padding: 0
            }}
            title="Send Query to LangGraph Pipeline"
          >
            {disabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spinSlow 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
