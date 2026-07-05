import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Package, 
  Layers, 
  UserCheck, 
  Mail, 
  Zap, 
  Globe, 
  Shield, 
  Percent, 
  Settings, 
  Terminal, 
  MessageSquare,
  LogOut,
  Cpu,
  Plus
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ReadOnlyBadge from '../ui/ReadOnlyBadge';
import BCoreLogoMark from '../branding/BCoreLogoMark';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  subtext?: string;
  readOnly?: boolean;
}

export default function AdminSidebar() {
  const { currentUser, logout, systemSettings, setInviteModalOpen } = useAppContext();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Workspaces', path: '/workspace', icon: <Briefcase size={18} /> },
    { label: 'Users', path: '/users', icon: <Users size={18} /> },
    { 
      label: 'Items & Products', 
      path: '/catalog', 
      icon: <Package size={18} />, 
      subtext: 'Category Initialization' 
    },
    { label: 'Departments', path: '/departments', icon: <Layers size={18} /> },
    { label: 'Customers', path: '/customers', icon: <UserCheck size={18} />, readOnly: true },
    { label: 'Email Setup', path: '/email-setup', icon: <Mail size={18} /> },
    { label: 'Automation Setup', path: '/automation', icon: <Zap size={18} /> },
    { label: 'Organisation', path: '/settings/org', icon: <Globe size={18} />, readOnly: true },
    { label: 'Security Logs', path: '/events', icon: <Shield size={18} /> },
    { label: 'Tax Rules & Services', path: '/taxes', icon: <Percent size={18} />, readOnly: true },
    { label: 'System Settings', path: '/settings/config', icon: <Settings size={18} />, subtext: 'Themes, Fonts, Layouts' },
    { label: 'Event Engine', path: '/event-engine', icon: <Terminal size={18} /> },
    { label: 'Communication', path: '/communication', icon: <MessageSquare size={18} />, subtext: 'Chat Rules & Configs' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[260px] bg-sidebar border-r border-color flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0">
      {/* Brand Header */}
      <div className="py-6 px-5 border-b border-color flex items-center gap-3">
        <div className="bg-card border border-color rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,91,255,0.15)]">
          <BCoreLogoMark size={20} />
        </div>
        <div>
          <span className="text-[0.9rem] font-bold text-text-main tracking-wider block font-display">
            B-CORE NEXUS
          </span>
          <span className="text-[0.7rem] text-text-muted block">
            {systemSettings?.organization_name || 'Tier 0 Root Admin'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 flex flex-col">
        {navItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className={({ isActive }) =>
              `flex items-center gap-2.5 py-2.5 px-5 text-text-muted text-[13.5px] font-medium border-l-2 transition-all duration-150 ${
                isActive
                  ? 'border-accent-primary bg-sidebar-active-bg text-sidebar-active-text font-semibold'
                  : 'border-transparent hover:bg-card-hover hover:text-text-main'
              }`
            }
          >
            <span className="flex items-center justify-center opacity-85">{item.icon}</span>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span>{item.label}</span>
                  {item.readOnly && <ReadOnlyBadge />}
                </div>
                {item.label === 'Users' && currentUser?.permissions?.includes('*:*') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setInviteModalOpen(true);
                    }}
                    className="bg-[#00A0DF] bg-opacity-10 border border-[#00A0DF] border-opacity-30 rounded text-[#00A0DF] p-0.5 flex items-center cursor-pointer transition-all duration-150 hover:bg-opacity-25 hover:border-opacity-50"
                    title="Invite Executive User"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {item.subtext && (
                <span className="text-[11px] text-text-muted mt-0.5 font-normal">
                  {item.subtext}
                </span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-5 border-t border-color flex flex-col gap-2.5">
        {currentUser && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-primary bg-opacity-20 text-accent-primary flex items-center justify-center font-bold text-[0.85rem]">
              {currentUser.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[0.8rem] font-semibold text-text-main truncate">
                {currentUser.full_name || currentUser.email}
              </span>
              <span className="text-[0.68rem] text-text-muted">
                {currentUser?.permissions?.includes('*:*') ? 'System Admin' : 'Admin'}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-transparent border-none text-accent-danger text-[0.8rem] font-semibold cursor-pointer py-1.5 text-left transition-colors duration-150 hover:text-red-400"
        >
          <LogOut size={14} />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
