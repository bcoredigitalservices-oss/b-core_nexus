import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, Globe, Percent, Cpu, Key } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import NexusLogoAnimated from '../components/branding/NexusLogoAnimated';
import { useAppContext } from '../context/AppContext';
import './Login.css';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'totp' | 'mfa_setup';

export default function Login() {
  const navigate   = useNavigate();
  const { login, setToken } = useAppContext();

  /* ── Form fields ──────────────────────────────────────────────────────── */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [isTierZeroMfa, setIsTierZeroMfa] = useState(false);

  /* ── MFA Setup intercept states ───────────────────────────────────────── */
  const [mfaSetupMode, setMfaSetupMode] = useState(false);
  const [setupUri, setSetupUri] = useState('');

  /* ── UI state ─────────────────────────────────────────────────────────── */
  const [formState, setFormState] = useState<FormState>('idle');
  const [showPass,  setShowPass]  = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /* ── Refs ─────────────────────────────────────────────────────────────── */
  const emailRef    = useRef<HTMLInputElement>(null);
  const successAudio = useRef<HTMLAudioElement | null>(null);

  /* ── Initialise audio and focus ───────────────────────────────────────── */
  useEffect(() => {
    successAudio.current = new Audio('/assets/sounds/success-chime.mp3');
    successAudio.current.preload = 'auto';
    emailRef.current?.focus();
  }, []);

  /* ── Caps Lock Detector ───────────────────────────────────────────────── */
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const setError = (msg: string) => {
    setErrorMsg(msg);
    setFormState('error');
  };

  const handleSuccessAndRedirect = () => {
    setFormState('success');
    successAudio.current?.play().catch(() => {});
    setTimeout(() => navigate('/'), 800);
  };

  /* ── Primary login submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setFormState('loading');
    setErrorMsg('');
    setIsTierZeroMfa(false);

    try {
      const body = new URLSearchParams();
      body.append('username', email.trim());
      body.append('password', password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (res.status === 401) {
        setError('Incorrect email or password.');
        return;
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data?.detail === "MFA_SETUP_REQUIRED") {
          setSetupUri(data.setup_uri);
          setMfaSetupMode(true);
          setFormState('idle');
          return;
        }
        if (data?.detail === "MFA_CODE_REQUIRED" || data?.detail === "MFA code required") {
          setIsTierZeroMfa(true);
          setFormState('totp');
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? 'Authentication failed. Please try again.');
        return;
      }

      const data = await res.json();

      if (data.status === 'requires_totp') {
        setTempToken(data.temp_token);
        setFormState('totp');
        return;
      }

      if (data.access_token) {
        localStorage.setItem('bcore_token', data.access_token);
        setToken(data.access_token);
        handleSuccessAndRedirect();
        return;
      }

      setError('Unexpected server response.');
    } catch {
      setError('Unable to reach the server. Is the backend running?');
    }
  };

  /* ── MFA setup submission ──────────────────────────────────────────────── */
  const handleMfaSetupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim() || !email.trim() || !password) return;

    setFormState('loading');
    setErrorMsg('');

    try {
      const body = new URLSearchParams();
      body.append('username', email.trim());
      body.append('password', password);
      body.append('totp_code', totpCode.trim());

      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? 'Invalid verification code.');
        setMfaSetupMode(true); // Ensure we stay in setup mode
        return;
      }

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('bcore_token', data.access_token);
        setToken(data.access_token);
        setMfaSetupMode(false);
        handleSuccessAndRedirect();
      }
    } catch {
      setError('Network error during MFA activation.');
      setMfaSetupMode(true);
    }
  };

  /* ── TOTP verification submit ─────────────────────────────────────────── */
  const handleTotpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim()) return;

    setFormState('loading');
    setErrorMsg('');

    if (isTierZeroMfa) {
      try {
        const body = new URLSearchParams();
        body.append('username', email.trim());
        body.append('password', password);
        body.append('totp_code', totpCode.trim());

        const res = await fetch(`${API_BASE}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.detail ?? 'Invalid verification code.');
          setFormState('totp');
          return;
        }

        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem('bcore_token', data.access_token);
          setToken(data.access_token);
          handleSuccessAndRedirect();
        }
      } catch {
        setError('Network error during TOTP verification.');
        setFormState('totp');
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login/verify-totp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ temp_token: tempToken, code: totpCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? 'Invalid verification code.');
        setFormState('totp');
        return;
      }

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('bcore_token', data.access_token);
        setToken(data.access_token);
        handleSuccessAndRedirect();
      }
    } catch {
      setError('Network error during TOTP verification.');
      setFormState('totp');
    }
  };

  const isLoading = formState === 'loading';
  const isSuccess = formState === 'success';

  return (
    <div className="login-root">

      {/* ── System Status badge absolute top right ────────────────────── */}
      <div className="system-status" aria-label="System status">
        <span className="status-dot"></span>
        <span>All Systems Operational</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LEFT PANEL — Interactive form (35%)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="login-form-panel" aria-label="Login access portal">

        {/* Twinkling star particle background */}
        <div className="login-stars-container">
          <div className="login-star" style={{ top: '15%', left: '25%', animationDelay: '0s' }} />
          <div className="login-star" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }} />
          <div className="login-star" style={{ top: '65%', left: '15%', animationDelay: '1s', width: '3px', height: '3px' }} />
          <div className="login-star" style={{ top: '75%', left: '85%', animationDelay: '1.5s' }} />
          <div className="login-star" style={{ top: '45%', left: '70%', animationDelay: '2s' }} />
          <div className="login-star" style={{ top: '85%', left: '40%', animationDelay: '2.5s' }} />
          <div className="login-star" style={{ top: '35%', left: '10%', animationDelay: '0.8s' }} />
          <div className="login-star" style={{ top: '55%', left: '90%', animationDelay: '1.2s' }} />
          <div className="login-star" style={{ top: '90%', left: '20%', animationDelay: '1.8s' }} />
          <div className="login-star" style={{ top: '10%', left: '60%', animationDelay: '2.2s' }} />
        </div>

        <div className="login-form-content-wrapper">
          {/* Mobile-only logo */}
          <div className="login-mobile-brand">
            <NexusLogoAnimated width={150} />
          </div>

          {/* Glassmorphic Container Card */}
          <div className="login-card">

          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">
              {mfaSetupMode
                ? 'MFA Setup Required'
                : formState === 'totp'
                  ? 'Security Verification'
                  : 'Welcome back'}
            </h1>
            <p className="login-subtitle">
              {mfaSetupMode
                ? 'Mandatory Security Step: Scan this code with Google Authenticator.'
                : formState === 'totp'
                  ? 'Enter your authenticator code to proceed.'
                  : 'Enter your credentials to access B-Core Nexus.'}
            </p>
          </div>

          {/* Error banner */}
          {(formState === 'error' || errorMsg) && (
            <div className="login-error-banner" role="alert" aria-live="polite">
              <AlertCircle size={15} strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success banner */}
          {isSuccess && (
            <div className="login-success-banner" role="status" aria-live="polite">
              <span className="login-success-checkmark">✓</span>
              <span>Workspace loaded. Redirecting…</span>
            </div>
          )}

          {/* ── Standard login form ─────────────────────────────────────── */}
          {formState !== 'totp' && !mfaSetupMode && !isSuccess && (
            <form
              id="login-form"
              className="login-form"
              onSubmit={handleSubmit}
              noValidate
              aria-label="Credential login form"
            >
              {/* Email */}
              <div className="login-field">
                <label htmlFor="login-email" className="login-label">
                  Email Address
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">
                    <Mail size={16} strokeWidth={1.75} />
                  </span>
                  <input
                    ref={emailRef}
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="login-input"
                    aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <div className="login-field-header">
                  <label htmlFor="login-password" className="login-label">
                    Password
                  </label>
                  <a href="#forgot" className="login-forgot-link">
                    Forgot Password?
                  </a>
                </div>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">
                    <Lock size={16} strokeWidth={1.75} />
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    className="login-input login-input--password"
                    aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                  />
                  {capsLockActive && (
                    <span className="login-caps-lock-warning" title="Caps Lock is active">
                      ⇪ CAPS
                    </span>
                  )}
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={0}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPass ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="login-remember-row">
                <label className="login-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="login-checkbox"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                className="login-btn"
                disabled={isLoading || !email || !password}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="login-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                      <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  'Authenticate'
                )}
              </button>

              {/* SSO Section */}
              <div className="login-sso-container">
                <div className="login-divider">
                  <span className="login-divider-line"></span>
                  <span className="login-divider-text">OR</span>
                  <span className="login-divider-line"></span>
                </div>
                <div className="login-sso-buttons">
                  <button type="button" className="login-sso-btn" onClick={() => alert('Google SSO integration')}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11-4.606 11-11.24 0-.756-.08-1.333-.18-1.955H12.24z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── TOTP verification form ──────────────────────────────────── */}
          {formState === 'totp' && !mfaSetupMode && (
            <form
              id="totp-form"
              className="login-form"
              onSubmit={handleTotpSubmit}
              noValidate
              aria-label="TOTP verification form"
            >
              <div className="login-field">
                <label htmlFor="totp-code" className="login-label">
                  Authenticator Code
                </label>
                <div className="login-input-wrap">
                  <input
                    id="totp-code"
                    name="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    disabled={isLoading}
                    placeholder="000000"
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="login-input login-input--totp"
                  />
                </div>
              </div>

              <button
                id="totp-submit-btn"
                type="submit"
                className="login-btn"
                disabled={isLoading || totpCode.length !== 6}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="login-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                      <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  'Verify & Enter'
                )}
              </button>

              <button
                type="button"
                className="login-link-btn"
                onClick={() => { setFormState('idle'); setTotpCode(''); setErrorMsg(''); }}
              >
                ← Back to login
              </button>
            </form>
          )}

          {/* ── MFA setup intercept form ──────────────────────────────────── */}
          {mfaSetupMode && !isSuccess && (
            <form
              id="mfa-setup-form"
              className="login-form"
              onSubmit={handleMfaSetupSubmit}
              noValidate
              aria-label="MFA setup verification form"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 0' }}>
                {/* QR Code Container */}
                <div 
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <QRCodeSVG value={setupUri} size={160} level="M" />
                </div>
              </div>

              {/* TOTP Entry Field */}
              <div className="login-field">
                <label htmlFor="mfa-setup-code" className="login-label" style={{ textAlign: 'center' }}>
                  Enter 6-Digit Code
                </label>
                <div className="login-input-wrap">
                  <input
                    id="mfa-setup-code"
                    name="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="000000"
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="login-input login-input--totp"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={isLoading || totpCode.length !== 6}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="login-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                      <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                    </svg>
                    Verifying & Activating…
                  </>
                ) : (
                  'Verify & Enter'
                )}
              </button>

              <button
                type="button"
                className="login-link-btn"
                onClick={() => { setMfaSetupMode(false); setTotpCode(''); setFormState('idle'); setErrorMsg(''); }}
              >
                ← Back to login
              </button>
            </form>
          )}

        </div>

      </div>

      {/* Build tag badge - absolute bottom left */}
      <div className="login-build-tag">
        <span>Build&nbsp;<code>1.0.0</code></span>
      </div>

    </section>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Branding canvas (65%)
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="login-brand-panel"
        aria-hidden="true"
        role="presentation"
      >
        {/* Ambient gradient orbs */}
        <div className="login-orb login-orb--1" />
        <div className="login-orb login-orb--2" />
        <div className="login-orb login-orb--3" />

        {/* Telemetry Grid Overlay (Diagonal Pan) */}
        <div className="login-grid-telemetry" />

        {/* Aurora Glow behind grid */}
        <div className="login-aurora-glow" />

        {/* Centred logo */}
        <div className="login-brand-content">
          <NexusLogoAnimated width={210} />

          <div className="login-brand-explain">
            <p className="login-explain-title">Enterprise Control System</p>
            
            {/* Feature Cards Grid */}
            <div className="login-feature-grid">
              <div className="login-feature-card">
                <div className="login-feature-header">
                  <Globe size={13} className="login-feature-icon" />
                  <strong className="login-feature-title">Global Registries</strong>
                </div>
                <p className="login-feature-desc">Manage cross-border entities</p>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-header">
                  <Percent size={13} className="login-feature-icon" strokeWidth={2.5} />
                  <strong className="login-feature-title">Tax Engine</strong>
                </div>
                <p className="login-feature-desc">Dynamic date-effective policies</p>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-header">
                  <Cpu size={13} className="login-feature-icon" />
                  <strong className="login-feature-title">Headless Core</strong>
                </div>
                <p className="login-feature-desc">Decoupled API-first architecture</p>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-header">
                  <Key size={13} className="login-feature-icon" />
                  <strong className="login-feature-title">Secure Access</strong>
                </div>
                <p className="login-feature-desc">Strict role-based tier isolation</p>
              </div>
            </div>
          </div>

          {/* Minimalist Trust Badges */}
          <div className="login-trust-badges">
            <div className="login-badge-item">
              <Shield size={12} strokeWidth={2.25} />
              <span>RBAC Enforced</span>
            </div>
            <div className="login-badge-item">
              <Lock size={12} strokeWidth={2.25} />
              <span>AES-256 Encrypted</span>
            </div>
            <div className="login-badge-item">
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
