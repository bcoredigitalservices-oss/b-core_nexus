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
    role_tier: number;
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
  const { token, authFetch, currentUser } = useAppContext();

  // Metadata context lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Field States
  const [roleTier, setRoleTier] = useState<number>(4);
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
    setRoleTier(user.role_tier || 4);
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
          role_tier: roleTier,
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
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          maxWidth: '600px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
      >
        {/* Modal Close "X" Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', margin: 0 }}>
            <ShieldCheck size={20} color="var(--accent-primary)" />
            Configure Access Control
          </h3>
          
          {/* Read-only Header showing user information */}
          <div style={{ marginTop: '0.5rem', padding: '10px 14px', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Independent Operator'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} />
              {user.email}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--text-muted)', gap: '1rem' }}>
            <div className="udg-spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '0.85rem' }}>Loading directory context...</span>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Clearance & Role Tier Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                  <ShieldCheck size={14} />
                  Role Tier
                </label>
                <select 
                  value={roleTier} 
                  onChange={(e) => setRoleTier(Number(e.target.value))}
                  disabled={submitting}
                >
                  <option value={0} disabled={currentUser?.role_tier > 0}>Tier 0 Superadmin</option>
                  <option value={1} disabled={currentUser?.role_tier > 1}>Tier 1 Executive</option>
                  <option value={2}>Tier 2 Manager</option>
                  <option value={3}>Tier 3 Operator</option>
                  <option value={4}>Tier 4 Auditor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
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
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
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
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px' }}>
                <Layers size={14} />
                Authorized Workspaces
              </label>
              
              {activeWorkspaces.length === 0 ? (
                <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={14} />
                  <span>No active workspaces registered. Permissions locked.</span>
                </div>
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '14px',
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }}
                >
                  {groupedWorkspaces.map((group) => {
                    const groupIds = group.items.map(item => item.id);
                    const allSelected = groupIds.every(id => selectedWorkspaceIds.includes(id));

                    return (
                      <div key={group.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px' }}>
                        {/* Category Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: group.color }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{group.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(group.items)}
                            disabled={submitting}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent-primary)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {/* Checkboxes grid inside Category */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {group.items.map((ws) => {
                            const isChecked = selectedWorkspaceIds.includes(ws.id);
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
                                  border: isChecked ? `1px solid var(--accent-primary)` : '1px solid var(--border-color)',
                                  backgroundColor: isChecked ? 'rgba(99, 91, 255, 0.05)' : 'var(--bg-card)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleWorkspace(ws.id)}
                                  disabled={submitting}
                                  style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)', width: 'auto' }}
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

            {/* Modal Actions */}
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
                {submitting ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
