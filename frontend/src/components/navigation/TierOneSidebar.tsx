import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Users,
  Package,
  UserCheck,
  Layers,
  Globe,
  Settings,
  Zap,
  User,
  LogOut,
  Cpu,
  Truck,
  Wrench,
  Briefcase,
  Sliders,
 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import BCoreLogoMark from '../branding/BCoreLogoMark';

// Keep in sync with the widths TierOneLayout expects when computing its own
// spacing — same convention as the Tier-2 Sidebar.jsx.
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export default function TierOneSidebar({ isExpanded, onToggle }) {
  const { currentUser, logout, activeWorkspace } = useAppContext();
  const navigate = useNavigate();

  const vertical = activeWorkspace?.industry_vertical || 'GENERAL_TRADING';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const coreNavItems = [
    { label: 'Home', path: '/workspace', icon: <Home size={18} /> },
    { label: 'Dashboard', path: '/executive', icon: <LayoutDashboard size={18} /> },
    { label: 'Users', path: '/directory', icon: <Users size={18} /> },
    { label: 'Workspaces', path: '/workspaces', icon: <Cpu size={18} /> }
  ];

  let verticalNavItems = [];
  if (vertical === 'HEALTHCARE_LOGISTICS') {
    verticalNavItems = [
      { label: 'Pharmaceutical Items', path: '/catalog', icon: <Package size={18} /> },
      { label: 'Dispatch Routes', path: '/routes', icon: <Truck size={18} /> },
      { label: 'Customers', path: '/customers', icon: <UserCheck size={18} /> },
      { label: 'Departments', path: '/departments', icon: <Layers size={18} /> }
    ];
  } else if (vertical === 'HEAVY_MACHINERY') {
    verticalNavItems = [
      { label: 'Fleet Assets', path: '/catalog', icon: <Package size={18} /> },
      { label: 'Maintenance Logs', path: '/maintenance', icon: <Wrench size={18} /> },
      { label: 'Customers', path: '/customers', icon: <UserCheck size={18} /> },
      { label: 'Departments', path: '/departments', icon: <Layers size={18} /> }
    ];
  } else {
    verticalNavItems = [
      { label: 'Products & Items', path: '/catalog', icon: <Package size={18} /> },
      { label: 'Customers', path: '/customers', icon: <UserCheck size={18} /> },
      { label: 'Departments', path: '/departments', icon: <Layers size={18} /> },
      { label: 'Organisation', path: '/settings/org', icon: <Globe size={18} /> },
    ];
  }

  const settingNavItems = [
    { label: 'General Settings', path: '/settings/config', icon: <Settings size={18} /> },
    { label: 'Events Engine', path: '/events', icon: <Zap size={18} /> },
    { label: 'My Profile', path: '/settings/profile', icon: <User size={18} /> }
  ];

  // Mobile gets its own compact bottom tab bar rather than a collapsible
  // drawer — this is the actual mobile nav for this tier (see TierOneLayout,
  // which no longer ships a redundant, non-functional hamburger drawer).
  const mobileShortcutItems = [
    { path: '/workspace', icon: <Home size={20} /> },
    { path: '/executive', icon: <LayoutDashboard size={20} /> },
    { path: '/catalog', icon: <Package size={20} /> },
    { path: '/settings/config', icon: <Settings size={20} /> }
  ];

  const renderNavGroup = (title, items, groupIcon) => (
    <div className="w-full mb-5 flex flex-col items-center">
      <div
        className={`flex items-center w-full mb-1.5 text-text-muted opacity-60 ${
          isExpanded ? 'justify-start px-5' : 'justify-center'
        }`}
        title={!isExpanded ? title : undefined}
      >
        {isExpanded ? (
          <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
        ) : (
          groupIcon
        )}
      </div>
      {items.map((item, index) => (
        <NavLink
          key={index}
          to={item.path}
          onClick={(e) => e.stopPropagation()}
          className={({ isActive }) =>
            `flex items-center h-[42px] my-1 mx-auto cursor-pointer rounded-lg relative text-text-muted transition-all duration-200 ${
              isActive ? 'text-accent-primary bg-card-hover font-semibold' : 'hover:text-accent-primary hover:bg-card-hover'
            } ${isExpanded ? 'w-[calc(100%-1.5rem)] px-3.5 justify-start' : 'w-11 justify-center'}`
          }
          title={!isExpanded ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center justify-center min-w-[20px] shrink-0">{item.icon}</span>
              {isExpanded && <span className="text-[13px] font-semibold ml-3.5 whitespace-nowrap">{item.label}</span>}
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-accent-primary rounded-r transition-transform duration-200 origin-left ${
                isActive ? 'scale-x-100' : 'scale-x-0'
              }`} />
            </>
          )}
        </NavLink>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar — click anywhere (outside links/logout) to expand/collapse */}
      <aside
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle?.(); } }}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        title={isExpanded ? 'Click to collapse sidebar' : 'Click to expand sidebar'}
        className={`group sticky top-0 h-screen flex flex-col bg-sidebar border-r border-color shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-50 overflow-y-auto overflow-x-hidden cursor-pointer transition-[width,background-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-card-hover/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:-outline-offset-2 ${
          isExpanded ? 'w-[240px] items-stretch' : 'w-[72px] items-center'
        } hidden md:flex`}
      >
        {/* Brand Header — fixed to 64px to exactly match the top navbar's height,
            so the two border-bottom lines meet flush instead of stepping at the seam */}
        <div className={`relative flex items-center h-16 shrink-0 border-b border-color w-full ${
          isExpanded ? 'justify-start px-5' : 'justify-center'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8.5 h-8.5 bg-card border border-color rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,91,255,0.15)]">
              <BCoreLogoMark size={20} />
            </div>
            {isExpanded && (
              <div className="flex flex-col leading-none">
                <span className="font-display text-sm font-extrabold tracking-wider text-text-main">B-CORE NEXUS</span>
              </div>
            )}
          </div>
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-muted opacity-0 group-hover:opacity-60 transition-opacity duration-200 ${
              isExpanded ? 'right-4' : 'right-1.5'
            }`}
            aria-hidden="true"
          >
            {isExpanded ? '⟨⟨' : '⟩⟩'}
          </span>
        </div>

        {/* Categories */}
        <nav className="flex-1 flex flex-col w-full pt-6">
          {renderNavGroup('Core Operation', coreNavItems, <Home size={14} />)}
          {renderNavGroup('Business Workspace', verticalNavItems, <Briefcase size={14} />)}
          {renderNavGroup('System Settings', settingNavItems, <Sliders size={14} />)}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-color flex w-full box-border shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className={`flex items-center w-full h-[42px] bg-transparent border-none rounded-lg text-accent-danger cursor-pointer transition-colors duration-200 hover:bg-red-500/10 ${
              isExpanded ? 'justify-start px-3.5' : 'justify-center'
            }`}
          >
            <LogOut size={18} />
            {isExpanded && <span className="ml-3.5 text-[13px] font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Smartphone Bottom Navigation Bar */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-card border-t border-color shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-[100] flex-row justify-around items-center px-4">
        {mobileShortcutItems.map((shortcut, index) => (
          <NavLink
            key={index}
            to={shortcut.path}
            className={({ isActive }) =>
              `flex items-center justify-center text-text-muted w-11 h-11 rounded-xl transition-all duration-150 ${
                isActive ? 'text-accent-primary bg-card-hover font-semibold' : 'hover:text-accent-primary hover:bg-card-hover'
              }`
            }
          >
            {shortcut.icon}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center text-text-muted w-11 h-11 rounded-xl transition-all duration-150 hover:bg-red-500/10 bg-transparent border-none cursor-pointer"
        >
          <LogOut size={20} className="text-accent-danger" />
        </button>
      </div>
    </>
  );
}