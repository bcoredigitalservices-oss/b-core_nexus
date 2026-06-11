import React, { useEffect, useState } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  X, 
  Cpu, 
  ShieldCheck, 
  Mail, 
  UserCheck, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProvisionUserModal from '../../components/iam/ProvisionUserModal';

interface WorkspaceItem {
  id: string;
  name: string;
  identifier: string;
  status: string;
}

interface UserItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_tier: number;
  clearance_level: number;
  is_active: boolean;
  department_id: string | null;
  functional_roles?: string[];
  workspaces?: { id: string }[];
}

interface DepartmentItem {
  id: string;
  name: string;
}

export default function Users() {
  const { token, authFetch } = useAppContext();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Standard roles from ERPNext style
  const standardRoles = ["System Manager", "Accounts Manager", "Sales Manager", "HR Manager", "Inventory Manager", "Project Manager"];

  // Modal & Drawer State
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Edit states inside Drawer
  const [editClearance, setEditClearance] = useState<number>(4);
  const [editWorkspaces, setEditWorkspaces] = useState<string[]>([]);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editDepartmentId, setEditDepartmentId] = useState<string>('');
  const [savingAccess, setSavingAccess] = useState(false);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Users & Workspaces
  const loadDirectoryData = async () => {
    try {
      const usersData = await authFetch('/auth/users');
      if (usersData) {
        setUsers(usersData);
      }

      const workspacesData = await authFetch('/iam/workspaces');
      if (workspacesData) {
        setWorkspaces(workspacesData);
      }

      const departmentsData = await authFetch('/iam/departments');
      if (departmentsData) {
        setDepartments(departmentsData);
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
      setErrorMsg('Failed to fetch the operator directory database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDirectoryData();
    }
  }, [token]);

  // Open Edit access drawer for selected user
  const handleSelectUser = async (user: UserItem) => {
    setSelectedUser(user);
    setEditClearance(user.clearance_level || user.role_tier || 4);
    
    // Fetch detailed user profile to extract workspace relationship keys
    // In our backend, User has workspaces relationship loaded. Let's extract their IDs.
    // If not directly in user, we query /users/{id}/access or use the workspaces field.
    // Let's call our update/get endpoint or extract from list if returned.
    try {
      setSavingAccess(true);
      // Let's resolve the assigned workspaces. We can fetch user access via list or GET if exists, 
      // but let's check: our list_users in auth router might return them. 
      // In case it doesn't, let's load what workspaces are linked to user.
      // We can also fetch via updating the workspaces edit state.
      // Let's extract workspaces if present:
      const assignedIds = user.workspaces ? user.workspaces.map(w => w.id) : [];
      
      // Let's query to make sure we have the latest.
      // If we don't have a direct get user endpoint, we can use the list items since we update them atomically.
      // Let's search if the user workspaces list was returned:
      // Let's assume list returns a workspaces list or we fallback:
      setEditWorkspaces(user.workspaces ? user.workspaces.map(w => w.id) : []);
      setEditRoles(user.functional_roles || []);
      setEditDepartmentId(user.department_id || '');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAccess(false);
      setDrawerOpen(true);
    }
  };

  // Toggle workspace assignment in edit array
  const handleToggleEditWorkspace = (wsId: string) => {
    setEditWorkspaces(prev => 
      prev.includes(wsId) ? prev.filter(id => id !== wsId) : [...prev, wsId]
    );
  };

  const handleToggleEditRole = (role: string) => {
    setEditRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Save changes to User Clearance & Workspace assignments
  const handleSaveAccess = async () => {
    if (!selectedUser) return;
    setSavingAccess(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/iam/users/${selectedUser.id}/access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          clearance_level: editClearance,
          role_tier: editClearance,
          workspace_ids: editWorkspaces,
          functional_roles: editRoles,
          department_id: editDepartmentId === '' ? null : editDepartmentId
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to update user access control.');
      }

      setSuccessMsg(`Access controls updated for ${selectedUser.email}.`);
      await loadDirectoryData();
      
      // Update local state to reflect changes in UI
      const updatedUserRes = await res.json();
      const updatedList = users.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            clearance_level: updatedUserRes.clearance_level,
            role_tier: updatedUserRes.role_tier,
            workspaces: editWorkspaces.map(id => ({ id })),
            functional_roles: editRoles,
            department_id: editDepartmentId === '' ? null : editDepartmentId
          };
        }
        return u;
      });
      setUsers(updatedList);

      setTimeout(() => {
        setDrawerOpen(false);
        setSelectedUser(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving modifications.');
    } finally {
      setSavingAccess(false);
    }
  };

  const getClearanceBadge = (level: number) => {
    switch(level) {
      case 0:
      case 1:
        return { label: 'Tier 1 Executive', color: '#ff3366', bg: 'rgba(255, 51, 102, 0.12)', border: '1px solid rgba(255, 51, 102, 0.2)' };
      case 2:
        return { label: 'Tier 2 Manager', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.2)' };
      case 3:
        return { label: 'Tier 3 Operator', color: '#ffb703', bg: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.2)' };
      case 4:
      default:
        return { label: 'Tier 4 Viewer', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.15)' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)', gap: '1rem' }}>
        <Loader2 className="udg-spinner" size={32} />
        <span>Loading operator directory...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 242, 254, 0.03) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              background: 'rgba(157, 78, 221, 0.15)',
              border: '1px solid rgba(157, 78, 221, 0.3)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UsersIcon size={24} color="#9d4edd" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: 'var(--font-display)' }}>
              Operator Directory & RBAC
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Provision new system users, audit clearance permissions, and assign active operational workspaces.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setProvisionModalOpen(true)} 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={16} />
          Provision Operator
        </button>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', backgroundColor: 'rgba(0, 245, 160, 0.1)', border: '1px solid rgba(0, 245, 160, 0.2)', borderRadius: '12px', color: '#00f5a0', fontSize: '0.88rem' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '12px', color: '#ff3366', fontSize: '0.88rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operator Directory Ledger */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
        <div 
          style={{ 
            padding: '1.25rem 1.75rem', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Operator Authority Records</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{users.length} Active Profiles</span>
        </div>

        <div style={{ padding: '1.25rem 1.75rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email / Login Identity</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clearance Level</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarding Status</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const badge = getClearanceBadge(user.clearance_level || user.role_tier);
                
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}` : <em style={{ opacity: 0.5 }}>Unconfigured</em>}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span 
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: badge.border,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {user.is_active ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5a0', fontSize: '0.82rem', fontWeight: 600 }}>
                          <UserCheck size={14} />
                          Active / Claimed
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffb703', fontSize: '0.82rem', fontWeight: 600 }}>
                          <Clock size={14} />
                          Pending Invite Claim
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleSelectUser(user)}
                        className="btn btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        Configure Access
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Provision Operator Modal ── */}
      <ProvisionUserModal 
        isOpen={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        onSuccess={() => {
          setProvisionModalOpen(false);
          loadDirectoryData();
        }}
      />

      {/* ── Sliding Side-Drawer for RBAC Access ── */}
      {drawerOpen && selectedUser && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 13, 26, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 900,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => {
            if (!savingAccess) {
              setDrawerOpen(false);
              setSelectedUser(null);
            }
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              backgroundColor: 'var(--bg-main)',
              borderLeft: '1px solid var(--border-color)',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing drawer on clicks inside
          >
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setDrawerOpen(false);
                setSelectedUser(null);
              }}
              disabled={savingAccess}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
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

            {/* Profile Summary */}
            <div>
              <div 
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(157, 78, 221, 0.15)',
                  border: '1px solid rgba(157, 78, 221, 0.3)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  marginBottom: '1rem'
                }}
              >
                {selectedUser.email[0].toUpperCase()}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name || ''}` : 'Independent Operator'}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Mail size={14} />
                <span>{selectedUser.email}</span>
              </div>
            </div>

            {/* Error Message inside drawer */}
            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', color: '#ff3366', fontSize: '0.82rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Section 1: Clearance Level */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <ShieldCheck size={16} color="#9d4edd" />
                Clearance Level Authorization
              </label>
              <select 
                value={editClearance} 
                onChange={(e) => setEditClearance(Number(e.target.value))}
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

            {/* Form Section: Department */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <UsersIcon size={16} color="#ffb703" />
                Assigned Department
              </label>
              <select 
                value={editDepartmentId} 
                onChange={(e) => setEditDepartmentId(e.target.value)}
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
                <option value="">-- No Department Assigned --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Form Section: Functional Roles */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '200px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <Cpu size={16} color="#ff3366" />
                Functional Roles (Permission Profiles)
              </label>
              
              <div 
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'var(--bg-input)'
                }}
              >
                {standardRoles.map((role) => {
                  const hasAccess = editRoles.includes(role);

                  return (
                    <div 
                      key={role}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: hasAccess ? 'rgba(255, 51, 102, 0.05)' : 'transparent',
                        border: hasAccess ? '1px solid rgba(255, 51, 102, 0.15)' : '1px solid transparent',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: hasAccess ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {role}
                      </span>
                      <button
                        onClick={() => handleToggleEditRole(role)}
                        style={{
                          backgroundColor: hasAccess ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: hasAccess ? '1px solid #ff3366' : '1px solid rgba(255,255,255,0.08)',
                          color: hasAccess ? '#ff3366' : 'var(--text-muted)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        {hasAccess ? 'Revoke' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Section 2: Workspace Authorization Toggles */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <Layers size={16} color="#00f2fe" />
                Workspace Permissions Access Scope
              </label>
              
              <div 
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'var(--bg-input)'
                }}
              >
                {workspaces.map((ws) => {
                  const hasAccess = editWorkspaces.includes(ws.id);
                  const isWorkspaceActive = ws.status === 'Active';

                  return (
                    <div 
                      key={ws.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: hasAccess ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                        border: hasAccess ? '1px solid rgba(0, 242, 254, 0.15)' : '1px solid transparent',
                        opacity: isWorkspaceActive ? 1 : 0.5
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: hasAccess ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {ws.name}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          ID: {ws.identifier} ({ws.status})
                        </span>
                      </div>

                      {/* Active switch */}
                      <button
                        onClick={() => handleToggleEditWorkspace(ws.id)}
                        disabled={!isWorkspaceActive}
                        style={{
                          backgroundColor: hasAccess ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: hasAccess ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.08)',
                          color: hasAccess ? '#00f2fe' : 'var(--text-muted)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: isWorkspaceActive ? 'pointer' : 'not-allowed',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        {hasAccess ? 'Revoke' : 'Authorize'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Save Button */}
            <button 
              onClick={handleSaveAccess}
              disabled={savingAccess}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {savingAccess ? (
                <>
                  <Loader2 size={16} className="udg-spinner" />
                  Saving updates...
                </>
              ) : (
                'Commit Access Changes'
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
