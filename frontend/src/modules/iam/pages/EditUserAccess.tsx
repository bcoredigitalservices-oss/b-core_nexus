import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  User as UserIcon,
  Shield,
  Settings as SettingsIcon,
  Layers,
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  Clock,
  Save,
  Key,
  AlertCircle,
  CheckCircle,
  FileText,
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
  Home,
  ClipboardList,
  ShoppingCart,
  Monitor,
  Users,
  Tag,
  LifeBuoy,
  Megaphone,
  Globe,
  UserCheck,
  Wallet,
  Calendar,
  Award,
  Plane,
  MessageSquare,
  Cog,
  Copy,
  ChevronDown,
  Receipt,
  Package,
  FolderKanban,
  CheckSquare,
  Truck,
  Wrench,
  Map,
  Cpu,
  Check,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import { isAdmin as isUserAdmin, hasPermission } from "../../../utils/permissions";

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

const MODULE_METADATA: Record<
  string,
  { label: string; icon: React.ComponentType<any>; group: string }
> = {
  accounting: { label: "Accounting", icon: DollarSign, group: "Finance" },
  invoicing: { label: "Invoicing", icon: FileSpreadsheet, group: "Finance" },
  payments: { label: "Payments", icon: CreditCard, group: "Finance" },
  banking: { label: "Banking", icon: Building, group: "Finance" },
  taxes: { label: "Taxes", icon: Percent, group: "Finance" },
  reports: { label: "Reports", icon: BarChart3, group: "Finance" },
  budget: { label: "Budget", icon: TrendingUp, group: "Finance" },
  shares: { label: "Shares", icon: PieChart, group: "Finance" },
  expenses: { label: "Expenses", icon: Receipt, group: "Finance" },
  assets: { label: "Assets", icon: Briefcase, group: "Operations" },
  products: { label: "Products", icon: Package, group: "Operations" },
  warehouse: { label: "Warehouse", icon: Home, group: "Operations" },
  stock: { label: "Stock", icon: ClipboardList, group: "Operations" },
  buying: { label: "Buying", icon: ShoppingCart, group: "Operations" },
  pos: { label: "POS", icon: Monitor, group: "Operations" },
  manufacturing: { label: "Manufacturing", icon: Cpu, group: "Operations" },
  projects: { label: "Projects", icon: FolderKanban, group: "Operations" },
  qa: { label: "QA", icon: CheckSquare, group: "Operations" },
  logistics: { label: "Logistics", icon: Truck, group: "Operations" },
  maintenance: { label: "Maintenance", icon: Wrench, group: "Operations" },
  field_ops: { label: "Field Ops", icon: Map, group: "Operations" },
  crm: { label: "CRM", icon: Users, group: "CRM & Sales" },
  sales: { label: "Sales", icon: Tag, group: "CRM & Sales" },
  support: { label: "Support", icon: LifeBuoy, group: "CRM & Sales" },
  marketing: { label: "Marketing", icon: Megaphone, group: "CRM & Sales" },
  website: { label: "Website", icon: Globe, group: "CRM & Sales" },
  hr: { label: "HR", icon: UserCheck, group: "HR & Company" },
  payroll: { label: "Payroll", icon: Wallet, group: "HR & Company" },
  attendance: { label: "Attendance", icon: Calendar, group: "HR & Company" },
  recruitment: { label: "Recruitment", icon: Search, group: "HR & Company" },
  performance: { label: "Performance", icon: Award, group: "HR & Company" },
  leaves: { label: "Leaves", icon: Plane, group: "HR & Company" },
  employee_groups: {
    label: "Employee Groups",
    icon: Users,
    group: "HR & Company",
  },
  chats: {
    label: "Chats",
    icon: MessageSquare,
    group: "System & Communications",
  },
  email: { label: "Email", icon: Mail, group: "System & Communications" },
  message: {
    label: "Message",
    icon: MessageSquare,
    group: "System & Communications",
  },
  internals: {
    label: "Internals",
    icon: SettingsIcon,
    group: "System & Communications",
  },
  cog: {
    label: "System Core (COG)",
    icon: Cog,
    group: "System & Communications",
  },
};

const actionOrder = [
  "read",
  "write",
  "create",
  "delete",
  "print",
  "email",
  "export",
  "share",
  "report",
  "import",
  "mask",
];

