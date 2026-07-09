import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon,
  Shield, 
  Settings as SettingsIcon,
  Layers, 
  Check, 
  ArrowLeft, 
  Loader2,
  Lock,
  Mail,
  Clock,
  Save,
  Key,
  Eye,
  AlertCircle,
  CheckCircle,
  FileText,
  Activity,
  Network,
  Search,
  ShieldAlert,
  DollarSign,
  FileSpreadsheet,
  CreditCard,
  Building,
  Percent,
  BarChart3,
  TrendingUp,
  PieChart,
  Briefcase,
  Package,
  Home,
  ClipboardList,
  ShoppingCart,
  Monitor,
  Users,
  Tag,
  LifeBuoy,
  Map,
  Wrench,
  Cpu,
  FolderKanban,
  CheckSquare,
  Truck,
  Receipt,
  UserCheck,
  Wallet,
  Calendar,
  Award,
  Plane,
  MessageSquare,
  Cog,
  Megaphone,
  Globe
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
}

interface PermissionItem {
  id: string;
  name: string;
}

interface UserDetailsData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  designation: string | null;
  department_id: string | null;
  is_active: boolean;
  roles: RoleItem[];
  permissions: string[];
  custom_attributes?: Record<string, any>;
}

interface GroupedPermissions {
  globalAll: PermissionItem | null;
  identity: {
    iamManage: PermissionItem | null;
    userControls: PermissionItem[];
  };
  modules: Record<string, PermissionItem[]>;
}

const MODULE_METADATA: Record<string, { label: string; icon: React.ComponentType<any>; group: string }> = {
  accounting: { label: 'Accounting', icon: DollarSign, group: 'Finance' },
  invoicing: { label: 'Invoicing', icon: FileSpreadsheet, group: 'Finance' },
  payments: { label: 'Payments', icon: CreditCard, group: 'Finance' },
  banking: { label: 'Banking', icon: Building, group: 'Finance' },
  taxes: { label: 'Taxes', icon: Percent, group: 'Finance' },
  reports: { label: 'Reports', icon: BarChart3, group: 'Finance' },
  budget: { label: 'Budget', icon: TrendingUp, group: 'Finance' },
  shares: { label: 'Shares', icon: PieChart, group: 'Finance' },
  expenses: { label: 'Expenses', icon: Receipt, group: 'Finance' },

  assets: { label: 'Assets', icon: Briefcase, group: 'Operations' },
  products: { label: 'Products', icon: Package, group: 'Operations' },
  warehouse: { label: 'Warehouse', icon: Home, group: 'Operations' },
  stock: { label: 'Stock', icon: ClipboardList, group: 'Operations' },
  buying: { label: 'Buying', icon: ShoppingCart, group: 'Operations' },
  pos: { label: 'POS', icon: Monitor, group: 'Operations' },
  manufacturing: { label: 'Manufacturing', icon: Cpu, group: 'Operations' },
  projects: { label: 'Projects', icon: FolderKanban, group: 'Operations' },
  qa: { label: 'QA', icon: CheckSquare, group: 'Operations' },
  logistics: { label: 'Logistics', icon: Truck, group: 'Operations' },
  maintenance: { label: 'Maintenance', icon: Wrench, group: 'Operations' },
  field_ops: { label: 'Field Ops', icon: Map, group: 'Operations' },

  crm: { label: 'CRM', icon: Users, group: 'CRM & Sales' },
  sales: { label: 'Sales', icon: Tag, group: 'CRM & Sales' },
  support: { label: 'Support', icon: LifeBuoy, group: 'CRM & Sales' },
  marketing: { label: 'Marketing', icon: Megaphone, group: 'CRM & Sales' },
  website: { label: 'Website', icon: Globe, group: 'CRM & Sales' },

  hr: { label: 'HR', icon: UserCheck, group: 'HR & Company' },
  payroll: { label: 'Payroll', icon: Wallet, group: 'HR & Company' },
  attendance: { label: 'Attendance', icon: Calendar, group: 'HR & Company' },
  recruitment: { label: 'Recruitment', icon: Search, group: 'HR & Company' },
  performance: { label: 'Performance', icon: Award, group: 'HR & Company' },
  leaves: { label: 'Leaves', icon: Plane, group: 'HR & Company' },
  employee_groups: { label: 'Employee Groups', icon: Users, group: 'HR & Company' },

  chats: { label: 'Chats', icon: MessageSquare, group: 'System & Communications' },
  email: { label: 'Email', icon: Mail, group: 'System & Communications' },
  message: { label: 'Message', icon: MessageSquare, group: 'System & Communications' },
  internals: { label: 'Internals', icon: SettingsIcon, group: 'System & Communications' },
  cog: { label: 'System Core (COG)', icon: Cog, group: 'System & Communications' }
};

