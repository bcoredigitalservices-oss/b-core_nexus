import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  User as UserIcon, 
  Network, 
  Cpu, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  X,
  Layers,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ProvisionUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Workspace {
  id: string;
  name: string;
  identifier: string;
  status: string;
}

export default function ProvisionUserModal({ isOpen, onClose, onSuccess }: ProvisionUserModalProps) {
  const { token, authFetch } = useAppContext();

  // Load lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeWorkspaces, setActiveWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clearanceLevel, setClearanceLevel] = useState(4); // Default Tier 4 Auditor
  const [departmentId, setDepartmentId] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

  // Submission Statuses
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;

    const loadFormData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setInviteLink('');
        setCopied(false);
        
        const depts = await authFetch('/iam/departments');
        if (depts) setDepartments(depts);

        const wses = await authFetch('/iam/workspaces');
        if (wses) {
          // Filter only ACTIVE workspaces
          const activeOnly = wses.filter((w: Workspace) => w.status === 'Active');
          setActiveWorkspaces(activeOnly);
        }
      } catch (err) {
        console.error('Failed to load provisioning form metadata:', err);
        setErrorMsg('Error loading active workspaces or departments metadata.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [isOpen, token]);

  const handleToggleWorkspace = (identifier: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(identifier) ? prev.filter(wId => wId !== identifier) : [...prev, identifier]
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setInviteLink('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/iam/users/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          role_tier: clearanceLevel,
          clearance_level: clearanceLevel,
          department_id: departmentId || null,
          workspace_strings: selectedWorkspaces
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'User provisioning failed.');
      }

      const data = await res.json();
      setInviteLink(data.onboarding_url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to provision user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter to get only leaf departments (departments that are not parents of any other department)
  const parentIds = new Set(departments.map(d => d.parent_id).filter(Boolean));
  const leafDepartments = departments.filter(d => !parentIds.has(d.id));
  const departmentOptions = leafDepartments.length > 0 ? leafDepartments : departments;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 26, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '1.5rem'
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: '540px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#1E293B', 
          border: '1px solid rgba(157, 78, 221, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
            <UserIcon size={20} color="#9d4edd" />
            Provision Operator User
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', color: '#ff3366', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader2 className="udg-spinner" size={24} />
            <span style={{ marginLeft: '10px' }}>Loading organization directory context...</span>
          </div>
        ) : inviteLink ? (
          /* Success / Invite link view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: '#00f5a0' }}>
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                User Provisioned Successfully!
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                A zero-knowledge invitation token has been generated. Send the secure claim URL below to the user:
              </p>
            </div>

            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                wordBreak: 'break-all',
                color: '#c8b6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <span>{inviteLink}</span>
              <button 
                type="button" 
                onClick={handleCopy}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {copied ? <Check size={14} color="#00f5a0" /> : <Copy size={14} />}
              </button>
            </div>

            <button 
              onClick={() => {
                onSuccess();
              }} 
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              Return to Ledger
            </button>
          </div>
        ) : (
          /* Form layout with three vertical sections */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* SECTION 1: Identity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                <UserIcon size={14} />
                Section 1: Identity
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>First Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      style={{ paddingLeft: '34px', width: '100%', fontSize: '0.85rem' }}
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>Last Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      style={{ paddingLeft: '34px', width: '100%', fontSize: '0.85rem' }}
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    required 
                    style={{ paddingLeft: '34px', width: '100%', fontSize: '0.85rem' }}
                    placeholder="operator@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>Clearance Level *</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select 
                    value={clearanceLevel} 
                    onChange={(e) => setClearanceLevel(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      paddingLeft: '34px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value={2}>Tier 2 Manager</option>
                    <option value={3}>Tier 3 Operator</option>
                    <option value={4}>Tier 4 Auditor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: Placement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9d4edd', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                <Briefcase size={14} />
                Section 2: Placement (The Human Org Chart)
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>Department Assignment</label>
                <div style={{ position: 'relative' }}>
                  <Network size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select 
                    value={departmentId} 
                    onChange={(e) => setDepartmentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      paddingLeft: '34px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">-- Unassigned (Root/Independent Operator) --</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Access */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c8b6ff', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                <Layers size={14} />
                Section 3: Access (The Software Modules)
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '10px' }}>
                  Authorized Workspaces
                </label>
                {activeWorkspaces.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: 'rgba(255, 183, 3, 0.05)', border: '1px solid rgba(255, 183, 3, 0.15)', borderRadius: '8px', fontSize: '0.78rem', color: '#ffb703', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={14} />
                    <span>No active workspaces registered. Toggles locked.</span>
                  </div>
                ) : (
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--bg-input)'
                    }}
                  >
                    {activeWorkspaces.map((ws) => {
                      const isChecked = selectedWorkspaces.includes(ws.identifier);
                      return (
                        <label 
                          key={ws.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            fontSize: '0.8rem', 
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid rgba(157, 78, 221, 0.2)' : '1px solid transparent',
                            backgroundColor: isChecked ? 'rgba(157, 78, 221, 0.08)' : 'transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleWorkspace(ws.identifier)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ color: isChecked ? '#ffffff' : 'var(--text-muted)' }}>
                            {ws.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="udg-spinner" />
                    Provisioning...
                  </>
                ) : (
                  'Provision Operator'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
