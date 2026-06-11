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

const WORKSPACE_CATEGORIES = [
  {
    name: 'Finance',
    color: '#00f5a0',
    keys: ['accounting', 'banking', 'taxes']
  },
  {
    name: 'Inventory',
    color: '#ffb703',
    keys: ['assets', 'products', 'items', 'warehouse', 'stock', 'buying']
  },
  {
    name: 'CRM & Sales',
    color: '#00f2fe',
    keys: ['pos', 'crm', 'sales', 'support']
  },
  {
    name: 'Operations & Management',
    color: '#c084fc',
    keys: ['field_ops', 'maintenance', 'manufacturing', 'projects', 'qa', 'qt', 'logistics']
  },
  {
    name: 'HR & Company',
    color: '#f472b6',
    keys: ['expenses', 'hr', 'payroll', 'attendance', 'recruitment', 'performance', 'leaves']
  },
  {
    name: 'Communications',
    color: '#38bdf8',
    keys: ['chats', 'employee_groups', 'email', 'message']
  },
  {
    name: 'Utilities',
    color: '#fb923c',
    keys: ['marketing', 'campaigns', 'website']
  },
  {
    name: 'System Internals',
    color: '#a3a3a3',
    keys: ['internals', 'cog']
  }
];

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
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;

    const loadFormData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setInviteLink('');
        setEmailSent(null);
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

  const handleToggleGroup = (groupItems: Workspace[]) => {
    const groupIdentifiers = groupItems.map(item => item.identifier);
    const allSelected = groupIdentifiers.every(id => selectedWorkspaces.includes(id));
    
    if (allSelected) {
      // Deselect all
      setSelectedWorkspaces(prev => prev.filter(id => !groupIdentifiers.includes(id)));
    } else {
      // Select all
      setSelectedWorkspaces(prev => {
        const next = [...prev];
        groupIdentifiers.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
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
    setEmailSent(null);

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
      setEmailSent(data.email_sent);
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

  // Group active workspaces
  const groupedWorkspaces = WORKSPACE_CATEGORIES.map(cat => {
    const items = activeWorkspaces.filter(ws => cat.keys.includes(ws.identifier));
    return { ...cat, items };
  }).filter(group => group.items.length > 0);

  // Add other ungrouped workspaces if they exist
  const categorizedIdentifiers = new Set(WORKSPACE_CATEGORIES.flatMap(cat => cat.keys));
  const otherItems = activeWorkspaces.filter(ws => !categorizedIdentifiers.has(ws.identifier));
  if (otherItems.length > 0) {
    groupedWorkspaces.push({
      name: 'Uncategorized Modules',
      color: '#a3a3a3',
      keys: [],
      items: otherItems
    });
  }

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
          maxWidth: '620px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-main)', 
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
            <UserIcon size={20} color="#9d4edd" />
            Provision Operator User
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--bg-card-hover)',
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                User Provisioned Successfully!
              </h3>
              
              {emailSent ? (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 245, 160, 0.08)',
                  border: '1px solid rgba(0, 245, 160, 0.2)',
                  borderRadius: '8px',
                  color: '#00f5a0',
                  fontSize: '0.82rem',
                  display: 'inline-block',
                  margin: '0.5rem 0'
                }}>
                  An activation email has been automatically dispatched via Resend to <strong>{email}</strong>
                </div>
              ) : (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 183, 3, 0.08)',
                  border: '1px solid rgba(255, 183, 3, 0.2)',
                  borderRadius: '8px',
                  color: '#ffb703',
                  fontSize: '0.82rem',
                  display: 'inline-block',
                  margin: '0.5rem 0'
                }}>
                  Resend integration unconfigured or failed to dispatch. Send this secure onboarding URL manually:
                </div>
              )}
            </div>

            <div 
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '1rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                wordBreak: 'break-all',
                color: 'var(--accent-primary)',
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
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                <UserIcon size={14} />
                Section 1: Identity
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>First Name</label>
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
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Last Name</label>
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Clearance Level *</label>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                <Briefcase size={14} />
                Section 2: Placement (The Human Org Chart)
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Department Assignment</label>
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
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                <Layers size={14} />
                Section 3: Access (Role-Based Workspace Control)
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px' }}>
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
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '14px',
                      backgroundColor: 'var(--bg-input)'
                    }}
                  >
                    {groupedWorkspaces.map((group) => {
                      const groupIdentifiers = group.items.map(item => item.identifier);
                      const allSelected = groupIdentifiers.every(id => selectedWorkspaces.includes(id));
                      const someSelected = groupIdentifiers.some(id => selectedWorkspaces.includes(id)) && !allSelected;

                      return (
                        <div key={group.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px', marginBottom: '4px' }}>
                          {/* Group Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: group.color }} />
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{group.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleGroup(group.items)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: allSelected ? '#ff3366' : 'var(--accent-primary)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          {/* Workspaces Grid inside Category */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {group.items.map((ws) => {
                              const isChecked = selectedWorkspaces.includes(ws.identifier);
                              return (
                                <label 
                                  key={ws.id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    fontSize: '0.78rem', 
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: isChecked ? `1px solid ${group.color}40` : '1px solid var(--border-color)',
                                    backgroundColor: isChecked ? `${group.color}0c` : 'rgba(255,255,255,0.01)',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleWorkspace(ws.identifier)}
                                    style={{ cursor: 'pointer', accentColor: group.color }}
                                  />
                                  <span style={{ color: isChecked ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isChecked ? 600 : 400 }}>
                                    {ws.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
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
                    <Loader2 size={14} className="udg-spinner" style={{ marginRight: '6px' }} />
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
