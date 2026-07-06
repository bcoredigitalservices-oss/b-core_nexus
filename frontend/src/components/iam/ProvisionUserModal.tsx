import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  User as UserIcon, 
  AlertCircle,
  X,
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

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export default function ProvisionUserModal({ isOpen, onClose, onSuccess }: ProvisionUserModalProps) {
  const { token, authFetch } = useAppContext();

  // Metadata context lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Field States
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Submission / Loading / Error States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch departments & roles on mount / open
  useEffect(() => {
    if (!isOpen || !token) return;

    const loadFormData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        const depts = await authFetch('/iam/departments');
        if (depts) setDepartments(depts);

        const fetchedRoles = await authFetch('/iam/roles');
        if (fetchedRoles && fetchedRoles.length > 0) {
          setRoles(fetchedRoles);
          setRoleId(fetchedRoles[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load provisioning form metadata:', err);
        setErrorMsg('Error loading roles or departments metadata.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [isOpen, token, authFetch]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !roleId) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await authFetch('/iam/users/provision', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          role_id: roleId,
          designation: designation.trim() || null,
          department_id: departmentId || null
        })
      });

      // Call onSuccess and onClose
      onSuccess(res);
      onClose();

      // Reset form states
      setEmail('');
      setFirstName('');
      setLastName('');
      setDesignation('');
      setDepartmentId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to provision user.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoleDescription = roles.find(r => r.id === roleId)?.description;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] p-6 animate-[fadeIn_0.2s_ease]">
      <div className="glass-panel w-full max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border border-color rounded-2xl p-8 shadow-xl flex flex-col gap-6 relative">
        {/* Modal Close "X" Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 bg-card-hover border border-color text-text-muted cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-all duration-200 hover:text-text-main hover:border-accent-primary"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-2 border-b border-color pb-4">
          <h3 className="text-[1.25rem] font-extrabold text-text-main flex items-center gap-2 font-display m-0">
            <UserIcon size={20} className="text-accent-primary" />
            Provision Operator User
          </h3>
          <p className="text-[0.8rem] text-text-muted m-0 font-medium">
            Configure identity credentials, assigned base role, department, and company designation.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[0.85rem]">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 text-text-muted gap-4">
            <div className="w-6 h-6 border-3 border-color border-t-accent-primary rounded-full animate-spin"></div>
            <span className="text-[0.85rem]">Loading directory context...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Identity & Basic Info */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">First Name</label>
                  <input 
                    type="text" 
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail size={14} className="absolute left-3 text-text-muted" />
                  <input 
                    type="email" 
                    required 
                    className="pl-[34px] w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
                    placeholder="operator@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Clearance & Role Tier Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-color pt-5">
              <div>
                <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-1.5">
                  <ShieldCheck size={14} />
                  Base Role Assignment *
                </label>
                <select 
                  value={roleId} 
                  onChange={(e) => setRoleId(e.target.value)}
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
                >
                  <option value="" disabled>-- Select Base Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {selectedRoleDescription && (
                  <span className="text-[10px] text-text-muted mt-1.5 block leading-normal italic">
                    {selectedRoleDescription}
                  </span>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-1.5">
                  <ShieldCheck size={14} />
                  Designation
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Sales Manager"
                  value={designation} 
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            {/* Placement / Department */}
            <div className="border-t border-color pt-5">
              <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-1.5">
                <Briefcase size={14} />
                Department Assignment
              </label>
              <select 
                value={departmentId} 
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
              >
                <option value="">-- Unassigned (Root/Independent Operator) --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 mt-2 border-t border-color pt-5">
              <button 
                type="button" 
                className="w-full rounded-lg py-2.5 px-4 font-semibold border border-color bg-card text-text-muted transition-all hover:bg-card-hover hover:text-text-main cursor-pointer"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="w-full rounded-lg py-2.5 px-4 font-semibold border border-transparent bg-accent-primary text-white shadow-lg shadow-accent-primary/20 transition-all hover:brightness-110 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? 'Provisioning...' : 'Provision Operator'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
