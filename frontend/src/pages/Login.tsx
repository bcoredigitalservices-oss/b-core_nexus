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

  const featureSlides = [
    {
      key: 'REG • 01',
      title: 'Global Registries',
      description: 'Unified entity visibility across multijurisdictional workflows.',
      icon: <Globe size={18} className="login-feature-icon" />,
    },
    {
      key: 'TAX • 02',
      title: 'Tax Engine',
      description: 'Smart tax calculation and compliance automation for every transaction.',
      icon: <Percent size={18} className="login-feature-icon" strokeWidth={2.5} />,
    },
    {
      key: 'API • 03',
      title: 'Headless Core',
      description: 'API-first architecture built for composable enterprise ecosystems.',
      icon: <Cpu size={18} className="login-feature-icon" />,
    },
    {
      key: 'SEC • 04',
      title: 'Secure Access',
      description: 'Multi-layered identity fencing with strong role separation.',
      icon: <Key size={18} className="login-feature-icon" />,
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % featureSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  /* ── Primary login submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Autofill fallback: Read from refs if React state hasn't synced
    const currentEmail = email.trim() || emailRef.current?.value.trim() || '';
    const currentPassword = password || passwordRef.current?.value || '';

    if (!currentEmail || !currentPassword) return;
    
    // Sync state for potential subsequent re-renders
    if (!email) setEmail(currentEmail);
    if (!password) setPassword(currentPassword);

    setFormState('loading');
    setErrorMsg('');
    setSetupUri('');

    try {
      const body = new URLSearchParams();
      body.append('username', currentEmail);
      body.append('password', currentPassword);

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
          if (data.setup_uri) {
            setSetupUri(data.setup_uri);
          }
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
  };

  const isLoading = formState === 'loading';
  const isSuccess = formState === 'success';

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F5F0] relative overflow-x-hidden font-body lg:flex-row lg:overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          LEFT PANEL — Interactive form (40%)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="flex items-center justify-center w-full min-h-screen py-12 px-4 bg-[#F6F5F0] relative z-10 sm:px-8 lg:w-[40%]" aria-label="Login access portal">

        {/* Telemetry Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,110,90,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,110,90,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-80 pointer-events-none z-0" />

        {/* Outer Corner Annotations */}
        <div className="absolute top-6 left-8 font-mono text-[10px] font-bold text-[#8E8B82] tracking-widest uppercase pointer-events-none hidden sm:block">
          N° 000 - 001
        </div>
        <div className="absolute bottom-12 left-8 font-mono text-[10px] font-bold text-[#8E8B82] tracking-widest uppercase pointer-events-none hidden sm:block">
          BUILD - 1.3.1
        </div>
        <div className="absolute bottom-6 left-8 font-mono text-[10px] font-bold text-[#8E8B82] tracking-widest uppercase pointer-events-none hidden sm:block">
          FILED - 2026
        </div>
        <div className="absolute bottom-6 right-8 font-mono text-[10px] font-bold text-[#8E8B82] tracking-widest uppercase pointer-events-none hidden sm:block">
          © 2026 B-CORE
        </div>

        <div className="flex flex-col w-full max-w-[420px] z-10">
          {/* Mobile-only logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <NexusLogoAnimated width={140} />
          </div>

          {/* Premium Card Container */}
          <div className="w-full bg-white border border-[#E4E2DC] rounded-[8px] p-10 shadow-[0_12px_32px_rgba(0,0,0,0.04)] flex flex-col gap-6 relative overflow-hidden border-t-[4px] border-t-[#0F2E59]">
            
            {/* Header / Step Tracker */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold text-[#b89230] tracking-[0.2em] uppercase leading-none">
                ACCESS <span className="mx-1">&gt;</span> STEP 01 - CREDENTIALS
              </div>
              <h1 className="font-display text-[26px] font-extrabold text-[#0F2E59] tracking-tight m-0 mt-2 leading-tight">
                {mfaSetupMode
                  ? 'MFA Setup Required'
                  : formState === 'totp'
                    ? 'Security Verification'
                    : 'Sign in to Nexus'}
              </h1>
              <p className="text-[13px] text-slate-500 leading-relaxed m-0 mt-1">
                {mfaSetupMode
                  ? 'Scan the code with your authenticator app.'
                  : formState === 'totp'
                    ? 'Enter your authenticator code to proceed.'
                    : 'Enter your credentials to access the B-Core control system.'}
              </p>
            </div>

            {/* Error banner */}
            {(formState === 'error' || errorMsg) && (
              <div className="flex items-center gap-3 py-3 px-4 bg-red-50 border border-red-200 rounded-[6px] text-red-700 text-xs font-semibold leading-relaxed animate-shake shadow-[0_4px_12px_rgba(239,68,68,0.05)] animate-fadeSlideIn" role="alert" aria-live="polite">
                <AlertCircle size={14} strokeWidth={2} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success banner */}
            {isSuccess && (
              <div className="flex items-center gap-3 py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-[6px] text-emerald-700 text-xs font-semibold animate-fadeSlideIn shadow-[0_4px_12px_rgba(16,185,129,0.05)]" role="status" aria-live="polite">
                <span className="text-[16px] leading-none">✓</span>
                <span>Workspace loaded. Redirecting…</span>
              </div>
            )}

            {/* ── Standard login form ─────────────────────────────────────── */}
            {formState !== 'totp' && !mfaSetupMode && !isSuccess && (
              <form
                id="login-form"
                className="flex flex-col gap-5"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Credential login form"
              >
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-email" className="text-[10px] font-bold uppercase tracking-widest text-[#0F2E59] m-0">
                    Email Address
                  </label>
                  <div className="relative flex items-center group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8980] flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-[#0F2E59]" aria-hidden="true">
                      <Mail size={15} strokeWidth={2} />
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
                      className="w-full py-3.5 pl-11 pr-4 bg-[#F4F1EA] border border-transparent rounded-[6px] text-[#0F2E59] font-body text-[14px] transition-all duration-200 outline-none placeholder-[#A39F93] hover:bg-[#EAE7DF] focus:bg-white focus:border-[#0F2E59] focus:ring-2 focus:ring-[#0F2E59]/10"
                      aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-[10px] font-bold uppercase tracking-widest text-[#0F2E59] m-0">
                      Password
                    </label>
                    <a href="#forgot" className="text-[11px] text-[#0f2e59]/70 no-underline font-semibold transition-opacity duration-200 hover:opacity-100 hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative flex items-center group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8980] flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-[#0F2E59]" aria-hidden="true">
                      <Lock size={15} strokeWidth={2} />
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
                      className="w-full py-3.5 pl-11 pr-20 bg-[#F4F1EA] border border-transparent rounded-[6px] text-[#0F2E59] font-body text-[14px] transition-all duration-200 outline-none placeholder-[#A39F93] hover:bg-[#EAE7DF] focus:bg-white focus:border-[#0F2E59] focus:ring-2 focus:ring-[#0F2E59]/10"
                      aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                    />
                    {capsLockActive && (
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 py-1 px-1.5 rounded pointer-events-none tracking-wider leading-none" title="Caps Lock is active">
                        ⇪ CAPS
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#8C8980] cursor-pointer flex items-center p-1 rounded-md transition-colors duration-200 hover:text-[#0F2E59] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#0F2E59] focus-visible:outline-offset-2"
                      onClick={() => setShowPass(v => !v)}
                      tabIndex={0}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      disabled={isLoading}
                    >
                      {showPass ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* Remember me checkbox */}
                <div className="flex items-center justify-start mt-1">
                  <label className="flex items-center gap-2.5 text-[13px] font-semibold text-[#0F2E59] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="appearance-none w-4 h-4 border border-[#C2C0B8] bg-white rounded cursor-pointer relative transition-all duration-200 flex items-center justify-center hover:border-[#0F2E59] checked:bg-[#0F2E59] checked:border-[#0F2E59] checked:after:content-['✓'] checked:after:text-[10px] checked:after:text-white checked:after:font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0F2E59]/20"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-6 mt-2 border-none rounded-[6px] font-display font-extrabold text-[15px] cursor-pointer bg-[#0F2E59] text-white shadow-[0_4px_14px_rgba(15,46,89,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,46,89,0.3)] active:not-disabled:translate-y-0 disabled:opacity-65 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                        <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                      </svg>
                      Authenticating…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      Sign in <span className="text-base leading-none">→</span>
                    </span>
                  )}
                </button>

              </form>
            )}

            {/* ── TOTP verification form ──────────────────────────────────── */}
            {formState === 'totp' && !mfaSetupMode && (
              <form
                id="totp-form"
                className="flex flex-col gap-5"
                onSubmit={handleTotpSubmit}
                noValidate
                aria-label="TOTP verification form"
              >
                {setupUri && (
                  <div className="flex flex-col items-center gap-[20px] py-1">
                    {/* QR Code Container */}
                    <div 
                      className="bg-white p-3 rounded-lg border border-[#E4E2DC] shadow-[0_8px_20px_rgba(0,0,0,0.03)] flex items-center justify-center animate-[fadeIn_0.3s_ease]"
                    >
                      <QRCodeSVG value={setupUri} size={150} level="M" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totp-code" className="text-[10px] font-bold uppercase tracking-widest text-[#0F2E59] m-0">
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
                      className="w-full py-3.5 pl-4 pr-4 bg-[#F4F1EA] border border-transparent rounded-[6px] text-[#0F2E59] font-body text-center font-mono text-2xl tracking-[0.3em] transition-all duration-200 ease-in-out outline-none placeholder-[#A39F93] hover:bg-[#EAE7DF] focus:bg-white focus:border-[#0F2E59]"
                    />
                  </div>
                </div>

                <button
                  id="totp-submit-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-6 mt-1 border-none rounded-[6px] font-display font-extrabold text-[15px] cursor-pointer bg-[#0F2E59] text-white shadow-[0_4px_14px_rgba(15,46,89,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,46,89,0.3)] active:not-disabled:translate-y-0 disabled:opacity-65 disabled:cursor-not-allowed"
                  disabled={isLoading || totpCode.length !== 6}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                        <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                      </svg>
                      Verifying…
                    </span>
                  ) : (
                    'Verify & Enter'
                  )}
                </button>

                <button
                  type="button"
                  className="bg-transparent border-none text-[#8C8980] text-[13px] font-bold cursor-pointer text-center p-2 transition-colors duration-200 hover:text-[#0F2E59]"
                  onClick={() => { setFormState('idle'); setTotpCode(''); setErrorMsg(''); setSetupUri(''); }}
                >
                  ← Back to login
                </button>
              </form>
            )}

            {/* ── MFA setup intercept form ──────────────────────────────────── */}
            {mfaSetupMode && !isSuccess && (
              <form
                id="mfa-setup-form"
                className="flex flex-col gap-5"
                onSubmit={handleMfaSetupSubmit}
                noValidate
                aria-label="MFA setup verification form"
              >
                <div className="flex flex-col items-center gap-[20px] py-1">
                  {/* QR Code Container */}
                  <div 
                    className="bg-white p-3 rounded-lg border border-[#E4E2DC] shadow-[0_8px_20px_rgba(0,0,0,0.03)] flex items-center justify-center"
                  >
                    <QRCodeSVG value={setupUri} size={150} level="M" />
                  </div>
                </div>

                {/* TOTP Entry Field */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mfa-setup-code" className="text-[10px] font-bold uppercase tracking-widest text-[#0F2E59] m-0 text-center">
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
                      className="w-full py-3.5 pl-4 pr-4 bg-[#F4F1EA] border border-transparent rounded-[6px] text-[#0F2E59] font-body text-center font-mono text-2xl tracking-[0.3em] transition-all duration-200 ease-in-out outline-none placeholder-[#A39F93] hover:bg-[#EAE7DF] focus:bg-white focus:border-[#0F2E59]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-6 mt-1 border-none rounded-[6px] font-display font-extrabold text-[15px] cursor-pointer bg-[#0F2E59] text-white shadow-[0_4px_14px_rgba(15,46,89,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,46,89,0.3)] active:not-disabled:translate-y-0 disabled:opacity-65 disabled:cursor-not-allowed"
                  disabled={isLoading || totpCode.length !== 6}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                        <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
                      </svg>
                      Verifying & Activating…
                    </span>
                  ) : (
                    'Verify & Activate'
                  )}
                </button>

                <button
                  type="button"
                  className="bg-transparent border-none text-[#8C8980] text-[13px] font-bold cursor-pointer text-center p-2 transition-colors duration-200 hover:text-[#0F2E59]"
                  onClick={() => { setMfaSetupMode(false); setTotpCode(''); setFormState('idle'); setErrorMsg(''); setSetupUri(''); }}
                >
                  ← Back to login
                </button>
              </form>
            )}

            {/* Secured Footer inside Card */}
            <div className="text-center text-[10px] font-bold text-[#8C8980] tracking-[0.2em] uppercase mt-2 select-none">
              Secured by B-Core
            </div>

          </div>

        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Branding canvas (60%)
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="hidden lg:flex lg:relative lg:items-center lg:justify-center lg:w-[60%] lg:bg-[#041527] lg:overflow-hidden min-h-screen"
        aria-hidden="true"
        role="presentation"
      >
        {/* Ambient subtle glow orbs */}
        <div className="absolute rounded-full filter blur-[100px] pointer-events-none w-[600px] h-[600px] bg-slate-800/10 -top-[150px] -right-[150px]" />
        
        {/* Telemetry Grid Overlay (Warm Grid) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-100 pointer-events-none" />

        {/* Corner Annotations on Right Panel */}
        <div className="absolute top-8 right-8 font-mono text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          NEXUS - V1
        </div>
        <div className="absolute bottom-8 right-8 font-mono text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          SECURED • TLS 1.3 • AES-256
        </div>

        {/* Top Branding Block */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <NexusLogoAnimated width={50} />
          <div className="flex flex-col">
            <div className="font-display font-extrabold text-[18px] tracking-wider text-white uppercase leading-none">
              B-CORE <span className="text-[#C5A85C]">•</span> NEXUS
            </div>
            <div className="text-[9px] font-bold tracking-[0.25em] text-slate-400 uppercase mt-1 leading-none">
              Enterprise Control System
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col w-full max-w-[500px] px-8 text-left">
          
          {/* Gold clearance label */}
          <div className="text-[10px] font-bold text-[#C5A85C] tracking-[0.2em] uppercase mb-4 leading-none">
            Enterprise • Registries • Compliance
          </div>

          {/* Heading */}
          <h2 className="font-display text-[38px] font-extrabold text-white tracking-tight leading-tight m-0 mb-4">
            One control plane for regulated operations.
          </h2>

          {/* Subheading */}
          <p className="text-[14px] text-slate-400 leading-relaxed m-0 mb-10 font-medium">
            Nexus consolidates entities, tax, and identity into a headless, audit-ready core — engineered for institutions that cannot afford drift.
          </p>
          
          {/* Interactive Feature Accordion List */}
          <div className="flex flex-col w-full border-t border-white/10">
            {featureSlides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`flex flex-col py-4 border-b border-white/10 cursor-pointer transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-[#C5A85C] w-16 flex-shrink-0">
                        {slide.key || `REG • 0${idx + 1}`}
                      </span>
                      <span className="font-display font-extrabold text-[17px] tracking-tight">
                        {slide.title}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-[#C5A85C] font-bold text-lg select-none">
                        →
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <p className="mt-2 pl-[88px] text-[12px] text-slate-300 leading-relaxed font-body font-medium animate-slideDown m-0">
                      {slide.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </section>

    </div>
  );
}