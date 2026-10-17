import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, currentConfig, onSaveConfig }) {
  if (!isOpen) return null;

  const [provider, setProvider] = useState(currentConfig?.provider || 'demo');
  const [apiKey, setApiKey] = useState(currentConfig?.api_key || '');
  const [modelName, setModelName] = useState(currentConfig?.model_name || '');
  const [baseUrl, setBaseUrl] = useState(currentConfig?.base_url || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const providerModels = {
    demo: ['offline-grounded-extractive'],
    gemini: ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    ollama: ['llama3', 'mistral', 'qwen2.5', 'phi3']
  };

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setModelName(providerModels[newProvider]?.[0] || '');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          model_name: modelName,
          base_url: baseUrl
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ valid: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      provider,
      api_key: apiKey,
      model_name: modelName || providerModels[provider]?.[0],
      base_url: baseUrl
    });
    onClose();
  };

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
          maxWidth: '520px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.3rem' }}>⚙️</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                LLM & Synthesizer Settings
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configure synthesis model and API credentials
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {/* Provider Selector Tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 600 }}>
            Inference Engine Provider
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
            {[
              { id: 'demo', label: 'Demo / Offline', icon: '⚡' },
              { id: 'gemini', label: 'Gemini', icon: '✨' },
              { id: 'openai', label: 'OpenAI', icon: '🟢' },
              { id: 'groq', label: 'Groq', icon: '⚡' },
              { id: 'ollama', label: 'Ollama', icon: '🦙' }
            ].map((p) => {
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  style={{
                    padding: '0.5rem 0.25rem',
                    borderRadius: '8px',
                    background: active ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: active ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  <div style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>{p.icon}</div>
                  <div>{p.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Mode Notice */}
        {provider === 'demo' ? (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: '#E0E7FF'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: '#A5B4FC' }}>
              ⚡ Offline Grounded Extractive Mode
            </div>
            Extracts grounded answers and page citations directly from ChromaDB without needing any external API keys or cloud tokens. Ideal for offline work and quick testing!
          </div>
        ) : (
          /* API Key & Model inputs */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {provider !== 'ollama' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                  {provider.toUpperCase()} API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={`Enter your ${provider} API key...`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-card)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {showApiKey ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                Model Identifier
              </label>
              <input
                type="text"
                value={modelName}
                placeholder={providerModels[provider]?.[0] || 'Model name'}
                onChange={(e) => setModelName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-card)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {provider === 'ollama' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  placeholder="http://localhost:11434/v1"
                  onChange={(e) => setBaseUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-card)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="btn-secondary"
              style={{ padding: '0.55rem', fontSize: '0.8rem' }}
            >
              {testing ? 'Testing Connection...' : '⚡ Test Connection'}
            </button>
          </div>
        )}

        {/* Test Connection Feedback */}
        {testResult && (
          <div style={{
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            background: testResult.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${testResult.valid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
            color: testResult.valid ? '#6EE7B7' : '#FDA4AF'
          }}>
            {testResult.valid ? (
              <div>✓ {testResult.message}</div>
            ) : (
              <div>⚠️ {testResult.error || 'Connection test failed.'}</div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: 'auto' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
