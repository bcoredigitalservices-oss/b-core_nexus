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
  AtSign,
  Search,
  Building,
  Target,
  FileText,
  HelpCircle,
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

  // Mentions Tray States
  const [unreadMentions, setUnreadMentions] = useState<any[]>([]);
  const [unreadMentionsCount, setUnreadMentionsCount] = useState<number>(0);
  const [mentionsOpen, setMentionsOpen] = useState<boolean>(false);
  const [loadingMentions, setLoadingMentions] = useState<boolean>(false);

  // Global Search States & Hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await authFetch(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (Array.isArray(data)) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Global search failed:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, authFetch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const fetchUnreadMentions = async () => {
    if (!currentUser) return;
    setLoadingMentions(true);
    try {
      const data = await authFetch("/messages/mentions/unread");
      if (Array.isArray(data)) {
        setUnreadMentions(data);
        setUnreadMentionsCount(data.length);
      }
    } catch (e) {
      console.error("Failed to fetch unread mentions:", e);
    } finally {
      setLoadingMentions(false);
    }
  };

  const handleMarkMentionRead = async (messageId: string) => {
    try {
      await authFetch(`/messages/${messageId}/read`, { method: "POST" });
      setUnreadMentions((prev) => prev.filter((m) => m.message_id !== messageId));
      setUnreadMentionsCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("Failed to mark mention as read:", e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadMentions();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMentions();
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleToggleNotifications = () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    setMentionsOpen(false);
    if (nextState) {
      fetchNotifications();
    }
  };

  // Close mentions dropdown when clicking outside
  useEffect(() => {
    if (!mentionsOpen) return;
    const close = () => setMentionsOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mentionsOpen]);

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
          basePath = "/workspace/crm/sales-orders";
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

          {/* Center Block: Organization Display on mobile, Search Bar on desktop */}
          <div className="flex-none text-center md:hidden">
            <span className="font-display text-[13px] md:text-sm font-bold text-text-muted tracking-wider whitespace-nowrap">
              {systemSettings?.organization_name ?? "B-Core Nexus"}
            </span>
          </div>

          <div ref={searchRef} className="flex-1 max-w-xs md:max-w-sm relative mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={14} />
              <input
                type="text"
                placeholder="Global search (by Ref No)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-white/5 border border-color rounded-xl pl-9 pr-8 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-primary focus:bg-white/10 transition-all font-semibold shadow-sm"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-2.5 animate-spin text-accent-primary" size={14} />
              )}
            </div>

            {/* Results Overlay */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-card/90 backdrop-blur-md border border-color rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[300] max-h-[320px] overflow-y-auto flex flex-col divide-y divide-color/40 text-left animate-slideDown">
                {searchLoading && searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="animate-spin text-accent-primary" size={18} />
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">Searching database...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <HelpCircle className="text-[var(--text-muted)] mb-1" size={18} />
                    <span className="text-xs text-[var(--text-muted)] italic font-semibold">No records found matching "{searchQuery}"</span>
                  </div>
                ) : (
                  searchResults.map((result) => {
                    let routePath = "/";
                    let IconComponent = HelpCircle;
                    let badgeColor = "bg-accent-primary/10 text-accent-primary";
                    let entityLabel = result.entity_type;

                    if (result.entity_type === "lead") {
                      routePath = `/workspace/crm/leads/${result.entity_id}`;
                      IconComponent = User;
                      badgeColor = "bg-accent-purple/10 text-accent-purple";
                      entityLabel = "Lead";
                    } else if (result.entity_type === "customer") {
                      routePath = `/workspace/crm/customers/${result.entity_id}`;
                      IconComponent = Building;
                      badgeColor = "bg-accent-green/10 text-accent-green";
                      entityLabel = "Customer";
                    } else if (result.entity_type === "deal") {
                      routePath = `/workspace/crm/deals/${result.entity_id}`;
                      IconComponent = Target;
                      badgeColor = "bg-accent-blue/10 text-accent-blue";
                      entityLabel = "Deal";
                    } else if (result.entity_type === "quotation") {
                      routePath = `/workspace/crm/quotations/${result.entity_id}`;
                      IconComponent = FileText;
                      badgeColor = "bg-amber-500/10 text-amber-500";
                      entityLabel = "Quotation";
                    } else if (result.entity_type === "sales_order") {
                      routePath = `/workspace/crm/sales-orders/${result.entity_id}`;
                      IconComponent = FileText;
                      badgeColor = "bg-rose-500/10 text-rose-500";
                      entityLabel = "Sales Order";
                    }

                    return (
                      <div
                        key={`${result.entity_type}-${result.entity_id}`}
                        onClick={() => {
                          navigate(routePath);
                          setSearchQuery("");
                          setSearchFocused(false);
                        }}
                        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-main/25 transition text-[var(--text-main)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-main/30 border border-color flex items-center justify-center shrink-0">
                            <IconComponent size={14} className="text-accent-primary" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold truncate">
                              {result.display_name}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {result.reference_number}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor} shrink-0`}>
                          {entityLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Block: Actions + User Profile Menu Dropdown */}
          <div className="flex items-center justify-end gap-2.5 flex-1">
            {/* Mentions Dropdown Selector Container */}
            <div className="relative">
              <button
                id="mentions-btn"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-color bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMentionsOpen(!mentionsOpen);
                  setNotificationsOpen(false); // Close notifications panel
                }}
                aria-label="Mentions"
                aria-haspopup="true"
                aria-expanded={mentionsOpen}
              >
                <AtSign size={17} />
                {unreadMentionsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent-primary text-[8px] font-extrabold text-white animate-pulse border border-main">
                    {unreadMentionsCount}
                  </span>
                ) : (
                  null
                )}
              </button>

              {mentionsOpen && (
                <div
                  className="absolute top-[calc(100%+8px)] right-0 min-w-[320px] max-w-[360px] bg-card border border-color rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[300] animate-slideDown overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                  role="menu"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-color bg-main/20">
                    <span className="text-xs font-extrabold text-[var(--text-main)] flex items-center gap-1.5">
                      <AtSign size={13} className="text-accent-primary" />
                      Unread Mentions
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-color/40">
                    {loadingMentions ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-1.5">
                        <Loader2
                          className="animate-spin text-accent-primary"
                          size={18}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Retrieving mentions…
                        </span>
                      </div>
                    ) : unreadMentions.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[var(--text-muted)] italic">
                        No unread mentions.
                      </div>
                    ) : (
                      unreadMentions.map((mention) => (
                        <div
                          key={mention.id}
                          className="p-3.5 flex flex-col gap-2 transition text-left hover:bg-main/25 relative text-[var(--text-main)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <span className="text-xs font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-accent-primary rounded-full shrink-0 animate-pulse" />
                                You were @mentioned
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono truncate block">
                                Msg ID: {mention.message_id}
                              </span>
                            </div>
                            <button
                              onClick={() => handleMarkMentionRead(mention.message_id)}
                              className="text-[10px] font-bold text-accent-primary hover:underline bg-transparent border-none cursor-pointer px-2 py-1 hover:bg-accent-primary/5 rounded border border-accent-primary/20 shrink-0"
                            >
                              Mark Read
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
