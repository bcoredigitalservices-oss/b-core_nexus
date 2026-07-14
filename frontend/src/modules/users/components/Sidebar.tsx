import React, { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Package,
  Shield,
  Cpu,
  LayoutDashboard,
  Activity,
  Briefcase,
  User,
  Settings,
  DollarSign,
  UserPlus,
  Plus,
  Zap,
  Globe,
  ChevronLeft,
  ChevronRight,
  Layers,
  LogOut,
  FolderOpen,
  Server,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";

// Keep these in sync with the paddingLeft values in AppShell.jsx —
// a mismatch here is what causes the sidebar/content misalignment on collapse.
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

interface NavItem {
  path: string;
  label: string;
  icon: string;
  required_tier?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapse?: (collapsed: boolean) => void;
  isMobile: boolean;
}

interface SidebarLinkProps {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}

interface NavIconProps {
  name: string;
}

// ─── Icon mapper (backend sends string names) ─────────────────────────────────
const ICON_MAP = {
  directory: <Users size={18} />,
  catalog: <Package size={18} />,
  shield: <Shield size={18} />,
  executive: <Briefcase size={18} />,
  cpu: <Cpu size={18} />,
  activity: <Activity size={18} />,
  user: <User size={18} />,
  briefcase: <Briefcase size={18} />,
  settings: <Settings size={18} />,
  "dollar-sign": <DollarSign size={18} />,
  "user-plus": <UserPlus size={18} />,
  plus: <Plus size={18} />,
  globe: <Globe size={18} />,
  dashboard: <LayoutDashboard size={18} />,
  zap: <Zap size={18} />,
  server: <Server size={18} />,
  folder: <FolderOpen size={18} />,
};

// ─── Permission key → path map for sidebar link filtering ────────────────────
// If a user lacks the required permission, the link is hidden entirely.
const LINK_PERMISSION_MAP = {
  "/users": ["iam:manage", "*:*"],
  "/departments": ["iam:manage", "*:*"],
  "/events": ["iam:manage", "*:*"],
  "/org": ["iam:manage", "system:write", "*:*"],
};

// Returns true if user can see this link (no restriction = visible to all)
import { hasAnyPermission, isAdmin, hasPermission } from "../../../utils/permissions";

function canSeeLink(item, currentUser) {
  const required = LINK_PERMISSION_MAP[item.path];
  if (!required) return true; // no restriction — show to everyone
  if (!currentUser) return false;
  if (isAdmin(currentUser)) return true;
  return hasAnyPermission(currentUser, required);
}

function NavIcon({ name }: NavIconProps) {
  return ICON_MAP[name] ?? <Layers size={18} />;
}

function SidebarLink({ item, collapsed, onClick }: SidebarLinkProps) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-text-muted text-[13px] font-medium transition-all duration-200 whitespace-nowrap overflow-hidden relative group ${
          isActive
            ? "bg-accent-primary bg-opacity-10 text-accent-primary font-semibold"
            : "hover:bg-accent-primary hover:bg-opacity-5 hover:text-text-main"
        } ${collapsed ? "justify-center p-2.5" : ""}`
      }
      title={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex items-center justify-center shrink-0 transition-colors duration-200 ${
              isActive
                ? "text-accent-primary drop-shadow-[0_0_6px_var(--accent-primary)]"
                : "group-hover:text-text-main"
            }`}
          >
            <NavIcon name={item.icon} />
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-accent-blue rounded-r transition-transform duration-200 origin-left ${
              isActive ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export default function Sidebar({
  isOpen,
  onClose,
  onCollapse,
  isMobile,
}: SidebarProps) {
  const { navigationMatrix, systemSettings, currentUser, logout } =
    useAppContext();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // On mobile the sidebar slides in/out at full width; on desktop it collapses to icon-only.
  const effectiveCollapsed = isMobile ? false : collapsed;

  // Computed independently instead of stacking possibly-conflicting utility
  // classes, so mobile and desktop widths never fight each other.
  const widthClass = isMobile
    ? "w-[240px]"
    : effectiveCollapsed
      ? "w-[72px]"
      : "w-[240px]";

  const transformClass = isMobile
    ? isOpen
      ? "translate-x-0"
      : "-translate-x-full"
    : "translate-x-0";

  const handleAsideClick = (e: React.MouseEvent) => {
    if (isMobile) return;
    if (collapsed) {
      handleCollapseToggle();
      return;
    }
    const isInteractive = (e.target as HTMLElement).closest("a, button, input, select");
    if (isInteractive) return;
    handleCollapseToggle();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-[199] animate-[fadeIn_0.2s_ease]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        onClick={handleAsideClick}
        className={`fixed top-0 left-0 h-screen bg-sidebar border-r border-color flex flex-col z-[200] overflow-hidden transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${widthClass} ${transformClass} cursor-pointer select-none ${
          isMobile ? "shadow-[4px_0_40px_rgba(0,0,0,0.6)]" : ""
        }`}
        aria-label="Primary navigation"
      >
        {/* ── Brand Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-b border-color h-16 shrink-0">
          {!effectiveCollapsed && (
            <div
              onClick={handleCollapseToggle}
              className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap no-underline text-inherit cursor-pointer"
            >
              <div className="w-8.5 h-8.5 bg-card border border-color rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,91,255,0.15)]">
                <img src="/favicon.svg" alt="B-Core Logo" className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-sm font-extrabold tracking-wider text-text-main">
                  B-CORE
                </span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest truncate max-w-[140px]">
                  {systemSettings?.organization_name ?? "Nexus ERP"}
                </span>
              </div>
            </div>
          )}

          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button
              id="sidebar-collapse-btn"
              className={`w-7 h-7 flex items-center justify-center border border-color rounded-md bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40 shrink-0 ${
                effectiveCollapsed ? "mx-auto" : ""
              }`}
              onClick={handleCollapseToggle}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              id="sidebar-close-btn"
              className="w-7 h-7 flex items-center justify-center border border-color rounded-md bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40 shrink-0"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* ── Primary Navigation ────────────────────────────────────── */}
        <nav
          className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto overflow-x-hidden"
          aria-label="Main navigation"
        >
          {!effectiveCollapsed && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 pb-1.5 opacity-70">
              Workspaces
            </p>
          )}
          <SidebarLink
            item={{ label: "My Workplace", path: "/", icon: "dashboard" }}
            collapsed={effectiveCollapsed}
            onClick={isMobile ? onClose : undefined}
          />
          {navigationMatrix.sidebar_links
            ?.filter(
              (item) =>
                item.path !== "/catalog" && item.path !== "/event-engine",
            )
            ?.filter((item) => canSeeLink(item, currentUser))
            .map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                collapsed={effectiveCollapsed}
                onClick={isMobile ? onClose : undefined}
              />
            ))}
        </nav>

        {/* ── Settings Modules / Access Control ────────────────────────── */}
        {(navigationMatrix.settings_modules?.length > 0 || hasPermission(currentUser, "iam:manage")) && (
          <nav
            className="flex flex-col gap-0.5 p-3 flex-none border-t border-color pt-3.5"
            aria-label="Settings navigation"
          >
            {!effectiveCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 pb-1.5 opacity-70">
                Settings
              </p>
            )}
            {navigationMatrix.settings_modules?.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                collapsed={effectiveCollapsed}
                onClick={isMobile ? onClose : undefined}
              />
            ))}
            {hasPermission(currentUser, "iam:manage") && (
              <SidebarLink
                item={{ label: "Users", path: "/users", icon: "directory" }}
                collapsed={effectiveCollapsed}
                onClick={isMobile ? onClose : undefined}
              />
            )}
          </nav>
        )}

        {/* ── User Footer ───────────────────────────────────────────── */}
        <div
          className={`border-t border-color p-3 flex flex-col gap-2 shrink-0 ${effectiveCollapsed ? "items-center" : ""}`}
        >
          {!effectiveCollapsed && currentUser && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-card-hover border border-color overflow-hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-accent-purple to-accent-blue rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0">
                {currentUser.email?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="flex flex-col overflow-hidden leading-none">
                <span className="text-[12px] font-semibold text-text-main truncate whitespace-nowrap">
                  {currentUser.first_name
                    ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                    : currentUser.email}
                </span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                  {currentUser.designation ||
                    (currentUser.permissions?.includes("*:*")
                      ? "System Admin"
                      : "User")}
                </span>
              </div>
            </div>
          )}
          <button
            id="sidebar-logout-btn"
            className="flex items-center justify-center gap-2 w-full py-2 px-2.5 rounded-lg border border-transparent bg-transparent text-text-muted text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/25 hover:text-accent-danger"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
            {!effectiveCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
