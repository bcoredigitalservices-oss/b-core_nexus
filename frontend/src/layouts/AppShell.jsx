import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Bell, Database, Server, User, ChevronDown, Settings, LogOut, LayoutGrid,
} from 'lucide-react';
import Sidebar, { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '../components/navigation/Sidebar';
import AdminSidebar from '../components/navigation/AdminSidebar';
import { useAppContext } from '../context/AppContext';

const MOBILE_BREAKPOINT = 768; // px

export default function AppShell() {
  const { isApiLive, currentUser, systemSettings, logout, isBooting } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isHub = location.pathname === '/workspace' || location.pathname === '/workspace/' || location.pathname === '/workspaces' || location.pathname === '/workspaces/';
  const isWorkspaceAppRoute = (location.pathname.startsWith('/workspace/') || location.pathname.startsWith('/workspaces/')) && !isHub;

  // ── Responsive & Navigation Sync States ────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile Drawer Toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop Width State
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // Reset mobile overlay state on desktop stretch
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close user-menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    currentUser?.permissions?.includes('*:*') || 
    currentUser?.permissions?.includes('iam:manage') ||
    currentUser?.functional_roles?.includes('admin') ||
    currentUser?.functional_roles?.includes('manager');

  // Derived from Sidebar's constants or AdminSidebar's fixed footprint
  const contentOffset = !isMobile && showSidebar
    ? (sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : (isAdmin ? 260 : SIDEBAR_WIDTH_EXPANDED))
    : 0;

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-main">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {showSidebar && (
        isAdmin ? (
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
        )
      )}

      {/* ── Main Layout Column (Header + Routed Content) ─────────── */}
      <div
        className="flex flex-col flex-1 min-w-0 h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          // Sync exact physical footprint width dynamically to prevent content jumping or bad layout overlaps
          paddingLeft: `${contentOffset}px`
        }}
      >
        {/* ── Top Header Bar ─────────────────────────────────────── */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-header border-b border-color sticky top-0 z-40 gap-4" role="banner">

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
            <button
              id="header-hub-btn"
              onClick={() => navigate('/workspace')}
              className="hidden md:flex items-center gap-1.5 text-[11px] font-bold bg-card-hover border border-color rounded-lg py-1.5 px-3 cursor-pointer transition-all duration-200 mr-2 text-text-muted hover:text-text-main hover:border-accent-primary hover:border-opacity-20"
            >
              <LayoutGrid size={13} />
              <span>Workspace Hub</span>
            </button>

            {/* API Environment Badge */}
            <div className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold border ${
              isApiLive
                ? 'text-accent-green border-accent-green/35 bg-accent-green/8'
                : 'text-accent-warning border-accent-warning/30 bg-accent-warning/7'
            }`}>
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
              {systemSettings?.organization_name ?? 'B-Core Nexus'}
            </span>
          </div>

          {/* Right Block: Actions + User Profile Menu Dropdown */}
          <div className="flex items-center justify-end gap-2.5 flex-1">
            <button
              id="notifications-btn"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-color bg-transparent text-text-muted cursor-pointer transition-all duration-200 hover:bg-card-hover hover:text-text-main hover:border-accent-primary hover:border-opacity-40"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-danger rounded-full border border-main animate-[pulse_2s_infinite]" />
            </button>

            {/* User Dropdown Selector Container */}
            <div className="relative">
              <button
                id="user-profile-btn"
                className="flex items-center gap-2 py-1.5 pr-2.5 pl-1.5 rounded-xl border border-color bg-white/5 cursor-pointer transition-all duration-200 hover:bg-card-hover hover:border-accent-primary hover:border-opacity-40"
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {currentUser?.email?.[0]?.toUpperCase() ?? <User size={14} />}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-[12px] font-semibold text-text-main max-w-[130px] truncate">
                    {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : (currentUser?.email || 'Admin')}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                    {currentUser?.permissions?.includes('*:*') ? 'Admin' : 'User'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 shrink-0 ${userMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 min-w-[180px] bg-card border border-color rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[300] animate-slideDown" role="menu">
                  <button
                    id="profile-settings-menu-item"
                    className="flex items-center gap-2 w-full p-2 rounded-lg border-none bg-transparent text-text-muted text-sm font-body cursor-pointer text-left transition-all duration-150 hover:bg-card-hover hover:text-text-main"
                    onClick={() => { navigate('/settings/profile'); setUserMenuOpen(false); }}
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
            padding: isWorkspaceAppRoute ? 0 : '1.5rem',
            display: isWorkspaceAppRoute ? 'flex' : 'block',
            flexDirection: isWorkspaceAppRoute ? 'column' : 'initial'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}