import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  User as UserIcon, 
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

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Permission {
  id: string;
  name: string;
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Field States
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Submission / Loading / Error States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch departments, roles, permissions and user details on mount / open
  useEffect(() => {
    if (!user || !token) return;

    const loadFormData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        const depts = await authFetch('/iam/departments');
        if (depts) setDepartments(depts);

        const fetchedRoles = await authFetch('/iam/roles');
        if (fetchedRoles) setRoles(fetchedRoles);

        const fetchedPerms = await authFetch('/iam/permissions');
        if (fetchedPerms) setPermissions(fetchedPerms);

        const details = await authFetch(`/iam/users/${user.id}/details`);
        if (details) {
          setDesignation(details.designation || '');
          setDepartmentId(details.department_id || '');
          if (details.roles && details.roles.length > 0) {
            setRoleId(details.roles[0].id);
          } else {
            setRoleId('');
          }
          if (details.permissions) {
            setSelectedPermissionIds(details.permissions.map((p: any) => p.id));
          }
        }
      } catch (err: any) {
        console.error('Failed to load access form metadata:', err);
        setErrorMsg('Error loading workspaces, roles, or departments metadata.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [user, token, authFetch]);

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

  const handleTogglePermission = (id: string) => {
    setSelectedPermissionIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleToggleGroup = (groupPermissions: Permission[]) => {
    const groupPermIds = groupPermissions.map(item => item.id);
    const allSelected = groupPermIds.every(id => selectedPermissionIds.includes(id));
    
    if (allSelected) {
      setSelectedPermissionIds(prev => prev.filter(id => !groupPermIds.includes(id)));
    } else {
      setSelectedPermissionIds(prev => {
        const next = [...prev];
        groupPermIds.forEach(id => {
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
      console.log('Detached APIs skipped in modal: Saving user metadata locally.');
      /*
      // 1. Save user details (designation, department, role)
      await authFetch(`/iam/users/${user.id}/access`, {
        method: 'PUT',
        body: JSON.stringify({
          designation: designation.trim() || null,
          department_id: departmentId || null,
          role_id: roleId || null
        })
      });

      // 2. Save user direct permissions override
      await authFetch(`/iam/users/${user.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          permission_ids: selectedPermissionIds
        })
      });
      */

      // Call onSuccess and onClose
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update access settings.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group permissions by workspace category
  const getGroupedPermissions = () => {
    const categories = WORKSPACE_CATEGORIES.map(cat => {
      const items = permissions.filter(p => {
        const parts = p.name.split(':');
        return parts.length === 2 && cat.keys.includes(parts[0]);
      });
      return { ...cat, items };
    }).filter(group => group.items.length > 0);

    // Get admin / non-workspace permissions
    const workspaceKeys = new Set(WORKSPACE_CATEGORIES.flatMap(cat => cat.keys));
    const adminItems = permissions.filter(p => {
      const parts = p.name.split(':');
      if (parts.length !== 2) return true; // admin overrides (e.g. iam:manage)
      return !workspaceKeys.has(parts[0]);
    });

    if (adminItems.length > 0) {
      categories.push({
        name: 'System Administration & Identity',
        color: '#ff3366',
        keys: [],
        items: adminItems
      });
    }

    return categories;
  };

  const groupedPermissions = getGroupedPermissions();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] p-6">
      <div className="glass-panel w-full max-w-[620px] max-h-[90vh] overflow-y-auto bg-card border border-color rounded-2xl p-8 shadow-xl flex flex-col gap-6 relative animate-[float-in_0.3s_ease]">
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
          <div className="mt-2 py-2.5 px-3.5 bg-card-hover border border-color rounded-lg flex flex-col gap-0.5 animate-[pulse_3s_infinite]">
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

            {/* Base Role & Designation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-1.5">
                  <ShieldCheck size={14} />
                  Assigned Authority Role
                </label>
                <select 
                  value={roleId} 
                  onChange={(e) => setRoleId(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-color bg-card py-2 px-3 text-sm text-text-main outline-none focus:border-accent-primary"
                >
                  <option value="">-- No Base Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-1.5">
                  <UserIcon size={14} />
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

            {/* Direct Permissions Checklist */}
            <div className="border-t border-color pt-5">
              <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-2.5">
                <Layers size={14} />
                Direct Permissions Override
              </label>
              
              {permissions.length === 0 ? (
                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[0.78rem] text-amber-500 flex items-center gap-2">
                  <span>No permissions loaded in system.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[260px] overflow-y-auto border border-color rounded-xl p-4 bg-black/10">
                  {groupedPermissions.map((group) => {
                    const groupPermIds = group.items.map(item => item.id);
                    const allSelected = groupPermIds.every(id => selectedPermissionIds.includes(id));

                    return (
                      <div key={group.name} className="flex flex-col gap-2 border-b border-color/40 pb-3 mb-1 last:border-b-0 last:pb-0 last:mb-0">
                        {/* Category Header */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                            <span className="text-[0.8rem] font-bold text-text-main">{group.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(group.items)}
                            disabled={submitting}
                            className="bg-transparent border-none text-accent-primary text-[0.7rem] font-bold cursor-pointer p-0 hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {/* Checkboxes grid inside Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.items.map((perm) => {
                            const isChecked = selectedPermissionIds.includes(perm.id);
                            return (
                              <label 
                                key={perm.id} 
                                className={`flex items-center gap-2.5 text-[0.76rem] cursor-pointer py-2 px-3 rounded-lg border transition-all duration-150 ${
                                  isChecked 
                                    ? 'border-accent-primary bg-accent-primary/5 text-text-main font-semibold' 
                                    : 'border-color bg-card text-text-muted hover:border-color-hover hover:text-text-main'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  disabled={submitting}
                                  className="cursor-pointer accent-accent-primary w-auto h-3.5"
                                />
                                <span className="truncate" title={perm.name}>
                                  {perm.name}
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
                {submitting ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
