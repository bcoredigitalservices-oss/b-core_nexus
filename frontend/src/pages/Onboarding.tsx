import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import NexusLogoAnimated from '../components/branding/NexusLogoAnimated';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Step = 'verifying' | 'password' | 'success' | 'error';

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>('verifying');
  const [email, setEmail] = useState('');

  // Password Phase States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const successAudio = useRef<HTMLAudioElement | null>(null);

  // Step 1: Automatically verify token on mount
  useEffect(() => {
    successAudio.current = new Audio('/assets/sounds/success-chime.mp3');
    successAudio.current.preload = 'auto';

    if (!token) {
      setErrorMsg('Invalid or missing onboarding link.');
      setStep('error');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/onboard/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data?.detail ?? 'Onboarding token is invalid or has expired.');
          setStep('error');
          return;
        }

        const data = await res.json();
        setEmail(data.email);
        setStep('password');
      } catch (err) {
        setErrorMsg('Unable to connect to the authentication server.');
        setStep('error');
      }
    };

    verifyToken();
  }, [token]);

  // Step 2: Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 12) {
      setErrorMsg('Password must be at least 12 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/onboard/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: password
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.detail ?? 'Failed to configure password. Please try again.');
        return;
      }

      // Success
      setStep('success');
      successAudio.current?.play().catch(() => {});
      
      // Auto-redirect to login screen after 2.5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErrorMsg('Network error setting password. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength logic
  const isPassLengthValid = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [isPassLengthValid, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <div 
      className="flex flex-col min-h-screen bg-main relative overflow-x-hidden font-body items-center justify-center p-8"
    >
      {/* Twinkling stars particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '15%', left: '25%', animationDelay: '0s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }} />
        <div className="absolute bg-white rounded-full opacity-60 animate-pulse" style={{ top: '65%', left: '15%', animationDelay: '1s', width: '3px', height: '3px' }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '75%', left: '85%', animationDelay: '1.5s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '45%', left: '70%', animationDelay: '2s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '85%', left: '40%', animationDelay: '2.5s' }} />
      </div>

      <div 
        className="w-full max-w-[460px] flex flex-col items-center gap-8 z-10"
      >
        {/* Animated Brand Emblem */}
        <NexusLogoAnimated width={180} />

        {/* Card Panel */}
        <div className="w-full bg-card border border-color/80 rounded-[20px] p-10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.8)] flex flex-col gap-7 relative overflow-hidden">
          
          {/* Top brand line on the card */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-[#00F5A0]" />

          {/* Header titles */}
          <div className="flex flex-col gap-2 mb-2 text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-main leading-none m-0 text-center">
              {step === 'verifying' && 'Securing Workspace...'}
              {step === 'password' && 'Create Master Password'}
              {step === 'success' && 'Workspace Active'}
              {step === 'error' && 'Verification Failure'}
            </h1>
            <p className="text-[15px] text-text-muted leading-relaxed m-0 text-center mt-1">
              {step === 'verifying' && 'Validating secure onboarding token key...'}
              {step === 'password' && `Welcome, ${email}. Choose your master credentials.`}
              {step === 'success' && 'Password configured successfully. Redirecting to login portal...'}
              {step === 'error' && 'This invitation link is invalid or expired.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && step === 'password' && (
            <div className="flex items-center gap-3 py-4 px-5 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm font-semibold leading-relaxed animate-shake shadow-[0_4px_12px_rgba(239,68,68,0.1)] w-full" role="alert">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── PHASE: VERIFYING (Loading Spinner) ────────────────────────── */}
          {step === 'verifying' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div 
                className="w-9 h-9 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" 
              />
              <span className="text-xs text-text-muted">Decrypting signature...</span>
            </div>
          )}

          {/* ── PHASE: PASSWORD ───────────────────────────────────────────── */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-[22px]">
              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">Choose Master Password</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-accent-primary"><Lock size={16} /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-12 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] transition-all duration-200 ease-in-out outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-black/20 focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-1 rounded-md transition-colors duration-200 hover:text-text-main hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">Confirm Master Password</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-accent-primary"><Lock size={16} /></span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-12 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] transition-all duration-200 ease-in-out outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-black/20 focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-1 rounded-md transition-colors duration-200 hover:text-text-main hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="flex flex-col gap-2 my-1">
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>Payload security level:</span>
                    <span className="font-bold" style={{ 
                      color: strengthScore <= 2 ? '#ff3366' : strengthScore <= 4 ? '#ffb703' : '#00F5A0' 
                    }}>
                      {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Moderate' : 'Highly Secure'}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1 w-full">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div 
                        key={idx}
                        className="flex-1 h-full rounded-[2px]"
                        style={{
                          background: idx <= strengthScore 
                            ? (strengthScore <= 2 ? '#ff3366' : strengthScore <= 4 ? '#ffb703' : '#00F5A0') 
                            : 'rgba(255,255,255,0.08)'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-text-muted leading-tight">
                    * Password must contain at least 12 characters.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border-none rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer bg-accent-primary text-white shadow-[0_4px_14px_rgba(99, 91, 255, 0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_6px_20px_rgba(99,91,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:not-disabled:bg-[#524ade] active:not-disabled:translate-y-0 active:not-disabled:shadow-[0_2px_8px_rgba(99,91,255,0.2)] disabled:opacity-65 disabled:cursor-not-allowed"
                disabled={loading || password.length < 12 || password !== confirmPassword}
              >
                {loading ? 'Activating Credentials...' : 'Save Password & Proceed'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ── PHASE: SUCCESS ────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div 
                className="bg-emerald-500/10 rounded-full border border-emerald-500/30 p-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,160,0.15)]"
              >
                <CheckCircle2 size={48} className="text-accent-green" />
              </div>

              <div className="text-center flex flex-col gap-2">
                <span className="text-[16px] font-bold text-text-main">Account Registered</span>
                <span className="text-xs text-text-muted leading-relaxed">
                  Your password has been set. Redirecting you to sign in...
                </span>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border-none rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer bg-accent-primary text-white shadow-[0_4px_14px_rgba(99, 91, 255, 0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_6px_20px_rgba(99,91,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:not-disabled:bg-[#524ade] active:not-disabled:translate-y-0 active:not-disabled:shadow-[0_2px_8px_rgba(99,91,255,0.2)] disabled:opacity-65 disabled:cursor-not-allowed"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* ── PHASE: ERROR ──────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div 
                className="bg-red-500/10 rounded-full border border-red-500/30 p-4 flex items-center justify-center shadow-[0_0_20px_rgba(255,51,102,0.15)]"
              >
                <AlertCircle size={48} className="text-[#ff8099]" />
              </div>

              <div className="text-center flex flex-col gap-2">
                <span className="text-[16px] font-bold text-text-main">Activation Link Invalid</span>
                <span className="text-xs text-text-muted leading-relaxed">
                  {errorMsg || 'The token signature is invalid, or the invitation has expired.'}
                </span>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border border-color bg-card-hover text-text-main rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer transition-all duration-200 hover:bg-main"
              >
                Return to Login Screen
              </button>
            </div>
          )}

        </div>

        {/* Footer info tag */}
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
          <Shield size={10} />
          <span>AES-256 SESSION ORCHESTRATION SHIELD</span>
        </div>
      </div>
    </div>
  );
}
