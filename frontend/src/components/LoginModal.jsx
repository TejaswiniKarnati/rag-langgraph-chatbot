import React, { useState } from 'react';
import logoSvg from '../assets/logo.svg';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  if (!isOpen) return null;

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('🧑‍💻');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarOptions = ['🧑‍💻', '⚡', '🤖', '🚀', '🧠', '🔬', '🌟', '🛡️'];

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister 
      ? { username, password, full_name: fullName, avatar }
      : { username, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || (isRegister ? 'Registration failed' : 'Login failed'));
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }} className="animate-fade-in">
      <div className="glass-panel animate-slide-up" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem 2rem',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.25)',
        position: 'relative'
      }}>
        {/* Glow backdrop decoration */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '100px',
          background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Header with Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.35)',
            marginBottom: '1rem'
          }}>
            <img src={logoSvg} alt="Synapse RAG Logo" style={{ width: '42px', height: '42px' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Create Your Account' : 'Welcome to Synapse RAG'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isRegister 
              ? 'Join to access the LangGraph Agentic RAG Assistant' 
              : 'Log in to start querying your knowledge base'}
          </p>
        </div>

        {/* Quick Demo Login Shortcuts */}
        {!isRegister && (
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.6rem'
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
                ⚡ Quick Demo Access
              </span>
              <span className="pill-badge pill-cyan" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>Instant</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('demo', 'demo123')}
                disabled={loading}
                className="btn-secondary"
                style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem', justifyContent: 'flex-start' }}
              >
                <span>🧑‍💻</span>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Demo User</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>demo / demo123</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                disabled={loading}
                className="btn-secondary"
                style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem', justifyContent: 'flex-start' }}
              >
                <span>⚡</span>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>Admin User</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>admin / admin123</div>
                </div>
              </button>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              margin: '1.25rem 0 0.5rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or with credentials</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: '#FDA4AF',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }} className="animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-card)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-card)',
                color: '#FFFFFF',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: isRegister ? '1rem' : '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-card)',
                color: '#FFFFFF',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Choose Your Avatar
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {avatarOptions.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      fontSize: '1.25rem',
                      background: avatar === av ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: avatar === av ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            {loading ? (
              <span>Connecting...</span>
            ) : isRegister ? (
              <span>Create Account & Sign In →</span>
            ) : (
              <span>Sign In to Assistant →</span>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#818CF8', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#818CF8', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Register now
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
