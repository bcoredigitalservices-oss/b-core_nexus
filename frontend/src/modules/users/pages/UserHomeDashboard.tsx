import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  CalendarDays,
  Loader2,
  CheckSquare,
  Square,
  Zap,
  Sun,
  Sunset,
  Moon,
  Bell,
  DollarSign,
  FileText,
  CreditCard,
  Building,
  Percent,
  BarChart2,
  PieChart as PieIcon,
  Briefcase,
  Receipt,
  LineChart,
  Package,
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
  Settings,
  Cog,
  Cpu,
  FolderKanban,
  Truck,
  Wrench,
  Map,
  Shield,
  Layers,
  LayoutGrid,
  ArrowRight,
  Server,
  Activity,
  Lock,
  Building2,
  Boxes,
  Box,
  MessagesSquare,
  Factory,
  BadgeCheck,
  UserPlus,
  Headphones,
  PiggyBank,
  Compass,
  TrendingUp,
  Mail,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppContext } from "../../../context/AppContext";
import {
  isAdmin as isUserAdmin,
  hasPermission,
} from "../../../utils/permissions";
import CreateTaskModal from "../../users/components/CreateTaskModal";

// ── Types ───────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner_id: string;
}

// ── Workspace shortcut map ───────────────────────────────────────────────────
const WORKSPACE_MAP: Record<
  string,
  { label: string; route: string; icon: React.ReactNode; color: string }
> = {
  accounting: {
    label: "Accounting",
    route: "/workspaces/finance/accounting",
    icon: <DollarSign size={20} />,
    color: "#00f5a0",
  },
  invoicing: {
    label: "Invoicing",
    route: "/workspaces/finance/invoicing",
    icon: <FileText size={20} />,
    color: "#00f5a0",
  },
  payments: {
    label: "Payments",
    route: "/workspaces/finance/payments",
    icon: <CreditCard size={20} />,
    color: "#00f5a0",
  },
  banking: {
    label: "Banking",
    route: "/workspaces/finance/banking",
    icon: <Building size={20} />,
    color: "#00f5a0",
  },
  taxes: {
    label: "Taxes",
    route: "/workspaces/finance/taxes",
    icon: <Percent size={20} />,
    color: "#00f5a0",
  },
  reports: {
    label: "Reports",
    route: "/workspaces/finance/reports",
    icon: <BarChart2 size={20} />,
    color: "#00f5a0",
  },
  budget: {
    label: "Budget",
    route: "/workspaces/finance/budgets",
    icon: <PieIcon size={20} />,
    color: "#00f5a0",
  },
  shares: {
    label: "Shares",
    route: "/workspaces/finance/shares",
    icon: <Briefcase size={20} />,
    color: "#00f5a0",
  },
  expenses: {
    label: "Expenses",
    route: "/workspaces/finance/expenses",
    icon: <Receipt size={20} />,
    color: "#00f5a0",
  },
  assets: {
    label: "Assets",
    route: "/workspaces/inventory",
    icon: <Briefcase size={20} />,
    color: "#ffb703",
  },
  products: {
    label: "Products",
    route: "/workspaces/inventory/products",
    icon: <Package size={20} />,
    color: "#ffb703",
  },
  warehouse: {
    label: "Warehouse",
    route: "/workspaces/inventory/warehouse",
    icon: <Building size={20} />,
    color: "#ffb703",
  },
  stock: {
    label: "Stock",
    route: "/workspaces/inventory/stock",
    icon: <ClipboardList size={20} />,
    color: "#ffb703",
  },
  buying: {
    label: "Buying",
    route: "/workspaces/inventory/buying",
    icon: <ShoppingCart size={20} />,
    color: "#ffb703",
  },
  pos: {
    label: "POS",
    route: "/workspace/crm/pos",
    icon: <Monitor size={20} />,
    color: "#00f2fe",
  },
  crm: {
    label: "CRM",
    route: "/workspace/crm",
    icon: <Users size={20} />,
    color: "#00f2fe",
  },
  sales: {
    label: "Sales",
    route: "/workspace/crm/sales-orders",
    icon: <Tag size={20} />,
    color: "#00f2fe",
  },
  support: {
    label: "Support",
    route: "/workspace/crm/support",
    icon: <LifeBuoy size={20} />,
    color: "#00f2fe",
  },
  marketing: {
    label: "Marketing",
    route: "/workspace/crm/marketing",
    icon: <Megaphone size={20} />,
    color: "#00f2fe",
  },
  website: {
    label: "Website",
    route: "/workspace/crm/website",
    icon: <Globe size={20} />,
    color: "#00f2fe",
  },
  hr: {
    label: "HR",
    route: "/workspace/hr",
    icon: <UserCheck size={20} />,
    color: "#f472b6",
  },
  payroll: {
    label: "Payroll",
    route: "/workspace/hr/payroll",
    icon: <Wallet size={20} />,
    color: "#f472b6",
  },
  attendance: {
    label: "Attendance",
    route: "/workspace/hr/attendance",
    icon: <Calendar size={20} />,
    color: "#f472b6",
  },
  recruitment: {
    label: "Recruitment",
    route: "/workspace/hr/recruitment",
    icon: <Award size={20} />,
    color: "#f472b6",
  },
  performance: {
    label: "Performance",
    route: "/workspace/hr/performance",
    icon: <LineChart size={20} />,
    color: "#f472b6",
  },
  leaves: {
    label: "Leaves",
    route: "/workspace/hr/leaves",
    icon: <Plane size={20} />,
    color: "#f472b6",
  },
  employee_groups: {
    label: "Employee Groups",
    route: "/workspace/hr/employee-groups",
    icon: <Users size={20} />,
    color: "#f472b6",
  },
  manufacturing: {
    label: "Manufacturing",
    route: "/workspace/operations",
    icon: <Cpu size={20} />,
    color: "#c084fc",
  },
  projects: {
    label: "Projects",
    route: "/workspace/operations/projects",
    icon: <FolderKanban size={20} />,
    color: "#c084fc",
  },
  logistics: {
    label: "Logistics",
    route: "/workspace/operations/logistics",
    icon: <Truck size={20} />,
    color: "#c084fc",
  },
  maintenance: {
    label: "Maintenance",
    route: "/workspace/operations/maintenance",
    icon: <Wrench size={20} />,
    color: "#c084fc",
  },
  field_ops: {
    label: "Field Ops",
    route: "/workspace/operations/field-ops",
    icon: <Map size={20} />,
    color: "#c084fc",
  },
  chats: {
    label: "Chats",
    route: "/workspace/chats",
    icon: <MessageSquare size={20} />,
    color: "#38bdf8",
  },
  email: {
    label: "Email",
    route: "/workspace/email",
    icon: <MessageSquare size={20} />,
    color: "#38bdf8",
  },
  internals: {
    label: "Internals",
    route: "/settings",
    icon: <Settings size={20} />,
    color: "#a3a3a3",
  },
  cog: {
    label: "System Core",
    route: "/settings",
    icon: <Cog size={20} />,
    color: "#a3a3a3",
  },
};

