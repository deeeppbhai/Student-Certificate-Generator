import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Zap, ShieldCheck, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { authService } from '../services/api';

const LoginForm = () => {
  const [email, setEmail] = useState('admin@scg.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const forceManual = searchParams.get('manual') === 'true' || authService.isManualLogout();

    // If explicitly accessing manual login mode, clear existing session to present clean login form
    if (forceManual) {
      authService.logout();
      setAutoLoggingIn(false);
      setLoading(false);
      return;
    }

    // 1. If user already has an active session, navigate directly to dashboard
    if (authService.getCurrentUser()) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // 2. Perform automatic background login if not manually logged out
    setAutoLoggingIn(true);
    setLoading(true);
    authService
      .autoLogin()
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setAutoLoggingIn(false);
        setLoading(false);
      });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify administrator email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.autoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Instant demo sign-in failed. Please verify credentials manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail('admin@scg.edu');
    setPassword('admin123');
    setError('');
  };

  return (
    <form className="login-card" onSubmit={handleLogin}>
      {/* Header Badge */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div className="login-icon-badge">
          <ShieldCheck size={36} color="#0F172A" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, color: '#FFF' }}>
          Administrator Portal
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
          Secure Authentication & Credential Management
        </p>
      </div>

      {autoLoggingIn && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: 'var(--gold-400)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '1.25rem',
          }}
        >
          <Sparkles size={18} />
          <span>Automatic login active: Signing in as Administrator...</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.14)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--rose-400)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Email Input */}
      <div className="form-group">
        <label className="form-label">Administrator Email</label>
        <div style={{ position: 'relative' }}>
          <Mail
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type="email"
            className="form-input"
            style={{ paddingLeft: '2.6rem' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@scg.edu"
            required
          />
        </div>
      </div>

      {/* Password Input with Visibility Toggle */}
      <div className="form-group">
        <label className="form-label">Password</label>
        <div style={{ position: 'relative' }}>
          <Lock
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember Me and Quick Fill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0.5rem 0 1.5rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ accentColor: 'var(--gold-400)' }}
          />
          Remember credentials
        </label>
        <button
          type="button"
          onClick={handleAutoFill}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold-400)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Auto-fill admin demo
        </button>
      </div>

      {/* Primary Sign In Button */}
      <button
        type="submit"
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '0.85rem',
          fontSize: '0.95rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          borderRadius: '10px',
        }}
        disabled={loading}
      >
        <KeyRound size={17} />
        {loading ? 'Authenticating Session...' : 'Sign In as Administrator'}
      </button>

      {/* 1-Click Instant Demo Login */}
      <div style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleInstantDemoLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: 'var(--blue-400)',
          }}
        >
          <Zap size={16} /> ⚡ 1-Click Instant Demo Sign In
        </button>
      </div>

      {/* Security Footer Notice */}
      <div
        style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        <ShieldCheck size={14} color="var(--emerald-400)" />
        Protected by 256-bit AES JWT Encryption & Role-Based Access Control
      </div>
    </form>
  );
};

export default LoginForm;
