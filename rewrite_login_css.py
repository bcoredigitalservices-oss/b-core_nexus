import os

content = """
/* ─── Root Layout — Mobile First (Stacked by default, Flex Row on Desktop) ────── */
.login-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-main);
  position: relative;
  overflow-x: hidden;
}

@media (min-width: 1024px) {
  .login-root {
    flex-direction: row;
    overflow: hidden;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   LEFT PANEL — Form side
   ══════════════════════════════════════════════════════════════════════════════ */
.login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 3rem 1rem;
  background: var(--bg-main);
  position: relative;
  z-index: 1;
}

@media (min-width: 640px) {
  .login-form-panel {
    padding: 3rem 2rem;
  }
}

@media (min-width: 1024px) {
  .login-form-panel {
    width: 45%;
    min-height: 100vh;
    box-shadow: 10px 0 30px rgba(0,0,0,0.03);
    z-index: 10;
  }
}

/* ── Content wrapper inside Left Panel to manage stack alignment ──────────────── */
.login-form-content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px;
  z-index: 1;
}

/* ── Glassmorphic card container ────────────────────────────────────────────── */
.login-card {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem 2.5rem;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Mobile-only brand ───────────────────────────────────────────────────────── */
.login-mobile-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .login-mobile-brand {
    display: none;
  }
}

/* ── Header copy ─────────────────────────────────────────────────────────────── */
.login-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.login-title {
  font-family: var(--font-display);
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
  line-height: 1.1;
  margin: 0;
}

.login-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

/* ── Form ────────────────────────────────────────────────────────────────────── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Field ───────────────────────────────────────────────────────────────────── */
.login-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.login-forgot-link {
  font-size: 0.75rem;
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.login-forgot-link:hover {
  opacity: 0.8;
}

/* ── Input wrapper ───────────────────────────────────────────────────────────── */
.login-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login-input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: color 0.2s;
}

.login-input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.75rem;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  outline: none;
}

.login-input:hover {
  border-color: #cbd5e1;
}

.login-input:focus {
  background: var(--bg-card);
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.15);
}

.login-input:focus ~ .login-input-icon,
.login-input-wrap:focus-within .login-input-icon {
  color: var(--accent-primary);
}

.login-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-main);
}

/* Password — extra right padding for eye & caps lock */
.login-input--password {
  padding-right: 4.8rem;
}

/* TOTP — centered, large monospace */
.login-input--totp {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  letter-spacing: 0.3em;
  padding-left: 1rem;
}

.login-eye-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
}
.login-eye-btn:hover { color: var(--text-main); }
.login-eye-btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Caps Lock indicator */
.login-caps-lock-warning {
  position: absolute;
  right: 2.6rem;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  pointer-events: none;
  letter-spacing: 0.05em;
  line-height: 1;
}

/* ── Submit button ───────────────────────────────────────────────────────────── */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  margin-top: 0.5rem;
  border: none;
  border-radius: 10px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  background: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 91, 255, 0.25);
  transition: all 0.2s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 91, 255, 0.35);
  background: #524ade;
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 91, 255, 0.2);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Spinner icon */
.login-spinner {
  animation: spin-icon 0.9s linear infinite;
}

@keyframes spin-icon {
  to { transform: rotate(360deg); }
}

/* ── SSO Section ─────────────────────────────────────────────────────────────── */
.login-sso-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.login-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  margin: 0.5rem 0;
}

.login-divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.login-divider-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.login-sso-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.login-sso-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.login-sso-btn:hover {
  background: var(--bg-main);
  border-color: #cbd5e1;
}

/* ── Checkbox Row ───────────────────────────────────────────────────────────── */
.login-remember-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.login-remember-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  user-select: none;
}

.login-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-checkbox:hover {
  border-color: var(--accent-primary);
}

.login-checkbox:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.login-checkbox:checked::after {
  content: '✓';
  font-size: 12px;
  color: #ffffff;
  font-weight: 900;
}

.login-checkbox:focus-visible {
  outline: 2px solid rgba(99, 91, 255, 0.3);
  outline-offset: 2px;
}

/* ── Back link button ────────────────────────────────────────────────────────── */
.login-link-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  padding: 0.25rem;
  transition: color 0.2s;
  margin-top: 0.5rem;
}
.login-link-btn:hover { color: var(--accent-primary); }

/* ── Alert banners ───────────────────────────────────────────────────────────── */
.login-error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.4;
  animation: shake 0.4s cubic-bezier(0.4,0,0.2,1);
}

@keyframes shake {
  0%  { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
  100%{ transform: translateX(0); }
}

.login-success-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 600;
  animation: fadeSlideIn 0.3s ease;
}

.login-success-checkmark {
  font-size: 1.1rem;
  line-height: 1;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Build tag pill ─────────────────────────────────────────────────────────── */
.login-build-tag {
  position: absolute;
  bottom: 1.5rem;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-muted);
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
  z-index: 10;
}

/* ══════════════════════════════════════════════════════════════════════════════
   RIGHT PANEL — branding canvas
   ══════════════════════════════════════════════════════════════════════════════ */
.login-brand-panel {
  display: none;
}

@media (min-width: 1024px) {
  .login-brand-panel {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 55%;
    background: var(--bg-main);
    background-image: radial-gradient(circle at top right, rgba(99, 91, 255, 0.05), transparent 50%),
                      radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.05), transparent 50%);
    overflow: hidden;
  }
}

/* ── Ambient gradient orbs ───────────────────────────────────────────────────── */
.login-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}

.login-orb--1 {
  width: 500px;
  height: 500px;
  background: rgba(99, 91, 255, 0.08);
  top: -100px;
  right: -100px;
  animation: orb-drift 15s ease-in-out infinite alternate;
}

.login-orb--2 {
  width: 400px;
  height: 400px;
  background: rgba(16, 185, 129, 0.05);
  bottom: -100px;
  left: -50px;
  animation: orb-drift 18s ease-in-out infinite alternate-reverse;
}

@keyframes orb-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 20px) scale(1.1); }
}

/* ── Telemetry Grid Overlay (Diagonal Pan) ─────────────────────────────────── */
.login-grid-telemetry {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.5;
  pointer-events: none;
}

/* ── System status indicator ─────────────────────────────────────────────────── */
.system-status {
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-main);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
  z-index: 10;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse-dot 2.5s infinite;
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* ── Brand content ───────────────────────────────────────────────────────────── */
.login-brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.login-brand-explain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 480px;
  padding: 0 2rem;
}

.login-explain-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--accent-primary);
  margin: 0;
}

.login-explain-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin: 0;
  font-weight: 400;
  font-family: var(--font-body);
}

.login-text-highlight {
  color: var(--text-main);
  font-weight: 600;
}

/* ── Trust badges ────────────────────────────────────────────────────────────── */
.login-trust-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  margin-top: 3rem;
  color: var(--text-muted);
  font-family: var(--font-body);
}

.login-badge-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.login-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-top: 2.5rem;
  width: 100%;
  max-width: 540px;
}

.login-feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 1.25rem;
  text-align: left;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.login-feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.05);
  border-color: var(--accent-primary);
}

.login-feature-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.login-feature-icon {
  color: var(--accent-primary);
  background: rgba(99, 91, 255, 0.1);
  padding: 0.4rem;
  border-radius: 8px;
}

.login-feature-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.login-feature-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
"""

with open('frontend/src/pages/Login.css', 'w') as f:
    f.write(content)

