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
      <div className="flex justify-center items-center py-12 text-text-muted">
        <Loader2 className="animate-spin" size={24} />
        <span className="ml-2.5">Loading workspace context...</span>
      </div>
    );
  }

  // Render Onboarding Invite Success Screen
  if (inviteLink) {
    return (
      <div className="flex flex-col gap-6 text-center p-4">
        <div className="flex justify-center text-[#00f5a0]">
          <CheckCircle2 size={48} />
        </div>
        <div>
          <h3 className="text-[1.2rem] font-extrabold text-text-main mb-2">
            User Provisioned Successfully!
          </h3>
          <p className="text-[0.82rem] text-text-muted m-0">
            A zero-knowledge invitation token has been generated. Send the secure claim URL below to the user:
          </p>
        </div>

        <div className="bg-card border border-color p-4 rounded-xl text-[0.8rem] font-mono break-all text-accent-primary flex items-center justify-between gap-3">
          <span>{inviteLink}</span>
          <button 
            type="button" 
            onClick={handleCopy}
            className="bg-card-hover border border-color text-text-main p-1.5 rounded-lg cursor-pointer flex items-center justify-center flex-shrink-0 hover:border-accent-primary hover:text-text-main"
          >
            {copied ? <Check size={14} className="text-[#00f5a0]" /> : <Copy size={14} />}
          </button>
        </div>

        <button 
          onClick={() => {
            onSuccess();
          }} 
          className="btn btn-primary mt-2"
        >
          Return to Ledger
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      
      {errorMsg && (
        <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[0.85rem]">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Email Address */}
      <div>
        <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Operator Email Address</label>
        <div className="relative flex items-center">
          <Mail size={16} className="absolute left-3 text-text-muted" />
          <input 
            type="email" 
            required 
            className="pl-[38px] w-full"
            placeholder="e.g. employee@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Name Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">First Name</label>
          <div className="relative flex items-center">
            <UserIcon size={16} className="absolute left-3 text-text-muted" />
            <input 
              type="text" 
              className="pl-[38px] w-full"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Last Name</label>
          <div className="relative flex items-center">
            <UserIcon size={16} className="absolute left-3 text-text-muted" />
            <input 
              type="text" 
              className="pl-[38px] w-full"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Department Assignment */}
      <div>
        <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Department / Node Assignment</label>
        <div className="relative flex items-center">
          <Network size={16} className="absolute left-3 text-text-muted" />
          <select 
            value={departmentId} 
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full py-3 pr-4 pl-10 bg-input border border-color rounded-lg text-text-main text-[0.9rem] outline-none"
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
        <label className="block text-[0.75rem] text-text-muted font-semibold mb-2">
          Authorized Workspaces (Active Only)
        </label>
        {activeWorkspaces.length === 0 ? (
          <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[0.78rem] text-amber-500 flex items-center gap-2">
            <Cpu size={14} />
            <span>No Active Workspaces registered. Toggles are locked.</span>
          </div>
        ) : (
          <div className="max-h-[120px] overflow-y-auto border border-color rounded-lg p-2.5 flex flex-col gap-2 bg-input">
            {activeWorkspaces.map((ws) => (
              <label 
                key={ws.id} 
                className={`flex items-center gap-2 text-[0.82rem] cursor-pointer py-1 px-2 rounded transition-all duration-150 ${
                  selectedWorkspaces.includes(ws.id) ? 'bg-accent-primary/8' : 'transparent'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={selectedWorkspaces.includes(ws.id)}
                  onChange={() => handleToggleWorkspace(ws.id)}
                  className="cursor-pointer accent-accent-primary"
                />
                <span className={selectedWorkspaces.includes(ws.id) ? 'text-text-main font-semibold' : 'text-text-muted'}>
                  {ws.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 mt-4">
        <button 
          type="button" 
          className="btn btn-secondary flex-1" 
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary flex-1 flex items-center justify-center gap-1.5" 
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
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
