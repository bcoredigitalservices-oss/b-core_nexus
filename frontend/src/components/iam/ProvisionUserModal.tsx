import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  User as UserIcon, 
  Network, 
  Cpu, 
  AlertCircle,
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

interface Role {
  id: string;
  name: string;
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
    keys: ['accounting', 'invoicing', 'payments', 'banking', 'taxes', 'reports', 'budget', 'shares']
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
  const { token, authFetch, currentUser } = useAppContext();

  // Metadata context lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Field States
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);

  // Submission / Loading / Error States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch departments & workspaces on mount / open
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

        const wses = await authFetch('/iam/workspaces');
        if (wses) {
          setWorkspaces(wses);
        }
      } catch (err: any) {
        console.error('Failed to load provisioning form metadata:', err);
        setErrorMsg('Error loading workspaces or departments metadata.');
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

  const handleToggleWorkspace = (identifier: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(identifier) ? prev.filter(wId => wId !== identifier) : [...prev, identifier]
    );
  };

  const handleToggleGroup = (groupItems: Workspace[]) => {
    const groupIdentifiers = groupItems.map(item => item.identifier);
    const allSelected = groupIdentifiers.every(id => selectedWorkspaces.includes(id));
    
    if (allSelected) {
      setSelectedWorkspaces(prev => prev.filter(id => !groupIdentifiers.includes(id)));
    } else {
      setSelectedWorkspaces(prev => {
        const next = [...prev];
        groupIdentifiers.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await authFetch('/iam/users/provision', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          role_id: roleId,
          designation: designation.trim() || null,
          department_id: departmentId || null,
          workspace_strings: selectedWorkspaces
        })
      });

      // Call onSuccess and onClose as required
      onSuccess();
      onClose();

      // Reset form states
      setEmail('');
      setFirstName('');
      setLastName('');
      setDesignation('');
      setDepartmentId('');
      setSelectedWorkspaces([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to provision user.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group fetched workspaces based on their categories (only active ones, or all)
  const activeWorkspaces = workspaces.filter(w => w.status === 'Active');
  
  const groupedWorkspaces = WORKSPACE_CATEGORIES.map(cat => {
    const items = activeWorkspaces.filter(ws => cat.keys.includes(ws.identifier));
    return { ...cat, items };
  }).filter(group => group.items.length > 0);

  const categorizedIdentifiers = new Set(WORKSPACE_CATEGORIES.flatMap(cat => cat.keys));
  const otherItems = activeWorkspaces.filter(ws => !categorizedIdentifiers.has(ws.identifier));
  if (otherItems.length > 0) {
    groupedWorkspaces.push({
      name: 'Other Modules',
      color: '#a3a3a3',
      keys: [],
      items: otherItems
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] p-6">
      <div className="glass-panel w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border border-color rounded-2xl p-8 shadow-xl flex flex-col gap-6 relative">
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
          <p className="text-[0.8rem] text-text-muted m-0">
            Configure identity credentials, clearance tier, department, and workspace permissions.
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
                    className="pl-[34px] w-full"
                    placeholder="operator@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Clearance & Role Tier Selection */}
            <div className="grid grid-cols-1 gap-4 border-t border-color pt-5">
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
                >
                  <option value="" disabled>-- Select Base Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
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
              >
                <option value="">-- Unassigned (Root/Independent Operator) --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Workspaces Assignment Checklist */}
            <div className="border-t border-color pt-5">
              <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-2.5">
                <Layers size={14} />
                Authorized Workspaces
              </label>
              
              {activeWorkspaces.length === 0 ? (
                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[0.78rem] text-amber-500 flex items-center gap-2">
                  <Cpu size={14} />
                  <span>No active workspaces registered. Permissions locked.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto border border-color rounded-xl p-3.5 bg-black/5">
                  {groupedWorkspaces.map((group) => {
                    const groupIdentifiers = group.items.map(item => item.identifier);
                    const allSelected = groupIdentifiers.every(id => selectedWorkspaces.includes(id));

                    return (
                      <div key={group.name} className="flex flex-col gap-2 border-b border-color pb-3 mb-1">
                        {/* Category Header */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }} />
                            <span className="text-[0.78rem] font-bold text-text-main">{group.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(group.items)}
                            disabled={submitting}
                            className="bg-transparent border-none text-accent-primary text-[0.7rem] font-bold cursor-pointer p-0"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {/* Checkboxes grid inside Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.items.map((ws) => {
                            const isChecked = selectedWorkspaces.includes(ws.identifier);
                            return (
                              <label 
                                key={ws.id} 
                                className={`flex items-center gap-2 text-[0.78rem] cursor-pointer py-1.5 px-2.5 rounded-lg border transition-all duration-150 ${
                                  isChecked 
                                    ? 'border-accent-primary bg-accent-primary/5' 
                                    : 'border-color bg-card'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleWorkspace(ws.identifier)}
                                  disabled={submitting}
                                  className="cursor-pointer accent-accent-primary w-auto"
                                />
                                <span className={isChecked ? 'text-text-main font-semibold' : 'text-text-muted font-normal'}>
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

            {/* Modal Actions */}
            <div className="flex gap-4 mt-4 border-t border-color pt-5">
              <button 
                type="button" 
                className="btn btn-secondary flex-1" 
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1" 
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
