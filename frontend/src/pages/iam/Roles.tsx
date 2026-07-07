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
  RefreshCw
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
        const perms: PermissionItem[] = await authFetch(`/iam/roles/${selectedRole.id}/permissions`);
        if (perms) {
          setSelectedRolePermissions(perms.map(p => p.id));
        }
        
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
        // Reload list and select new role
        const fetchedRoles = await authFetch('/iam/roles');
        if (fetchedRoles) {
          setRoles(fetchedRoles);
          const found = fetchedRoles.find((r: RoleItem) => r.name === created.name);
          if (found) setSelectedRole(found);
        }
        
        // Reset states
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
      // 1. Update metadata
      await authFetch(`/iam/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDescription.trim() || null
        })
      });

      // 2. Update permissions
      await authFetch(`/iam/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          permission_ids: selectedRolePermissions
        })
      });

      setSuccessMsg(`Role settings for '${roleName}' saved successfully.`);
      
      // Refresh list to update display names
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

  // Categorize permissions for clean checkbox group layout
  const getCategorizedPermissions = () => {
    const categories: Record<string, PermissionItem[]> = {
      'Identity & Directory Control': [],
      'System Settings & Telemetry': [],
      'General Clearances': []
    };

    permissions.forEach(p => {
      const name = p.name.toLowerCase();
      if (name.startsWith('iam:') || name.startsWith('user:')) {
        categories['Identity & Directory Control'].push(p);
      } else if (name.startsWith('system:')) {
        categories['System Settings & Telemetry'].push(p);
      } else {
        categories['General Clearances'].push(p);
      }
    });

    return categories;
  };

  const categorizedPermissions = getCategorizedPermissions();

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

              {/* Permissions Checklist Groups */}
              <div className="border-t border-color pt-5">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider"> Baseline Role Clearances</label>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="bg-transparent border-none text-accent-primary text-[0.7rem] font-bold cursor-pointer hover:underline p-0"
                    >
                      Grant All
                    </button>
                    <span className="text-text-muted/30 text-[0.7rem] select-none">|</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="bg-transparent border-none text-text-muted text-[0.7rem] font-bold cursor-pointer hover:underline p-0"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {Object.entries(categorizedPermissions).map(([catName, perms]) => {
                    if (perms.length === 0) return null;
                    return (
                      <div key={catName} className="flex flex-col gap-2.5 border border-color/40 p-4 bg-black/5 rounded-xl">
                        <span className="text-[11px] font-extrabold text-text-main tracking-wider block border-b border-color pb-1.5 mb-1 uppercase">{catName}</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isChecked = selectedRolePermissions.includes(p.id);
                            return (
                              <label 
                                key={p.id} 
                                className={`flex items-center gap-2.5 text-[0.78rem] cursor-pointer py-1.5 px-3 rounded-lg border transition-all duration-150 ${
                                  isChecked 
                                    ? 'border-accent-primary bg-accent-primary/5 text-text-main font-semibold' 
                                    : 'border-color bg-card text-text-muted hover:border-accent-primary hover:bg-card-hover'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.id)}
                                  disabled={submitting}
                                  className="cursor-pointer accent-accent-primary w-auto shrink-0"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
