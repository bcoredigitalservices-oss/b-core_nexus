import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Database,
  Server,
  User,
  ChevronDown,
  Settings,
  LogOut,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import Sidebar, {
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from "../../modules/users/components/Sidebar";
import AdminSidebar from "../../modules/admin/components/AdminSidebar";
import { useAppContext } from "../../context/AppContext";
import { isAdmin as isUserAdmin, hasPermission } from "../../utils/permissions";

const MOBILE_BREAKPOINT = 768; // px

export default function AppShell() {
  const {
    isApiLive,
    currentUser,
    systemSettings,
    logout,
    isBooting,
    authFetch,
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isHub =
    location.pathname === "/workspace" ||
    location.pathname === "/workspace/" ||
    location.pathname === "/workspaces" ||
    location.pathname === "/workspaces/";
  const isWorkspaceAppRoute =
    (location.pathname.startsWith("/workspace/") ||
      location.pathname.startsWith("/workspaces/")) &&
    !isHub;

  // ── Responsive & Navigation Sync States ────────────────────────────────────
  const [isMobile, setIsMobile] = useState<boolean>(
    window.innerWidth < MOBILE_BREAKPOINT,
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false); // Mobile Drawer Toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false); // Desktop Width State
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  // Notification Tray States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [loadingNotifications, setLoadingNotifications] =
    useState<boolean>(false);

  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const data = await authFetch("/notifications/count");
      if (data && typeof data.unread_count === "number") {
        setUnreadCount(data.unread_count);
      }
    } catch (e) {
      console.error("Failed to fetch notifications count:", e);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoadingNotifications(true);
    try {
      const data = await authFetch("/notifications");
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleToggleNotifications = () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    if (!notificationsOpen) return;
    const close = () => setNotificationsOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [notificationsOpen]);

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.is_read) {
        await authFetch(`/notifications/${notif.id}/read`, { method: "PATCH" });
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
      }

      // Navigate to target entity detail page if present
      if (notif.entity_type && notif.entity_id) {
        let basePath = `/workspace/crm/${notif.entity_type}s`;
        if (notif.entity_type === "sales_order") {
          basePath = "/workspace/crm/salesorders";
        }
        navigate(`${basePath}/${notif.entity_id}`);
      }
      setNotificationsOpen(false);
    } catch (e) {
      console.error("Failed to process notification click:", e);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing dropdown
    try {
      await authFetch("/notifications/read-all", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // Reset mobile overlay state on desktop stretch
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Close user-menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Boot screen
  if (isBooting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-5 text-text-muted font-body text-sm bg-main">
        <div className="w-10 h-10 border-3 border-color border-t-accent-primary rounded-full animate-spin" />
        <p>Initialising B-Core Nexus…</p>
      </div>
    );
  }

  // Determine if layout should show structural sidebar
  const showSidebar = !isWorkspaceAppRoute;
  const isAdmin =
    isUserAdmin(currentUser) ||
    currentUser?.functional_roles?.includes("manager");

  // Derived from Sidebar's constants or AdminSidebar's fixed footprint
  const contentOffset =
    !isMobile && showSidebar
      ? sidebarCollapsed
        ? SIDEBAR_WIDTH_COLLAPSED
        : isAdmin
          ? 260
          : SIDEBAR_WIDTH_EXPANDED
      : 0;

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-main">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {showSidebar &&
        (isAdmin ? (
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onCollapse={setSidebarCollapsed}
            isMobile={isMobile}
          />
        ) : (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onCollapse={setSidebarCollapsed} // Tells AppShell if sidebar is 72px or 240px wide
            isMobile={isMobile}
          />
        ))}

      {/* ── Main Layout Column (Header + Routed Content) ─────────── */}
      <div
        className="flex flex-col flex-1 min-w-0 h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          // Sync exact physical footprint width dynamically to prevent content jumping or bad layout overlaps
          paddingLeft: `${contentOffset}px`,
        }}
      >
        {/* ── Top Header Bar ─────────────────────────────────────── */}
        <header
          className="flex items-center justify-between h-16 px-4 md:px-6 bg-header border-b border-color sticky top-0 z-40 gap-4"
          role="banner"
        >
          {/* Left Block: Hamburger on mobile, Workspace Action on desktop */}
          <div className="flex items-center gap-2.5 flex-1">
            {isMobile && showSidebar && (
              <button
                id="hamburger-menu-btn"
                className="p-2 -ml-2 text-text-muted hover:text-text-main transition-colors duration-200 bg-transparent border-none cursor-pointer"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Workspace Hub Quick Redirect */}
            {(!showSidebar || sidebarCollapsed) && (
              <button
                id="header-hub-btn"
                onClick={() => navigate("/workspace")}
                className="hidden md:flex items-center gap-1.5 text-[11px] font-bold bg-card-hover border border-color rounded-lg py-1.5 px-3 cursor-pointer transition-all duration-200 mr-2 text-text-muted hover:text-text-main hover:border-accent-primary hover:border-opacity-20"
              >
                <LayoutGrid size={13} />
                <span>Workspace Hub</span>
              </button>
            )}

            {/* API Environment Badge */}
            <div
              className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold border ${
                isApiLive
                  ? "text-accent-green border-accent-green/35 bg-accent-green/8"
                  : "text-accent-warning border-accent-warning/30 bg-accent-warning/7"
              }`}
            >
              {isApiLive ? (
                <>
                  <Database size={13} />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <Server size={13} />
                  <span>Sandbox</span>
                </>
              )}
            </div>
          </div>

          {/* Center Block: Organization Display */}
          <div className="flex-none text-center">
            <span className="font-display text-[13px] md:text-sm font-bold text-text-muted tracking-wider whitespace-nowrap">
              {systemSettings?.organization_name ?? "B-Core Nexus"}
            </span>
          </div>

          {/* Right Block: Actions + User Profile Menu Dropdown */}
          <div className="flex items-center justify-end gap-2.5 flex-1">
            {/* Notifications Dropdown Selector Container */}
            <div className="relative">
              <button
                id="notifications-btn"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-color bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleNotifications();
                }}
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent-danger text-[8px] font-extrabold text-white animate-pulse border border-main">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-danger rounded-full border border-main" />
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute top-[calc(100%+8px)] right-0 min-w-[320px] max-w-[360px] bg-card border border-color rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[300] animate-slideDown overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                  role="menu"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-color bg-main/20">
                    <span className="text-xs font-extrabold text-[var(--text-main)]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-accent-primary hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-color/40">
                    {loadingNotifications ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-1.5">
                        <Loader2
                          className="animate-spin text-accent-primary"
                          size={18}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Retrieving updates…
                        </span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[var(--text-muted)] italic">
                        No notifications to show.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 flex flex-col gap-1 cursor-pointer transition text-left hover:bg-main/25 relative ${
                            !notif.is_read
                              ? "font-semibold text-[var(--text-main)]"
                              : "font-normal text-[var(--text-muted)]"
                          }`}
                        >
                          {!notif.is_read && (
                            <span className="absolute left-2 top-[18px] w-1.5 h-1.5 bg-accent-primary rounded-full animate-ping" />
                          )}
                          <div className="flex items-center justify-between gap-2 pl-2">
                            <span className="text-xs">{notif.title}</span>
                            <span className="text-[9px] text-[var(--text-muted)] font-mono shrink-0">
                              {new Date(notif.created_at).toLocaleDateString(
                                [],
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] m-0 leading-relaxed pl-2 font-normal">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown Selector Container */}
            <div className="relative">
              <button
                id="user-profile-btn"
                className="flex items-center gap-2 py-1.5 pr-2.5 pl-1.5 rounded-xl border border-color bg-white/5 cursor-pointer transition-all duration-200 hover:bg-card-hover hover:border-accent-primary hover:border-opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((v) => !v);
                }}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {currentUser?.email?.[0]?.toUpperCase() ?? <User size={14} />}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-[12px] font-semibold text-text-main max-w-[130px] truncate">
                    {currentUser?.first_name
                      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                      : currentUser?.email || "Admin"}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                    {isUserAdmin(currentUser) ? "Admin" : "User"}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-text-muted transition-transform duration-200 shrink-0 ${userMenuOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute top-[calc(100%+8px)] right-0 min-w-[180px] bg-card border border-color rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[300] animate-slideDown"
                  role="menu"
                >
                  <button
                    id="profile-settings-menu-item"
                    className="flex items-center gap-2 w-full p-2 rounded-lg border-none bg-transparent text-text-muted text-sm font-body cursor-pointer text-left transition-all duration-150 hover:bg-card-hover hover:text-text-main"
                    onClick={() => {
                      navigate("/settings/profile");
                      setUserMenuOpen(false);
                    }}
                    role="menuitem"
                  >
                    <Settings size={14} /> My Profile
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    id="logout-menu-item"
                    className="flex items-center gap-2 w-full p-2 rounded-lg border-none bg-transparent text-text-muted text-sm font-body cursor-pointer text-left transition-all duration-150 hover:bg-red-500/10 hover:text-accent-danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable Viewport Render Area ────────────────────── */}
        <main
          className="flex-1 overflow-y-auto"
          id="main-content"
          role="main"
          style={{
            padding: isWorkspaceAppRoute ? 0 : "1.5rem",
            display: isWorkspaceAppRoute ? "flex" : "block",
            flexDirection: isWorkspaceAppRoute ? "column" : "initial",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
