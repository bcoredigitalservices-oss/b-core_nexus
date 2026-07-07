import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Layers,
  Search,
  SlidersHorizontal,
  Lock,
  RefreshCw,
  Sliders
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
  designation: string | null;
  is_active: boolean;
  department_id: string | null;
  functional_roles?: string[];
  workspaces?: string[];
  permissions?: string[];
}

interface DepartmentItem {
  id: string;
  name: string;
}

export default function Users() {
  const navigate = useNavigate();
  const { token, authFetch, currentUser } = useAppContext();

  const canProvision = 
    currentUser?.permissions?.includes('*:*') || 
    currentUser?.permissions?.includes('iam:manage') ||
    currentUser?.permissions?.includes('user:invite');
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState('all'); // 'all' | 'active' | 'pending'

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

  const getClearanceBadge = (permissions: string[] = []) => {
    if (permissions.includes('*:*')) {
      return { label: 'System Admin', color: '#9d4edd', bg: 'rgba(157, 78, 221, 0.08)', border: '1px solid rgba(157, 78, 221, 0.2)' };
    }
    if (permissions.includes('iam:manage')) {
      return { label: 'IAM Executive', color: '#e63946', bg: 'rgba(230, 57, 70, 0.08)', border: '1px solid rgba(230, 57, 70, 0.2)' };
    }
    if (permissions.includes('system:admin') || permissions.includes('system:write')) {
      return { label: 'System Manager', color: '#00b4d8', bg: 'rgba(0, 180, 216, 0.08)', border: '1px solid rgba(0, 180, 216, 0.2)' };
    }
    return { label: 'Operator', color: 'var(--text-muted)', bg: 'rgba(142, 139, 130, 0.06)', border: '1px solid rgba(142, 139, 130, 0.15)' };
  };

  // Helper to generate initials avatar background
  const getAvatarStyle = (firstName: string | null, lastName: string | null) => {
    const combined = `${firstName || ''}${lastName || ''}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-[#0F2E59] to-[#1e4e8c]',
      'from-[#C5A85C] to-[#d8bf7a]',
      'from-[#4A5568] to-[#718096]',
      'from-[#9d4edd] to-[#b5179e]',
      'from-[#00b4d8] to-[#0077b6]',
      'from-[#e63946] to-[#d90429]'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName) {
      return `${firstName[0].toUpperCase()}${lastName ? lastName[0].toUpperCase() : ''}`;
    }
    return email[0].toUpperCase();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchId('');
    setSearchName('');
    setSearchEmail('');
    setSearchStatus('all');
  };

  // Compute live filtered users
  const filteredUsers = users.filter(user => {
    if (searchId.trim()) {
      const matchId = searchId.trim().toLowerCase();
      if (!user.id.toLowerCase().includes(matchId)) return false;
    }
    if (searchName.trim()) {
      const matchName = searchName.trim().toLowerCase();
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      if (!fullName.includes(matchName)) return false;
    }
    if (searchEmail.trim()) {
      const matchEmail = searchEmail.trim().toLowerCase();
      if (!user.email.toLowerCase().includes(matchEmail)) return false;
    }
    if (searchStatus !== 'all') {
      if (searchStatus === 'active' && !user.is_active) return false;
      if (searchStatus === 'pending' && user.is_active) return false;
    }
    return true;
  });

  // Calculate dynamic metrics
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.is_active).length;
  const systemUsersCount = users.filter(u => u.permissions?.includes('*:*') || u.permissions?.includes('iam:manage')).length;
  const lockedUsersCount = users.filter(u => !u.is_active).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
        <span className="font-semibold text-sm">Loading operator directory database...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1250px] mx-auto p-4 relative animate-[fadeIn_0.3s_ease]">
      
      {/* ── Governance Header & Banner ── */}
      <div className="bg-gradient-to-r from-[#0F2E59] to-[#1a3f73] border border-[var(--border-color)] rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-4.5 z-10">
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-center shadow-lg">
            <UsersIcon size={24} className="text-[#C5A85C]" />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-black text-white font-display mb-1 flex items-center gap-2">
              User Governance Control
            </h1>
            <p className="text-white/80 text-[0.82rem] font-medium max-w-[550px] leading-relaxed">
              Manage institutional access, roles, and security permissions across the entire Bcore Nexus ecosystem.
            </p>
          </div>
        </div>

        {canProvision && (
          <button 
            onClick={() => setProvisionModalOpen(true)} 
            className="bg-[#C5A85C] text-[#0F2E59] hover:brightness-110 font-bold flex items-center gap-2 py-3 px-5 rounded-xl border border-transparent shadow-lg shadow-[#C5A85C]/10 transition-all duration-200 z-10 cursor-pointer"
          >
            <UserPlus size={16} />
            Provision Operator
          </button>
        )}
      </div>

      {successMsg && (
        <div className="flex flex-col gap-1 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.88rem] shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>
              {successMsg.includes('Click activate link') ? (
                <>
                  Operator provisioned successfully.{' '}
                  <a 
                    href={successMsg.split(': ')[1]} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="underline font-bold text-[#C5A85C] hover:brightness-110 ml-1 inline-flex items-center gap-1"
                  >
                    Activate / Onboard Profile Link
                  </a>
                </>
              ) : (
                successMsg
              )}
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[0.88rem] shadow-sm">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Dynamic Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Users */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Total Users</span>
            <span className="text-2xl font-black text-text-main leading-none">{totalUsersCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-0.5">
              +12% <span className="text-text-muted font-normal">vs last month</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-primary/5 border border-accent-primary/10 flex items-center justify-center text-accent-primary">
            <UsersIcon size={18} />
          </div>
        </div>

        {/* Active Now */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Active Now</span>
            <span className="text-2xl font-black text-text-main leading-none">{activeUsersCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1">Stable</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500">
            <UserCheck size={18} />
          </div>
        </div>

        {/* System Users */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">System Users</span>
            <span className="text-2xl font-black text-text-main leading-none">{systemUsersCount}</span>
            <span className="text-[10px] text-accent-purple font-semibold mt-1">Managed</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-purple/5 border border-accent-purple/10 flex items-center justify-center text-accent-purple">
            <Cpu size={18} />
          </div>
        </div>

        {/* Locked / Pending */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Pending Invites</span>
            <span className="text-2xl font-black text-text-main leading-none">{lockedUsersCount}</span>
            <span className="text-[10px] text-amber-500 font-semibold mt-1">Pending Claim</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock size={18} />
          </div>
        </div>

      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="glass-panel p-5 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-color text-text-main text-[0.8rem] font-bold uppercase tracking-wider">
          <SlidersHorizontal size={14} className="text-accent-primary" />
          Filter Operators ledger
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">Operator ID</label>
            <input 
              type="text"
              placeholder="e.g. 550e8400..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              type="text"
              placeholder="Search names..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="text"
              placeholder="Search emails..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">User Type</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active / Claimed</option>
              <option value="pending">Pending Claim</option>
            </select>
          </div>
        </div>

        {(searchId || searchName || searchEmail || searchStatus !== 'all') && (
          <div className="flex justify-end mt-1">
            <button 
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-card-hover border border-color text-text-muted text-[0.75rem] font-bold rounded-lg cursor-pointer transition hover:text-text-main"
            >
              <RefreshCw size={12} />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* ── Operator Ledger Table ── */}
      <div className="glass-panel p-0 overflow-hidden bg-card border border-color rounded-2xl shadow-sm">
        <div className="py-5 px-7 border-b border-color flex items-center justify-between bg-card-hover">
          <span className="text-[0.8rem] font-bold text-text-main tracking-wider uppercase">Operator Governance Directory</span>
          <span className="text-[0.7rem] text-text-muted font-bold bg-card py-1 px-3 rounded-full border border-color">
            {filteredUsers.length} matching profile{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.85rem]">
            <thead>
              <tr className="border-b border-color text-text-muted text-[0.7rem] uppercase tracking-wider bg-card-hover font-bold">
                <th className="py-4 px-6 w-[280px]">Full Name / Identity</th>
                <th className="py-4 px-4 w-[140px]">Status</th>
                <th className="py-4 px-4 w-[180px]">Clearance Level</th>
                <th className="py-4 px-4 w-[280px]">Operator ID</th>
                <th className="py-4 px-4">Email Address</th>
                <th className="py-4 px-6 text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Sliders size={28} className="text-text-muted opacity-50" />
                      <span className="text-sm font-semibold">No operators found matching the criteria.</span>
                      {(searchId || searchName || searchEmail || searchStatus !== 'all') && (
                        <button 
                          onClick={handleClearFilters}
                          className="mt-1 py-1.5 px-4 bg-accent-primary text-white font-semibold rounded-lg text-xs cursor-pointer shadow hover:brightness-110"
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const badge = getClearanceBadge(user.permissions);
                  const isUserActive = user.is_active;

                  return (
                    <tr key={user.id} className="border-b border-color transition-colors duration-150 hover:bg-card-hover/40">
                      
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarStyle(user.first_name, user.last_name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                            {getInitials(user.first_name, user.last_name, user.email)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-main text-[0.88rem]">
                              {user.first_name ? `${user.first_name} ${user.last_name || ''}` : <em className="opacity-50 font-normal">Unconfigured Profile</em>}
                            </span>
                            <span className="text-[11px] text-text-muted leading-none mt-0.5">
                              {user.designation || 'Operational Staff'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isUserActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/15 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending Claim
                          </span>
                        )}
                      </td>

                      {/* Clearance Level */}
                      <td className="py-4 px-4">
                        <span 
                          className="text-[10px] font-bold py-1 px-2.5 rounded border uppercase tracking-wider inline-block text-center"
                          style={{
                            color: badge.color,
                            backgroundColor: badge.bg,
                            borderColor: badge.color + '26',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Operator UUID */}
                      <td className="py-4 px-4 font-mono text-[11px] text-text-muted select-all">
                        {user.id}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-text-muted font-medium">
                        {user.email}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="py-1.5 px-3.5 bg-card hover:bg-card-hover border border-color text-text-main text-[0.78rem] font-bold rounded-lg cursor-pointer transition shadow-sm"
                        >
                          Configure Access
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Provision Operator Modal ── */}
      <ProvisionUserModal 
        isOpen={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        onSuccess={(data?: any) => {
          setProvisionModalOpen(false);
          loadDirectoryData();
          if (data?.onboarding_url) {
            setSuccessMsg(`Operator provisioned. Click activate link for local testing: ${data.onboarding_url}`);
          } else {
            setSuccessMsg('Operator invitation generated and dispatched.');
          }
        }}
      />

    </div>
  );
}
