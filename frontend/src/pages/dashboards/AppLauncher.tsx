import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Package,
  Cog,
  UserCheck,
  ShieldCheck,
  Compass,
  MessageSquare,
  Wrench,
  Cpu,
  Factory,
  ClipboardList,
  BadgeCheck,
  CalendarDays,
  UserPlus,
  TrendingUp,
  ShoppingCart,
  Headphones,
  Landmark,
  PiggyBank,
  FileText,
  BarChart2,
  Box,
  Boxes,
  Building2,
  Truck,
  CreditCard,
  Mail,
  MessagesSquare,
  Globe,
  Megaphone,
  Layers,
  Lock,
  Clock,
  PieChart,
  Briefcase,
  Receipt,
  LineChart,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

// ─── Department → Workspace Map ───────────────────────────────────────────────

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
    id: 'finance',
    name: 'Finance & Accounting',
    description: 'Accounting, banking operations, tax compliance and financial reporting.',
    accentColor: '#00f5a0',
    glowColor: 'rgba(0,245,160,0.14)',
    workspaces: [
      { key: 'accounting', label: 'Accounting', icon: <FileText size={20} />, route: '/workspaces/finance/accounting', color: '#00f5a0' },
      { key: 'invoicing', label: 'Invoicing', icon: <FileText size={20} />, route: '/workspaces/finance/invoicing', color: '#00f5a0' },
      { key: 'payments', label: 'Payments', icon: <CreditCard size={20} />, route: '/workspaces/finance/payments', color: '#00f5a0' },
      { key: 'banking', label: 'Banking', icon: <PiggyBank size={20} />, route: '/workspaces/finance/banking', color: '#00f5a0' },
      { key: 'taxes', label: 'Taxes', icon: <FileText size={20} />, route: '/workspaces/finance/taxes', color: '#00f5a0' },
      { key: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, route: '/workspaces/finance/reports', color: '#00f5a0' },
      { key: 'budget', label: 'Budget', icon: <PieChart size={20} />, route: '/workspaces/finance/budgets', color: '#00f5a0' },
      { key: 'shares', label: 'Shares', icon: <Briefcase size={20} />, route: '/workspaces/finance/shares', color: '#00f5a0' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Assets, products, stock control, warehouse operations and procurement.',
    accentColor: '#ffb703',
    glowColor: 'rgba(255,183,3,0.14)',
    workspaces: [
      { key: 'assets', label: 'Assets', icon: <BarChart2 size={20} />, route: '/workspace/inventory/assets', color: '#ffb703' },
      { key: 'products', label: 'Products', icon: <Package size={20} />, route: '/workspace/inventory/products', color: '#ffb703' },
      { key: 'items', label: 'Items', icon: <Box size={20} />, route: '/workspace/items/item', color: '#ffb703' },
      { key: 'warehouse', label: 'Warehouse', icon: <Boxes size={20} />, route: '/workspace/inventory/warehouses', color: '#ffb703' },
      { key: 'stock', label: 'Stock', icon: <Building2 size={20} />, route: '/workspace/inventory/stock', color: '#ffb703' },
      { key: 'buying', label: 'Buying', icon: <ShoppingCart size={20} />, route: '/workspace/inventory/buying', color: '#ffb703' },
    ],
  },
  {
    id: 'crm',
    name: 'CRM & Sales',
    description: 'POS, lead management, sales pipeline and customer support.',
    accentColor: '#00f2fe',
    glowColor: 'rgba(0,242,254,0.14)',
    workspaces: [
      { key: 'pos', label: 'POS', icon: <CreditCard size={20} />, route: '/workspace/crm/pos', color: '#00f2fe' },
      { key: 'crm', label: 'CRM', icon: <Users size={20} />, route: '/workspace/crm', color: '#00f2fe' },
      { key: 'sales', label: 'Sales', icon: <TrendingUp size={20} />, route: '/workspace/crm/sales', color: '#00f2fe' },
      { key: 'support', label: 'Support', icon: <Headphones size={20} />, route: '/workspace/crm/support', color: '#00f2fe' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations & Management',
    description: 'Field ops, maintenance, manufacturing, projects, QA and logistics.',
    accentColor: '#c084fc',
    glowColor: 'rgba(192,132,252,0.14)',
    workspaces: [
      { key: 'field_ops', label: 'Field Ops', icon: <Compass size={20} />, route: '/workspaces/operations/field', color: '#c084fc' },
      { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={20} />, route: '/workspaces/operations/maintenance', color: '#c084fc' },
      { key: 'manufacturing', label: 'Manufacturing', icon: <Factory size={20} />, route: '/workspaces/operations/manufacturing', color: '#c084fc' },
      { key: 'projects', label: 'Projects', icon: <ClipboardList size={20} />, route: '/workspaces/operations/projects', color: '#c084fc' },
      { key: 'qa', label: 'QA', icon: <BadgeCheck size={20} />, route: '/workspaces/operations/qa', color: '#c084fc' },
      { key: 'qt', label: 'QT', icon: <Layers size={20} />, route: '/workspaces/operations/qt', color: '#c084fc' },
      { key: 'logistics', label: 'Logistics', icon: <Truck size={20} />, route: '/workspaces/operations/logistics', color: '#c084fc' },
    ],
  },
  {
    id: 'hr',
    name: 'HR & Company',
    description: 'Payroll, attendance, recruitment, performance, leaves and expenses.',
    accentColor: '#f472b6',
    glowColor: 'rgba(244,114,182,0.14)',
    workspaces: [
      { key: 'expenses', label: 'Expenses', icon: <DollarSign size={20} />, route: '/workspaces/hr/expenses', color: '#f472b6' },
      { key: 'hr', label: 'HR', icon: <UserCheck size={20} />, route: '/workspaces/hr', color: '#f472b6' },
      { key: 'payroll', label: 'Payroll', icon: <CreditCard size={20} />, route: '/workspaces/hr/payroll', color: '#f472b6' },
      { key: 'attendance', label: 'Attendance', icon: <CalendarDays size={20} />, route: '/workspaces/hr/attendance', color: '#f472b6' },
      { key: 'recruitment', label: 'Recruitment', icon: <UserPlus size={20} />, route: '/workspaces/hr/recruitment', color: '#f472b6' },
      { key: 'performance', label: 'Performance', icon: <TrendingUp size={20} />, route: '/workspaces/hr/performance', color: '#f472b6' },
      { key: 'leaves', label: 'Leaves', icon: <CalendarDays size={20} />, route: '/workspaces/hr/leaves', color: '#f472b6' },
    ],
  },
  {
    id: 'communications',
    name: 'Communications',
    description: 'Internal chats, employee groups, email and team messaging.',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56,189,248,0.14)',
    workspaces: [
      { key: 'chats', label: 'Chats', icon: <MessageSquare size={20} />, route: '/workspaces/comms/chats', color: '#38bdf8' },
      { key: 'employee_groups', label: 'Groups', icon: <MessagesSquare size={20} />, route: '/workspaces/comms/groups', color: '#38bdf8' },
      { key: 'email', label: 'Email', icon: <Mail size={20} />, route: '/workspaces/comms/email', color: '#38bdf8' },
      { key: 'message', label: 'Message', icon: <MessagesSquare size={20} />, route: '/workspaces/comms/message', color: '#38bdf8' },
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Marketing campaigns, website management and brand operations.',
    accentColor: '#fb923c',
    glowColor: 'rgba(251,146,60,0.14)',
    workspaces: [
      { key: 'marketing', label: 'Marketing', icon: <Megaphone size={20} />, route: '/workspaces/utilities/marketing', color: '#fb923c' },
      { key: 'campaigns', label: 'Campaigns', icon: <BarChart2 size={20} />, route: '/workspaces/utilities/campaigns', color: '#fb923c' },
      { key: 'website', label: 'Website', icon: <Globe size={20} />, route: '/workspaces/utilities/website', color: '#fb923c' },
    ],
  },

];

// ─── Live Clock Component ─────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  const day = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5 font-mono text-[1.5rem] font-bold text-text-main tracking-wider">
        <Clock size={16} className="text-text-muted" />
        {hh}<span className="opacity-50 animate-[blink_1s_step-end_infinite]">:</span>{mm}<span className="opacity-50 animate-[blink_1s_step-end_infinite]">:</span><span className="text-[#00f5a0]">{ss}</span>
      </div>
      <span className="text-[0.72rem] text-text-muted tracking-wide">{day}</span>
    </div>
  );
}

