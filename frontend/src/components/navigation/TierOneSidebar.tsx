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
  Wrench
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function TierOneSidebar() {
  const { currentUser, logout, activeWorkspace } = useAppContext();
  const navigate = useNavigate();

  const vertical = activeWorkspace?.industry_vertical || 'GENERAL_TRADING';

  // Construct dynamic navItems based on active workspace industry vertical
  const coreNavItemsBefore = [
    { label: 'Home', subtext: 'Workspace & Department hub', path: '/workspace', icon: <Home size={18} /> },
    { label: 'Dashboard', subtext: 'Business overview & reports', path: '/executive', icon: <LayoutDashboard size={18} /> },
    { label: 'Users', subtext: 'Tier 2, 3, 4 management', path: '/directory', icon: <Users size={18} /> },
    { label: 'Workspaces', subtext: 'Active cluster registry', path: '/workspaces', icon: <Cpu size={18} /> }
  ];

  const coreNavItemsAfter = [
    { label: 'Organisation', subtext: 'Company setup: Formats, Logo, Details', path: '/settings/org', icon: <Globe size={18} /> },
    { label: 'General Settings', subtext: 'Theme, Language, Fonts', path: '/settings/config', icon: <Settings size={18} /> },
    { label: 'Events Engine', subtext: 'Beacon, Meeting, Reporting alerts', path: '/events', icon: <Zap size={18} /> },
    { label: 'My Profile', subtext: 'Operator profile details', path: '/settings/profile', icon: <User size={18} /> }
  ];

  let verticalNavItems = [];
  if (vertical === 'HEALTHCARE_LOGISTICS') {
    verticalNavItems = [
      { label: 'Pharmaceutical Items', subtext: 'Medical catalog & batch logs', path: '/catalog', icon: <Package size={18} /> },
      { label: 'Dispatch Routes', subtext: 'Cold chain routing matrix', path: '/routes', icon: <Truck size={18} /> },
      { label: 'Customers', subtext: 'Clinics & pharmacies ledger', path: '/customers', icon: <UserCheck size={18} /> },
      { label: 'Departments', subtext: 'Access & distribution units', path: '/departments', icon: <Layers size={18} /> }
    ];
  } else if (vertical === 'HEAVY_MACHINERY') {
    verticalNavItems = [
      { label: 'Fleet Assets', subtext: 'Heavy equipment catalog', path: '/catalog', icon: <Package size={18} /> },
      { label: 'Maintenance Logs', subtext: 'Scheduled preventative alerts', path: '/maintenance', icon: <Wrench size={18} /> },
      { label: 'Customers', subtext: 'Clients & projects registry', path: '/customers', icon: <UserCheck size={18} /> },
      { label: 'Departments', subtext: 'Operational workshops', path: '/departments', icon: <Layers size={18} /> }
    ];
  } else {
    // GENERAL_TRADING / Default
    verticalNavItems = [
      { label: 'Products & Items', subtext: 'Setup & locks', path: '/catalog', icon: <Package size={18} /> },
      { label: 'Customers', subtext: 'Overview & creation', path: '/customers', icon: <UserCheck size={18} /> },
      { label: 'Departments', subtext: 'Access & operations', path: '/departments', icon: <Layers size={18} /> }
    ];
  }

  const navItems = [...coreNavItemsBefore, ...verticalNavItems, ...coreNavItemsAfter];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      style={{
        width: '270px',
        backgroundColor: '#0F172A',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        zIndex: 50
      }}
    >
      <style>{`
        .tierone-sidebar-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.25rem;
          color: #94A3B8;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-left: 3px solid transparent;
          gap: 12px;
        }
        .tierone-sidebar-link:hover {
          color: #F8FAFC;
          background-color: rgba(255, 255, 255, 0.03);
        }
        .tierone-sidebar-link.active {
          border-left-color: #9d4edd;
          background: linear-gradient(90deg, rgba(157, 78, 221, 0.1) 0%, rgba(157, 78, 221, 0.02) 100%);
          color: #F8FAFC;
        }
        .tierone-sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          color: #64748B;
        }
        .tierone-sidebar-link:hover .tierone-sidebar-icon {
          transform: scale(1.05);
          color: #9d4edd;
        }
        .tierone-sidebar-link.active .tierone-sidebar-icon {
          color: #9d4edd;
        }
        .tierone-sidebar-label {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .tierone-sidebar-subtext {
          font-size: 0.7rem;
          color: #64748B;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {/* Brand Header */}
      <div 
        style={{ 
          padding: '1.5rem 1.25rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(180deg, rgba(157, 78, 221, 0.05) 0%, rgba(0, 0, 0, 0) 100%)'
        }}
      >
        <div 
          style={{
            background: 'rgba(157, 78, 221, 0.15)',
            border: '1px solid rgba(157, 78, 221, 0.3)',
            borderRadius: '8px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(157, 78, 221, 0.2)'
          }}
        >
          <Cpu size={20} color="#9d4edd" />
        </div>
        <div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em', display: 'block', fontFamily: 'var(--font-display)' }}>
            B-CORE NEXUS
          </span>
          <span style={{ fontSize: '0.7rem', color: '#9d4edd', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {vertical.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className="tierone-sidebar-link"
          >
            <span className="tierone-sidebar-icon">{item.icon}</span>
            <div className="tierone-sidebar-label">
              <span>{item.label}</span>
              <span className="tierone-sidebar-subtext">{item.subtext}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div 
        style={{ 
          padding: '1.25rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(157, 78, 221, 0.2)',
                border: '1px solid rgba(157, 78, 221, 0.4)',
                color: '#c8b6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {currentUser.email?.[0]?.toUpperCase() ?? 'E'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {currentUser.full_name || currentUser.email}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                Executive Board
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
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            color: '#EF4444',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 12px',
            textAlign: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          <LogOut size={14} />
          <span>Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}
