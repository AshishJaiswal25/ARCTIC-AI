import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

export default function AuthScreen({ onBack }) {
  const { login, register, verifyEmail, resendCode, cancelVerification, pendingVerification, verificationMessage } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification code - 6 individual digit inputs
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const codeRefs = useRef([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Name is required');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        await register(name.trim(), email, password, company.trim());
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    const code = codeDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(pendingVerification, code);
    } catch (err) {
      setError(err.message);
      setCodeDigits(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const msg = await resendCode(pendingVerification);
      setSuccess(msg);
      setCodeDigits(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newDigits.every((d) => d !== '')) {
      setTimeout(() => handleVerify(), 100);
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setCodeDigits(digits);
      codeRefs.current[5]?.focus();
      setTimeout(() => {
        setError('');
        setLoading(true);
        verifyEmail(pendingVerification, pasted)
          .catch((err) => {
            setError(err.message);
            setCodeDigits(['', '', '', '', '', '']);
            codeRefs.current[0]?.focus();
          })
          .finally(() => setLoading(false));
      }, 100);
      e.preventDefault();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'var(--bg-primary)',
      position: 'relative',
    }}>
      {/* Theme Toggle - top right */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
          borderRadius: 10, padding: '8px 14px', fontSize: 16, cursor: 'pointer',
          color: 'var(--text-secondary)', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-secondary)'; }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px var(--accent-shadow)',
          }}>
            <span style={{ fontSize: 36 }}>❄️</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            ARCTIC
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-dim)' }}>
            AI HVAC Diagnostic System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 16,
          padding: 32,
        }}>

          {/* ── Verification Code Screen ── */}
          {pendingVerification ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Verify Your Email
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {verificationMessage || 'Enter the 6-digit code sent to your email'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>
                  {pendingVerification}
                </p>
              </div>

              {/* 6-digit code inputs */}
              <div style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (codeRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={i === 0 ? handleCodePaste : undefined}
                    style={{
                      width: 48,
                      height: 56,
                      textAlign: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'var(--bg-primary)',
                      border: `2px solid ${digit ? 'var(--accent)' : 'var(--border-secondary)'}`,
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                      caretColor: 'var(--accent)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.select(); }}
                    onBlur={(e) => { if (!digit) e.target.style.borderColor = 'var(--border-secondary)'; }}
                  />
                ))}
              </div>

              {error && (
                <div style={{
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error-border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: 'var(--error)',
                  textAlign: 'center',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: 'var(--success)',
                  textAlign: 'center',
                }}>
                  ✅ {success}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || codeDigits.some((d) => !d)}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: (loading || codeDigits.some((d) => !d)) ? 'var(--border-secondary)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: (loading || codeDigits.some((d) => !d)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: (loading || codeDigits.some((d) => !d)) ? 'none' : '0 4px 20px var(--accent-shadow)',
                  marginBottom: 12,
                }}>
                {loading ? '⏳ Verifying...' : 'Verify Email'}
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleResend}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                  Resend Code
                </button>
                <button
                  onClick={cancelVerification}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
              </div>
            </>
          ) : (
          <>
          {/* ── Login / Register Form ── */}

          {/* Tab toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 28,
          }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: mode === m ? 'var(--bg-tertiary)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-dim)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tech@company.com"
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                required
                minLength={mode === 'register' ? 6 : 1}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
              />
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Company <span style={{ color: 'var(--text-ghost)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="HVAC Solutions Inc."
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-secondary)'}
                />
              </div>
            )}

            {error && (
              <div style={{
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 18,
                fontSize: 13,
                color: 'var(--error)',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 0',
                background: loading ? 'var(--text-secondary)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: loading ? 'none' : '0 4px 20px var(--accent-shadow)',
              }}
            >
              {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          </>
          )}
        </div>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'block',
              margin: '20px auto 0',
              padding: '8px 20px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-ghost)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-ghost)'}
          >
            ← Back to Home
          </button>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 12 }}>
          © {new Date().getFullYear()} Arctic AI · arctic-ai.org
        </p>
      </div>
    </div>
  );
}
