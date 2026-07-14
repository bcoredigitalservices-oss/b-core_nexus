import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import NexusLogoAnimated from '../../../components/branding/NexusLogoAnimated';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Step = 'form' | 'success';

export default function Bootstrap() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const successAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    successAudio.current = new Audio('/assets/sounds/success-chime.mp3');
    successAudio.current.preload = 'auto';
  }, []);

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
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
      const res = await fetch(`${API_BASE}/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.detail ?? 'System initialization failed. Make sure the database is not already bootstrapped.');
        return;
      }

      setStep('success');
      successAudio.current?.play().catch(() => {});
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErrorMsg('Unable to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const isPassLengthValid = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [isPassLengthValid, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen bg-main relative overflow-x-hidden font-body items-center justify-center p-8">
      {/* Stars particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '15%', left: '25%', animationDelay: '0s' }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }} />
        <div className="absolute bg-white rounded-full opacity-60 animate-pulse" style={{ top: '65%', left: '15%', animationDelay: '1s', width: '3px', height: '3px' }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '75%', left: '85%', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-[460px] flex flex-col items-center gap-8 z-10">
        <NexusLogoAnimated width={180} />

        <div className="w-full bg-card border border-color/80 rounded-[20px] p-10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.8)] flex flex-col gap-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-[#00F5A0]" />

          <div className="flex flex-col gap-2 mb-2 text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-main leading-none m-0 text-center">
              {step === 'form' ? 'Bootstrap Admin' : 'System Bootstrapped'}
            </h1>
            <p className="text-[15px] text-text-muted leading-relaxed m-0 text-center mt-1">
              {step === 'form' ? 'Register the first administrator user to initialize the instance.' : 'Administrator registered. Redirecting to login portal...'}
            </p>
          </div>

          {errorMsg && step === 'form' && (
            <div className="flex items-center gap-3 py-4 px-5 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm font-semibold leading-relaxed animate-shake shadow-[0_4px_12px_rgba(239,68,68,0.1)] w-full" role="alert">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleBootstrapSubmit} className="flex flex-col gap-[20px]">
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full py-3.5 px-4 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full py-3.5 px-4 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full py-3.5 px-4 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">Choose Password</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-accent-primary"><Lock size={16} /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-12 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-1 rounded-md transition-colors duration-200 hover:text-text-main hover:bg-black/5"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-main m-0">Confirm Password</label>
                <div className="relative flex items-center group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-accent-primary"><Lock size={16} /></span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full py-3.5 pl-12 pr-12 bg-main border border-black/10 rounded-xl text-text-main font-body text-[15px] outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:bg-card focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/15"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-1 rounded-md transition-colors duration-200 hover:text-text-main hover:bg-black/5"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {password && (
                <div className="flex flex-col gap-2 my-1">
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>Password Security Level:</span>
                    <span className="font-bold" style={{ color: strengthScore <= 2 ? '#ff3366' : strengthScore <= 4 ? '#ffb703' : '#00F5A0' }}>
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
                  <span className="text-[10px] text-text-muted">
                    * Password must be at least 12 characters.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-2 border-none rounded-xl font-display font-bold text-[17px] tracking-wide cursor-pointer bg-accent-primary text-white shadow-[0_4px_14px_rgba(99, 91, 255, 0.3)] transition-all duration-200 hover:not-disabled:-translate-y-0.5 active:not-disabled:translate-y-0 disabled:opacity-65 disabled:cursor-not-allowed"
                disabled={loading || password.length < 12 || password !== confirmPassword}
              >
                {loading ? 'Bootstrapping Admin...' : 'Initialize System & Admin'} <ArrowRight size={16} />
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="bg-transparent border-none text-[#8C8980] text-[13px] font-bold cursor-pointer transition-colors duration-200 hover:text-text-main"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="bg-emerald-500/10 rounded-full border border-emerald-500/30 p-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,160,0.15)]">
                <CheckCircle2 size={48} className="text-accent-green" />
              </div>
              <div className="text-center flex flex-col gap-2">
                <span className="text-[16px] font-bold text-text-main">System Initialized</span>
                <span className="text-xs text-text-muted leading-relaxed">
                  First admin account registered. Redirecting to login...
                </span>
              </div>
            </div>
          )}

          <div className="text-center text-[10px] font-bold text-[#8C8980] tracking-[0.2em] uppercase mt-2 select-none">
            Secured by B-Core
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
          <Shield size={10} />
          <span>INSTANCE INITIALIZATION SHELL</span>
        </div>
      </div>
    </div>
  );
}
