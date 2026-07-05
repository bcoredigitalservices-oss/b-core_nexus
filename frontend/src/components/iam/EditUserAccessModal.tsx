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

interface EditUserAccessModalProps {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    designation: string | null;
    department_id: string | null;
    workspaces?: string[];
  } | null;
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

export default function EditUserAccessModal({ user, onClose, onSuccess }: EditUserAccessModalProps) {
  const { token, authFetch } = useAppContext();

  // Metadata context lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Field States
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);

  // Submission / Loading / Error States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch departments & workspaces on mount / open
  useEffect(() => {
    if (!user || !token) return;

    const loadFormData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        const depts = await authFetch('/iam/departments');
        if (depts) setDepartments(depts);

        const wses = await authFetch('/iam/workspaces');
        if (wses) {
          setWorkspaces(wses);
        }
      } catch (err: any) {
        console.error('Failed to load access form metadata:', err);
        setErrorMsg('Error loading workspaces or departments metadata.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [user, token, authFetch]);

  // Initialize form fields with existing user properties
  useEffect(() => {
    if (!user) return;
    setDesignation(user.designation || '');
    setDepartmentId(user.department_id || '');
  }, [user]);

  // Map user's existing workspace identifier strings to workspace IDs once workspaces are loaded
  useEffect(() => {
    if (!user || !workspaces.length) return;

    const userWorkspaceIdentifiers = user.workspaces || [];
    const matchedIds = userWorkspaceIdentifiers.map((wsVal: any) => {
      if (typeof wsVal === 'string') {
        const match = workspaces.find(w => w.identifier === wsVal || w.id === wsVal);
        return match ? match.id : null;
      }
      return wsVal?.id || null;
    }).filter((id): id is string => !!id);

    setSelectedWorkspaceIds(matchedIds);
  }, [user, workspaces]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (user) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [user]);

  if (!user) return null;

  const handleToggleWorkspace = (id: string) => {
    setSelectedWorkspaceIds(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const handleToggleGroup = (groupItems: Workspace[]) => {
    const groupIds = groupItems.map(item => item.id);
    const allSelected = groupIds.every(id => selectedWorkspaceIds.includes(id));
    
    if (allSelected) {
      setSelectedWorkspaceIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedWorkspaceIds(prev => {
        const next = [...prev];
        groupIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await authFetch(`/iam/users/${user.id}/access`, {
        method: 'PUT',
        body: JSON.stringify({
          designation: designation.trim() || null,
          department_id: departmentId || null,
          workspace_ids: selectedWorkspaceIds
        })
      });

      // Call onSuccess and onClose as required
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update access settings.');
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
        <div className="flex flex-col gap-2.5 border-b border-color pb-4">
          <h3 className="text-[1.25rem] font-extrabold text-text-main flex items-center gap-2 font-display m-0">
            <ShieldCheck size={20} className="text-accent-primary" />
            Configure Access Control
          </h3>
          
          {/* Read-only Header showing user information */}
          <div className="mt-2 py-2.5 px-3.5 bg-card-hover border border-color rounded-lg flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-text-main">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Independent Operator'}
            </span>
            <span className="text-[0.75rem] text-text-muted flex items-center gap-1.5">
              <Mail size={12} />
              {user.email}
            </span>
          </div>
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

            {/* Designation */}
            <div className="grid grid-cols-1 gap-4 mb-6">
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
                    const groupIds = group.items.map(item => item.id);
                    const allSelected = groupIds.every(id => selectedWorkspaceIds.includes(id));

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
                            const isChecked = selectedWorkspaceIds.includes(ws.id);
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
                                  onChange={() => handleToggleWorkspace(ws.id)}
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
                {submitting ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
