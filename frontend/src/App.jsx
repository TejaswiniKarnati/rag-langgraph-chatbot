import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import LoginModal from './components/LoginModal';
import CitationModal from './components/CitationModal';
import ChunkModal from './components/ChunkModal';
import GraphDrawer from './components/GraphDrawer';
import SettingsModal from './components/SettingsModal';

export default function App() {
  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('synapse_rag_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('synapse_rag_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // UI Modals
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [graphOpen, setGraphOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [activeInspectDoc, setActiveInspectDoc] = useState(null);

  // App Data
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ documents_count: 0, total_chunks: 0 });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('synapse_rag_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loadingChat, setLoadingChat] = useState(false);
  const [latestTrace, setLatestTrace] = useState(null);
  const [toast, setToast] = useState(null);

  // LLM Config
  const [llmConfig, setLlmConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('synapse_rag_llm_config');
      return saved ? JSON.parse(saved) : { provider: 'demo' };
    } catch {
      return { provider: 'demo' };
    }
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync Messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('synapse_rag_messages', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages', e);
    }
  }, [messages]);

  // Fetch Documents and Stats
  const fetchKnowledgeBase = useCallback(async () => {
    if (!token) return;
    setLoadingDocs(true);
    try {
      const [docsRes, healthRes] = await Promise.all([
        fetch('/api/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/health')
      ]);

      if (docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData.documents || []);
        setStats({
          documents_count: dData.documents_count || 0,
          total_chunks: dData.total_chunks || 0
        });
      } else if (docsRes.status === 401) {
        // Session expired
        handleLogout();
      }

      if (healthRes.ok) {
        const hData = await healthRes.json();
        setStats(prev => ({
          ...prev,
          documents_count: hData.documents_count,
          total_chunks: hData.total_chunks
        }));
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchKnowledgeBase();
    }
  }, [token, fetchKnowledgeBase]);

  // Login handler
  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('synapse_rag_token', newToken);
    localStorage.setItem('synapse_rag_user', JSON.stringify(newUser));
    showToast(`Welcome back, ${newUser.full_name || newUser.username}!`, 'success');
  };

  // Logout handler
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error(e);
      }
    }
    setToken('');
    setUser(null);
    localStorage.removeItem('synapse_rag_token');
    localStorage.removeItem('synapse_rag_user');
    showToast('Logged out successfully.', 'info');
  };

  // Upload Document
  const handleUploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload failed');
    showToast(data.message || `Indexed ${file.name} successfully!`, 'success');
    await fetchKnowledgeBase();
  };

  // Load Sample Knowledge
  const handleLoadSample = async () => {
    try {
      const res = await fetch('/api/documents/load-sample', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to load samples');
      showToast(data.message || 'Sample knowledge loaded!', 'success');
      await fetchKnowledgeBase();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from the knowledge base?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Delete failed');
      showToast('Document removed from vector store.', 'info');
      await fetchKnowledgeBase();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Send Chat Message
  const handleSendMessage = async (question) => {
    if (!question || loadingChat) return;

    // Add user message to UI immediately
    const userMsg = {
      role: 'user',
      content: question,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoadingChat(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          chat_history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          llm_config: llmConfig
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.detail || 'Error communicating with RAG assistant');
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.answer,
        route: data.route,
        citations: data.citations || [],
        confidence: data.confidence,
        steps: data.steps || [],
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (data.steps && data.steps.length > 0) {
        setLatestTrace(data.steps);
      }
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Error Processing Query:** ${err.message}`,
        route: 'error',
        citations: [],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Clear Chat History
  const handleClearChat = () => {
    if (window.confirm('Clear current conversation history?')) {
      setMessages([]);
      localStorage.removeItem('synapse_rag_messages');
      showToast('Conversation cleared.', 'info');
    }
  };

  // Save LLM Config
  const handleSaveConfig = (newConfig) => {
    setLlmConfig(newConfig);
    try {
      localStorage.setItem('synapse_rag_llm_config', JSON.stringify(newConfig));
      showToast(`Inference engine set to ${newConfig.provider.toUpperCase()}`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        stats={stats}
        onOpenGraph={() => setGraphOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main App Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Knowledge Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          documents={documents}
          loadingDocs={loadingDocs}
          onUploadFile={handleUploadFile}
          onLoadSample={handleLoadSample}
          onDeleteDoc={handleDeleteDoc}
          onInspectDoc={(doc) => setActiveInspectDoc(doc)}
        />

        {/* Central Chat & Q&A Canvas */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <ChatWindow
            messages={messages}
            loading={loadingChat}
            user={user}
            onOpenCitation={(citation) => setActiveCitation(citation)}
            onStarterClick={(prompt) => handleSendMessage(prompt)}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={loadingChat || !token}
            onClearChat={handleClearChat}
            hasMessages={messages.length > 0}
          />
        </main>
      </div>

      {/* Mandatory User Login / Registration Modal */}
      <LoginModal
        isOpen={!token || !user}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      {/* Chunk Inspector Modal */}
      <ChunkModal
        doc={activeInspectDoc}
        onClose={() => setActiveInspectDoc(null)}
        token={token}
      />

      {/* LangGraph State Machine Visualizer */}
      <GraphDrawer
        isOpen={graphOpen}
        onClose={() => setGraphOpen(false)}
        latestTrace={latestTrace}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentConfig={llmConfig}
        onSaveConfig={handleSaveConfig}
      />

      {/* Toast Feedback Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error'
            ? 'rgba(244, 63, 94, 0.9)'
            : toast.type === 'success'
            ? 'rgba(16, 185, 129, 0.9)'
            : 'rgba(31, 41, 55, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          fontSize: '0.88rem',
          fontWeight: 600,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }} className="animate-slide-up">
          <span>{toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✓' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
