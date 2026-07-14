import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Globe,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import ReadOnlyBadge from "../../../components/ui/ReadOnlyBadge";
import BCoreLogoMark from "../../../components/branding/BCoreLogoMark";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  subtext?: string;
  readOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function AdminSidebar({
  isOpen,
  onClose,
  onCollapse,
  isMobile,
}: AdminSidebarProps) {
  const { currentUser, logout, systemSettings } = useAppContext();
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

  const navGroups: NavGroup[] = [
    {
      title: "Core Control",
      items: [
        { label: "Dashboard", path: "/", icon: <LayoutDashboard size={17} /> },
        {
          label: "Workspaces",
          path: "/workspace",
          icon: <Briefcase size={17} />,
        },
      ],
    },
    {
      title: "Identity & Structure",
      items: [
        { label: "Users", path: "/users", icon: <Users size={17} /> },
      ],
    },
    {
      title: "Control & Security",
      items: [
        {
          label: "Organisation",
          path: "/org",
          icon: <Globe size={17} />,
        },
        {
          label: "System Settings",
          path: "/settings/config",
          icon: <Settings size={17} />,
          subtext: "Themes, Fonts, Layouts",
        },
      ],
    },
  ];

  const effectiveCollapsed = isMobile ? false : collapsed;
  const widthClass = isMobile
    ? "w-[260px]"
    : effectiveCollapsed
      ? "w-[72px]"
      : "w-[260px]";
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
    const isInteractive = (e.target as HTMLElement).closest(
      "a, button, input, select",
    );
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
        aria-label="Administrator navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-color h-16 shrink-0">
          {!effectiveCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <div className="w-8.5 h-8.5 bg-card border border-color rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,91,255,0.15)]">
                <BCoreLogoMark size={20} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[0.9rem] font-bold text-text-main tracking-wider block font-display">
                  B-CORE NEXUS
                </span>
                <span
                  className="text-[10px] text-text-muted uppercase tracking-widest truncate max-w-[140px]"
                  title={
                    systemSettings?.organization_name || "Tier 0 Root Admin"
                  }
                >
                  {systemSettings?.organization_name || "Tier 0 Root Admin"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto bg-card border border-color rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,91,255,0.15)]">
              <BCoreLogoMark size={20} />
            </div>
          )}

          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button
              className={`w-7 h-7 flex items-center justify-center border border-color rounded-md bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40 shrink-0 ${
                effectiveCollapsed ? "hidden" : ""
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
              className="w-7 h-7 flex items-center justify-center border border-color rounded-md bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40 shrink-0"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-5 flex flex-col gap-5 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1.5">
              {!effectiveCollapsed && (
                <span className="text-[9px] font-bold text-text-muted/50 uppercase tracking-widest px-5 select-none">
                  {group.title}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.path}
                    title={effectiveCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 py-2.5 px-5 text-text-muted text-[13px] font-medium border-l-2 transition-all duration-150 relative group ${
                        isActive
                          ? "border-accent-primary bg-sidebar-active-bg text-sidebar-active-text font-semibold"
                          : "border-transparent hover:bg-card-hover hover:text-text-main"
                      } ${effectiveCollapsed ? "justify-center p-2.5 border-l-0" : ""}`
                    }
                  >
                    <span className="flex items-center justify-center opacity-85 shrink-0">
                      {item.icon}
                    </span>
                    {!effectiveCollapsed && (
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">{item.label}</span>
                            {item.readOnly && <ReadOnlyBadge />}
                          </div>
                        </div>
                        {item.subtext && (
                          <span className="text-[10px] text-text-muted/70 mt-0.5 font-normal leading-tight truncate">
                            {item.subtext}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div
          className={`p-4 border-t border-color flex flex-col gap-2.5 shrink-0 ${effectiveCollapsed ? "items-center" : ""}`}
        >
          {currentUser &&
            (!effectiveCollapsed ? (
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-card-hover border border-color overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-accent-primary bg-opacity-20 text-accent-primary flex items-center justify-center font-bold text-[0.85rem] shrink-0">
                  {currentUser.email?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex flex-col overflow-hidden leading-none">
                  <span
                    className="text-[12px] font-semibold text-text-main truncate whitespace-nowrap max-w-[140px]"
                    title={
                      currentUser.first_name
                        ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                        : currentUser.email
                    }
                  >
                    {currentUser.first_name
                      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                      : currentUser.email}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                    {currentUser?.permissions?.includes("*:*") ||
                    currentUser?.functional_roles?.includes("admin")
                      ? "System Admin"
                      : "Admin"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent-primary bg-opacity-20 text-accent-primary flex items-center justify-center font-bold text-[0.85rem] shrink-0">
                {currentUser.email?.[0]?.toUpperCase() ?? "A"}
              </div>
            ))}
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 w-full py-2 px-2.5 rounded-lg border border-transparent bg-transparent text-text-muted text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/25 hover:text-accent-danger ${
              effectiveCollapsed ? "p-2" : ""
            }`}
            title="Logout Session"
            aria-label="Logout Session"
          >
            <LogOut size={15} />
            {!effectiveCollapsed && <span>Logout Session</span>}
          </button>
        </div>
      </aside>
    </>
  );
}