const actionOrder = ['read', 'write', 'create', 'delete', 'print', 'email', 'export', 'share', 'report', 'import', 'mask'];

const sortPermissionsByAction = (perms: PermissionItem[]) => {
  return [...perms].sort((a, b) => {
    const actionA = a.name.split(':')[1] || '';
    const actionB = b.name.split(':')[1] || '';
    const idxA = actionOrder.indexOf(actionA);
    const idxB = actionOrder.indexOf(actionB);
    
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    
    return valA - valB;
  });
};

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { authFetch, token, currentUser } = useAppContext();

  const canToggleStatus = 
    currentUser?.permissions?.includes('*:*') || 
    currentUser?.permissions?.includes('iam:manage') ||
    currentUser?.permissions?.includes('user:write');

  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'rbac' | 'logs' | 'settings'>('details');

  // Metadata arrays
  const [allRoles, setAllRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [copyingFromUserId, setCopyingFromUserId] = useState('');

  const handleToggleStatus = async () => {
    const actionText = isActive ? "deactivate (suspend)" : "activate (restore)";
    if (confirm(`Are you sure you want to ${actionText} this user?`)) {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        await authFetch(`/iam/users/${userId}/status`, { 
          method: 'PUT',
          body: JSON.stringify({ is_active: !isActive })
        });
        setSuccessMsg(`User status successfully updated.`);
        setIsActive(!isActive);
      } catch (err: any) {
        setErrorMsg(err.message || `Failed to ${actionText} user`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Search & Filter UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('All');

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial profile context
  useEffect(() => {
    if (!token || !userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        // 1. Fetch system metadata
        const rolesList = await authFetch('/iam/roles');
        if (rolesList) setAllRoles(rolesList);

        const permsList = await authFetch('/iam/permissions');
        if (permsList) setAllPermissions(permsList);

        const deptsList = await authFetch('/iam/departments');
        if (deptsList) setDepartments(deptsList);

        // 2. Fetch User Details
        const data: UserDetailsData = await authFetch(`/iam/users/${userId}/details`);
        if (data) {
          setEmail(data.email);
          setDesignation(data.designation || '');
          setDepartmentId(data.department_id || '');
          setIsActive(data.is_active);
          setCustomNotes(data.custom_attributes?.notes || '');

          // Fallback fetch first_name and last_name from user list since details API doesn't expose them
          try {
            const allUsersList = await authFetch('/auth/users');
            if (allUsersList) setAllUsers(allUsersList);
            const matchedUser = allUsersList?.find((u: any) => String(u.id) === String(userId));
            if (matchedUser) {
              setFirstName(matchedUser.first_name || '');
              setLastName(matchedUser.last_name || '');
            } else {
              setFirstName(data.first_name || '');
              setLastName(data.last_name || '');
            }
          } catch (err) {
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
          }

          // Map base role (take first assigned role)
          if (data.roles && data.roles.length > 0) {
            setSelectedRoleId(data.roles[0].id);
          }

          // Map direct permissions
          const directPerms: PermissionItem[] = await authFetch(`/iam/users/${userId}/permissions`);
          if (directPerms) {
            setSelectedPermissionIds(directPerms.map(p => p.id));
          }
        }
      } catch (err: any) {
        console.error('Failed to load user details:', err);
        setErrorMsg(err.message || 'Error fetching user record.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, token]);

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissionIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissionIds(allPermissions.map(p => p.id));
  };

  const handleClearAllPermissions = () => {
    setSelectedPermissionIds([]);
  };

  const handleToggleModuleAll = (moduleKey: string, modulePerms: PermissionItem[]) => {
    const permIds = modulePerms.map(p => p.id);
    const allSelected = permIds.every(id => selectedPermissionIds.includes(id));
    
    if (allSelected) {
      setSelectedPermissionIds(prev => prev.filter(id => !permIds.includes(id)));
    } else {
      setSelectedPermissionIds(prev => {
        const next = [...prev];
        permIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  };

  const handleCopyPermissions = async (sourceUserId: string) => {
    if (!sourceUserId) return;
    const sourceUser = allUsers.find(u => u.id === sourceUserId);
    const sourceName = sourceUser ? (sourceUser.first_name ? `${sourceUser.first_name} ${sourceUser.last_name || ''}` : sourceUser.email) : 'selected user';
    
    if (confirm(`Are you sure you want to overwrite all permissions for this operator with the permissions of '${sourceName}'?`)) {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const res = await authFetch(`/iam/users/${userId}/copy-permissions`, {
          method: 'POST',
          body: JSON.stringify({ source_user_id: sourceUserId })
        });
        
        // Re-fetch direct permissions to update checkboxes on screen
        const directPerms = await authFetch(`/iam/users/${userId}/permissions`);
        if (directPerms) {
          setSelectedPermissionIds(directPerms.map((p: any) => p.id));
        }
        
        setSuccessMsg(res.message || 'Permissions profile duplicated successfully.');
        setCopyingFromUserId('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to copy permissions.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Save user base role
      if (selectedRoleId) {
        await authFetch(`/iam/users/${userId}/roles`, {
          method: 'PUT',
          body: JSON.stringify({
            role_id: selectedRoleId
          })
        });
      }

      // 2. Save direct permission overrides
      await authFetch(`/iam/users/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          permission_ids: selectedPermissionIds
        })
      });

      setSuccessMsg('User profile configurations updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save access profile.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to generate initials avatar background
  const getAvatarStyle = () => {
    const combined = `${firstName}${lastName}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-[#0F2E59] to-[#1e4e8c]',
      'from-[#C5A85C] to-[#d8bf7a]',
      'from-[#4A5568] to-[#718096]',
      'from-[#9d4edd] to-[#b5179e]',
      'from-[#00b4d8] to-[#0077b6]'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Parse permissions into structured groups
  const getParsedPermissions = () => {
    const parsed: GroupedPermissions = {
      globalAll: null,
      identity: {
        iamManage: null,
        userControls: []
      },
      modules: {}
    };

    allPermissions.forEach(p => {
      const name = p.name;
      if (name === '*:*') {
        parsed.globalAll = p;
      } else if (name === 'iam:manage') {
        parsed.identity.iamManage = p;
      } else if (name.startsWith('user:')) {
        parsed.identity.userControls.push(p);
      } else if (name.includes(':')) {
        const [modName] = name.split(':');
        if (!parsed.modules[modName]) {
          parsed.modules[modName] = [];
        }
        parsed.modules[modName].push(p);
      }
    });

    return parsed;
  };

  const parsed = getParsedPermissions();

  // Filter modules
  const filteredModules = Object.entries(parsed.modules).filter(([modName, perms]) => {
    const meta = MODULE_METADATA[modName] || {
      label: modName.charAt(0).toUpperCase() + modName.slice(1).replace('_', ' '),
      group: 'System & Communications'
    };
    
    const matchesSearch = 
      meta.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perms.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesTab = activeSubTab === 'All' || meta.group === activeSubTab;
    
    return matchesSearch && matchesTab;
  });

  const subTabs = [
    { id: 'All', label: 'All Modules' },
    { id: 'Finance', label: 'Finance' },
    { id: 'Operations', label: 'Operations' },
    { id: 'CRM & Sales', label: 'CRM & Sales' },
    { id: 'HR & Company', label: 'HR' },
    { id: 'System & Communications', label: 'System & Comms' }
  ];

  const renderModuleCard = (modName: string, modulePerms: PermissionItem[]) => {
    const meta = MODULE_METADATA[modName] || {
      label: modName.charAt(0).toUpperCase() + modName.slice(1).replace('_', ' '),
      icon: SettingsIcon,
      group: 'System & Communications'
    };
    
    const IconComponent = meta.icon;
    const sortedPerms = sortPermissionsByAction(modulePerms);
    
    const permIds = modulePerms.map(p => p.id);
    const isAllChecked = permIds.length > 0 && permIds.every(id => selectedPermissionIds.includes(id));
    const isSomeChecked = permIds.length > 0 && permIds.some(id => selectedPermissionIds.includes(id)) && !isAllChecked;

    return (
      <div key={modName} className="bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
        {/* Card Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-card-hover border-b border-color">
          <div className="flex items-center gap-2">
            <div className="bg-accent-primary/10 rounded-md p-1.5 flex items-center justify-center text-accent-primary">
              <IconComponent size={14} />
            </div>
            <span className="text-[0.82rem] font-bold text-text-main">{meta.label}</span>
          </div>
          
          {/* SELECT ALL toggle */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleToggleModuleAll(modName, modulePerms)}
            className={`text-[0.65rem] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
              isAllChecked
                ? 'bg-accent-primary border-accent-primary text-white'
                : 'bg-card border-color text-text-muted hover:border-accent-primary hover:text-accent-primary'
            }`}
          >
            {isAllChecked ? 'Clear All' : 'Select All'}
          </button>
        </div>
        
        {/* Card Body - Clean chip buttons grid */}
        <div className="grid grid-cols-2 gap-2 p-4">
          {sortedPerms.map((p) => {
            const action = p.name.split(':')[1] || p.name;
            const isChecked = selectedPermissionIds.includes(p.id);
            
            return (
              <button
                key={p.id}
                type="button"
                disabled={submitting}
                onClick={() => handleTogglePermission(p.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[0.75rem] font-bold uppercase tracking-wide cursor-pointer transition-all duration-150 ${
                  isChecked
                    ? 'border-accent-primary bg-accent-primary/8 text-accent-primary'
                    : 'border-color bg-card text-text-muted hover:border-accent-primary/50 hover:text-text-main'
                }`}
              >
                <span>{action}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${
                  isChecked ? 'bg-accent-primary' : 'bg-card-hover border border-color'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
        <span>Loading operator access profile...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1250px] mx-auto p-4 animate-[fadeIn_0.2s_ease]">
      
      {/* ── Page Header / Breadcrumbs & Action Bar ── */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-color pb-5">
        <div className="flex items-center gap-3">
          <Link 
            to="/users"
            className="p-2 bg-card-hover border border-color text-text-muted rounded-lg transition hover:text-text-main"
            title="Return to Directory"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2 text-[0.8rem] text-text-muted font-bold tracking-wide">
              <span>Organization</span>
              <span>/</span>
              <Link to="/users" className="hover:text-accent-primary transition">User</Link>
              <span>/</span>
              <span className="text-text-main">{firstName || email.split('@')[0]}</span>
            </div>
            <h2 className="text-[1.35rem] font-black text-text-main font-display mt-1 flex items-center gap-2.5">
              {firstName ? `${firstName} ${lastName}` : email}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              } uppercase tracking-wider`}>
                {isActive ? 'Active' : 'Suspended'}
              </span>
            </h2>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Impersonation token generation mock.")}
            className="py-2 px-4 border border-color bg-card text-text-muted text-[0.78rem] font-bold rounded-lg cursor-pointer transition hover:text-text-main"
          >
            Impersonate
          </button>
          {isActive ? (
            <button 
              onClick={handleToggleStatus}
              disabled={submitting || !canToggleStatus}
              className="py-2.5 px-4 border border-red-500/25 bg-red-500/10 text-red-400 text-[0.78rem] font-bold rounded-lg cursor-pointer transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canToggleStatus ? "Insufficient permissions" : undefined}
            >
              Deactivate Account
            </button>
          ) : (
            <button 
              onClick={handleToggleStatus}
              disabled={submitting || !canToggleStatus}
              className="py-2.5 px-4 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[0.78rem] font-bold rounded-lg cursor-pointer transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canToggleStatus ? "Insufficient permissions" : undefined}
            >
              Activate Account
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-1.5 py-2.5 px-5 bg-accent-primary text-white font-bold text-[0.8rem] rounded-lg shadow-lg shadow-accent-primary/10 hover:brightness-110 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.85rem] shadow-sm">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[0.85rem] shadow-sm">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Section: Tabs & Form Content */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-color gap-6">
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                activeTab === 'details' 
                  ? 'border-accent-primary text-text-main' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              User Details
            </button>
            <button 
              onClick={() => setActiveTab('rbac')}
              className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                activeTab === 'rbac' 
                  ? 'border-accent-primary text-text-main' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              Roles & Permissions
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                activeTab === 'logs' 
                  ? 'border-accent-primary text-text-main' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              More Information
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                activeTab === 'settings' 
                  ? 'border-accent-primary text-text-main' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Tab Content Cards */}
          <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm min-h-[300px]">
            
            {/* Tab 1: General Details */}
            {activeTab === 'details' && (
              <div className="flex flex-col gap-6 animate-[fadeIn_0.15s_ease]">
                <h3 className="text-[1rem] font-bold text-text-main border-b border-color pb-3 flex items-center gap-2">
                  <UserIcon size={16} className="text-accent-primary" />
                  Identity & Placement
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">First Name</label>
                    <input 
                      type="text" 
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Last Name</label>
                    <input 
                      type="text" 
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Finance Officer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Department Assignment</label>
                    <select 
                      value={departmentId} 
                      onChange={(e) => setDepartmentId(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary cursor-pointer"
                    >
                      <option value="">-- Unassigned (Independent Operator) --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Login Email Address (Read-Only)</label>
                  <div className="relative flex items-center">
                    <Mail size={14} className="absolute left-3.5 text-text-muted" />
                    <input 
                      type="email" 
                      disabled
                      value={email}
                      className="pl-10 w-full rounded-lg border border-color bg-card-hover py-2.5 px-3.5 text-sm text-text-muted outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Roles & Permissions */}
            {activeTab === 'rbac' && (
              <div className="flex flex-col gap-6 animate-[fadeIn_0.15s_ease]">
                <h3 className="text-[1rem] font-bold text-text-main border-b border-color pb-3 flex items-center gap-2">
                  <Shield size={16} className="text-accent-primary" />
                  Authorization clearance
                </h3>

                {/* Base Role Selector */}
                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Assigned Authority Role *</label>
                  <select 
                    value={selectedRoleId} 
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary cursor-pointer"
                  >
                    <option value="" disabled>-- Select Base Role --</option>
                    {allRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {selectedRoleId && (
                    <span className="text-[11px] text-text-muted mt-2 block leading-relaxed italic">
                      {allRoles.find(r => r.id === selectedRoleId)?.description || 'No role description registered.'}
                    </span>
                  )}
                </div>

                {/* Copy Permissions Profile Section */}
                <div className="bg-accent-primary/5 border border-accent-primary/10 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <label className="block text-[0.72rem] text-text-main font-bold uppercase tracking-wider">Duplicate Clearances Profile</label>
                    <span className="text-[10px] text-text-muted font-medium">Easily duplicate another operator's direct permission clearances to this user profile.</span>
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={copyingFromUserId}
                      onChange={(e) => setCopyingFromUserId(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-color bg-card py-2 px-3 text-xs text-text-main outline-none focus:border-accent-primary cursor-pointer h-[36px]"
                    >
                      <option value="">-- Select Operator to Copy From --</option>
                      {allUsers
                        .filter(u => String(u.id) !== String(userId))
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.first_name ? `${u.first_name} ${u.last_name || ''} (${u.email})` : u.email}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleCopyPermissions(copyingFromUserId)}
                      disabled={submitting || !copyingFromUserId}
                      className="py-2 px-4 bg-accent-primary text-white font-bold text-[0.75rem] rounded-lg shadow shadow-accent-primary/10 hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[36px] flex items-center justify-center"
                    >
                      Copy Clearances
                    </button>
                  </div>
                </div>

                {/* Identity & Directory Control Section */}
                <div className="border-t border-color pt-5 flex flex-col gap-4">
                  <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider">Identity & Directory Control</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* IAM card */}
                    {parsed.identity.iamManage && (
                      <div className="bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 bg-card-hover border-b border-color">
                          <div className="flex items-center gap-2">
                            <div className="bg-accent-primary/10 rounded-md p-1.5 text-accent-primary">
                              <Key size={14} />
                            </div>
                            <span className="text-[0.82rem] font-bold text-text-main">Directory Manager</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleTogglePermission(parsed.identity.iamManage!.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-[0.75rem] font-bold uppercase tracking-wide cursor-pointer transition-all ${
                              selectedPermissionIds.includes(parsed.identity.iamManage.id)
                                ? 'border-accent-primary bg-accent-primary/8 text-accent-primary'
                                : 'border-color bg-card text-text-muted hover:border-accent-primary/50 hover:text-text-main'
                            }`}
                          >
                            <span>IAM:MANAGE</span>
                            <span className={`w-2 h-2 rounded-full ${
                              selectedPermissionIds.includes(parsed.identity.iamManage.id) ? 'bg-accent-primary' : 'bg-card-hover border border-color'
                            }`} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* User controls card */}
                    {parsed.identity.userControls.length > 0 && (() => {
                      const uPerms = parsed.identity.userControls;
                      const allChecked = uPerms.every(p => selectedPermissionIds.includes(p.id));
                      return (
                        <div className="bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                          <div className="flex justify-between items-center px-4 py-3 bg-card-hover border-b border-color">
                            <div className="flex items-center gap-2">
                              <div className="bg-accent-primary/10 rounded-md p-1.5 text-accent-primary">
                                <Users size={14} />
                              </div>
                              <span className="text-[0.82rem] font-bold text-text-main">User Directory Controls</span>
                            </div>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => {
                                const ids = uPerms.map(p => p.id);
                                if (allChecked) {
                                  setSelectedPermissionIds(prev => prev.filter(id => !ids.includes(id)));
                                } else {
                                  setSelectedPermissionIds(prev => [...Array.from(new Set([...prev, ...ids]))]);
                                }
                              }}
                              className={`text-[0.65rem] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
                                allChecked
                                  ? 'bg-accent-primary border-accent-primary text-white'
                                  : 'bg-card border-color text-text-muted hover:border-accent-primary hover:text-accent-primary'
                              }`}
                            >
                              {allChecked ? 'Clear All' : 'Select All'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 p-4">
                            {sortPermissionsByAction(uPerms).map((p) => {
                              const action = p.name.split(':')[1] || p.name;
                              const isChecked = selectedPermissionIds.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleTogglePermission(p.id)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[0.75rem] font-bold uppercase tracking-wide cursor-pointer transition-all ${
                                    isChecked
                                      ? 'border-accent-primary bg-accent-primary/8 text-accent-primary'
                                      : 'border-color bg-card text-text-muted hover:border-accent-primary/50 hover:text-text-main'
                                  }`}
                                >
                                  <span>{action}</span>
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${
                                    isChecked ? 'bg-accent-primary' : 'bg-card-hover border border-color'
                                  }`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* General Clearances Section */}
                <div className="border-t border-color pt-5 flex flex-col gap-5">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider mb-0">Granular Direct Overrides</label>
                      <span className="text-[11px] text-text-muted font-medium">Assign specific workspace clearances directly as user-level overrides.</span>
                    </div>
                    
                    {/* Select/Clear All */}
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="bg-transparent border-none text-accent-primary text-[0.75rem] font-bold cursor-pointer hover:underline p-0"
                      >
                        Grant All Overrides
                      </button>
                      <span className="text-text-muted/30 text-[0.75rem] select-none">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        className="bg-transparent border-none text-text-muted text-[0.75rem] font-bold cursor-pointer hover:underline p-0"
                      >
                        Clear All Overrides
                      </button>
                    </div>
                  </div>

                  {/* 1. Global All (*:*) override banner */}
                  {parsed.globalAll && (
                    <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                      selectedPermissionIds.includes(parsed.globalAll.id)
                        ? 'border-[#C5A85C] bg-[#C5A85C]/5 shadow-sm'
                        : 'border-color bg-card hover:border-[#C5A85C]/40'
                    }`}>
                      <div className="flex items-center justify-between border-b border-color/40 pb-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className={`w-4 h-4 ${selectedPermissionIds.includes(parsed.globalAll.id) ? 'text-[#C5A85C]' : 'text-text-muted'}`} />
                          <span className="text-[0.88rem] font-bold text-text-main font-display">Global Access Override</span>
                        </div>
                        
                        <span className="text-[10px] bg-[#C5A85C]/10 border border-[#C5A85C]/20 text-[#C5A85C] font-semibold py-0.5 px-2 rounded-full uppercase tracking-wider">Super Clearance</span>
                      </div>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleTogglePermission(parsed.globalAll!.id)}
                        className="flex items-center justify-between gap-4 py-1.5 w-full text-left cursor-pointer select-none"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-text-main text-[0.85rem]">Grant Super Clearance — All Access</span>
                          <span className="text-[11px] text-text-muted font-medium mt-0.5">Enabling this grants full administrative and operational authorization across all workspaces and features, bypassing fine-grained checks.</span>
                        </div>
                        {/* Toggle Switch */}
                        <div className={`relative w-11 h-6 rounded-full border transition-all duration-200 flex-shrink-0 ${
                          selectedPermissionIds.includes(parsed.globalAll.id)
                            ? 'bg-[#C5A85C] border-[#C5A85C]'
                            : 'bg-card-hover border-color'
                        }`}>
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                            selectedPermissionIds.includes(parsed.globalAll.id) ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Search & Domain Filter Bar */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/5 p-4 rounded-2xl border border-color/30">
                    {/* Category Pills/Tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                      {subTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveSubTab(tab.id)}
                          className={`py-1.5 px-3 rounded-lg text-[0.72rem] font-bold cursor-pointer transition-all border ${
                            activeSubTab === tab.id
                              ? 'bg-accent-primary border-accent-primary text-white shadow-sm'
                              : 'bg-card border-color text-text-muted hover:text-text-main hover:bg-card-hover'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-[260px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Search overrides..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card border border-color rounded-xl text-xs text-text-main placeholder-text-muted/65 outline-none focus:border-accent-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Module cards grid */}
                  {filteredModules.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {filteredModules.map(([modName, perms]) => renderModuleCard(modName, perms))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-card border border-color rounded-2xl text-center text-text-muted gap-2 min-h-[160px]">
                      <Search className="w-8 h-8 opacity-30 text-accent-primary" />
                      <span className="font-semibold text-xs text-text-main">No modules match your filter</span>
                      <span className="text-[10px] text-text-muted">Try adjusting your search query or selecting a different tab.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: More Information */}
            {activeTab === 'logs' && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                <h3 className="text-[1rem] font-bold text-text-main border-b border-color pb-3 flex items-center gap-2">
                  <FileText size={16} className="text-accent-primary" />
                  Additional Metadata
                </h3>

                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Internal Administrator Notes</label>
                  <textarea 
                    rows={6}
                    placeholder="Enter custom operator specifications, notes, or operational clearances notes..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Settings */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6 animate-[fadeIn_0.15s_ease]">
                <h3 className="text-[1rem] font-bold text-text-main border-b border-color pb-3 flex items-center gap-2">
                  <SettingsIcon size={16} className="text-accent-primary" />
                  Profile Configuration Preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-color rounded-lg bg-card-hover/20">
                    <span className="text-[0.75rem] font-bold text-text-main block mb-1">MFA Security Settings</span>
                    <p className="text-[0.7rem] text-text-muted mb-3 leading-relaxed">
                      Toggle whether Two-Factor Authentication is currently enforced for this operator.
                    </p>
                    <button 
                      type="button"
                      onClick={() => alert("MFA state modification is locked to user account ownership settings.")}
                      className="py-1.5 px-3 border border-color text-text-muted text-[0.72rem] font-bold rounded bg-card hover:text-text-main cursor-pointer"
                    >
                      Audit MFA Configuration
                    </button>
                  </div>

                  <div className="p-4 border border-color rounded-lg bg-card-hover/20">
                    <span className="text-[0.75rem] font-bold text-text-main block mb-1">Credentials Control</span>
                    <p className="text-[0.7rem] text-text-muted mb-3 leading-relaxed">
                      Force password rotation or generate a secure credentials reset token link.
                    </p>
                    <button 
                      type="button"
                      onClick={() => alert("Credentials reset request dispatched to console log Dispatched.")}
                      className="py-1.5 px-3 border border-color text-text-muted text-[0.72rem] font-bold rounded bg-card hover:text-text-main cursor-pointer"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Mock Connections Block matching Screenshot */}
          <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-5">
            <h3 className="text-[0.82rem] font-bold text-text-main tracking-wider uppercase border-b border-color pb-3">Connections Grid (References)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2 p-3 bg-black/5 border border-color rounded-lg">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase">Profile</span>
                <div className="flex justify-between items-center text-xs font-semibold text-text-main">
                  <span>Contact Card</span>
                  <span className="w-5 h-5 rounded bg-card flex items-center justify-center text-[10px] border border-color cursor-pointer hover:bg-card-hover">+</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-black/5 border border-color rounded-lg">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase">Activity Logs</span>
                <div className="flex justify-between items-center text-xs font-semibold text-text-main">
                  <span>Route history log</span>
                  <span className="text-[10px] text-text-muted bg-card px-1.5 py-0.5 rounded border border-color font-mono">99+</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-black/5 border border-color rounded-lg">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase">Settings</span>
                <div className="flex justify-between items-center text-xs font-semibold text-text-main">
                  <span>User Permission 1</span>
                  <span className="w-5 h-5 rounded bg-card flex items-center justify-center text-[10px] border border-color cursor-pointer hover:bg-card-hover">+</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Section: Sidebar Avatar and Checklist */}
        <div className="flex flex-col gap-6">
          
          {/* User Bio Card */}
          <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm flex flex-col items-center text-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarStyle()} flex items-center justify-center text-white font-bold text-2xl shadow`}>
              {firstName ? `${firstName[0].toUpperCase()}${lastName ? lastName[0].toUpperCase() : ''}` : email[0].toUpperCase()}
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-main leading-tight">{firstName ? `${firstName} ${lastName}` : 'System User'}</span>
              <span className="text-[11px] text-text-muted leading-relaxed mt-0.5">{email}</span>
            </div>

            <div className="w-full border-t border-color pt-4 flex flex-col gap-3.5 text-left text-xs font-semibold text-text-main">
              <div className="flex justify-between items-center cursor-pointer hover:text-accent-primary transition">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                  Assign Tasks
                </span>
                <span className="text-[10px] border border-color rounded px-1 text-text-muted font-bold bg-card">+</span>
              </div>
              <div className="flex justify-between items-center cursor-pointer hover:text-accent-primary transition">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Attachments
                </span>
                <span className="text-[10px] border border-color rounded px-1 text-text-muted font-bold bg-card">+</span>
              </div>
              <div className="flex justify-between items-center cursor-pointer hover:text-accent-primary transition">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                  Tags / Groups
                </span>
                <span className="text-[10px] border border-color rounded px-1 text-text-muted font-bold bg-card">+</span>
              </div>
            </div>
          </div>

          {/* Audit Telemetry Card */}
          <div className="glass-panel p-5 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-3.5 text-xs text-text-muted">
            <span className="font-bold text-[0.7rem] text-text-main uppercase tracking-wider border-b border-color pb-2">Audit Telemetry</span>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted">Last Profile Update</span>
              <span className="font-semibold text-text-main flex items-center gap-1.5 mt-0.5">
                <Clock size={12} />
                Just recently
              </span>
            </div>
            <div className="flex flex-col gap-1 border-t border-color pt-3">
              <span className="text-[10px] text-text-muted">Account Registered</span>
              <span className="font-semibold text-text-main flex items-center gap-1.5 mt-0.5">
                <Clock size={12} />
                Over a week ago
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
