import React, { useState, useEffect } from 'react';

export default function ChunkModal({ doc, onClose, token }) {
  if (!doc) return null;

  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChunks = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/documents/${doc.doc_id}/chunks`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to fetch chunks');
        setChunks(data.chunks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChunks();
  }, [doc.doc_id, token]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 16, 0.75)',
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
          maxWidth: '720px',
          maxHeight: '85vh',
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
            <span style={{ fontSize: '1.3rem' }}>🔍</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                Document Chunks Inspector
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {doc.filename} • {doc.total_chunks} chunk(s) stored in ChromaDB
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {/* Content list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingRight: '0.25rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              Loading chunks from vector database...
            </div>
          ) : error ? (
            <div style={{ color: '#FDA4AF', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: '8px' }}>
              ⚠️ {error}
            </div>
          ) : chunks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No chunks found for this document.
            </div>
          ) : (
            chunks.map((c, i) => (
              <div
                key={c.id || i}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                  fontSize: '0.75rem'
                }}>
                  <span className="pill-badge pill-indigo">
                    Chunk #{c.chunk_index !== undefined ? c.chunk_index : i + 1}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Page {c.page || 1} • {c.text?.length || 0} chars
                  </span>
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  lineHeight: 1.55,
                  color: '#D1D5DB',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {c.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
