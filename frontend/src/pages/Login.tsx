import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../context/AppContext';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;
const LOGO_SRC = '/bcore-logo.svg';

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'totp' | 'mfa_setup';

function VantaNetBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BG_COLOR = "#eaf2fa";
    const NODE_COLOR = "129,158,195";
    const LINE_COLOR = "129,158,195";

    const NODE_COUNT = 140;
    const MAX_DIST = 220;
    const MOUSE_RADIUS = 260;

    let width = 0;
    let height = 0;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Node = {
      x: number;
      y: number;

      baseX: number;
      baseY: number;

      vx: number;
      vy: number;

      radius: number;
    };

    let nodes: Node[] = [];

    const mouse = {
      x: -9999,
      y: -9999,
    };

    let offsetX = 0;
    let offsetY = 0;

    let targetOffsetX = 0;
    let targetOffsetY = 0;

    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => {

        const x = Math.random() * width;
        const y = Math.random() * height;

        return {
          x,
          y,

          baseX: x,
          baseY: y,

          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,

          radius: 1.5 + Math.random() * 2,
        };
      });
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodes.length === 0) initNodes();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();

      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      targetOffsetX = (mouse.x - width / 2) * 0.015;
      targetOffsetY = (mouse.y - height / 2) * 0.015;
    };

    const onTouchMove = (e: TouchEvent) => {

      const rect = canvas.getBoundingClientRect();

      const t = e.touches.item(0);

      if (!t) return;

      mouse.x = t.clientX - rect.left;
      mouse.y = t.clientY - rect.top;

      targetOffsetX = (mouse.x - width / 2) * 0.015;
      targetOffsetY = (mouse.y - height / 2) * 0.015;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    let raf = 0;
    const draw = () => {

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      offsetX += (targetOffsetX - offsetX) * 0.05;
      offsetY += (targetOffsetY - offsetY) * 0.05;

      for (const n of nodes) {
        n.baseX += n.vx;
        n.baseY += n.vy;

        if (n.baseX < 0 || n.baseX > width) n.vx *= -1;
        if (n.baseY < 0 || n.baseY > height) n.vy *= -1;

        const dx = mouse.x - n.baseX;
        const dy = mouse.y - n.baseY;

        const dist = Math.sqrt(dx * dx + dy * dy);

        let tx = n.baseX;
        let ty = n.baseY;

        if (dist > 0 && dist < MOUSE_RADIUS) {

          const strength = (1 - dist / MOUSE_RADIUS) * 10;

          tx -= (dx / dist) * strength;
          ty -= (dy / dist) * strength;
        }

        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;

        ctx.beginPath();
        ctx.arc(
          n.x + offsetX,
          n.y + offsetY,
          n.radius,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(${NODE_COLOR}, 0.9)`;
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < MAX_DIST) {
            const opacity = Math.pow(1 - dist / MAX_DIST, 2) * .75;
            ctx.strokeStyle = `rgba(${LINE_COLOR}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(
              nodes[i].x + offsetX,
              nodes[i].y + offsetY
            );

            ctx.lineTo(
              nodes[j].x + offsetX,
              nodes[j].y + offsetY
            );
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseout", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" aria-hidden="true" />;
}

//Glowing animated logo 
function NexusLogoGlow({ size = 200 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <style>{`
        @keyframes logoHaloPulse {
          0%,100%{
            transform:scale(1);
            opacity:.55;
          }
          50%{
            transform:scale(1.12);
            opacity:.9;
          }
        }

        @keyframes logoFloat{
          0%,100%{
            transform:translateY(0px);
          }
          50%{
            transform:translateY(-10px);
          }
        }

        @keyframes logoRingSpin{
          from{
            transform:rotate(0deg);
          }
          to{
            transform:rotate(360deg);
          }
        }

        @keyframes orbitDot{
          from{
            transform:rotate(0deg);
          }
          to{
            transform:rotate(360deg);
          }
        }

        @keyframes fadeUp{
          from{
            opacity:0;
            transform:translateY(20px);
          }
          to{
            opacity:1;
            transform:translateY(0);
          }
        }

        @media (prefers-reduced-motion:reduce){
          .logo-halo,
          .logo-float,
          .logo-ring,
          .orbit-dot{
            animation:none!important;
          }
        }
      `}</style>

      <div
        className="relative flex items-center justify-center"
        style={{
          width: size * 1.8,
          height: size * 1.8,
        }}
      >
        {/* Halo */}
        <div
          className="logo-halo absolute inset-0 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(181,210,240,.7) 42%, rgba(181,210,240,0) 75%)",
            animation: "logoHaloPulse 5s ease-in-out infinite",
          }}
        />

        {/* Orbit Ring */}
        <svg
          className="logo-ring absolute"
          width={size * 1.5}
          height={size * 1.5}
          viewBox="0 0 100 100"
          style={{
            animation: "logoRingSpin 40s linear infinite",
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="rgba(19,40,71,.18)"
            strokeWidth="0.7"
            strokeDasharray="3 6"
          />
        </svg>

        {/* Orbit Dot */}
        <div
          className="orbit-dot absolute"
          style={{
            width: size * 1.5,
            height: size * 1.5,
            animation: "orbitDot 18s linear infinite",
          }}
        >
          <div
            className="absolute rounded-full bg-white shadow-lg"
            style={{
              width: 8,
              height: 8,
              top: -4,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 0 18px rgba(255,255,255,.9)",
            }}
          />
        </div>

        {/* Logo */}
        <img
          src={LOGO_SRC}
          alt="B-Core Nexus"
          width={size}
          height={size}
          className="logo-float relative z-10"
          style={{
            animation: "logoFloat 6s ease-in-out infinite",
            filter:
              "drop-shadow(0 12px 30px rgba(19,40,71,.22))",
          }}
        />
      </div>

      {/* Text */}
      <div
        className="flex flex-col items-center"
        style={{
          animation: "fadeUp .9s ease",
          marginTop: 8,
        }}
      >
        {/* Capsule */}
        <div
          style={{
            minWidth: 485,
            height: 64,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            padding: "0 44px",

            borderRadius: 9999,

            background: "#FFFFFF",

            border: "1px solid rgba(228,236,245,.95)",

            boxShadow: `
        0 18px 40px rgba(18,38,66,.08),
        inset 0 1px 0 rgba(255,255,255,.95)
      `,
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: ".36em",
              color: "#162C4C",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            B-CORE
          </span>

          <span
            style={{
              margin: "0 28px",
              color: "#5A8FC7",
              fontSize: 20,
            }}
          >
            •
          </span>

          <span
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: ".36em",
              color: "#162C4C",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            NEXUS
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            marginTop: 34,

            fontSize: 13,

            fontWeight: 700,

            letterSpacing: ".62em",

            color: "#5B7EA6",

            textTransform: "uppercase",

            whiteSpace: "nowrap",
          }}
        >
          THE B-CORE DIGITAL SYSTEM
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { setToken } = useAppContext();

  //Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');

  //MFA Setup intercept states
  const [mfaSetupMode, setMfaSetupMode] = useState(false);
  const [setupUri, setSetupUri] = useState('');

  // UI state
  const [formState, setFormState] = useState<FormState>('idle');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  //Refs 
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const successAudio = useRef<HTMLAudioElement | null>(null);

  //Initialise audio and focus
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

  //Caps Lock Detector 
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  //Helpers 
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
    successAudio.current?.play().catch(() => { });
    setTimeout(() => navigate('/'), 800);
  };

  // Primary login submit 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const currentEmail = email.trim() || emailRef.current?.value.trim() || '';
    const currentPassword = password || passwordRef.current?.value || '';

    if (!currentEmail || !currentPassword) return;

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
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (res.status === 401) {
        setError('Incorrect email or password.');
        return;
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data?.detail === 'MFA_SETUP_REQUIRED') {
          setSetupUri(data.setup_uri);
          setMfaSetupMode(true);
          setFormState('idle');
          return;
        }
        if (data?.detail === 'MFA_CODE_REQUIRED' || data?.detail === 'MFA code required') {
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

  // MFA setup submission 
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
        method: 'POST',
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

  //OTP verification submit 
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
        method: 'POST',
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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden font-body lg:flex-row lg:overflow-hidden">

      {/* Interactive VANTA.NET canvas — light blue, low density  */}
      <VantaNetBackground />

      {/* Soft veil behind the card side to further reduce eye contrast */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(105deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 42%, rgba(234,242,250,0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* Login card */}
      <section
        className="relative z-10 flex w-full min-h-screen items-center justify-center px-6 py-14 sm:px-10 lg:w-[44%] lg:px-16"
        aria-label="Sign in"
      >
        <div className="w-full max-w-[410px]">
          <div className="flex w-full flex-col gap-7 rounded-xl border border-[#d7e4f0] bg-white/90 p-10 shadow-[0_18px_50px_rgba(19,40,71,0.10)] backdrop-blur-md">

            {/* Brand row */}
            <div className="flex items-center gap-3">
              <img src={LOGO_SRC} alt="" width={40} height={40} aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-[13px] font-extrabold uppercase tracking-[0.18em] leading-none text-[#132847]">
                  B-Core <span className="text-[#4a7fb5]">•</span> Nexus
                </span>
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] leading-none text-[#7d93ab]">
                  The B-Core Digital System
                </span>
              </div>
            </div>

            {/* Formal heading  */}
            <h1 className="m-0 text-[24px] font-bold leading-tight tracking-tight text-[#132847]">
              {mfaSetupMode
                ? 'Set up your authenticator'
                : formState === 'totp'
                  ? 'Two-factor verification'
                  : 'Welcome back'}
            </h1>

            {/* Error banner */}
            {(formState === 'error' || errorMsg) && !isSuccess && (
              <div
                className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-700"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={14} strokeWidth={2} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success banner */}
            {isSuccess && (
              <div
                className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700"
                role="status"
                aria-live="polite"
              >
                <span className="text-[16px] leading-none">✓</span>
                <span>Workspace loaded. Redirecting…</span>
              </div>
            )}

            {/* Standard login form  */}
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
                  <label
                    htmlFor="login-email"
                    className="m-0 text-[10px] font-bold uppercase tracking-widest text-[#132847]"
                  >
                    Email Address
                  </label>
                  <div className="group relative flex items-center">
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-[#8ba3bc] transition-colors duration-200 group-focus-within:text-[#132847]"
                      aria-hidden="true"
                    >
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
                      className="w-full rounded-md border border-transparent bg-[#f0f5fa] py-3.5 pl-11 pr-4 font-body text-[14px] text-[#132847] outline-none transition-all duration-200 placeholder-[#a4b7ca] hover:bg-[#e8eff7] focus:border-[#4a7fb5] focus:bg-white focus:ring-2 focus:ring-[#4a7fb5]/15"
                      aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="m-0 text-[10px] font-bold uppercase tracking-widest text-[#132847]"
                    >
                      Password
                    </label>
                    <a
                      href="#forgot"
                      className="text-[11px] font-semibold text-[#4a7fb5] no-underline transition-opacity duration-200 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="group relative flex items-center">
                    <span
                      className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-[#8ba3bc] transition-colors duration-200 group-focus-within:text-[#132847]"
                      aria-hidden="true"
                    >
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
                      className="w-full rounded-md border border-transparent bg-[#f0f5fa] py-3.5 pl-11 pr-20 font-body text-[14px] text-[#132847] outline-none transition-all duration-200 placeholder-[#a4b7ca] hover:bg-[#e8eff7] focus:border-[#4a7fb5] focus:bg-white focus:ring-2 focus:ring-[#4a7fb5]/15"
                      aria-describedby={formState === 'error' ? 'login-error-msg' : undefined}
                    />
                    {capsLockActive && (
                      <span
                        className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-1 font-mono text-[9px] font-bold leading-none tracking-wider text-amber-600"
                        title="Caps Lock is active"
                      >
                        ⇪ CAPS
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center rounded-md border-none bg-transparent p-1 text-[#8ba3bc] transition-colors duration-200 hover:bg-black/5 hover:text-[#132847]"
                      onClick={() => setShowPass(!showPass)}
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 cursor-pointer rounded border border-[#c4d4e1] bg-white accent-[#4a7fb5]"
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-xs font-medium text-[#132847] cursor-pointer"
                  >
                    Remember me on this device
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative mt-2 w-full rounded-md bg-[#132847] py-3.5 px-5 font-body text-[14px] font-bold text-white shadow-md transition-all duration-200 hover:bg-[#0f1f35] active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MFA Setup Mode */}
            {mfaSetupMode && !isSuccess && (
              <form
                className="flex flex-col gap-5"
                onSubmit={handleMfaSetupSubmit}
                noValidate
              >
                <p className="text-sm text-[#7d93ab]">
                  Scan the QR code with your authenticator app and enter the code below.
                </p>

                {setupUri && (
                  <div className="flex justify-center py-3 bg-white p-4 rounded-lg border border-[#d7e4f0]">
                    <QRCodeSVG value={setupUri} size={200} level="H" includeMargin />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totp-code" className="m-0 text-[10px] font-bold uppercase tracking-widest text-[#132847]">
                    6-Digit Code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    className="w-full rounded-md border border-transparent bg-[#f0f5fa] py-3.5 px-4 font-mono text-[18px] text-center tracking-widest text-[#132847] outline-none transition-all duration-200 placeholder-[#a4b7ca] hover:bg-[#e8eff7] focus:border-[#4a7fb5] focus:bg-white focus:ring-2 focus:ring-[#4a7fb5]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="relative w-full rounded-md bg-[#4a7fb5] py-3.5 px-5 font-body text-[14px] font-bold text-white shadow-md transition-all duration-200 hover:bg-[#3a5f95] active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying...
                    </>
                  ) : (
                    'Confirm & Sign in'
                  )}
                </button>
              </form>
            )}

            {/* TOTP Verification Mode */}
            {formState === 'totp' && !mfaSetupMode && !isSuccess && (
              <form
                className="flex flex-col gap-5"
                onSubmit={handleTotpSubmit}
                noValidate
              >
                <p className="text-sm text-[#7d93ab]">
                  Enter the 6-digit code from your authenticator app.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="verify-code" className="m-0 text-[10px] font-bold uppercase tracking-widest text-[#132847]">
                    6-Digit Code
                  </label>
                  <input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    className="w-full rounded-md border border-transparent bg-[#f0f5fa] py-3.5 px-4 font-mono text-[18px] text-center tracking-widest text-[#132847] outline-none transition-all duration-200 placeholder-[#a4b7ca] hover:bg-[#e8eff7] focus:border-[#4a7fb5] focus:bg-white focus:ring-2 focus:ring-[#4a7fb5]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="relative w-full rounded-md bg-[#132847] py-3.5 px-5 font-body text-[14px] font-bold text-white shadow-md transition-all duration-200 hover:bg-[#0f1f35] active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign in'
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7d93ab]">
                Secured by B-Core
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*Animated Logo */}
      <section className="hidden lg:flex relative z-10 w-[56%] min-h-screen items-center justify-center px-8 py-14">
        <NexusLogoGlow size={180} />
      </section>
    </div>
  );
}