import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users as UsersIcon,
  UserPlus,
  Cpu,
  ShieldCheck,
  Mail,
  UserCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  Lock,
  Unlock,
  RefreshCw,
  Sliders,
  Plus,
  Save,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import ProvisionUserModal from "../components/ProvisionUserModal";
// ── Cleaned up the dead EditUserAccessModal import from here to fix tracking path ──

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, authFetch, currentUser } = useAppContext();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"users" | "roles">(
    tabParam === "roles" ? "roles" : "users",
  );

  const canProvision =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("iam:manage") ||
    currentUser?.permissions?.includes("user:invite");

  const canManageRoles =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("iam:manage");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Roles states
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  // Form states for roles
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // New role inputs
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Search & Filter States
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");

  // Modal State
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTabChange = (tab: "users" | "roles") => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSuccessMsg("");
    setErrorMsg("");
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "roles") {
      setActiveTab("roles");
    } else {
      setActiveTab("users");
    }
  }, [searchParams]);

  const loadDirectoryData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [usersData, workspacesData, departmentsData, rolesData] =
        await Promise.all([
          authFetch("/auth/users"),
          authFetch("/iam/workspaces"),
          authFetch("/iam/departments"),
          authFetch("/iam/roles"),
        ]);

      if (usersData) setUsers(usersData);
      if (workspacesData) setWorkspaces(workspacesData);
      if (departmentsData) setDepartments(departmentsData);
      if (rolesData) {
        setRoles(rolesData);
        if (rolesData.length > 0 && !selectedRole) {
          setSelectedRole(rolesData[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load user directory and roles:", err);
      setErrorMsg("Failed to fetch the operator directory database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDirectoryData();
    }
  }, [token]);

  useEffect(() => {
    if (!selectedRole) return;
    setRoleName(selectedRole.name);
    setRoleDescription(selectedRole.description || "");
    setIsCreatingRole(false);
  }, [selectedRole]);

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setRoleSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const created: RoleItem = await authFetch("/iam/roles", {
        method: "POST",
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null,
        }),
      });

      if (created) {
        setSuccessMsg(`Role '${created.name}' created successfully.`);
        const fetchedRoles = await authFetch("/iam/roles");
        if (fetchedRoles) {
          setRoles(fetchedRoles);
          const found = fetchedRoles.find((r: RoleItem) => r.name === created.name);
          if (found) setSelectedRole(found);
        }
        setNewRoleName("");
        setNewRoleDescription("");
        setIsCreatingRole(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create new role.");
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleSaveRoleSettings = async () => {
    if (!selectedRole) return;

    setRoleSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await authFetch(`/iam/roles/${selectedRole.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDescription.trim() || null,
        }),
      });

      setSuccessMsg(`Role settings for '${roleName}' saved successfully.`);

      const fetchedRoles = await authFetch("/iam/roles");
      if (fetchedRoles) {
        setRoles(fetchedRoles);
        const updated = fetchedRoles.find((r: RoleItem) => r.id === selectedRole.id);
        if (updated) setSelectedRole(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save role settings.");
    } finally {
      setRoleSubmitting(false);
    }
  };

  const canToggleStatus =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("iam:manage") ||
    currentUser?.permissions?.includes("user:write");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    const actionText = currentActive ? "deactivate (suspend)" : "activate (restore)";
    if (confirm(`Are you sure you want to ${actionText} this user?`)) {
      setUpdatingUserId(userId);
      setErrorMsg("");
      setSuccessMsg("");
      try {
        await authFetch(`/iam/users/${userId}/status`, {
          method: "PUT",
          body: JSON.stringify({ is_active: !currentActive }),
        });
        setSuccessMsg(`User status successfully updated.`);
        await loadDirectoryData();
      } catch (err: any) {
        setErrorMsg(err.message || `Failed to ${actionText} user`);
      } finally {
        setUpdatingUserId(null);
      }
    }
  };

  const getClearanceBadge = (permissions: string[] = [], functionalRoles: string[] = []) => {
    if (permissions.includes("*:*") || functionalRoles.includes("admin") || functionalRoles.includes("root")) {
      return {
        label: "System Admin",
        color: "#9d4edd",
        bg: "rgba(157, 78, 221, 0.08)",
        border: "1px solid rgba(157, 78, 221, 0.2)",
      };
    }
    if (permissions.includes("iam:manage") || functionalRoles.includes("manager")) {
      return {
        label: "IAM Executive",
        color: "#e63946",
        bg: "rgba(230, 57, 70, 0.08)",
        border: "1px solid rgba(230, 57, 70, 0.2)",
      };
    }
    if (permissions.includes("system:admin") || permissions.includes("system:write")) {
      return {
        label: "System Manager",
        color: "#00b4d8",
        bg: "rgba(0, 180, 216, 0.08)",
        border: "1px solid rgba(0, 180, 216, 0.2)",
      };
    }
    if (functionalRoles && functionalRoles.length > 0) {
      const formatted = functionalRoles[0]
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return {
        label: formatted,
        color: "var(--text-muted)",
        bg: "rgba(142, 139, 130, 0.06)",
        border: "1px solid rgba(142, 139, 130, 0.15)",
      };
    }
    return {
      label: "Operator",
      color: "var(--text-muted)",
      bg: "rgba(142, 139, 130, 0.06)",
      border: "1px solid rgba(142, 139, 130, 0.15)",
    };
  };

  const getAvatarStyle = (firstName: string | null, lastName: string | null) => {
    const combined = `${firstName || ""}${lastName || ""}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "from-[#0F2E59] to-[#1e4e8c]",
      "from-[#C5A85C] to-[#d8bf7a]",
      "from-[#4A5568] to-[#718096]",
      "from-[#9d4edd] to-[#b5179e]",
      "from-[#00b4d8] to-[#0077b6]",
      "from-[#e63946] to-[#d90429]",
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName) {
      return `${firstName[0].toUpperCase()}${lastName ? lastName[0].toUpperCase() : ""}`;
    }
    return email[0].toUpperCase();
  };

  const handleClearFilters = () => {
    setSearchId("");
    setSearchName("");
    setSearchEmail("");
    setSearchStatus("all");
  };

  const filteredUsers = users.filter((user) => {
    if (searchId.trim()) {
      const matchId = searchId.trim().toLowerCase();
      if (!user.id.toLowerCase().includes(matchId)) return false;
    }
    if (searchName.trim()) {
      const matchName = searchName.trim().toLowerCase();
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
      if (!fullName.includes(matchName)) return false;
    }
    if (searchEmail.trim()) {
      const matchEmail = searchEmail.trim().toLowerCase();
      if (!user.email.toLowerCase().includes(matchEmail)) return false;
    }
    if (searchStatus !== "all") {
      if (searchStatus === "active" && !user.is_active) return false;
      if (searchStatus === "pending" && user.is_active) return false;
    }
    return true;
  });

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.is_active).length;
  const systemUsersCount = users.filter(
    (u) => u.permissions?.includes("*:*") || u.permissions?.includes("iam:manage"),
  ).length;
  const lockedUsersCount = users.filter((u) => !u.is_active).length;

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
      {/* Governance Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2E59] to-[#1a3f73] border border-[var(--border-color)] rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-4.5 z-10">
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-center shadow-lg">
            <UsersIcon size={24} className="text-[#C5A85C]" />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-black text-white font-display mb-1 flex items-center gap-2">User Governance Control</h1>
            <p className="text-white/80 text-[0.82rem] font-medium max-w-[550px] leading-relaxed">
              Manage institutional access, roles, and security permissions across the entire Bcore Nexus ecosystem.
            </p>
          </div>
        </div>

        <div className="flex gap-3 z-10 flex-wrap">
          {activeTab === "users" && canProvision && (
            <button
              onClick={() => setProvisionModalOpen(true)}
              className="bg-[#C5A85C] text-[#0F2E59] hover:brightness-110 font-bold flex items-center gap-2 py-3 px-5 rounded-xl border border-transparent shadow-lg shadow-[#C5A85C]/10 transition-all duration-200 cursor-pointer"
            >
              <UserPlus size={16} /> Provision Operator
            </button>
          )}
          {activeTab === "roles" && canManageRoles && (
            <button
              onClick={() => {
                setIsCreatingRole(true);
                setSelectedRole(null);
              }}
              className="bg-[#C5A85C] text-[#0F2E59] hover:brightness-110 font-bold flex items-center gap-2 py-3 px-5 rounded-xl border border-transparent shadow-lg shadow-[#C5A85C]/10 transition-all duration-200 cursor-pointer"
            >
              <Plus size={16} /> Create New Role
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="flex flex-col gap-1 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.88rem] shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>
              {successMsg.includes("Click activate link") ? (
                <>
                  Operator provisioned successfully.{" "}
                  <a href={successMsg.split(": ")[1]} target="_blank" rel="noreferrer" className="underline font-bold text-[#C5A85C] hover:brightness-110 ml-1 inline-flex items-center gap-1">
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-color gap-6">
        <button onClick={() => handleTabChange("users")} className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all relative cursor-pointer ${activeTab === "users" ? "text-text-main font-bold" : "text-text-muted hover:text-text-main"}`}>
          Operator Directory
          {activeTab === "users" && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent-primary" />}
        </button>
        <button onClick={() => handleTabChange("roles")} className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all relative cursor-pointer ${activeTab === "roles" ? "text-text-main font-bold" : "text-text-muted hover:text-text-main"}`}>
          Authority Roles
          {activeTab === "roles" && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent-primary" />}
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          {/* Dynamic Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Total Users</span>
                <span className="text-2xl font-black text-text-main leading-none">{totalUsersCount}</span>
                <span className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-0.5">+12% <span className="text-text-muted font-normal">vs last month</span></span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent-primary/5 border border-accent-primary/10 flex items-center justify-center text-accent-primary"><UsersIcon size={18} /></div>
            </div>
            <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Active Now</span>
                <span className="text-2xl font-black text-text-main leading-none">{activeUsersCount}</span>
                <span className="text-[10px] text-emerald-500 font-semibold mt-1">Stable</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500"><UserCheck size={18} /></div>
            </div>
            <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">System Users</span>
                <span className="text-2xl font-black text-text-main leading-none">{systemUsersCount}</span>
                <span className="text-[10px] text-accent-purple font-semibold mt-1">Managed</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent-purple/5 border border-accent-purple/10 flex items-center justify-center text-accent-purple"><Cpu size={18} /></div>
            </div>
            <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">Pending Invites</span>
                <span className="text-2xl font-black text-text-main leading-none">{lockedUsersCount}</span>
                <span className="text-[10px] text-amber-500 font-semibold mt-1">Pending Claim</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500"><Clock size={18} /></div>
            </div>
          </div>

          {/* Search Filters */}
          <div className="glass-panel p-5 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-color text-text-main text-[0.8rem] font-bold uppercase tracking-wider">
              <SlidersHorizontal size={14} className="text-accent-primary" /> Filter Operators ledger
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">Operator ID</label>
                <input type="text" placeholder="e.g. 550e8400..." value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary" />
              </div>
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">Full Name</label>
                <input type="text" placeholder="Search names..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary" />
              </div>
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="text" placeholder="Search emails..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary" />
              </div>
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">User Type</label>
                <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer">
                  <option value="all">All Statuses</option>
                  <option value="active">Active / Claimed</option>
                  <option value="pending">Pending Claim</option>
                </select>
              </div>
            </div>
            {(searchId || searchName || searchEmail || searchStatus !== "all") && (
              <div className="flex justify-end mt-1">
                <button onClick={handleClearFilters} className="flex items-center gap-1.5 py-1.5 px-3 bg-card-hover border border-color text-text-muted text-[0.75rem] font-bold rounded-lg cursor-pointer transition">
                  <RefreshCw size={12} /> Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Directory Table */}
          <div className="glass-panel p-0 overflow-hidden bg-card border border-color rounded-2xl shadow-sm">
            <div className="py-5 px-7 border-b border-color flex items-center justify-between bg-card-hover">
              <span className="text-[0.8rem] font-bold text-text-main tracking-wider uppercase">Operator Governance Directory</span>
              <span className="text-[0.7rem] text-text-muted font-bold bg-card py-1 px-3 rounded-full border border-color">
                {filteredUsers.length} matching profile{filteredUsers.length !== 1 ? "s" : ""}
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
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const badge = getClearanceBadge(user.permissions, user.functional_roles);
                      return (
                        <tr key={user.id} className="border-b border-color transition-colors duration-150 hover:bg-card-hover/40">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarStyle(user.first_name, user.last_name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                {getInitials(user.first_name, user.last_name, user.email)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-text-main text-[0.88rem]">
                                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : <em className="opacity-50 font-normal">Unconfigured Profile</em>}
                                </span>
                                <span className="text-[11px] text-text-muted leading-none mt-0.5">{user.designation || "Operational Staff"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/15 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending Claim
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-bold py-1 px-2.5 rounded border uppercase tracking-wider inline-block text-center" style={{ color: badge.color, backgroundColor: badge.bg, borderColor: badge.color + "26" }}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-text-muted select-all">{user.id}</td>
                          <td className="py-4 px-4 text-text-muted font-medium">{user.email}</td>
                          {/* ── Direct Full-Page Redirection Navigation Trigger wired below ── */}
                          <td className="py-4 px-6 text-right flex justify-end items-center gap-2">
                            <button
                              onClick={() => navigate(`/users/${user.id}`)}
                              className="py-1.5 px-3.5 bg-card hover:bg-card-hover border border-color text-text-main text-[0.78rem] font-bold rounded-lg cursor-pointer transition shadow-sm"
                            >
                              Configure Access
                            </button>
                            {user.is_active ? (
                              <button onClick={() => handleToggleStatus(user.id, true)} disabled={!canToggleStatus || updatingUserId === user.id} className="py-1.5 px-3 bg-red-500/10 border border-red-500/25 text-red-400 text-[0.75rem] rounded-lg cursor-pointer hover:bg-red-500/20 font-semibold inline-flex items-center gap-1.5 transition shadow-sm h-[32px]">
                                <Lock size={12} /> {updatingUserId === user.id ? "Suspending..." : "Deactivate"}
                              </button>
                            ) : (
                              <button onClick={() => handleToggleStatus(user.id, false)} disabled={!canToggleStatus || updatingUserId === user.id} className="py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[0.75rem] rounded-lg cursor-pointer hover:bg-emerald-500/20 font-semibold inline-flex items-center gap-1.5 transition shadow-sm h-[32px]">
                                <Unlock size={12} /> {updatingUserId === user.id ? "Activating..." : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ── Split-Pane Authority Roles Layout ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-[fadeIn_0.15s_ease]">
          <div className="flex flex-col gap-4">
            <div className="glass-panel bg-card border border-color rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider block border-b border-color pb-2">Authority Roles Registry</span>
              <div className="flex flex-col gap-1.5 max-h-[450px] overflow-y-auto pr-1">
                {roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <button key={r.id} onClick={() => { setSelectedRole(r); setIsCreatingRole(false); }} className={`flex flex-col text-left py-3 px-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-accent-primary bg-accent-primary/5 text-text-main font-bold" : "border-color bg-card text-text-muted hover:bg-card-hover"}`}>
                      <span className={`text-[0.85rem] ${isSelected ? "text-text-main font-bold" : "text-text-main/80 font-semibold"}`}>{r.name}</span>
                      <span className="text-[10px] text-text-muted mt-1 leading-normal line-clamp-1">{r.description || "No description provided."}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedRole && !isCreatingRole && (
              <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-6 animate-[fadeIn_0.15s_ease]">
                <div className="flex justify-between items-center border-b border-color pb-3 flex-wrap gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-[1rem] font-bold text-text-main flex items-center gap-2"><ShieldCheck size={18} className="text-accent-primary" /> Configure Role Settings</h3>
                    <span className="text-[11px] text-text-muted mt-0.5 font-medium">Selected Role: {selectedRole.name}</span>
                  </div>
                  <button onClick={handleSaveRoleSettings} disabled={roleSubmitting} className="flex items-center gap-1.5 py-2 px-4 bg-accent-primary text-white font-bold text-[0.78rem] rounded-lg shadow hover:brightness-110 cursor-pointer disabled:opacity-50">
                    {roleSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Role Settings
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Name</label>
                    <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} disabled={roleSubmitting} className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary" />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Description</label>
                    <textarea rows={2} value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} disabled={roleSubmitting} placeholder="Enter short details explaining role context..." className="w-full rounded-lg border border-color bg-card py-2 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary resize-none" />
                  </div>
                </div>
              </div>
            )}

            {isCreatingRole && (
              <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                <div className="border-b border-color pb-3">
                  <h3 className="text-[1rem] font-bold text-text-main flex items-center gap-2"><ShieldCheck size={18} className="text-accent-primary" /> Define Authority Role</h3>
                  <span className="text-[11px] text-text-muted mt-0.5 font-medium">Create a new baseline system role</span>
                </div>
                <form onSubmit={handleCreateRoleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Name *</label>
                    <input type="text" required placeholder="e.g. Sales Executive" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} disabled={roleSubmitting} className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary" />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">Role Description</label>
                    <textarea rows={3} placeholder="Enter context, organizational scope, or clearance level details for this role..." value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} disabled={roleSubmitting} className="w-full rounded-lg border border-color bg-card py-2 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary resize-none" />
                  </div>
                  <div className="flex gap-4 border-t border-color pt-4 mt-2">
                    <button type="button" onClick={() => { setIsCreatingRole(false); if (roles.length > 0) setSelectedRole(roles[0]); }} disabled={roleSubmitting} className="w-full rounded-lg py-2.5 px-4 font-semibold border border-color bg-card text-text-muted hover:bg-card-hover transition cursor-pointer">Cancel</button>
                    <button type="submit" disabled={roleSubmitting} className="w-full rounded-lg py-2.5 px-4 font-semibold border border-transparent bg-accent-primary text-white shadow hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5">
                      {roleSubmitting && <Loader2 size={14} className="animate-spin" />} Create Role
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!selectedRole && !isCreatingRole && (
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
      )}

      {/* Provision Operator Modal */}
      <ProvisionUserModal
        isOpen={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        departments={departments}
        roles={roles}
        onSuccess={(data?: any) => {
          setProvisionModalOpen(false);
          loadDirectoryData();
          if (data?.onboarding_url) {
            setSuccessMsg(`Operator provisioned. Click activate link for local testing: ${data.onboarding_url}`);
          } else {
            setSuccessMsg("Operator invitation generated and dispatched.");
          }
        }}
      />
    </div>
  );
}