// ─── Department Card ──────────────────────────────────────────────────────────

interface DeptCardProps {
  dept: DepartmentDefinition;
  permittedWorkspaceKeys: string[];
  onLaunch: (route: string, wsKey: string) => void;
  isSuperUser: boolean;
}

function DepartmentCard({ dept, permittedWorkspaceKeys, onLaunch, isSuperUser }: DeptCardProps) {
  const [hovered, setHovered] = useState(false);
  const [hoveredWs, setHoveredWs] = useState<string | null>(null);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden bg-card rounded-2xl p-6 transition-all duration-300 shadow-md hover:shadow-lg border"
      style={{
        borderColor: hovered ? `${dept.accentColor}50` : 'rgba(255,255,255,0.07)',
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.25), 0 0 30px ${dept.glowColor}`
          : '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      {/* Corner glow */}
      <div 
        className="absolute -top-[40px] -right-[40px] width-[120px] height-[120px] rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${dept.glowColor} 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0.5,
          filter: 'blur(10px)',
          width: '120px',
          height: '120px',
        }} 
      />

      {/* Bottom accent bar */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${dept.accentColor}70, transparent)`,
          opacity: hovered ? 1 : 0,
        }} 
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[1.05rem] font-extrabold text-text-main font-display mb-1.5 tracking-tight">
            {dept.name}
          </h3>
          <p className="text-[0.75rem] text-text-muted leading-relaxed max-w-[240px]">
            {dept.description}
          </p>
        </div>
        <span 
          className="text-[0.68rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border whitespace-nowrap"
          style={{
            backgroundColor: `${dept.accentColor}14`, 
            color: dept.accentColor,
            borderColor: `${dept.accentColor}30`,
          }}
        >
          {dept.workspaces.length} modules
        </span>
      </div>

      {/* Workspace icon grid */}
      <div className="flex flex-wrap gap-2.5">
        {dept.workspaces.map((ws) => {
          const permitted = isSuperUser || permittedWorkspaceKeys.includes(ws.key);
          const isHov = hoveredWs === ws.key;

          return (
            <button
              key={ws.key}
              title={ws.label}
              disabled={!permitted}
              onClick={() => permitted && onLaunch(ws.route, ws.key)}
              onMouseEnter={() => setHoveredWs(ws.key)}
              onMouseLeave={() => setHoveredWs(null)}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-3 rounded-xl transition-all duration-200 relative min-w-[64px] border ${
                permitted 
                  ? 'cursor-pointer opacity-100' 
                  : 'cursor-not-allowed opacity-40'
              }`}
              style={{
                background: isHov && permitted ? `${ws.color}18` : 'rgba(255,255,255,0.03)',
                borderColor: isHov && permitted ? `${ws.color}50` : 'rgba(255,255,255,0.06)',
                color: permitted ? (isHov ? ws.color : 'var(--text-muted)') : 'rgba(255,255,255,0.18)',
                transform: isHov && permitted ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              <span className="text-inherit">{ws.icon}</span>
              <span className="text-[0.62rem] font-semibold text-center tracking-wide white-space-nowrap">
                {ws.label}
              </span>
              {!permitted && <Lock size={8} className="absolute bottom-1.5 right-1.5 opacity-40" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ExecutiveHome Component ─────────────────────────────────────────────

export default function AppLauncher() {
  const { currentUser, activeWorkspace } = useAppContext();
  const navigate = useNavigate();

  const roleTier: number = currentUser?.role_tier ?? 99;
  const isSuperUser = roleTier <= 1;

  const permittedWorkspaceKeys: string[] = isSuperUser
    ? DEPARTMENTS.flatMap((d) => d.workspaces.map((w) => w.key))
    : ((currentUser as any)?.workspaces as string[] | undefined) ?? [];

  const orgName = (activeWorkspace as any)?.organization_name || 'B-Core Nexus';
  const userName = currentUser?.first_name && (currentUser as any)?.last_name
    ? `${currentUser.first_name} ${(currentUser as any).last_name}`
    : currentUser?.email?.split('@')[0] || 'Operator';

  const roleTierLabel: Record<number, string> = {
    0: 'Tier 0 — Genesis Admin',
    1: 'Tier 1 — Executive',
    2: 'Tier 2 — Manager',
    3: 'Tier 3 — Operator',
    4: 'Tier 4 — Viewer',
  };

  const handleLaunch = (route: string) => {
    navigate(route);
  };

  return (
    <>
      <style>{`
        @keyframes blink { 50% { opacity: 0.15; } }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dept-grid > * {
          animation: float-in 0.4s ease both;
        }
        .dept-grid > *:nth-child(1) { animation-delay: 0.04s; }
        .dept-grid > *:nth-child(2) { animation-delay: 0.08s; }
        .dept-grid > *:nth-child(3) { animation-delay: 0.12s; }
        .dept-grid > *:nth-child(4) { animation-delay: 0.16s; }
        .dept-grid > *:nth-child(5) { animation-delay: 0.20s; }
        .dept-grid > *:nth-child(6) { animation-delay: 0.24s; }
        .dept-grid > *:nth-child(7) { animation-delay: 0.28s; }
        .dept-grid > *:nth-child(8) { animation-delay: 0.32s; }
      `}</style>

      <div className="flex flex-col gap-8 w-full max-w-[1240px] mx-auto">

        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-[1.8rem] font-bold text-text-main font-display">
            Welcome back, {userName}
          </h1>
          <p className="text-text-muted text-[0.9rem]">
            Select an application module below to begin your work.
          </p>
        </div>

        {/* ── Department Cards Grid ── */}
        <div className="dept-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {DEPARTMENTS.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              permittedWorkspaceKeys={permittedWorkspaceKeys}
              onLaunch={handleLaunch}
              isSuperUser={isSuperUser}
            />
          ))}
        </div>

        {/* ── Access Hint Footer ── */}
        {!isSuperUser && (
          <div className="flex items-center gap-2.5 py-4 px-6 rounded-xl bg-[#ffb703]/5 border border-[#ffb703]/15 text-[0.82rem] text-text-muted">
            <Lock size={14} className="text-[#ffb703]" />
            <span>
              <strong className="text-[#ffb703]">Limited access.</strong>{' '}
              Some workspace modules may be restricted. Contact your Tier 1 Executive Administrator to request additional access.
            </span>
          </div>
        )}

      </div>
    </>
  );
}
