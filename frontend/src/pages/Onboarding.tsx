import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import NexusLogoAnimated from '../components/branding/NexusLogoAnimated';
import './Login.css'; // Reuse the login screen styles for visual consistency

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
      className="login-root"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        minHeight: '100vh',
        background: '#0B1120'
      }}
    >
      {/* Twinkling stars particle background */}
      <div className="login-stars-container">
        <div className="login-star" style={{ top: '15%', left: '25%', animationDelay: '0s' }} />
        <div className="login-star" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }} />
        <div className="login-star" style={{ top: '65%', left: '15%', animationDelay: '1s', width: '3px', height: '3px' }} />
        <div className="login-star" style={{ top: '75%', left: '85%', animationDelay: '1.5s' }} />
        <div className="login-star" style={{ top: '45%', left: '70%', animationDelay: '2s' }} />
        <div className="login-star" style={{ top: '85%', left: '40%', animationDelay: '2.5s' }} />
      </div>

      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          zIndex: 1
        }}
      >
        {/* Animated Brand Emblem */}
        <NexusLogoAnimated width={180} />

        {/* Card Panel */}
        <div className="login-card" style={{ width: '100%' }}>
          
          {/* Header titles */}
          <div className="login-header">
            <h1 className="login-title" style={{ textAlign: 'center' }}>
              {step === 'verifying' && 'Securing Workspace...'}
              {step === 'password' && 'Create Master Password'}
              {step === 'success' && 'Workspace Active'}
              {step === 'error' && 'Verification Failure'}
            </h1>
            <p className="login-subtitle" style={{ textAlign: 'center', marginTop: '4px' }}>
              {step === 'verifying' && 'Validating secure onboarding token key...'}
              {step === 'password' && `Welcome, ${email}. Choose your master credentials.`}
              {step === 'success' && 'Password configured successfully. Redirecting to login portal...'}
              {step === 'error' && 'This invitation link is invalid or expired.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && step === 'password' && (
            <div className="login-error-banner" role="alert" style={{ width: '100%' }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── PHASE: VERIFYING (Loading Spinner) ────────────────────────── */}
          {step === 'verifying' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', gap: '1rem' }}>
              <div 
                className="appshell-boot__spinner" 
                style={{ 
                  borderTopColor: '#00A0DF',
                  width: '36px',
                  height: '36px',
                  animation: 'spin 1.2s linear infinite'
                }} 
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Decrypting signature...</span>
            </div>
          )}

          {/* ── PHASE: PASSWORD ───────────────────────────────────────────── */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="login-form">
              {/* New Password */}
              <div className="login-field">
                <label className="login-label">Choose Master Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><Lock size={16} /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-input"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="login-field">
                <label className="login-label">Confirm Master Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><Lock size={16} /></span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="login-input"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.2rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Payload security level:</span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: strengthScore <= 2 ? '#ff3366' : strengthScore <= 4 ? '#ffb703' : '#00F5A0' 
                    }}>
                      {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Moderate' : 'Highly Secure'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', height: '4px', width: '100%' }}>
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div 
                        key={idx}
                        style={{
                          flex: 1,
                          height: '100%',
                          borderRadius: '2px',
                          background: idx <= strengthScore 
                            ? (strengthScore <= 2 ? '#ff3366' : strengthScore <= 4 ? '#ffb703' : '#00F5A0') 
                            : 'rgba(255,255,255,0.08)'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    * Password must contain at least 12 characters.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="login-btn"
                disabled={loading || password.length < 12 || password !== confirmPassword}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? 'Activating Credentials...' : 'Save Password & Proceed'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ── PHASE: SUCCESS ────────────────────────────────────────────── */}
          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
              <div 
                style={{
                  background: 'rgba(0, 245, 160, 0.1)',
                  borderRadius: '50%',
                  border: '2px solid rgba(0, 245, 160, 0.3)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0, 245, 160, 0.15)'
                }}
              >
                <CheckCircle2 size={48} color="var(--accent-green)" />
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Account Registered</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Your password has been set. Redirecting you to sign in...
                </span>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="login-btn"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Go to Login
              </button>
            </div>
          )}

          {/* ── PHASE: ERROR ──────────────────────────────────────────────── */}
          {step === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
              <div 
                style={{
                  background: 'rgba(255, 51, 102, 0.1)',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 51, 102, 0.3)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(255, 51, 102, 0.15)'
                }}
              >
                <AlertCircle size={48} color="#ff8099" />
              </div>

              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Activation Link Invalid</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {errorMsg || 'The token signature is invalid, or the invitation has expired.'}
                </span>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="login-btn"
                style={{ 
                  width: '100%', 
                  marginTop: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  boxShadow: 'none'
                }}
              >
                Return to Login Screen
              </button>
            </div>
          )}

        </div>

        {/* Footer info tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
          <Shield size={10} />
          <span>AES-256 SESSION ORCHESTRATION SHIELD</span>
        </div>
      </div>
    </div>
  );
}
