import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Menu, Bell, RefreshCw, Database, Server, User, ChevronDown, Settings, LogOut,
} from 'lucide-react';
import Sidebar from '../components/navigation/Sidebar';
import { useAppContext } from '../context/AppContext';
import './AppShell.css';

const MOBILE_BREAKPOINT = 768; // px

export default function AppShell() {
  const { isApiLive, currentUser, systemSettings, logout, isBooting } = useAppContext();
  const navigate = useNavigate();

  // ── Responsive state ────────────────────────────────────────────────────────
  const [isMobile, setIsMobile]           = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // reset on desktop
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
      <div className="appshell-boot">
        <div className="appshell-boot__spinner" />
        <p>Initialising B-Core Nexus…</p>
      </div>
    );
  }

  return (
    <div className="appshell">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapse={setSidebarCollapsed}
        isMobile={isMobile}
      />

      {/* ── Main Column (header + content) ───────────────────────── */}
      <div className={[
        'appshell-main',
        !isMobile && 'appshell-main--desktop',
        !isMobile && sidebarCollapsed && 'sidebar-is-collapsed',
      ].filter(Boolean).join(' ')}>

        {/* ── Top Header ─────────────────────────────────────────── */}
        <header className="appshell-header" role="banner">

          {/* Left: hamburger (mobile) or brand spacer */}
          <div className="appshell-header__left">
            {isMobile && (
              <button
                id="hamburger-menu-btn"
                className="appshell-icon-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}

            {/* API status badge */}
            <div className={`appshell-api-badge ${isApiLive ? 'appshell-api-badge--live' : 'appshell-api-badge--offline'}`}>
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

          {/* Centre: org name */}
          <div className="appshell-header__center">
            <span className="appshell-org-name">
              {systemSettings?.organization_name ?? 'B-Core Nexus'}
            </span>
          </div>

          {/* Right: notifications + user profile */}
          <div className="appshell-header__right">
            <button
              id="notifications-btn"
              className="appshell-icon-btn"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="appshell-notif-dot" />
            </button>

            {/* User profile dropdown */}
            <div className="appshell-user-menu-wrapper">
              <button
                id="user-profile-btn"
                className="appshell-user-btn"
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div className="appshell-user-avatar">
                  {currentUser?.email?.[0]?.toUpperCase() ?? <User size={14} />}
                </div>
                <div className="appshell-user-details">
                  <span className="appshell-user-name">
                    {currentUser?.full_name || currentUser?.email || 'Admin'}
                  </span>
                  <span className="appshell-user-tier">
                    Tier {currentUser?.role_tier ?? '—'}
                  </span>
                </div>
                <ChevronDown size={14} className={`appshell-chevron ${userMenuOpen ? 'appshell-chevron--open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="appshell-dropdown" role="menu">
                  <button
                    id="profile-settings-menu-item"
                    className="appshell-dropdown__item"
                    onClick={() => { navigate('/settings/profile'); setUserMenuOpen(false); }}
                    role="menuitem"
                  >
                    <Settings size={14} /> System Settings
                  </button>
                  <div className="appshell-dropdown__divider" />
                  <button
                    id="logout-menu-item"
                    className="appshell-dropdown__item appshell-dropdown__item--danger"
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

        {/* ── Scrollable Workspace Content ───────────────────────── */}
        <main className="appshell-content" id="main-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
