import React, { useState, FormEvent, useEffect } from 'react';
import { Mail, User, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function InviteUserModal() {
  const { inviteModalOpen, setInviteModalOpen, authFetch } = useAppContext();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch roles when modal opens
  useEffect(() => {
    if (inviteModalOpen) {
      authFetch('/iam/roles').then((fetchedRoles) => {
        if (fetchedRoles && fetchedRoles.length > 0) {
          setRoles(fetchedRoles);
          setRoleId(fetchedRoles[0].id);
        }
      }).catch(err => console.error("Failed to fetch roles:", err));
    }
  }, [inviteModalOpen]);

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
      if (!roleId) {
        throw new Error('Please select a base role for the invitation.');
      }

      // POST /api/v1/iam/users/invite (requires min_tier=0, which our currentUser is)
      const data = await authFetch('/iam/users/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role_id: roleId
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
        <div className="fixed bottom-6 right-6 z-[1000] bg-[#091b2e]/85 border border-[#00f5a0]/35 rounded-xl p-4 md:p-6 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center gap-3 animate-[toast-slide-in_0.3s_cubic-bezier(0.16,1,0.3,1)] max-w-[400px]">
          <style>{`
            @keyframes toast-slide-in {
              from { transform: translateY(20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
          <div className="bg-[#00f5a0]/10 rounded-full p-1.5 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-[var(--accent-green)]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-text-main">Invitation Created</span>
            <span className="text-[0.75rem] text-text-muted">{toastMsg}</span>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="bg-transparent border-none text-text-muted cursor-pointer p-1 ml-auto hover:text-text-main"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Modal Backdrop ────────────────────────────────────────────── */}
      {inviteModalOpen && (
        <div
          onClick={() => setInviteModalOpen(false)}
          className="fixed inset-0 bg-[#030712]/75 backdrop-blur-md z-[900] flex items-center justify-center p-6"
        >
          {/* Modal Container Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[460px] bg-card border border-color rounded-2xl p-9 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(0,160,223,0.05)] flex flex-col gap-6 relative animate-[modal-zoom-in_0.3s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <style>{`
              @keyframes modal-zoom-in {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>

            {/* Close button */}
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-6 right-6 bg-transparent border-none text-text-muted cursor-pointer p-1 rounded-md transition-colors duration-200 hover:text-text-main"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#00A0DF]" />
                <h3 className="text-[1.25rem] font-extrabold m-0 tracking-tight text-text-main">
                  Invite User
                </h3>
              </div>
              <p className="text-[0.8rem] text-text-muted m-0 leading-relaxed">
                Generate a secure activation link for a new user.
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 py-3 px-4 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-lg text-[#ff8099] text-[0.8rem]">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder="executive@bcore.local"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full py-3 pr-4 pl-11 bg-white/2 border border-white/8 rounded-lg text-text-main text-[0.9rem] transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-[#00A0DF]"
                  />
                  <span className="absolute left-4 text-text-muted flex items-center pointer-events-none">
                    <Mail size={16} />
                  </span>
                </div>
              </div>

              {/* First Name & Last Name in double column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">
                    First Name
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Jane"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full py-3 pr-4 pl-10 bg-white/2 border border-white/8 rounded-lg text-text-main text-[0.9rem] transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-[#00A0DF]"
                    />
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <User size={15} />
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">
                    Last Name
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Doe"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full py-3 pr-4 pl-10 bg-white/2 border border-white/8 rounded-lg text-text-main text-[0.9rem] transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-[#00A0DF]"
                    />
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <User size={15} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Base Role Selection */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">
                  Base Role
                </label>
                <select 
                  value={roleId} 
                  onChange={(e) => setRoleId(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full py-3 px-4 bg-white/2 border border-white/8 rounded-lg text-text-main text-[0.9rem] outline-none focus:border-transparent focus:ring-2 focus:ring-[#00A0DF]"
                >
                  <option value="" disabled>-- Select Base Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3.5 border-none rounded-lg font-bold text-[0.95rem] cursor-pointer bg-gradient-to-r from-[#00A0DF] to-[#007cb0] text-white shadow-[0_0_15px_rgba(0,160,223,0.2)] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_0_20px_rgba(0,160,223,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
