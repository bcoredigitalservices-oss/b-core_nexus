import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Package, Shield, Cpu, LayoutDashboard, Activity,
  Briefcase, User, Settings, DollarSign, UserPlus, Plus,
  Zap, Globe, ChevronLeft, ChevronRight, Layers, LogOut,
  FolderOpen, Server,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Sidebar.css';

// ─── Icon mapper (backend sends string names) ─────────────────────────────────
const ICON_MAP = {
  directory:    <Users       size={18} />,
  catalog:      <Package     size={18} />,
  shield:       <Shield      size={18} />,
  executive:    <Briefcase   size={18} />,
  cpu:          <Cpu         size={18} />,
  activity:     <Activity    size={18} />,
  user:         <User        size={18} />,
  briefcase:    <Briefcase   size={18} />,
  settings:     <Settings    size={18} />,
  'dollar-sign':<DollarSign  size={18} />,
  'user-plus':  <UserPlus    size={18} />,
  plus:         <Plus        size={18} />,
  globe:        <Globe       size={18} />,
  dashboard:    <LayoutDashboard size={18} />,
  zap:          <Zap         size={18} />,
  server:       <Server      size={18} />,
  folder:       <FolderOpen  size={18} />,
};

function NavIcon({ name }) {
  return ICON_MAP[name] ?? <Layers size={18} />;
}

// ─── A single sidebar link ────────────────────────────────────────────────────
function SidebarLink({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? 'sidebar-link--active' : ''} ${collapsed ? 'sidebar-link--collapsed' : ''}`
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar-link__icon">
        <NavIcon name={item.icon} />
      </span>
      {!collapsed && (
        <span className="sidebar-link__label">{item.label}</span>
      )}
    </NavLink>
  );
}

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose, onCollapse, isMobile }) {
  const { navigationMatrix, systemSettings, currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // On mobile the sidebar slides in/out; on desktop it collapses to icon-only
  const effectiveCollapsed = isMobile ? false : collapsed;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={[
          'sidebar',
          effectiveCollapsed ? 'sidebar--collapsed' : '',
          isMobile ? 'sidebar--mobile' : '',
          isMobile && isOpen ? 'sidebar--mobile-open' : '',
        ].filter(Boolean).join(' ')}
        aria-label="Primary navigation"
      >
        {/* ── Brand Header ──────────────────────────────────────────── */}
        <div className="sidebar-header">
          {!effectiveCollapsed && (
            <div className="sidebar-brand">
              <div className="sidebar-brand__logo">
                <img src="/favicon.svg" alt="B-Core Logo" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="sidebar-brand__text">
                <span className="sidebar-brand__name">B-CORE</span>
                <span className="sidebar-brand__sub">
                  {systemSettings?.organization_name ?? 'Nexus ERP'}
                </span>
              </div>
            </div>
          )}

          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button
              id="sidebar-collapse-btn"
              className="sidebar-collapse-btn"
              onClick={handleCollapseToggle}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              id="sidebar-close-btn"
              className="sidebar-collapse-btn"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* ── Primary Navigation ────────────────────────────────────── */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {!effectiveCollapsed && (
            <p className="sidebar-section-label">Workspaces</p>
          )}
          {navigationMatrix.sidebar_links.map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              collapsed={effectiveCollapsed}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </nav>

        {/* ── Settings Modules ──────────────────────────────────────── */}
        {navigationMatrix.settings_modules?.length > 0 && (
          <nav className="sidebar-nav sidebar-nav--settings" aria-label="Settings navigation">
            {!effectiveCollapsed && (
              <p className="sidebar-section-label">Settings</p>
            )}
            {navigationMatrix.settings_modules.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                collapsed={effectiveCollapsed}
                onClick={isMobile ? onClose : undefined}
              />
            ))}
          </nav>
        )}

        {/* ── User Footer ───────────────────────────────────────────── */}
        <div className={`sidebar-footer ${effectiveCollapsed ? 'sidebar-footer--collapsed' : ''}`}>
          {!effectiveCollapsed && currentUser && (
            <div className="sidebar-user">
              <div className="sidebar-user__avatar">
                {currentUser.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="sidebar-user__info">
                <span className="sidebar-user__name">
                  {currentUser.full_name || currentUser.email}
                </span>
                <span className="sidebar-user__tier">
                  Tier {currentUser.role_tier ?? '?'}
                </span>
              </div>
            </div>
          )}
          <button
            id="sidebar-logout-btn"
            className="sidebar-logout-btn"
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