interface WorkspaceModule {
  key: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

interface DepartmentDefinition {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  glowColor: string;
  workspaces: WorkspaceModule[];
}

const DEPARTMENTS: DepartmentDefinition[] = [
  {
    id: "finance",
    name: "Finance & Accounting",
    description:
      "Accounting, banking operations, tax compliance and financial reporting.",
    accentColor: "#00f5a0",
    glowColor: "rgba(0,245,160,0.14)",
    workspaces: [
      {
        key: "accounting",
        label: "Accounting",
        icon: <FileText size={20} />,
        route: "/workspaces/finance/accounting",
        color: "#00f5a0",
      },
      {
        key: "invoicing",
        label: "Invoicing",
        icon: <FileText size={20} />,
        route: "/workspaces/finance/invoicing",
        color: "#00f5a0",
      },
      {
        key: "payments",
        label: "Payments",
        icon: <CreditCard size={20} />,
        route: "/workspaces/finance/payments",
        color: "#00f5a0",
      },
      {
        key: "banking",
        label: "Banking",
        icon: <PiggyBank size={20} />,
        route: "/workspaces/finance/banking",
        color: "#00f5a0",
      },
      {
        key: "taxes",
        label: "Taxes",
        icon: <FileText size={20} />,
        route: "/workspaces/finance/taxes",
        color: "#00f5a0",
      },
      {
        key: "reports",
        label: "Reports",
        icon: <BarChart2 size={20} />,
        route: "/workspaces/finance/reports",
        color: "#00f5a0",
      },
      {
        key: "budget",
        label: "Budget",
        icon: <PieIcon size={20} />,
        route: "/workspaces/finance/budgets",
        color: "#00f5a0",
      },
      {
        key: "shares",
        label: "Shares",
        icon: <Briefcase size={20} />,
        route: "/workspaces/finance/shares",
        color: "#00f5a0",
      },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    description:
      "Assets, products, stock control, warehouse operations and procurement.",
    accentColor: "#ffb703",
    glowColor: "rgba(255,183,3,0.14)",
    workspaces: [
      {
        key: "assets",
        label: "Assets",
        icon: <Briefcase size={20} />,
        route: "/workspace/inventory/assets",
        color: "#ffb703",
      },
      {
        key: "products",
        label: "Products",
        icon: <Package size={20} />,
        route: "/workspace/inventory/products",
        color: "#ffb703",
      },
      {
        key: "items",
        label: "Items",
        icon: <Box size={20} />,
        route: "/workspace/items/item",
        color: "#ffb703",
      },
      {
        key: "warehouse",
        label: "Warehouse",
        icon: <Building size={20} />,
        route: "/workspace/inventory/warehouses",
        color: "#ffb703",
      },
      {
        key: "stock",
        label: "Stock",
        icon: <ClipboardList size={20} />,
        route: "/workspace/inventory/stock",
        color: "#ffb703",
      },
      {
        key: "buying",
        label: "Buying",
        icon: <ShoppingCart size={20} />,
        route: "/workspace/inventory/buying",
        color: "#ffb703",
      },
    ],
  },
  {
    id: "crm",
    name: "CRM & Sales",
    description: "POS, lead management, sales pipeline and customer support.",
    accentColor: "#00f2fe",
    glowColor: "rgba(0,242,254,0.14)",
    workspaces: [
      {
        key: "pos",
        label: "POS",
        icon: <CreditCard size={20} />,
        route: "/workspace/crm/pos",
        color: "#00f2fe",
      },
      {
        key: "crm",
        label: "CRM",
        icon: <Users size={20} />,
        route: "/workspace/crm",
        color: "#00f2fe",
      },
      {
        key: "sales",
        label: "Sales",
        icon: <TrendingUp size={20} />,
        route: "/workspace/crm/sales",
        color: "#00f2fe",
      },
      {
        key: "support",
        label: "Support",
        icon: <Headphones size={20} />,
        route: "/workspace/crm/support",
        color: "#00f2fe",
      },
    ],
  },
  {
    id: "operations",
    name: "Operations & Management",
    description:
      "Field ops, maintenance, manufacturing, projects, QA and logistics.",
    accentColor: "#c084fc",
    glowColor: "rgba(192,132,252,0.14)",
    workspaces: [
      {
        key: "field_ops",
        label: "Field Ops",
        icon: <Compass size={20} />,
        route: "/workspaces/operations/field",
        color: "#c084fc",
      },
      {
        key: "maintenance",
        label: "Maintenance",
        icon: <Wrench size={20} />,
        route: "/workspaces/operations/maintenance",
        color: "#c084fc",
      },
      {
        key: "manufacturing",
        label: "Manufacturing",
        icon: <Factory size={20} />,
        route: "/workspaces/operations/manufacturing",
        color: "#c084fc",
      },
      {
        key: "projects",
        label: "Projects",
        icon: <ClipboardList size={20} />,
        route: "/workspaces/operations/projects",
        color: "#c084fc",
      },
      {
        key: "qa",
        label: "QA",
        icon: <BadgeCheck size={20} />,
        route: "/workspaces/operations/qa",
        color: "#c084fc",
      },
      {
        key: "qt",
        label: "QT",
        icon: <Layers size={20} />,
        route: "/workspaces/operations/qt",
        color: "#c084fc",
      },
      {
        key: "logistics",
        label: "Logistics",
        icon: <Truck size={20} />,
        route: "/workspaces/operations/logistics",
        color: "#c084fc",
      },
    ],
  },
  {
    id: "hr",
    name: "HR & Company",
    description:
      "Payroll, attendance, recruitment, performance, leaves and expenses.",
    accentColor: "#f472b6",
    glowColor: "rgba(244,114,182,0.14)",
    workspaces: [
      {
        key: "expenses",
        label: "Expenses",
        icon: <DollarSign size={20} />,
        route: "/workspaces/hr/expenses",
        color: "#f472b6",
      },
      {
        key: "hr",
        label: "HR",
        icon: <UserCheck size={20} />,
        route: "/workspaces/hr",
        color: "#f472b6",
      },
      {
        key: "payroll",
        label: "Payroll",
        icon: <CreditCard size={20} />,
        route: "/workspaces/hr/payroll",
        color: "#f472b6",
      },
      {
        key: "attendance",
        label: "Attendance",
        icon: <CalendarDays size={20} />,
        route: "/workspaces/hr/attendance",
        color: "#f472b6",
      },
      {
        key: "recruitment",
        label: "Recruitment",
        icon: <UserPlus size={20} />,
        route: "/workspaces/hr/recruitment",
        color: "#f472b6",
      },
      {
        key: "performance",
        label: "Performance",
        icon: <TrendingUp size={20} />,
        route: "/workspaces/hr/performance",
        color: "#f472b6",
      },
      {
        key: "leaves",
        label: "Leaves",
        icon: <CalendarDays size={20} />,
        route: "/workspaces/hr/leaves",
        color: "#f472b6",
      },
    ],
  },
  {
    id: "communications",
    name: "Communications",
    description: "Internal chats, employee groups, email and team messaging.",
    accentColor: "#38bdf8",
    glowColor: "rgba(56,189,248,0.14)",
    workspaces: [
      {
        key: "chats",
        label: "Chats",
        icon: <MessageSquare size={20} />,
        route: "/workspaces/comms/chats",
        color: "#38bdf8",
      },
      {
        key: "employee_groups",
        label: "Groups",
        icon: <MessagesSquare size={20} />,
        route: "/workspaces/comms/groups",
        color: "#38bdf8",
      },
      {
        key: "email",
        label: "Email",
        icon: <Mail size={20} />,
        route: "/workspaces/comms/email",
        color: "#38bdf8",
      },
      {
        key: "message",
        label: "Message",
        icon: <MessagesSquare size={20} />,
        route: "/workspaces/comms/message",
        color: "#38bdf8",
      },
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    description:
      "Marketing campaigns, website management and brand operations.",
    accentColor: "#fb923c",
    glowColor: "rgba(251,146,60,0.14)",
    workspaces: [
      {
        key: "marketing",
        label: "Marketing",
        icon: <Megaphone size={20} />,
        route: "/workspaces/utilities/marketing",
        color: "#fb923c",
      },
      {
        key: "campaigns",
        label: "Campaigns",
        icon: <BarChart2 size={20} />,
        route: "/workspaces/utilities/campaigns",
        color: "#fb923c",
      },
      {
        key: "website",
        label: "Website",
        icon: <Globe size={20} />,
        route: "/workspaces/utilities/website",
        color: "#fb923c",
      },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12)
    return {
      text: "Good morning",
      icon: <Sun size={17} className="text-amber-400" />,
    };
  if (h < 17)
    return {
      text: "Good afternoon",
      icon: <Sunset size={17} className="text-orange-400" />,
    };
  return {
    text: "Good evening",
    icon: <Moon size={17} className="text-indigo-400" />,
  };
}

function priorityColor(p: string) {
  if (p === "high") return "text-red-400 bg-red-500/10 border-red-500/20";
  if (p === "medium") return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  return "text-text-muted bg-card border-color";
}

function isOverdue(t: Task) {
  if (!t.due_date || t.status === "completed" || t.status === "cancelled")
    return false;
  return new Date(t.due_date) < new Date(new Date().toDateString());
}
function isDueToday(t: Task) {
  if (!t.due_date) return false;
  return new Date(t.due_date).toDateString() === new Date().toDateString();
}
function isUpcoming(t: Task) {
  if (!t.due_date || t.status === "completed" || t.status === "cancelled")
    return false;
  const due = new Date(t.due_date);
  const today = new Date();
  const in7 = new Date();
  in7.setDate(today.getDate() + 7);
  return due > today && due <= in7;
}

const CHART_COLORS = ["#9d4edd", "#00f2fe", "#00f5a0", "#ffb703", "#ff0076"];
const healthData = [
  { name: "Mon", requests: 4000 },
  { name: "Tue", requests: 3000 },
  { name: "Wed", requests: 2000 },
  { name: "Thu", requests: 2780 },
  { name: "Fri", requests: 1890 },
  { name: "Sat", requests: 2390 },
  { name: "Sun", requests: 3490 },
];

// ─── Department Card ──────────────────────────────────────────────────────────

interface DeptCardProps {
  dept: DepartmentDefinition;
  permittedWorkspaceKeys: string[];
  onLaunch: (route: string) => void;
  isSuperUser: boolean;
}

const getPermittedOperations = (
  wsKey: string,
  permissions: string[],
  isSuperUser: boolean,
) => {
  if (isSuperUser || permissions.includes("*:*")) {
    return ["read", "write", "create", "delete", "export"];
  }
  return permissions
    .filter((p) => p.startsWith(`${wsKey}:`))
    .map((p) => p.split(":")[1]);
};

function DepartmentCard({
  dept,
  permittedWorkspaceKeys,
  onLaunch,
  isSuperUser,
}: DeptCardProps) {
  const { currentUser } = useAppContext();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden bg-card rounded-2xl p-6 transition-all duration-200 border border-color shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.03)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-extrabold text-text-main font-display mb-1 tracking-tight leading-snug">
            {dept.name}
          </h3>
          <p className="text-[0.78rem] text-text-muted leading-relaxed max-w-[280px]">
            {dept.description}
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full whitespace-nowrap"
          style={{
            backgroundColor: `${dept.accentColor}12`,
            color: dept.accentColor,
          }}
        >
          {dept.workspaces.length} MODULES
        </span>
      </div>

      {/* Workspace List - dynamically showing permitted tools like an app with read/write details */}
      <div className="flex flex-col gap-3">
        {dept.workspaces.map((ws) => {
          const permitted =
            isSuperUser || permittedWorkspaceKeys.includes(ws.key);
          const ops = getPermittedOperations(
            ws.key,
            currentUser?.permissions || [],
            isSuperUser,
          );

          return (
            <div
              key={ws.key}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 bg-white ${
                permitted
                  ? "border-gray-150 hover:border-gray-300"
                  : "border-gray-100 opacity-60"
              }`}
              style={{ borderColor: "rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center gap-3.5">
                {/* Icon Container */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: permitted ? `${ws.color}14` : "#f1f5f9",
                    color: permitted ? ws.color : "#94a3b8",
                  }}
                >
                  {ws.icon}
                </div>

                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[0.85rem] font-bold text-text-main">
                    {ws.label}
                  </span>
                  {permitted ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {ops.map((op) => (
                        <span
                          key={op}
                          className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-500"
                        >
                          {op}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1 font-medium">
                      <Lock size={10} className="text-text-muted opacity-50" />
                      Locked / No clearance
                    </span>
                  )}
                </div>
              </div>

              {permitted && (
                <button
                  onClick={() => onLaunch(ws.route)}
                  className="px-4 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 bg-white hover:bg-slate-50 text-gray-700 text-[11px] font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Launch
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserHomeDashboard() {
  const { token, authFetch, currentUser } = useAppContext();
  const navigate = useNavigate();

  // Admin check — drives which sections are shown
  const isAdmin =
    isUserAdmin(currentUser) ||
    currentUser?.functional_roles?.includes("manager");

  const canReadTasks = isAdmin || hasPermission(currentUser, "tasks:read");
  const canCreateTasks = isAdmin || hasPermission(currentUser, "tasks:create");
  const canWriteTasks = isAdmin || hasPermission(currentUser, "tasks:write");

  // ── Task state ──
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ── Admin org state ──
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepts] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [orgProfile, setOrgProfile] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const permittedWorkspaceKeys: string[] = isAdmin
    ? DEPARTMENTS.flatMap((d) => d.workspaces.map((w) => w.key))
    : (currentUser?.permissions || []).reduce((acc: string[], perm: string) => {
        const parts = perm.split(":");
        if (parts.length === 2) {
          const wsKey = parts[0];
          if (!acc.includes(wsKey)) {
            acc.push(wsKey);
          }
        }
        return acc;
      }, []);

  // ── Load tasks ──
  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const data = await authFetch("/tasks/my");
      if (data) setTasks(data);
    } catch {
      /* silent */
    } finally {
      setTasksLoading(false);
    }
  };

  // ── Load organization profile (for all users) ──
  const loadOrgProfile = async () => {
    try {
      const data = await authFetch("/organization/profile");
      if (data) setOrgProfile(data);
    } catch {
      /* silent */
    }
  };

  // ── Load admin data (only if admin) ──
  const loadAdminData = async () => {
    if (!token || !isAdmin) return;
    setAdminLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const base = `${import.meta.env.VITE_API_URL}/api/v1`;
      const [usersRes, worksRes] = await Promise.all([
        fetch(`${base}/auth/users`, { headers }),
        fetch(`${base}/iam/workspaces`, { headers }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (worksRes.ok) setWorkspaces(await worksRes.json());
    } catch {
      /* silent */
    } finally {
      setAdminLoading(false);
    }
  };

  // ── Load departments (for all users, to resolve their department name) ──
  const loadDepartments = async () => {
    try {
      const data = await authFetch("/iam/departments");
      if (data) setDepts(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (token) {
      if (canReadTasks) {
        loadTasks();
      } else {
        setTasksLoading(false);
      }
      loadOrgProfile();
      loadAdminData();
      loadDepartments();
    }
  }, [token]);

  useEffect(() => {
    const handleOpenModal = () => {
      setSelectedTask(null);
      setTaskModalOpen(true);
    };
    window.addEventListener("open-task-modal", handleOpenModal);
    return () => window.removeEventListener("open-task-modal", handleOpenModal);
  }, []);

  // ── Derived data ──
  const greeting = getGreeting();
  const userName = currentUser?.first_name
    ? `${currentUser.first_name}${(currentUser as any).last_name ? " " + (currentUser as any).last_name : ""}`
    : currentUser?.email?.split("@")[0] || "there";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const overdueTasks = tasks.filter(isOverdue);
  const todayTasks = tasks.filter(
    (t) =>
      isDueToday(t) && t.status !== "completed" && t.status !== "cancelled",
  );
  const upcomingTasks = tasks.filter(isUpcoming);

  const deptData =
    departments.length > 0
      ? departments.map((d) => ({
          name: d.name,
          value: Math.floor(Math.random() * 20) + 5,
        }))
      : [
          { name: "Engineering", value: 40 },
          { name: "Sales", value: 30 },
          { name: "Marketing", value: 20 },
          { name: "HR", value: 10 },
        ];

  const workspaceBarData =
    workspaces.length > 0
      ? workspaces.map((w) => ({
          name: w.name || w.industry_vertical,
          active: 1,
        }))
      : [
          { name: "CRM", active: 1 },
          { name: "HR", active: 1 },
          { name: "Finance", active: 1 },
        ];

  const handleToggleTask = async (task: Task) => {
    setActionId(task.id);
    const next = task.status === "completed" ? "in_progress" : "completed";
    try {
      await authFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      await loadTasks();
    } catch {
      /* silent */
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1300px] mx-auto pb-10 animate-[fadeIn_0.25s_ease]">
      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0F2E59] to-[#1a3f73] border border-[var(--border-color)] rounded-2xl py-7 px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            {greeting.icon}
            <span className="text-white/70 text-[0.85rem] font-medium">
              {greeting.text}
            </span>
          </div>
          <h1 className="text-[1.65rem] font-black text-white font-display leading-tight">
            {userName}
          </h1>
          <p className="text-white/60 text-[0.8rem] mt-1 flex items-center gap-2 flex-wrap">
            <CalendarDays size={13} />
            {todayLabel}
            {orgProfile?.legal_name && (
              <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/80">
                Company: {orgProfile.legal_name}
              </span>
            )}
            {(currentUser as any)?.designation && (
              <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/80">
                {(currentUser as any).designation}
              </span>
            )}
            {isAdmin && (
              <span className="px-2 py-0.5 bg-[#C5A85C]/20 border border-[#C5A85C]/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#C5A85C]">
                System Admin
              </span>
            )}
          </p>
        </div>
        {overdueTasks.length > 0 && (
          <div className="z-10 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-300 text-sm font-semibold animate-pulse">
            <Bell size={16} />
            {overdueTasks.length} overdue task
            {overdueTasks.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Task Summary Cards (everyone) ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pending",
            value: pendingTasks.length,
            color: "text-amber-400",
            bg: "bg-amber-500/8 border-amber-500/20",
            icon: <Clock size={18} />,
          },
          {
            label: "In Progress",
            value: inProgressTasks.length,
            color: "text-sky-400",
            bg: "bg-sky-500/8 border-sky-500/20",
            icon: <Zap size={18} />,
          },
          {
            label: "Due Today",
            value: todayTasks.length,
            color: "text-accent-primary",
            bg: "bg-accent-primary/8 border-accent-primary/20",
            icon: <CalendarDays size={18} />,
          },
          {
            label: "Overdue",
            value: overdueTasks.length,
            color: "text-red-400",
            bg: "bg-red-500/8 border-red-500/20",
            icon: <AlertTriangle size={18} />,
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`p-5 rounded-xl border flex items-center justify-between ${c.bg}`}
          >
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-text-muted mb-1">
                {c.label}
              </p>
              <p className={`text-2xl font-black ${c.color}`}>
                {tasksLoading ? "—" : c.value}
              </p>
            </div>
            <span className={c.color}>{c.icon}</span>
          </div>
        ))}
      </div>

      {/* ── Admin KPI Cards (admin only) ───────────────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              label: "Total Personnel",
              value: adminLoading ? "—" : users.length,
              color: "#00f2fe",
              icon: <Users size={20} />,
              sub: "Registered IAM Users",
            },
            {
              label: "Active Departments",
              value: adminLoading ? "—" : departments.length,
              color: "#00f5a0",
              icon: <Layers size={20} />,
              sub: "Operational divisions",
            },
            {
              label: "Cluster Workspaces",
              value: adminLoading ? "—" : workspaces.length,
              color: "#ffb703",
              icon: <LayoutGrid size={20} />,
              sub: "Provisioned & running",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="glass-panel p-6 bg-card border border-color rounded-2xl flex justify-between items-start"
            >
              <div>
                <p className="text-[0.72rem] uppercase tracking-wider text-text-muted font-bold mb-4">
                  {c.label}
                </p>
                <p className="text-[2.2rem] font-extrabold font-display text-text-main leading-none">
                  {c.value}
                </p>
                <p className="text-[0.78rem] text-text-muted mt-1.5">{c.sub}</p>
              </div>
              <span
                className="p-2 rounded-lg border border-color bg-card-hover"
                style={{ color: c.color }}
              >
                {c.icon}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Admin Charts + Shortcuts (admin only) ──────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
          {/* Charts column */}
          <div className="flex flex-col gap-6">
            {/* System activity area chart */}
            <div className="glass-panel p-6 bg-card border border-color rounded-2xl">
              <h3 className="text-[0.95rem] font-bold text-text-main mb-5 flex items-center gap-2">
                <Zap size={17} className="text-[#00f2fe]" /> System Activity &
                Health
              </h3>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={healthData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="uhdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#9d4edd"
                          stopOpacity={0.7}
                        />
                        <stop
                          offset="95%"
                          stopColor="#9d4edd"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border-color)",
                        borderRadius: "8px",
                        color: "var(--text-main)",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#9d4edd"
                      fillOpacity={1}
                      fill="url(#uhdGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dept + Workspace charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="glass-panel p-5 bg-card border border-color rounded-2xl">
                <h3 className="text-[0.85rem] font-bold text-text-main mb-4 flex items-center gap-2">
                  <Briefcase size={15} className="text-[#ffb703]" /> Department
                  Spread
                </h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {deptData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--bg-card)",
                          borderColor: "var(--border-color)",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-5 bg-card border border-color rounded-2xl">
                <h3 className="text-[0.85rem] font-bold text-text-main mb-4 flex items-center gap-2">
                  <Server size={15} className="text-[#00f5a0]" /> Workspace
                  Provisioning
                </h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workspaceBarData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--text-muted)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--bg-card)",
                          borderColor: "var(--border-color)",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      />
                      <Bar
                        dataKey="active"
                        fill="#00f5a0"
                        radius={[4, 4, 0, 0]}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Admin shortcuts column */}
          <div className="glass-panel bg-card border border-color rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-color bg-card-hover">
              <Shield size={15} className="text-[#9d4edd]" />
              <span className="text-[0.85rem] font-bold text-text-main uppercase tracking-wider">
                Admin Shortcuts
              </span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {[
                {
                  label: "User Console",
                  route: "/users",
                  color: "#9d4edd",
                  icon: <Users size={18} />,
                },
                {
                  label: "Departments & Mgmt",
                  route: "/departments",
                  color: "#00f2fe",
                  icon: <Layers size={18} />,
                },
                {
                  label: "All Workspaces",
                  route: "/workspaces",
                  color: "#00f5a0",
                  icon: <LayoutGrid size={18} />,
                },
              ].map((s) => (
                <button
                  key={s.route}
                  onClick={() => navigate(s.route)}
                  className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:brightness-110"
                  style={{
                    borderColor: `${s.color}30`,
                    backgroundColor: `${s.color}08`,
                    color: "var(--text-main)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span className="font-semibold text-[0.85rem]">
                      {s.label}
                    </span>
                  </div>
                  <ArrowRight size={15} className="text-text-muted" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Today's Tasks + Upcoming Deadlines (everyone) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's tasks — 2/3 */}
        <div className="lg:col-span-2 bg-card border border-color rounded-2xl overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-5 py-4 border-b border-color bg-card-hover">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-accent-primary" />
              <span className="font-bold text-text-main text-[0.82rem] uppercase tracking-wider">
                Today's Tasks
              </span>
              {canReadTasks && todayTasks.length > 0 && (
                <span className="text-[10px] font-bold bg-accent-primary text-white px-2 py-0.5 rounded-full">
                  {todayTasks.length}
                </span>
              )}
            </div>
            {canCreateTasks && (
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setTaskModalOpen(true);
                }}
                className="text-[0.72rem] font-bold text-accent-primary hover:underline cursor-pointer"
              >
                + New Task
              </button>
            )}
          </div>

          <div className="flex flex-col divide-y divide-[var(--border-color)]">
            {!canReadTasks ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2 bg-slate-50/50">
                <Lock size={26} className="text-slate-400 opacity-60" />
                <span className="text-sm font-semibold text-text-main">
                  Clearance Required
                </span>
                <span className="text-xs">Requires tasks:read permission</span>
              </div>
            ) : tasksLoading ? (
              <div className="flex justify-center items-center py-10 text-text-muted gap-2">
                <Loader2
                  className="animate-spin text-accent-primary"
                  size={18}
                />
                <span className="text-sm">Loading tasks...</span>
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted gap-2">
                <CheckCircle2
                  size={26}
                  className="text-emerald-500 opacity-60"
                />
                <span className="text-sm font-semibold">
                  No tasks due today
                </span>
                <span className="text-xs">You're all clear! ✓</span>
              </div>
            ) : (
              todayTasks.map((task) => {
                const done = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 px-5 py-3.5 hover:bg-card-hover/40 transition ${done ? "opacity-60" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      disabled={actionId === task.id || !canWriteTasks}
                      className="text-text-muted hover:text-accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {actionId === task.id ? (
                        <Loader2
                          className="animate-spin text-accent-primary"
                          size={17}
                        />
                      ) : done ? (
                        <CheckSquare className="text-emerald-500" size={17} />
                      ) : (
                        <Square size={17} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[0.83rem] font-semibold text-text-main truncate ${done ? "line-through text-text-muted" : ""}`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${priorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {canWriteTasks && (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setTaskModalOpen(true);
                          }}
                          className="text-[0.7rem] text-text-muted hover:text-accent-primary cursor-pointer font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming — 1/3 */}
        <div className="bg-card border border-color rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-color bg-card-hover">
            <CalendarDays size={15} className="text-accent-primary" />
            <span className="font-bold text-text-main text-[0.82rem] uppercase tracking-wider">
              Upcoming (7 days)
            </span>
          </div>
          <div className="flex flex-col divide-y divide-[var(--border-color)]">
            {!canReadTasks ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2 bg-slate-50/50">
                <Lock size={22} className="text-slate-400 opacity-60" />
                <span className="text-xs font-semibold text-text-main">
                  Clearance Required
                </span>
              </div>
            ) : tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2
                  className="animate-spin text-accent-primary"
                  size={18}
                />
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted gap-2">
                <CalendarDays size={22} className="opacity-30" />
                <span className="text-xs font-semibold">
                  No upcoming deadlines
                </span>
              </div>
            ) : (
              upcomingTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-card-hover/40 transition"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-semibold text-text-main truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString(
                            undefined,
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${priorityColor(task.priority)}`}
                  >
                    {task.priority[0]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── My Department Workspaces (everyone — based on permitted departments) ── */}
      {(() => {
        const userDept = departments.find(
          (d) => d.id === currentUser?.department_id,
        );
        const userDeptId = userDept ? userDept.name.toLowerCase() : "";

        const isDeptVisible = (dept: (typeof DEPARTMENTS)[0]) => {
          if (isAdmin) return true;
          if (
            userDeptId &&
            ((dept.id === "finance" && userDeptId.includes("finance")) ||
              (dept.id === "inventory" && userDeptId.includes("inventory")) ||
              (dept.id === "crm" &&
                (userDeptId.includes("crm") || userDeptId.includes("sales"))) ||
              (dept.id === "operations" && userDeptId.includes("operations")) ||
              (dept.id === "hr" &&
                (userDeptId.includes("hr") ||
                  userDeptId.includes("company"))) ||
              (dept.id === "communications" &&
                userDeptId.includes("communication")) ||
              (dept.id === "utilities" && userDeptId.includes("utilit")) ||
              (dept.id === "internals" && userDeptId.includes("internal")))
          ) {
            return true;
          }
          return dept.workspaces.some((ws) =>
            permittedWorkspaceKeys.includes(ws.key),
          );
        };

        const visibleDepts = DEPARTMENTS.filter(isDeptVisible);

        if (visibleDepts.length === 0) return null;

        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5.5 bg-gradient-to-b from-[#9d4edd] to-[#00f2fe] rounded-sm" />
              <h2 className="text-[1.1rem] font-bold text-text-main font-display">
                {isAdmin
                  ? "Departmental Workspaces"
                  : "My Workplace Department"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {visibleDepts.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  dept={dept}
                  permittedWorkspaceKeys={permittedWorkspaceKeys}
                  onLaunch={(route) => navigate(route)}
                  isSuperUser={isAdmin}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Task Modal */}
      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={() => {
          setTaskModalOpen(false);
          loadTasks();
        }}
        preselectedUserId={currentUser?.id}
        task={selectedTask}
      />
    </div>
  );
}
