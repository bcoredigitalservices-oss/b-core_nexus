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
  Network
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

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { authFetch, token } = useAppContext();

  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'rbac' | 'logs' | 'settings'>('details');

  // Metadata arrays
  const [allRoles, setAllRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

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
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setDesignation(data.designation || '');
          setDepartmentId(data.department_id || '');
          setIsActive(data.is_active);
          setCustomNotes(data.custom_attributes?.notes || '');

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

  const handleSave = async () => {
    if (!userId) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Save general access metadata (Role, Designation, Department, Names)
      await authFetch(`/iam/users/${userId}/access`, {
        method: 'PUT',
        body: JSON.stringify({
          designation: designation.trim() || null,
          role_id: selectedRoleId || null,
          department_id: departmentId || null
        })
      });

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
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              } uppercase tracking-wider`}>
                {isActive ? 'Active' : 'Pending Claim'}
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

                {/* Direct Permissions Checkbox Grid */}
                <div className="border-t border-color pt-5">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider">Granular Direct Overrides</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="bg-transparent border-none text-accent-primary text-[0.7rem] font-bold cursor-pointer hover:underline p-0"
                      >
                        Grant All
                      </button>
                      <span className="text-text-muted/30 text-[0.7rem] select-none">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        className="bg-transparent border-none text-text-muted text-[0.7rem] font-bold cursor-pointer hover:underline p-0"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {allPermissions.map((perm) => {
                      const isChecked = selectedPermissionIds.includes(perm.id);
                      return (
                        <label 
                          key={perm.id} 
                          className={`flex items-center gap-2.5 text-[0.78rem] cursor-pointer py-2 px-3 rounded-lg border transition-all duration-150 ${
                            isChecked 
                              ? 'border-accent-primary bg-accent-primary/5 text-text-main font-semibold' 
                              : 'border-color bg-card text-text-muted hover:border-accent-primary hover:bg-card-hover'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            disabled={submitting}
                            className="cursor-pointer accent-accent-primary w-auto shrink-0"
                          />
                          <span className="truncate">{perm.name}</span>
                        </label>
                      );
                    })}
                  </div>
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
                      onClick={() => alert("Credentials reset request dispatched to console log.")}
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
