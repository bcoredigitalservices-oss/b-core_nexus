import React, { useState } from 'react';
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
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function TierOneSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
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
        width: isExpanded ? '250px' : '76px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        zIndex: 50,
        boxShadow: '1px 0 10px rgba(0, 0, 0, 0.02)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <style>{`
        .tierone-sidebar-link {
          display: flex;
          alignItems: center;
          width: ${isExpanded ? 'calc(100% - 1.5rem)' : '48px'};
          height: 48px;
          margin: 0.3rem auto;
          padding: ${isExpanded ? '0 1rem' : '0'};
          justify-content: ${isExpanded ? 'flex-start' : 'center'};
          color: var(--text-muted);
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }
        .tierone-sidebar-link:hover {
          color: var(--accent-primary);
          background-color: var(--bg-card-hover);
        }
        .tierone-sidebar-link.active {
          background-color: var(--bg-card-hover);
          color: var(--accent-primary);
        }
        .tierone-sidebar-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 24px;
          width: 4px;
          background-color: var(--accent-primary);
          border-radius: 0 4px 4px 0;
        }
        .tierone-sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
        }
        .tierone-sidebar-label {
          display: ${isExpanded ? 'flex' : 'none'};
          flex-direction: column;
          margin-left: 1rem;
          white-space: nowrap;
          overflow: hidden;
        }
        .tierone-sidebar-label-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: inherit;
        }
        .tierone-sidebar-label-subtext {
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--text-muted);
          opacity: 0.8;
          margin-top: 2px;
        }
      `}</style>

      {/* Brand Header */}
      <div 
        style={{ 
          padding: '1.5rem 0', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          width: '100%',
          marginBottom: '1rem',
          paddingLeft: isExpanded ? '1.5rem' : '0',
          position: 'relative'
        }}
      >
        <div 
          style={{
            background: 'var(--accent-primary)',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}
        >
          <Cpu size={22} />
        </div>
        
        {isExpanded && (
          <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', letterSpacing: '0.05em' }}>NEXUS OS</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enterprise</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
        {navItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className="tierone-sidebar-link"
            title={!isExpanded ? item.label : undefined}
          >
            <span className="tierone-sidebar-icon">{item.icon}</span>
            <div className="tierone-sidebar-label">
              <span className="tierone-sidebar-label-title">{item.label}</span>
              <span className="tierone-sidebar-label-subtext">{item.subtext}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile & Toggle */}
      <div 
        style={{ 
          padding: '1rem 0', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: isExpanded ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-around' : 'center',
          gap: isExpanded ? '0' : '0.5rem',
          width: '100%'
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '10px',
            color: 'var(--accent-danger)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
