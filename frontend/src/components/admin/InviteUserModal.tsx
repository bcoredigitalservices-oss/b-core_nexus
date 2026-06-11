import React, { useState, FormEvent, useEffect } from 'react';
import { Mail, User, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function InviteUserModal() {
  const { inviteModalOpen, setInviteModalOpen, authFetch } = useAppContext();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Prevent scroll when modal is open
  useEffect(() => {
    if (inviteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [inviteModalOpen]);

  if (!inviteModalOpen && !showToast) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // POST /api/v1/auth/invite (requires min_tier=0, which our currentUser is)
      const data = await authFetch('/auth/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role_tier: 1 // default role tier to 1 (Executive)
        })
      });

      if (data.status === 'success' || data.message) {
        // Show success toast
        setToastMsg(`Invitation successfully generated for ${email}`);
        setShowToast(true);
        // Clear fields and close modal
        setEmail('');
        setFirstName('');
        setLastName('');
        setInviteModalOpen(false);
        // Auto-hide toast after 4 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 4000);
      } else {
        setErrorMsg('Unexpected server response.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Success Toast ────────────────────────────────────── */}
      {showToast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            background: 'rgba(9, 27, 46, 0.85)',
            border: '1px solid rgba(0, 245, 160, 0.35)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxWidth: '400px'
          }}
        >
          <style>{`
            @keyframes toast-slide-in {
              from { transform: translateY(20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
          <div style={{ background: 'rgba(0, 245, 160, 0.1)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center' }}>
            <CheckCircle2 size={18} color="var(--accent-green)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Invitation Created</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{toastMsg}</span>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', marginLeft: 'auto' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Modal Backdrop ────────────────────────────────────────────── */}
      {inviteModalOpen && (
        <div 
          onClick={() => setInviteModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          {/* Modal Container Card */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2.25rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 160, 223, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              animation: 'modal-zoom-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <style>{`
              @keyframes modal-zoom-in {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              .invite-input-wrap {
                position: relative;
                display: flex;
                align-items: center;
              }
              .invite-input-icon {
                position: absolute;
                left: 1rem;
                color: var(--text-muted);
                display: flex;
                align-items: center;
                pointer-events: none;
              }
              .invite-input {
                width: 100%;
                padding: 0.75rem 1rem 0.75rem 2.75rem;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                color: var(--text-main);
                font-size: 0.9rem;
                transition: all 0.2s ease;
                outline: none;
              }
              .invite-input:focus {
                border-color: transparent;
                box-shadow: 0 0 0 2px #00A0DF;
              }
              .invite-input:focus ~ .invite-input-icon {
                color: #00A0DF;
              }
              .invite-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
                padding: 0.9rem;
                border: none;
                border-radius: 10px;
                font-weight: 700;
                font-size: 0.95rem;
                cursor: pointer;
                background: linear-gradient(to right, #00A0DF, #007cb0);
                color: #ffffff;
                box-shadow: 0 0 15px rgba(0, 160, 223, 0.2);
                transition: all 0.2s ease;
              }
              .invite-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 0 20px rgba(0, 160, 223, 0.4);
              }
              .invite-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
            `}</style>

            {/* Close button */}
            <button 
              onClick={() => setInviteModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#00A0DF" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  Invite Executive Boardroom Member
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Generate a secure activation link for a new Tier 1 Executive user.
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 51, 102, 0.1)',
                  border: '1px solid rgba(255, 51, 102, 0.3)',
                  borderRadius: '8px',
                  color: '#ff8099',
                  fontSize: '0.8rem'
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Email Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Email Address
                </label>
                <div className="invite-input-wrap">
                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder="executive@bcore.local"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="invite-input"
                  />
                  <span className="invite-input-icon">
                    <Mail size={16} />
                  </span>
                </div>
              </div>

              {/* First Name & Last Name in double column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    First Name
                  </label>
                  <div className="invite-input-wrap">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Jane"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="invite-input"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <span className="invite-input-icon" style={{ left: '0.85rem' }}>
                      <User size={15} />
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Last Name
                  </label>
                  <div className="invite-input-wrap">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Doe"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="invite-input"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <span className="invite-input-icon" style={{ left: '0.85rem' }}>
                      <User size={15} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="invite-btn"
                disabled={loading || !email.trim() || !firstName.trim() || !lastName.trim()}
              >
                {loading ? 'Generating Link...' : 'Generate Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
