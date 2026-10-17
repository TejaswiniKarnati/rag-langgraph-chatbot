import React, { useState, useRef } from 'react';

export default function Sidebar({
  isOpen,
  documents,
  loadingDocs,
  onUploadFile,
  onLoadSample,
  onDeleteDoc,
  onInspectDoc
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file) => {
    setUploadError('');
    setUploading(true);
    try {
      await onUploadFile(file);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (ext === 'md') return '📘';
    if (ext === 'txt') return '📄';
    if (ext === 'csv') return '📊';
    return '📁';
  };

  return (
    <aside style={{
      width: '320px',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden',
      flexShrink: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '1.25rem 1.25rem 0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📚</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
            Knowledge Corpus
          </h3>
        </div>
        <span className="pill-badge pill-purple" style={{ fontSize: '0.65rem' }}>
          ChromaDB
        </span>
      </div>

      {/* Action: 1-Click Load Sample Knowledge */}
      <div style={{ padding: '0.85rem 1.25rem 0.5rem' }}>
        <button
          onClick={onLoadSample}
          className="btn-secondary"
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#FFFFFF',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <span>✨</span>
          <span>Load Sample Knowledge</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div style={{ padding: '0.5rem 1.25rem' }}>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem 0.75rem',
            textAlign: 'center',
            background: dragActive ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0, 0, 0, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {uploading ? '⏳' : '📥'}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
            {uploading ? 'Chunking & Indexing...' : 'Upload Document'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            PDF, Markdown, TXT, CSV (Auto-chunked)
          </div>
        </div>

        {uploadError && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#FDA4AF',
            background: 'rgba(244, 63, 94, 0.15)',
            padding: '0.4rem 0.6rem',
            borderRadius: '6px'
          }}>
            ⚠️ {uploadError}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem 1.25rem 1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Indexed Files ({documents.length})
          </span>
        </div>

        {loadingDocs ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Refreshing knowledge corpus...
          </div>
        ) : documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.25rem' }}>
              No Documents Indexed
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click 'Load Sample Knowledge' above to test RAG with pre-loaded articles!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {documents.map((doc) => (
              <div
                key={doc.doc_id}
                className="glass-card"
                style={{
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minWidth: 0 }}>
                  <span style={{ fontSize: '1.2rem', marginTop: '0.1rem' }}>
                    {getFileIcon(doc.filename)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      title={doc.filename}
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {doc.filename}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span className="pill-badge pill-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        {doc.total_chunks} chunks
                      </span>
                      {doc.total_pages && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {doc.total_pages} {doc.total_pages === 1 ? 'pg' : 'pgs'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <button
                    onClick={() => onInspectDoc(doc)}
                    className="btn-icon"
                    title="Inspect Chunks"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteDoc(doc.doc_id)}
                    className="btn-icon"
                    title="Delete Document"
                    style={{
                      width: '28px',
                      height: '28px',
                      color: '#FDA4AF'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer System Info */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>HNSW Cosine Space</span>
        <span style={{ color: '#10B981' }}>● Active</span>
      </div>
    </aside>
  );
}
