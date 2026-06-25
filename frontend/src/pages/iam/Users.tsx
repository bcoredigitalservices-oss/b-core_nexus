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
import EditUserAccessModal from '../../components/iam/EditUserAccessModal';

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
  workspaces?: string[];
}

interface DepartmentItem {
  id: string;
  name: string;
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

export default function Users() {
  const { token, authFetch } = useAppContext();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Standard roles from ERPNext style
  // Modal State
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

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

  // Open Edit access modal for selected user
  const handleSelectUser = (user: UserItem) => {
    setSelectedUser(user);
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

      {/* ── Edit User Access Modal ── */}
      <EditUserAccessModal 
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSuccess={() => {
          setSelectedUser(null);
          loadDirectoryData();
        }}
      />

    </div>
  );
}
