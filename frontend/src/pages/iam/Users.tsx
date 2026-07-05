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
  designation: string | null;
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
        return { label: 'Tier 0 Superadmin', color: '#9d4edd', bg: 'rgba(157, 78, 221, 0.12)', border: '1px solid rgba(157, 78, 221, 0.2)' };
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
        <Loader2 className="animate-spin" size={32} />
        <span>Loading operator directory...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto p-4 relative">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#9d4edd]/8 to-[#00f2fe]/3 border border-color rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#9d4edd]/15 border border-[#9d4edd]/30 rounded-xl p-2.5 flex items-center justify-center shadow-[0_0_20px_rgba(157,78,221,0.2)]">
            <UsersIcon size={24} className="text-[#9d4edd]" />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-extrabold text-text-main font-display mb-1">
              Operator Directory & RBAC
            </h1>
            <p className="text-text-muted text-[0.85rem]">
              Provision new system users, audit clearance permissions, and assign active operational workspaces.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setProvisionModalOpen(true)} 
          className="btn btn-primary flex items-center gap-2 py-3 px-5 font-semibold"
        >
          <UserPlus size={16} />
          Provision Operator
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.88rem]">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[#ff3366] text-[0.88rem]">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operator Directory Ledger */}
      <div className="glass-panel p-0 overflow-hidden bg-main border border-color rounded-2xl shadow-lg">
        <div className="py-5 px-7 border-b border-color flex items-center justify-between bg-card-hover">
          <span className="text-[0.85rem] font-bold text-text-main tracking-wide">Operator Authority Records</span>
          <span className="text-[0.75rem] text-text-muted font-medium bg-card-hover py-1 px-3 rounded-full">{users.length} Active Profiles</span>
        </div>

        <div className="py-5 px-7 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-color text-text-muted text-[0.75rem] uppercase tracking-wider">
                <th className="py-3 px-2">Email / Login Identity</th>
                <th className="py-3 px-2">Full Name</th>
                <th className="py-3 px-2">Designation</th>
                <th className="py-3 px-2">Onboarding Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const badge = getClearanceBadge(user.role_tier);
                
                return (
                  <tr key={user.id} className="border-b border-color transition-colors duration-200 hover:bg-card-hover">
                    <td className="py-4 px-2 font-semibold text-text-main">
                      {user.email}
                    </td>
                    <td className="py-4 px-2 text-text-muted">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}` : <em className="opacity-50">Unconfigured</em>}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.85rem] font-semibold text-text-main">
                          {user.designation || <em className="opacity-50">Unassigned</em>}
                        </span>
                        <span 
                          className="text-[0.65rem] font-bold py-0.5 px-2.5 rounded border uppercase tracking-wider self-start"
                          style={{
                            color: badge.color,
                            backgroundColor: badge.bg,
                            borderColor: badge.color + '33',
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      {user.is_active ? (
                        <div className="flex items-center gap-1.5 text-[#00f5a0] text-[0.82rem] font-semibold">
                          <UserCheck size={14} />
                          Active / Claimed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#ffb703] text-[0.82rem] font-semibold">
                          <Clock size={14} />
                          Pending Invite Claim
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        onClick={() => handleSelectUser(user)}
                        className="btn btn-secondary py-1 px-3 text-[0.78rem]"
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
