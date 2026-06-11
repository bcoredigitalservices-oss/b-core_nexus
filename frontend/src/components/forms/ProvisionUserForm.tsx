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
  Check
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ProvisionUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface Workspace {
  id: string;
  name: string;
  status: string;
}

export default function ProvisionUserForm({ onSuccess, onCancel }: ProvisionUserFormProps) {
  const { token, authFetch } = useAppContext();

  // Load lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeWorkspaces, setActiveWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clearanceLevel, setClearanceLevel] = useState(4); // Default Tier 4 Viewer
  const [departmentId, setDepartmentId] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

  // Submission Statuses
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
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
    
    if (token) {
      loadFormData();
    }
  }, [token]);

  const handleToggleWorkspace = (id: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
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
          workspace_ids: selectedWorkspaces
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 className="udg-spinner" size={24} />
        <span style={{ marginLeft: '10px' }}>Loading workspace context...</span>
      </div>
    );
  }

  // Render Onboarding Invite Success Screen
  if (inviteLink) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#00f5a0' }}>
          <CheckCircle2 size={48} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            User Provisioned Successfully!
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            A zero-knowledge invitation token has been generated. Send the secure claim URL below to the user:
          </p>
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
          style={{ marginTop: '0.5rem' }}
        >
          Return to Ledger
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', color: '#ff3366', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Email Address */}
      <div>
        <label>Operator Email Address</label>
        <div style={{ position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="email" 
            required 
            style={{ paddingLeft: '38px' }}
            placeholder="e.g. employee@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Name Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label>First Name</label>
          <div style={{ position: 'relative' }}>
            <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              style={{ paddingLeft: '38px' }}
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label>Last Name</label>
          <div style={{ position: 'relative' }}>
            <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              style={{ paddingLeft: '38px' }}
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Clearance Level / Role */}
      <div>
        <label>Clearance Level Assignment</label>
        <select 
          value={clearanceLevel} 
          onChange={(e) => setClearanceLevel(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '0.9rem'
          }}
        >
          <option value={2}>Tier 2 Manager (Directional Operations)</option>
          <option value={3}>Tier 3 Operator (Operational Leadership)</option>
          <option value={4}>Tier 4 Viewer (Execution & Logs)</option>
        </select>
      </div>

      {/* Department Assignment */}
      <div>
        <label>Department / Node Assignment</label>
        <div style={{ position: 'relative' }}>
          <Network size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select 
            value={departmentId} 
            onChange={(e) => setDepartmentId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              paddingLeft: '38px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}
          >
            <option value="">-- Unassigned / Independent Operator --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workspace Access Multi-Select */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Authorized Workspaces (Active Only)
        </label>
        {activeWorkspaces.length === 0 ? (
          <div style={{ padding: '12px', backgroundColor: 'rgba(255, 183, 3, 0.05)', border: '1px solid rgba(255, 183, 3, 0.15)', borderRadius: '8px', fontSize: '0.78rem', color: '#ffb703', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={14} />
            <span>No Active Workspaces registered. Toggles are locked.</span>
          </div>
        ) : (
          <div 
            style={{
              maxHeight: '120px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: 'var(--bg-input)'
            }}
          >
            {activeWorkspaces.map((ws) => (
              <label 
                key={ws.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.82rem', 
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  backgroundColor: selectedWorkspaces.includes(ws.id) ? 'rgba(157, 78, 221, 0.08)' : 'transparent'
                }}
              >
                <input 
                  type="checkbox"
                  checked={selectedWorkspaces.includes(ws.id)}
                  onChange={() => handleToggleWorkspace(ws.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: selectedWorkspaces.includes(ws.id) ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {ws.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          onClick={onCancel}
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
              <Loader2 size={16} className="udg-spinner" />
              Provisioning...
            </>
          ) : (
            'Provision Operator'
          )}
        </button>
      </div>

    </form>
  );
}
