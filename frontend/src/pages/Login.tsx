import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, Globe, Percent, Cpu, Key } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import NexusLogoAnimated from '../components/branding/NexusLogoAnimated';
import { useAppContext } from '../context/AppContext';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'totp' | 'mfa_setup';

export default function Login() {
  const navigate   = useNavigate();
  const { setToken } = useAppContext();

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
  const passwordRef = useRef<HTMLInputElement>(null);
  const successAudio = useRef<HTMLAudioElement | null>(null);

  /* ── Initialise audio and focus ───────────────────────────────────────── */
  useEffect(() => {
    successAudio.current = new Audio('/assets/sounds/success-chime.mp3');
    successAudio.current.preload = 'auto';
    
    const savedEmail = localStorage.getItem('bcore_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      setTimeout(() => {
        passwordRef.current?.focus();
      }, 50);
    } else {
      emailRef.current?.focus();
    }
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

  const saveTokenAndSession = (accessToken: string, refreshToken?: string) => {
    if (rememberMe) {
      localStorage.setItem('bcore_remember_email', email.trim());
      localStorage.setItem('bcore_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('bcore_refresh_token', refreshToken);
      }
    } else {
      localStorage.removeItem('bcore_remember_email');
      sessionStorage.setItem('bcore_token', accessToken);
      if (refreshToken) {
        sessionStorage.setItem('bcore_refresh_token', refreshToken);
      }
    }
    setToken(accessToken);
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
        saveTokenAndSession(data.access_token, data.refresh_token);
        handleSuccessAndRedirect();
        return;
      }

      setError('Unexpected server response.');
    } catch {
      setError('Unable to reach the service. Please try again later.');
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
        setMfaSetupMode(true);
        return;
      }

      const data = await res.json();
      if (data.access_token) {
        saveTokenAndSession(data.access_token, data.refresh_token);
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
          saveTokenAndSession(data.access_token, data.refresh_token);
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
        saveTokenAndSession(data.access_token, data.refresh_token);
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
    <div className="flex flex-col min-h-screen bg-main relative overflow-x-hidden font-body lg:flex-row lg:overflow-hidden">

      {/* ── System Status badge absolute top right ────────────────────── */}
      <div className="absolute top-8 right-10 flex items-center gap-2.5 font-body text-xs font-bold text-text-main bg-card border border-color/10 py-2 px-4 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10" aria-label="System status">
        <span className="w-2 h-2 bg-accent-green rounded-full shadow-[0_0_0_3px_rgba(16,185,129,0.2)] animate-pulse"></span>
        <span>All Systems Operational</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LEFT PANEL — Interactive form (35%)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="flex items-center justify-center w-full min-h-screen py-12 px-4 bg-main relative z-10 sm:px-8 lg:w-[45%] lg:shadow-[10px_0_40px_rgba(0,0,0,0.04)]" aria-label="Login access portal">

        {/* Twinkling star particle background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '15%', left: '25%', animationDelay: '0s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }} />
          <div className="absolute bg-white rounded-full opacity-60 animate-pulse" style={{ top: '65%', left: '15%', animationDelay: '1s', width: '3px', height: '3px' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '75%', left: '85%', animationDelay: '1.5s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '45%', left: '70%', animationDelay: '2s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '85%', left: '40%', animationDelay: '2.5s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '35%', left: '10%', animationDelay: '0.8s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '55%', left: '90%', animationDelay: '1.2s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '90%', left: '20%', animationDelay: '1.8s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '10%', left: '60%', animationDelay: '2.2s' }} />
        </div>

        <div className="flex flex-col w-full max-w-[440px] z-10">
          {/* Mobile-only logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <NexusLogoAnimated width={150} />
          </div>

          {/* Glassmorphic Container Card */}
          <div className="w-full bg-card border border-color/80 rounded-[20px] p-10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.8)] flex flex-col gap-7 relative overflow-hidden">
            
            {/* Top brand line on the card */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-[#00F5A0]" />

            {/* Header */}
            <div className="flex flex-col gap-2 mb-2 text-center">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-main leading-none m-0">
                {mfaSetupMode
                  ? 'MFA Setup Required'
                  : formState === 'totp'
                    ? 'Security Verification'
                    : 'Welcome back'}
              </h1>
              <p className="text-[15px] text-text-muted leading-relaxed m-0 mt-1">
                {mfaSetupMode
                  ? 'Mandatory Security Step: Scan this code with Google Authenticator.'
                  : formState === 'totp'
                    ? 'Enter your authenticator code to proceed.'
                    : 'Enter your credentials to access B-Core Nexus.'}
              </p>
            </div>

            {/* Error banner */}
            {(formState === 'error' || errorMsg) && (
              <div className="flex items-center gap-3 py-4 px-5 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm font-semibold leading-relaxed animate-shake shadow-[0_4px_12px_rgba(239,68,68,0.1)]" role="alert" aria-live="polite">
                <AlertCircle size={15} strokeWidth={1.75} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success banner */}
            {isSuccess && (
              <div className="flex items-center gap-3 py-4 px-5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-700 text-sm font-semibold animate-fadeSlideIn shadow-[0_4px_12px_rgba(16,185,129,0.1)]" role="status" aria-live="polite">
                <span className="text-[19px] leading-none">✓</span>
                <span>Workspace loaded. Redirecting…</span>
              </div>
            )}

            {/* ── Standard login form ─────────────────────────────────────── */}
            {formState !== 'totp' && !mfaSetupMode && !isSuccess && (
              <form
                id="login-form"
                className="flex flex-col gap-[22px]"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Credential login form"
              >
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-widest text-text-main m-0">
                    Email Address
                  </label>
                  <div className="relative flex items-center group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-accent-primary" aria-hidden="true">
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
                      className="w-full py-3.5 pl-12 pr-4 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] transition-all duration-200 ease-in-out outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-black/20 focus:bg-card focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-opacity-20"
                      aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-widest text-text-main m-0">
                      Password
                    </label>
                    <a href="#forgot" className="text-xs text-accent-primary no-underline font-semibold transition-opacity duration-200 hover:opacity-70">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative flex items-center group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-accent-primary" aria-hidden="true">
                      <Lock size={16} strokeWidth={1.75} />
                    </span>
                    <input
                      ref={passwordRef}
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
                      className="w-full py-3.5 pl-12 pr-20 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] transition-all duration-200 ease-in-out outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-black/20 focus:bg-card focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-opacity-20"
                      aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                    />
                    {capsLockActive && (
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/40 py-1 px-2 rounded-md pointer-events-none tracking-wider leading-none" title="Caps Lock is active">
                        ⇪ CAPS
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-1 rounded-md transition-colors duration-200 hover:text-text-main hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
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
                <div className="flex items-center justify-start">
                  <label className="flex items-center gap-2.5 text-[13px] font-medium text-text-main cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="appearance-none w-4.5 h-4.5 border border-black/20 bg-card rounded-md cursor-pointer relative transition-all duration-200 flex items-center justify-center hover:border-accent-primary checked:bg-accent-primary checked:border-accent-primary checked:after:content-['✓'] checked:after:text-[13px] checked:after:text-white checked:after:font-black focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent-primary/20 focus-visible:outline-offset-2"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border-none rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer bg-accent-primary text-white shadow-[0_4px_14px_rgba(99,91,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_6px_20px_rgba(99,91,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:not-disabled:bg-[#524ade] active:not-disabled:translate-y-0 active:not-disabled:shadow-[0_2px_8px_rgba(99,91,255,0.2)] disabled:opacity-65 disabled:cursor-not-allowed"
                  disabled={isLoading || !email || !password}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
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
                <div className="flex flex-col gap-5 w-full">
                  <div className="flex items-center justify-center gap-4 w-full my-2">
                    <span className="flex-1 h-px bg-black/10"></span>
                    <span className="text-xs font-semibold text-text-muted">OR</span>
                    <span className="flex-1 h-px bg-black/10"></span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button type="button" className="flex items-center justify-center py-3.5 px-4 border border-black/10 bg-card text-text-main rounded-xl font-body text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:bg-main hover:border-black/20 hover:shadow-[0_4px_10px_rgba(0,0,0,0.05)]" onClick={() => alert('Google SSO integration')}>
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
                className="flex flex-col gap-[22px]"
                onSubmit={handleTotpSubmit}
                noValidate
                aria-label="TOTP verification form"
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor="totp-code" className="text-xs font-bold uppercase tracking-widest text-text-main m-0">
                    Authenticator Code
                  </label>
                  <div className="relative flex items-center group">
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
                      className="w-full py-3.5 pl-4 pr-4 bg-main border border-black/10 rounded-xl text-text-main font-body text-center font-mono text-2xl tracking-[0.3em] transition-all duration-200 ease-in-out outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-black/20 focus:bg-card focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-opacity-20"
                    />
                  </div>
                </div>

                <button
                  id="totp-submit-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border-none rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer bg-accent-primary text-white shadow-[0_4px_14px_rgba(99,91,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_6px_20px_rgba(99,91,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:not-disabled:bg-[#524ade] active:not-disabled:translate-y-0 active:not-disabled:shadow-[0_2px_8px_rgba(99,91,255,0.2)] disabled:opacity-65 disabled:cursor-not-allowed"
                  disabled={isLoading || totpCode.length !== 6}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
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
                  className="bg-transparent border-none text-text-muted text-[13px] font-semibold cursor-pointer text-center p-2 transition-colors duration-200 hover:text-accent-primary mt-2"
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
                className="flex flex-col gap-[22px]"
                onSubmit={handleMfaSetupSubmit}
                noValidate
                aria-label="MFA setup verification form"
              >
                <div className="flex flex-col items-center gap-[20px] py-2">
                  {/* QR Code Container */}
                  <div 
                    className="bg-white p-3 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.3)] flex items-center justify-center"
                  >
                    <QRCodeSVG value={setupUri} size={160} level="M" />
                  </div>
                </div>

                {/* TOTP Entry Field */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="mfa-setup-code" className="text-xs font-bold uppercase tracking-widest text-text-main m-0 text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="relative flex items-center group">
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
                      className="w-full py-3.5 pl-4 pr-4 bg-main border border-black/10 rounded-xl text-text-main font-body text-center font-mono text-2xl tracking-[0.3em] transition-all duration-200 ease-in-out outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-black/20 focus:bg-card focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-opacity-20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border-none rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer bg-accent-primary text-white shadow-[0_4px_14px_rgba(99,91,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_6px_20px_rgba(99,91,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:not-disabled:bg-[#524ade] active:not-disabled:translate-y-0 active:not-disabled:shadow-[0_2px_8px_rgba(99,91,255,0.2)] disabled:opacity-65 disabled:cursor-not-allowed"
                  disabled={isLoading || totpCode.length !== 6}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
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
                  className="bg-transparent border-none text-text-muted text-[13px] font-semibold cursor-pointer text-center p-2 transition-colors duration-200 hover:text-accent-primary mt-2"
                  onClick={() => { setMfaSetupMode(false); setTotpCode(''); setFormState('idle'); setErrorMsg(''); }}
                >
                  ← Back to login
                </button>
              </form>
            )}

          </div>

        </div>

      </section>

      {/* Build tag badge - absolute bottom left */}
      <div className="absolute bottom-6 left-8 flex items-center gap-2 text-[11px] font-mono font-bold text-text-main py-2 px-4 bg-card border border-black/10 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] z-10">
        <span>Build&nbsp;<code>1.2.1 (Alpha)</code></span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Branding canvas (65%)
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="hidden lg:flex lg:relative lg:items-center lg:justify-center lg:w-[55%] lg:bg-[#F8FAFC] lg:bg-[radial-gradient(circle_at_80%_20%,rgba(99,91,255,0.08)_0%,transparent_40%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08)_0%,transparent_40%)] lg:overflow-hidden"
        aria-hidden="true"
        role="presentation"
      >
        {/* Ambient gradient orbs */}
        <div className="absolute rounded-full filter blur-[100px] pointer-events-none w-[600px] h-[600px] bg-accent-primary/12 -top-[150px] -right-[150px] animate-orb-drift" />
        <div className="absolute rounded-full filter blur-[100px] pointer-events-none w-[500px] h-[500px] bg-accent-green/8 -bottom-[150px] -left-[100px] animate-[orb-drift_25s_ease-in-out_infinite_alternate-reverse]" />

        {/* Telemetry Grid Overlay (Diagonal Pan) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-80 pointer-events-none" />

        {/* Aurora Glow behind grid */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/5 via-transparent to-accent-green/5 opacity-50" />

        {/* Centred logo */}
        <div className="relative z-10 flex flex-col items-center gap-10 text-center">
          <NexusLogoAnimated width={210} />

          <div className="flex flex-col items-center gap-5 max-w-[520px] px-8">
            <p className="font-display text-[18px] font-extrabold uppercase tracking-[0.35em] text-text-main bg-gradient-to-r bg-clip-text text-transparent from-text-main to-accent-primary m-0">Enterprise Control System</p>
            
            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-6 mt-12 w-full max-w-[580px]">
              <div className="bg-gradient-to-br from-white/70 to-slate-50/30 backdrop-blur-md border-2 border-black/5 rounded-[18px] p-7 text-left transition-all duration-300 ease-out shadow-[0_10px_25px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-accent-primary/30 flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <Globe size={13} className="text-accent-primary bg-accent-primary/8 p-2 rounded-lg" />
                  <strong className="font-display text-[17px] font-extrabold text-text-main">Global Registries</strong>
                </div>
                <p className="text-sm text-text-muted leading-relaxed m-0 font-medium">Manage cross-border entities</p>
              </div>

              <div className="bg-gradient-to-br from-white/70 to-slate-50/30 backdrop-blur-md border-2 border-black/5 rounded-[18px] p-7 text-left transition-all duration-300 ease-out shadow-[0_10px_25px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-accent-primary/30 flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <Percent size={13} className="text-accent-primary bg-accent-primary/8 p-2 rounded-lg" strokeWidth={2.5} />
                  <strong className="font-display text-[17px] font-extrabold text-text-main">Tax Engine</strong>
                </div>
                <p className="text-sm text-text-muted leading-relaxed m-0 font-medium">Dynamic date-effective policies</p>
              </div>

              <div className="bg-gradient-to-br from-white/70 to-slate-50/30 backdrop-blur-md border-2 border-black/5 rounded-[18px] p-7 text-left transition-all duration-300 ease-out shadow-[0_10px_25px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-accent-primary/30 flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <Cpu size={13} className="text-accent-primary bg-accent-primary/8 p-2 rounded-lg" />
                  <strong className="font-display text-[17px] font-extrabold text-text-main">Headless Core</strong>
                </div>
                <p className="text-sm text-text-muted leading-relaxed m-0 font-medium">Decoupled API-first architecture</p>
              </div>

              <div className="bg-gradient-to-br from-white/70 to-slate-50/30 backdrop-blur-md border-2 border-black/5 rounded-[18px] p-7 text-left transition-all duration-300 ease-out shadow-[0_10px_25px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-accent-primary/30 flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <Key size={13} className="text-accent-primary bg-accent-primary/8 p-2 rounded-lg" />
                  <strong className="font-display text-[17px] font-extrabold text-text-main">Secure Access</strong>
                </div>
                <p className="text-sm text-text-muted leading-relaxed m-0 font-medium">Strict role-based tier isolation</p>
              </div>
            </div>
          </div>

          {/* Minimalist Trust Badges */}
          <div className="flex items-center justify-center gap-12 mt-16 text-text-muted font-body">
            <div className="flex items-center gap-2.5 text-[13px] font-bold tracking-wide">
              <Shield size={12} strokeWidth={2.25} />
              <span>RBAC Enforced</span>
            </div>
            <div className="flex items-center gap-2.5 text-[13px] font-bold tracking-wide">
              <Lock size={12} strokeWidth={2.25} />
              <span>AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2.5 text-[13px] font-bold tracking-wide">
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
