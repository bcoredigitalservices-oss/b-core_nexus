import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  Lock, 
  Check, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  ShieldCheck,
  FileText,
  Sliders,
  RefreshCw,
  Search,
  // Module Icons
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
  Mail,
  Megaphone,
  Globe,
  Settings,
  Cog,
  Key,
  ShieldAlert
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
  internals: { label: 'Internals', icon: Settings, group: 'System & Communications' },
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

export default function Roles() {
  const { authFetch, token } = useAppContext();

  // Data states
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // New role inputs
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const fetchedRoles = await authFetch('/iam/roles');
      if (fetchedRoles) {
        setRoles(fetchedRoles);
        // Default select first role if available
        if (fetchedRoles.length > 0 && !selectedRole) {
          setSelectedRole(fetchedRoles[0]);
        }
      }

      const fetchedPerms = await authFetch('/iam/permissions');
      if (fetchedPerms) {
        setPermissions(fetchedPerms);
      }
    } catch (err: any) {
      console.error('Failed to load roles/permissions:', err);
      setErrorMsg('Failed to load system roles database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Load permissions for selected role
  useEffect(() => {
    if (!selectedRole || !token) return;

    const loadRolePermissions = async () => {
      try {
        setErrorMsg('');
        console.log('Detached API skipped: GET role permissions.');
        setSelectedRolePermissions([]); // local stub
        
        // Populate inputs
        setRoleName(selectedRole.name);
        setRoleDescription(selectedRole.description || '');
        setIsCreating(false);
      } catch (err: any) {
        console.error('Failed to load role permissions:', err);
        setErrorMsg('Failed to load permissions for the selected role.');
      }
    };

    loadRolePermissions();
  }, [selectedRole, token]);

  const handleTogglePermission = (permId: string) => {
    setSelectedRolePermissions(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRolePermissions(permissions.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedRolePermissions([]);
  };

  const handleToggleModuleAll = (moduleKey: string, modulePerms: PermissionItem[]) => {
    const permIds = modulePerms.map(p => p.id);
    const allSelected = permIds.every(id => selectedRolePermissions.includes(id));
    
    if (allSelected) {
      setSelectedRolePermissions(prev => prev.filter(id => !permIds.includes(id)));
    } else {
      setSelectedRolePermissions(prev => {
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

  // Create new role
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const created: RoleItem = await authFetch('/iam/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null
        })
      });

      if (created) {
        setSuccessMsg(`Role '${created.name}' created successfully.`);
        const fetchedRoles = await authFetch('/iam/roles');
        if (fetchedRoles) {
          setRoles(fetchedRoles);
          const found = fetchedRoles.find((r: RoleItem) => r.name === created.name);
          if (found) setSelectedRole(found);
        }
        
        setNewRoleName('');
        setNewRoleDescription('');
        setIsCreating(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create new role.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save changes to existing role (metadata + permissions)
  const handleSaveRoleSettings = async () => {
    if (!selectedRole) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await authFetch(`/iam/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDescription.trim() || null
        })
      });

      console.log('Detached API skipped: PUT role permissions.');
      /*
      await authFetch(`/iam/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          permission_ids: selectedRolePermissions
        })
      });
      */

      setSuccessMsg(`Role settings for '${roleName}' saved successfully (Local Simulation).`);
      
      const fetchedRoles = await authFetch('/iam/roles');
      if (fetchedRoles) {
        setRoles(fetchedRoles);
        const updated = fetchedRoles.find((r: RoleItem) => r.id === selectedRole.id);
        if (updated) setSelectedRole(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role permissions.');
    } finally {
      setSubmitting(false);
    }
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

    permissions.forEach(p => {
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
      
    const matchesTab = activeTab === 'All' || meta.group === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const tabs = [
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
      icon: Settings,
      group: 'System & Communications'
    };
    
    const IconComponent = meta.icon;
    const sortedPerms = sortPermissionsByAction(modulePerms);
    
    const permIds = modulePerms.map(p => p.id);
    const isAllChecked = permIds.length > 0 && permIds.every(id => selectedRolePermissions.includes(id));
    const isSomeChecked = permIds.length > 0 && permIds.some(id => selectedRolePermissions.includes(id)) && !isAllChecked;

    return (
      <div key={modName} className="glass-panel p-5 bg-card border border-color rounded-2xl shadow-sm hover:border-accent-primary/45 transition-all duration-200 flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex justify-between items-center border-b border-color/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-accent-primary/10 border border-accent-primary/15 rounded-lg p-2 flex items-center justify-center text-accent-primary">
              <IconComponent size={16} />
            </div>
            <span className="text-[0.88rem] font-bold text-text-main font-display">{meta.label}</span>
          </div>
          
          {/* Toggle All checkbox */}
          <label className="flex items-center gap-2 text-[0.7rem] font-bold text-text-muted cursor-pointer select-none mb-0">
            <input
              type="checkbox"
              checked={isAllChecked}
              ref={el => {
                if (el) el.indeterminate = isSomeChecked;
              }}
              onChange={() => handleToggleModuleAll(modName, modulePerms)}
              className="cursor-pointer accent-accent-primary rounded"
            />
            <span>SELECT ALL</span>
          </label>
        </div>
        
        {/* Card Body - Grid of Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sortedPerms.map((p) => {
            const action = p.name.split(':')[1] || p.name;
            const isChecked = selectedRolePermissions.includes(p.id);
            const isPrimary = ['read', 'write', 'create', 'delete'].includes(action);
            
            return (
              <label 
                key={p.id}
                className={`flex items-center gap-2 text-[0.75rem] cursor-pointer py-1.5 px-2.5 rounded-lg border transition-all duration-150 ${
                  isChecked
                    ? 'border-accent-primary bg-accent-primary/5 text-text-main font-semibold'
                    : 'border-color bg-card text-text-muted hover:border-accent-primary/40 hover:bg-card-hover'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTogglePermission(p.id)}
                  disabled={submitting}
                  className="cursor-pointer accent-accent-primary w-auto shrink-0 rounded"
                />
                <span className="truncate uppercase font-medium">
                  {action}
                </span>
                {isPrimary && (
                  <span className="w-1 h-1 rounded-full bg-accent-primary/40 ml-auto" />
                )}
              </label>
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
        <span>Loading system roles database...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1250px] mx-auto p-4 animate-[fadeIn_0.2s_ease]">
      
      {/* ── Page Header ── */}
      <div className="flex justify-between items-center border-b border-color pb-5 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-2.5 flex items-center justify-center text-accent-primary shadow-sm">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-[1.35rem] font-black text-text-main font-display leading-tight">
              Roles & Global Permissions
            </h1>
            <p className="text-text-muted text-[0.8rem] mt-0.5 font-medium">
              Create authority roles and configure baseline baseline access clearances across Bcore Nexus.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setSelectedRole(null);
          }}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-accent-primary text-white font-bold text-[0.8rem] rounded-lg shadow-lg shadow-accent-primary/10 hover:brightness-110 cursor-pointer"
        >
          <Plus size={14} />
          Create New Role
        </button>
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

      {/* ── Split-Pane Workspace Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Roles List Panel */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel bg-card border border-color rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider block border-b border-color pb-2">Authority Roles Registry</span>
            
            <div className="flex flex-col gap-1.5 max-h-[450px] overflow-y-auto pr-1">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRole(r);
                      setIsCreating(false);
                    }}
                    className={`flex flex-col text-left py-3 px-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-accent-primary bg-accent-primary/5 text-text-main font-bold' 
                        : 'border-color bg-card text-text-muted hover:bg-card-hover hover:border-accent-primary'
                    }`}
                  >
                    <span className={`text-[0.85rem] ${isSelected ? 'text-text-main' : 'text-text-main/80 font-semibold'}`}>{r.name}</span>
                    <span className="text-[10px] text-text-muted mt-1 leading-normal line-clamp-1">{r.description || 'No description provided.'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Role Settings & Permission Editor Panel */}
        <div className="md:col-span-2">
          
          {/* Active Edit Settings */}
          {selectedRole && !isCreating && (
            <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-6 animate-[fadeIn_0.15s_ease]">
              
              <div className="flex justify-between items-center border-b border-color pb-3 flex-wrap gap-4">
                <div className="flex flex-col">
                  <h3 className="text-[1rem] font-bold text-text-main flex items-center gap-2">
                    <ShieldCheck size={18} className="text-accent-primary" />
                    Configure Role Settings
                  </h3>
                  <span className="text-[11px] text-text-muted mt-0.5 font-medium">Selected Role: {selectedRole.name}</span>
                </div>

                <button
                  onClick={handleSaveRoleSettings}
                  disabled={submitting}
                  className="flex items-center gap-1.5 py-2 px-4 bg-accent-primary text-white font-bold text-[0.78rem] rounded-lg shadow hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Role Settings
                </button>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Name</label>
                  <input 
                    type="text" 
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Description</label>
                  <textarea 
                    rows={2}
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    disabled={submitting}
                    placeholder="Enter short details explaining role context..."
                    className="w-full rounded-lg border border-color bg-card py-2 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary resize-none"
                  />
                </div>
              </div>

              {/* Identity & Directory Control Section */}
              <div className="border-t border-color pt-5 flex flex-col gap-4">
                <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider">Identity & Directory Control</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* IAM card */}
                  {parsed.identity.iamManage && (
                    <div className="glass-panel p-5 bg-card border border-color rounded-2xl shadow-sm hover:border-accent-primary/45 transition-all duration-200 flex flex-col gap-3">
                      <div className="flex items-center gap-2 border-b border-color/40 pb-2.5">
                        <div className="bg-accent-primary/10 border border-accent-primary/15 rounded-lg p-2 flex items-center justify-center text-accent-primary">
                          <Key size={16} />
                        </div>
                        <span className="text-[0.88rem] font-bold text-text-main font-display">Directory Manager</span>
                      </div>
                      
                      <label 
                        className={`flex items-center gap-2.5 text-[0.78rem] cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                          selectedRolePermissions.includes(parsed.identity.iamManage.id)
                            ? 'border-accent-primary bg-accent-primary/5 text-text-main font-semibold'
                            : 'border-color bg-card text-text-muted hover:border-accent-primary hover:bg-card-hover'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRolePermissions.includes(parsed.identity.iamManage.id)}
                          onChange={() => handleTogglePermission(parsed.identity.iamManage!.id)}
                          disabled={submitting}
                          className="cursor-pointer accent-accent-primary w-auto shrink-0 rounded"
                        />
                        <span className="font-semibold uppercase font-display">IAM:MANAGE</span>
                      </label>
                    </div>
                  )}

                  {/* User controls card */}
                  {parsed.identity.userControls.length > 0 && (
                    <div className="glass-panel p-5 bg-card border border-color rounded-2xl shadow-sm hover:border-accent-primary/45 transition-all duration-200 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-color/40 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-accent-primary/10 border border-accent-primary/15 rounded-lg p-2 flex items-center justify-center text-accent-primary">
                            <Users size={16} />
                          </div>
                          <span className="text-[0.88rem] font-bold text-text-main font-display">User Directory Controls</span>
                        </div>
                        
                        {/* Toggle User All */}
                        <label className="flex items-center gap-2 text-[0.7rem] font-bold text-text-muted cursor-pointer select-none mb-0">
                          <input
                            type="checkbox"
                            checked={parsed.identity.userControls.every(p => selectedRolePermissions.includes(p.id))}
                            ref={el => {
                              if (el) {
                                const checkedCount = parsed.identity.userControls.filter(p => selectedRolePermissions.includes(p.id)).length;
                                el.indeterminate = checkedCount > 0 && checkedCount < parsed.identity.userControls.length;
                              }
                            }}
                            onChange={() => {
                              const uPerms = parsed.identity.userControls;
                              const allChecked = uPerms.every(p => selectedRolePermissions.includes(p.id));
                              const ids = uPerms.map(p => p.id);
                              if (allChecked) {
                                setSelectedRolePermissions(prev => prev.filter(id => !ids.includes(id)));
                              } else {
                                setSelectedRolePermissions(prev => [...Array.from(new Set([...prev, ...ids]))]);
                              }
                            }}
                            className="cursor-pointer accent-accent-primary rounded"
                          />
                          <span>SELECT ALL</span>
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {sortPermissionsByAction(parsed.identity.userControls).map((p) => {
                          const action = p.name.split(':')[1] || p.name;
                          const isChecked = selectedRolePermissions.includes(p.id);
                          return (
                            <label 
                              key={p.id}
                              className={`flex items-center gap-2 text-[0.75rem] cursor-pointer py-1.5 px-2.5 rounded-lg border transition-all duration-150 ${
                                isChecked
                                  ? 'border-accent-primary bg-accent-primary/5 text-text-main font-semibold'
                                  : 'border-color bg-card text-text-muted hover:border-accent-primary/40 hover:bg-card-hover'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(p.id)}
                                disabled={submitting}
                                className="cursor-pointer accent-accent-primary w-auto shrink-0 rounded"
                              />
                              <span className="truncate uppercase font-medium">
                                {action}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* General Clearances Section */}
              <div className="border-t border-color pt-5 flex flex-col gap-5">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider mb-0">Baseline Role Clearances</label>
                    <span className="text-[11px] text-text-muted font-medium">Select specific module operations for general operational clearances.</span>
                  </div>
                  
                  {/* Select/Clear All */}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="bg-transparent border-none text-accent-primary text-[0.75rem] font-bold cursor-pointer hover:underline p-0"
                    >
                      Grant All Clearances
                    </button>
                    <span className="text-text-muted/30 text-[0.75rem] select-none">|</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="bg-transparent border-none text-text-muted text-[0.75rem] font-bold cursor-pointer hover:underline p-0"
                    >
                      Clear All Clearances
                    </button>
                  </div>
                </div>

                {/* 1. Global All (*:*) override banner */}
                {parsed.globalAll && (
                  <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                    selectedRolePermissions.includes(parsed.globalAll.id)
                      ? 'border-[#C5A85C] bg-[#C5A85C]/5 shadow-sm'
                      : 'border-color bg-card hover:border-[#C5A85C]/40'
                  }`}>
                    <div className="flex items-center justify-between border-b border-color/40 pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={`w-4 h-4 ${selectedRolePermissions.includes(parsed.globalAll.id) ? 'text-[#C5A85C]' : 'text-text-muted'}`} />
                        <span className="text-[0.88rem] font-bold text-text-main font-display">Global Access Override</span>
                      </div>
                      
                      <span className="text-[10px] bg-[#C5A85C]/10 border border-[#C5A85C]/20 text-[#C5A85C] font-semibold py-0.5 px-2 rounded-full uppercase tracking-wider">Super Clearance</span>
                    </div>

                    <label className="flex items-center gap-3 text-[0.8rem] cursor-pointer py-1.5 select-none mb-0">
                      <input
                        type="checkbox"
                        checked={selectedRolePermissions.includes(parsed.globalAll.id)}
                        onChange={() => handleTogglePermission(parsed.globalAll!.id)}
                        disabled={submitting}
                        className="cursor-pointer accent-[#C5A85C] w-4 h-4 rounded-md"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main">All</span>
                        <span className="text-[11px] text-text-muted font-medium mt-0.5">Enabling this grants full administrative and operational authorization across all workspaces and features, bypassing fine-grained checks.</span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Search & Domain Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/5 p-4 rounded-2xl border border-color/30">
                  {/* Category Pills/Tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-1.5 px-3 rounded-lg text-[0.72rem] font-bold cursor-pointer transition-all border ${
                          activeTab === tab.id
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
                      placeholder="Search modules..."
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

          {/* New Role Creation Panel */}
          {isCreating && (
            <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
              <div className="border-b border-color pb-3">
                <h3 className="text-[1rem] font-bold text-text-main flex items-center gap-2">
                  <ShieldCheck size={18} className="text-accent-primary" />
                  Define Authority Role
                </h3>
                <span className="text-[11px] text-text-muted mt-0.5 font-medium">Create a new baseline system role</span>
              </div>

              <form onSubmit={handleCreateRoleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sales Executive"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter context, organizational scope, or clearance level details for this role..."
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-card py-2 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary resize-none"
                  />
                </div>

                <div className="flex gap-4 border-t border-color pt-4 mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreating(false);
                      if (roles.length > 0) setSelectedRole(roles[0]);
                    }}
                    disabled={submitting}
                    className="w-full rounded-lg py-2.5 px-4 font-semibold border border-color bg-card text-text-muted hover:bg-card-hover hover:text-text-main transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full rounded-lg py-2.5 px-4 font-semibold border border-transparent bg-accent-primary text-white shadow shadow-accent-primary/10 hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    Create Role
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fallback Empty Panel */}
          {!selectedRole && !isCreating && (
            <div className="glass-panel p-12 bg-card border border-color rounded-xl shadow-sm text-center text-text-muted flex flex-col items-center justify-center gap-3.5 min-h-[300px]">
              <Sliders size={32} className="opacity-40 text-accent-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-sm text-text-main">No Role Selected</span>
                <span className="text-xs text-text-muted mt-1 leading-normal max-w-[280px]">Select an existing role from the left registry or click "+ New Role" to create one.</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