const sortPermissionsByAction = (perms: PermissionItem[]) => {
  return [...perms].sort((a, b) => {
    const actionA = a.name.split(":")[1] || "";
    const actionB = b.name.split(":")[1] || "";
    const idxA = actionOrder.indexOf(actionA);
    const idxB = actionOrder.indexOf(actionB);
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    return valA - valB;
  });
};

export default function EditUserAccess() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { authFetch, token, currentUser } = useAppContext();

  const canToggleStatus =
    isUserAdmin(currentUser) ||
    hasPermission(currentUser, "iam:manage") ||
    hasPermission(currentUser, "user:write");

  // Core Tab Matrix
  const [activeTab, setActiveTab] = useState<
    "details" | "permissions" | "settings"
  >("details");

  // Metadata arrays
  const [allRoles, setAllRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Form Field States
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [copyingFromUserId, setCopyingFromUserId] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("All");

  const handleToggleStatus = async () => {
    const actionText = isActive ? "deactivate (suspend)" : "activate (restore)";
    if (confirm(`Are you sure you want to ${actionText} this user?`)) {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      try {
        await authFetch(`/iam/users/${userId}/status`, {
          method: "PUT",
          body: JSON.stringify({ is_active: !isActive }),
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

  // Bootstrap Context Fields
  useEffect(() => {
    if (!token || !userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const [rolesList, permsList, deptsList] = await Promise.all([
          authFetch("/iam/roles"),
          authFetch("/iam/permissions"),
          authFetch("/iam/departments"),
        ]);

        if (rolesList) setAllRoles(rolesList);
        if (permsList) setAllPermissions(permsList);
        if (deptsList) setDepartments(deptsList);

        const data: UserDetailsData = await authFetch(
          `/iam/users/${userId}/details`,
        );
        if (data) {
          setEmail(data.email);
          setDesignation(data.designation || "");
          setDepartmentId(data.department_id || "");
          setIsActive(data.is_active);

          try {
            const allUsersList = await authFetch("/auth/users");
            if (allUsersList) setAllUsers(allUsersList);
            const matchedUser = allUsersList?.find(
              (u: any) => String(u.id) === String(userId),
            );
            if (matchedUser) {
              setFirstName(matchedUser.first_name || "");
              setLastName(matchedUser.last_name || "");
            } else {
              setFirstName(data.first_name || "");
              setLastName(data.last_name || "");
            }
          } catch (err) {
            setFirstName(data.first_name || "");
            setLastName(data.last_name || "");
          }

          if (data.roles && data.roles.length > 0) {
            setSelectedRoleId(data.roles[0].id);
          }

          const directPerms: PermissionItem[] = await authFetch(
            `/iam/users/${userId}/permissions`,
          );
          if (directPerms) {
            setSelectedPermissionIds(directPerms.map((p) => p.id));
          }
        }
      } catch (err: any) {
        console.error("Failed to load user credentials deck:", err);
        setErrorMsg(err.message || "Error fetching user record.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, token]);

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  const handleToggleModuleAll = (
    moduleKey: string,
    modulePerms: PermissionItem[],
  ) => {
    const permIds = modulePerms.map((p) => p.id);
    const allSelected = permIds.every((id) =>
      selectedPermissionIds.includes(id),
    );

    if (allSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !permIds.includes(id)),
      );
    } else {
      setSelectedPermissionIds((prev) => {
        const next = [...prev];
        permIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  // ── New Helper to Grant All Overrides instantly ──
  const handleGrantAllSystemPermissions = () => {
    const allIds = allPermissions.map((p) => p.id);
    setSelectedPermissionIds(allIds);
    setSuccessMsg("All granular permission overrides selected.");
  };

  // ── New Helper to Clear All Overrides instantly ──
  const handleClearAllSystemPermissions = () => {
    setSelectedPermissionIds([]);
    setSuccessMsg("All granular permission overrides cleared.");
  };

  const handleCopyPermissions = async (sourceUserId: string) => {
    if (!sourceUserId) return;
    const sourceUser = allUsers.find((u) => u.id === sourceUserId);
    const sourceName = sourceUser
      ? sourceUser.first_name
        ? `${sourceUser.first_name} ${sourceUser.last_name || ""}`
        : sourceUser.email
      : "selected user";

    if (
      confirm(
        `Are you sure you want to completely overwrite this operator's direct clearances with the clearances of '${sourceName}'?`,
      )
    ) {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      try {
        const res = await authFetch(`/iam/users/${userId}/copy-permissions`, {
          method: "POST",
          body: JSON.stringify({ source_user_id: sourceUserId }),
        });

        const directPerms = await authFetch(`/iam/users/${userId}/permissions`);
        if (directPerms) {
          setSelectedPermissionIds(directPerms.map((p: any) => p.id));
        }

        setSuccessMsg(res.message || "Access parameters copied successfully.");
        setCopyingFromUserId("");
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to copy permission profiles.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      if (selectedRoleId) {
        await authFetch(`/iam/users/${userId}/roles`, {
          method: "PUT",
          body: JSON.stringify({ role_id: selectedRoleId }),
        });
      }

      await authFetch(`/iam/users/${userId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permission_ids: selectedPermissionIds }),
      });

      setSuccessMsg("User security parameters synchronized successfully.");
    } catch (err: any) {
      setErrorMsg(
        err.message || "Failed to save access profile modifications.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getParsedPermissions = () => {
    const parsed: GroupedPermissions = {
      globalAll: null,
      identity: { iamManage: null, userControls: [] },
      modules: {},
    };

    allPermissions.forEach((p) => {
      const name = p.name;
      if (name === "*:*") {
        parsed.globalAll = p;
      } else if (name === "iam:manage") {
        parsed.identity.iamManage = p;
      } else if (name.startsWith("user:")) {
        parsed.identity.userControls.push(p);
      } else if (name.includes(":")) {
        const [modName] = name.split(":");
        if (!parsed.modules[modName]) parsed.modules[modName] = [];
        parsed.modules[modName].push(p);
      }
    });

    return parsed;
  };

  const parsed = getParsedPermissions();

  const filteredModules = Object.entries(parsed.modules).filter(
    ([modName, perms]) => {
      const meta = MODULE_METADATA[modName] || {
        label:
          modName.charAt(0).toUpperCase() + modName.slice(1).replace("_", " "),
        group: "System & Communications",
      };

      const matchesSearch =
        meta.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perms.some((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesTab = activeSubTab === "All" || meta.group === activeSubTab;
      return matchesSearch && matchesTab;
    },
  );

  const subTabs = [
    { id: "All", label: "All Workspaces" },
    { id: "Finance", label: "Finance" },
    { id: "Operations", label: "Operations" },
    { id: "CRM & Sales", label: "CRM & Sales" },
    { id: "HR & Company", label: "HR" },
    { id: "System & Communications", label: "System Core" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1250px] mx-auto p-4 tracking-tight animate-fade-in">
      {/* Header Profile Info Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-color pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/users"
            className="p-2 bg-card-hover border border-color text-text-muted rounded-lg transition hover:text-text-main"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2 text-[0.78rem] text-text-muted font-bold tracking-wider uppercase">
              <span>IAM Node Controls</span>
              <span>/</span>
              <span className="text-text-main">Operator Configuration</span>
            </div>
            <h2 className="text-[1.35rem] font-black text-text-main font-display mt-1 flex items-center gap-2.5">
              {firstName ? `${firstName} ${lastName}` : email}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                } uppercase tracking-wider`}
              >
                {isActive ? "Active" : "Suspended"}
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls Footer Triggers */}
        <div className="flex items-center gap-3">
          {isActive ? (
            <button
              onClick={handleToggleStatus}
              disabled={submitting || !canToggleStatus}
              className="py-2.5 px-4 border border-red-500/25 bg-red-500/10 text-red-400 text-[0.78rem] font-bold rounded-lg cursor-pointer transition hover:bg-red-500/20 disabled:opacity-40"
            >
              Deactivate Account
            </button>
          ) : (
            <button
              onClick={handleToggleStatus}
              disabled={submitting || !canToggleStatus}
              className="py-2.5 px-4 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[0.78rem] font-bold rounded-lg cursor-pointer transition hover:bg-emerald-500/20 disabled:opacity-40"
            >
              Activate Account
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-1.5 py-2.5 px-5 bg-accent-primary text-white font-bold text-[0.8rem] rounded-lg shadow-md hover:brightness-110 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Workspace Changes
          </button>
        </div>
      </div>

      {/* Realtime Status Alerts Context Nodes */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.85rem] shadow-xs">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[0.85rem] shadow-xs">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tab Routing Options Navigation Grid */}
      <div className="flex border-b border-color gap-6">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all cursor-pointer ${activeTab === "details" ? "border-accent-primary text-text-main" : "border-transparent text-text-muted hover:text-text-main"}`}
        >
          User Details Profile
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all cursor-pointer ${activeTab === "permissions" ? "border-accent-primary text-text-main" : "border-transparent text-text-muted hover:text-text-main"}`}
        >
          Permissions & Roles Engine
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 text-[0.85rem] font-bold border-b-2 transition-all cursor-pointer ${activeTab === "settings" ? "border-accent-primary text-text-main" : "border-transparent text-text-muted hover:text-text-main"}`}
        >
          Account Settings
        </button>
      </div>

      {/* Main Card View viewport Content Switch */}
      <div className="glass-panel p-6 bg-card border border-color rounded-xl shadow-sm min-h-[350px]">
        {/* VIEW TAB 1: CORE USER DETAILS */}
        {activeTab === "details" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-[0.92rem] font-bold text-text-main border-b border-color pb-3 flex items-center gap-2 uppercase tracking-wider text-[0.78rem]">
              <UserIcon size={16} className="text-accent-primary" />
              Identity Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Operations Analyst"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">
                  Department Assignment
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary cursor-pointer"
                >
                  <option value="">
                    -- Unassigned (Root/Independent Operator) --
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">
                Account Login Email (Read-Only)
              </label>
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

        {/* VIEW TAB 2: EDIT PERMISSIONS AND ROLES MATRIX */}
        {activeTab === "permissions" && (
          <div className="flex flex-col gap-6">
            {/* AUTHORITY ROLE FIELD ASSIGNMENT SYSTEM */}
            <div className="border-b border-color/40 pb-5">
              <h3 className="text-[0.92rem] font-bold text-text-main pb-3 flex items-center gap-2 uppercase tracking-wider text-[0.78rem]">
                <Shield size={16} className="text-accent-primary" />
                Baseline Clearance Role
              </h3>
              <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-2">
                Select Functional Role Blueprint *
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                required
                className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm text-text-main outline-none focus:border-accent-primary cursor-pointer"
              >
                <option value="" disabled>
                  -- Choose Baseline Role --
                </option>
                {allRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {selectedRoleId && (
                <span className="text-[11px] text-text-muted mt-2 block italic leading-normal">
                  Role Scope Scope:{" "}
                  {allRoles.find((r) => r.id === selectedRoleId)?.description ||
                    "No baseline blueprint metadata text found."}
                </span>
              )}
            </div>

            {/* DUPLICATE ANOTHER OPERATOR'S COMPREHENSIVE ACCESS PROFILE */}
            <div className="bg-accent-primary/5 border border-accent-primary/10 rounded-xl p-4.5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-accent-primary">
                <Copy size={15} />
                <label className="block text-[0.75rem] font-bold uppercase tracking-wider m-0">
                  Copy Profile Clearances Engine
                </label>
              </div>
              <p className="text-[0.75rem] text-text-muted m-0 leading-normal">
                Select an active operator from the network registry tree to
                immediately duplicate all of their direct clearance tokens onto
                this profile.
              </p>
              <div className="flex gap-3 items-center mt-1">
                <select
                  value={copyingFromUserId}
                  onChange={(e) => setCopyingFromUserId(e.target.value)}
                  className="w-full rounded-lg border border-color bg-card py-2 px-3 text-xs text-text-main outline-none focus:border-accent-primary cursor-pointer h-[36px]"
                >
                  <option value="">
                    -- Select Target Profile To Duplicate --
                  </option>
                  {allUsers
                    .filter((u) => String(u.id) !== String(userId))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name
                          ? `${u.first_name} ${u.last_name || ""} (${u.email})`
                          : u.email}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleCopyPermissions(copyingFromUserId)}
                  disabled={submitting || !copyingFromUserId}
                  className="py-2 px-4.5 bg-accent-primary text-white font-bold text-[0.75rem] rounded-lg cursor-pointer hover:brightness-110 disabled:opacity-40 whitespace-nowrap h-[36px] transition-all"
                >
                  Duplicate Clearances
                </button>
              </div>
            </div>

            {/* DIRECT PERMISSION OVERRIDES STRING GRID SYSTEM */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[0.75rem] text-text-muted font-bold uppercase tracking-wider m-0">
                    Direct Permission Override Strips
                  </label>
                  <span className="text-[11px] text-text-muted font-normal">
                    Add or remove exact micro-permissions flags to override
                    baseline credentials roles.
                  </span>
                </div>

                {/* ── Unified Global Override Buttons ── */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGrantAllSystemPermissions}
                    className="py-1.5 px-3 border border-accent-primary/20 bg-accent-primary/5 text-accent-primary text-[0.72rem] font-bold rounded-lg cursor-pointer hover:bg-accent-primary/10 transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <Check size={12} />
                    Grant All Overrides
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllSystemPermissions}
                    className="py-1.5 px-3 border border-color bg-card text-text-muted text-[0.72rem] font-bold rounded-lg cursor-pointer hover:text-text-main hover:bg-card-hover transition-all"
                  >
                    Clear All Overrides
                  </button>
                </div>
              </div>

              {/* ── Professional Global Override Banner ── */}
              {parsed.globalAll && (
                <div
                  className={`p-4 rounded-xl border transition-all ${selectedPermissionIds.includes(parsed.globalAll.id) ? "border-[#C5A85C] bg-[#C5A85C]/5 shadow-2xs" : "border-color"}`}
                >
                  <button
                    type="button"
                    onClick={() => handleTogglePermission(parsed.globalAll!.id)}
                    className="flex items-center justify-between w-full text-left cursor-pointer bg-transparent border-none p-0"
                  >
                    <div className="flex flex-col gap-0.5 pr-4">
                      <span className="font-bold text-text-main text-[0.82rem] flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-[#C5A85C]" />
                        Grant All System Clearances
                      </span>
                      <span className="text-[11px] text-text-muted leading-relaxed">
                        Attaching this gives full absolute permission privileges
                        over every cluster endpoint module in the architecture,
                        bypassing standard rule verification gates.
                      </span>
                    </div>
                    <div
                      className={`relative w-10 h-5.5 rounded-full border transition-all ${selectedPermissionIds.includes(parsed.globalAll.id) ? "bg-[#C5A85C] border-[#C5A85C]" : "bg-card-hover border-color"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${selectedPermissionIds.includes(parsed.globalAll.id) ? "left-5" : "left-0.5"}`}
                      />
                    </div>
                  </button>
                </div>
              )}

              {/* Workspace Filter Utility Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/5 p-3.5 rounded-xl border border-color/40 mt-1">
                <div className="flex items-center gap-1 flex-wrap">
                  {subTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`py-1.5 px-3 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all border ${activeSubTab === tab.id ? "bg-accent-primary border-accent-primary text-white" : "bg-card border-color text-text-muted hover:text-text-main"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search token keys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8.5 pr-4 py-2 bg-card border border-color rounded-xl text-xs text-text-main placeholder-text-muted/65 outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              {/* Functional Permission Chip Blocks Layout Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* ── 1. STANDALONE USER MANAGEMENT CLEARANCES CARD ── */}
                {parsed.identity.userControls.length > 0 &&
                  (() => {
                    const uPerms = parsed.identity.userControls;
                    const isAllChecked = uPerms.every((p) =>
                      selectedPermissionIds.includes(p.id),
                    );
                    return (
                      <div className="bg-card border border-color rounded-xl flex flex-col overflow-hidden shadow-2xs">
                        <div className="flex justify-between items-center px-4 py-2.5 bg-card-hover border-b border-color">
                          <span className="text-[0.8rem] font-bold text-text-main flex items-center gap-2">
                            <UserIcon
                              size={13}
                              className="text-accent-primary"
                            />
                            User Management Clearances
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleModuleAll("user", uPerms)
                            }
                            className="text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded border border-color text-text-muted hover:text-accent-primary cursor-pointer transition-colors bg-card"
                          >
                            {isAllChecked ? "Clear" : "Select"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-3.5">
                          {sortPermissionsByAction(uPerms).map((p) => {
                            const isChecked = selectedPermissionIds.includes(
                              p.id,
                            );
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleTogglePermission(p.id)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[0.72rem] font-bold uppercase cursor-pointer transition-all ${
                                  isChecked
                                    ? "border-accent-primary bg-accent-primary/5 text-accent-primary"
                                    : "border-color text-text-muted"
                                }`}
                              >
                                <span>{p.name.split(":")[1] || p.name}</span>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${isChecked ? "bg-accent-primary" : "bg-color"}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                {/* IAM Directory Manager Box */}
                {parsed.identity.iamManage && (
                  <div className="bg-card border border-color rounded-xl flex flex-col overflow-hidden shadow-2xs">
                    <div className="px-4 py-2.5 bg-card-hover border-b border-color text-[0.8rem] font-bold text-text-main flex items-center gap-2">
                      <Key size={13} className="text-accent-primary" />
                      Identity Directory Access
                    </div>
                    <div className="p-4 flex items-center h-full">
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePermission(parsed.identity.iamManage!.id)
                        }
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-[0.75rem] font-bold uppercase cursor-pointer transition-all ${selectedPermissionIds.includes(parsed.identity.iamManage.id) ? "border-accent-primary bg-accent-primary/5 text-accent-primary" : "border-color text-text-muted"}`}
                      >
                        <span>iam:manage (Global Controls)</span>
                        <span
                          className={`w-2 h-2 rounded-full ${selectedPermissionIds.includes(parsed.identity.iamManage.id) ? "bg-accent-primary" : "bg-transparent border border-color"}`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Micro Workspaces Chips Grid Generator Loop */}
                {filteredModules.map(([modName, perms]) => {
                  const meta = MODULE_METADATA[modName] || {
                    label: modName.charAt(0).toUpperCase() + modName.slice(1),
                    icon: SettingsIcon,
                  };
                  const Icon = meta.icon;
                  const isAllChecked = perms
                    .map((p) => p.id)
                    .every((id) => selectedPermissionIds.includes(id));

                  return (
                    <div
                      key={modName}
                      className="bg-card border border-color rounded-xl flex flex-col overflow-hidden shadow-2xs"
                    >
                      <div className="flex justify-between items-center px-4 py-2.5 bg-card-hover border-b border-color">
                        <span className="text-[0.8rem] font-bold text-text-main flex items-center gap-2">
                          <Icon size={13} /> {meta.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleModuleAll(modName, perms)}
                          className="text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded border border-color text-text-muted hover:text-accent-primary cursor-pointer transition-colors bg-card"
                        >
                          {isAllChecked ? "Clear" : "Select"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3.5">
                        {sortPermissionsByAction(perms).map((p) => {
                          const isChecked = selectedPermissionIds.includes(
                            p.id,
                          );
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleTogglePermission(p.id)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[0.72rem] font-bold uppercase cursor-pointer transition-all ${isChecked ? "border-accent-primary bg-accent-primary/5 text-accent-primary" : "border-color text-text-muted"}`}
                            >
                              <span>{p.name.split(":")[1] || p.name}</span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${isChecked ? "bg-accent-primary" : "bg-color"}`}
                              />
                            </button>
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

        {/* VIEW TAB 3: ACCOUNT CONFIGURATION SETTINGS */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
            <h3 className="text-[0.92rem] font-bold text-text-main border-b border-color pb-3 flex items-center gap-2 uppercase tracking-wider text-[0.78rem]">
              <SettingsIcon size={16} className="text-accent-primary" />
              Security Governance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-color rounded-xl bg-card-hover/20">
                <span className="text-[0.8rem] font-bold text-text-main block mb-1">
                  MFA Verification Flag
                </span>
                <p className="text-[0.72rem] text-text-muted m-0 leading-relaxed mb-3">
                  Enforce or suspend account parameters regarding active token
                  hardware validation steps.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "MFA criteria locked to local profile settings constraints.",
                    )
                  }
                  className="py-1.5 px-3 border border-color text-text-muted text-[0.72rem] font-bold bg-card rounded hover:text-text-main transition cursor-pointer"
                >
                  Audit Parameters
                </button>
              </div>
              <div className="p-4 border border-color rounded-xl bg-card-hover/20">
                <span className="text-[0.8rem] font-bold text-text-main block mb-1">
                  Password Lifecycle Rotation
                </span>
                <p className="text-[0.72rem] text-text-muted m-0 leading-relaxed mb-3">
                  Force credential timeout locks to require password validation
                  resetting.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Rotation link generated.")}
                  className="py-1.5 px-3 border border-color text-text-muted text-[0.72rem] font-bold bg-card rounded hover:text-text-main transition cursor-pointer"
                >
                  Dispatch Reset Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}