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
    <aside 
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-main)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto'
      }}
    >
      <style>{`
        .admin-sidebar-link {
          display: flex;
          align-items: center;
          padding: 0.65rem 1.25rem;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          border-left: 2px solid transparent;
          gap: 10px;
        }
        .admin-sidebar-link:hover {
          color: var(--text-main);
          background-color: var(--bg-card-hover);
        }
        .admin-sidebar-link.active {
          border-left-color: var(--accent-primary);
          background-color: var(--sidebar-active-bg);
          color: var(--sidebar-active-text);
        }
        .admin-sidebar-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.85;
        }
        .admin-sidebar-link.active .admin-sidebar-link-icon {
          color: var(--sidebar-active-text);
          opacity: 1;
        }
      `}</style>

      {/* Brand Header */}
      <div 
        style={{ 
          padding: '1.5rem 1.25rem', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div 
          style={{
            background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
            borderRadius: '8px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Cpu size={20} color="var(--accent-primary)" />
        </div>
        <div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.05em', display: 'block' }}>
            B-CORE NEXUS
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
            {systemSettings?.organization_name || 'Tier 0 Root Admin'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column' }}>
        {navItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className="admin-sidebar-link"
          >
            <span className="admin-sidebar-link-icon">{item.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{item.label}</span>
                  {item.readOnly && <ReadOnlyBadge />}
                </div>
                {item.label === 'Users' && currentUser?.role_tier === 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setInviteModalOpen(true);
                    }}
                    style={{
                      background: 'rgba(0, 160, 223, 0.12)',
                      border: '1px solid rgba(0, 160, 223, 0.3)',
                      borderRadius: '4px',
                      color: '#00A0DF',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 160, 223, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(0, 160, 223, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 160, 223, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(0, 160, 223, 0.3)';
                    }}
                    title="Invite Executive User"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {item.subtext && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {item.subtext}
                </span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div 
        style={{ 
          padding: '1rem 1.25rem', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {currentUser.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {currentUser.full_name || currentUser.email}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Tier {currentUser.role_tier ?? 0} Root
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#EF4444',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 0',
            textAlign: 'left',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#EF4444'}
        >
          <LogOut size={14} />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
