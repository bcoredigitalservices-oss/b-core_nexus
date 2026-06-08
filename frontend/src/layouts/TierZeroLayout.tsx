import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Database, Server, User, ChevronDown, Bell, LogOut, Settings } from 'lucide-react';
import AdminSidebar from '../components/navigation/AdminSidebar';
import InviteUserModal from '../components/admin/InviteUserModal';
import { useAppContext } from '../context/AppContext';

export default function TierZeroLayout() {
  const { isApiLive, currentUser, systemSettings, logout, isBooting } = useAppContext();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isBooting) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0F172A',
          color: '#ffffff',
          gap: '1.5rem'
        }}
      >
        <div className="appshell-boot__spinner" style={{ borderTopColor: '#00A0DF', width: '40px', height: '40px' }} />
        <p style={{ fontSize: '0.95rem', letterSpacing: '0.05em', color: '#9CA3AF' }}>Initialising Tier 0 Admin Workspace…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#090D1A', color: '#F3F4F6' }}>
      
      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
        />
      )}

      {/* Sidebar (sticky left) */}
      <div 
        style={{
          display: isMobile && !mobileSidebarOpen ? 'none' : 'block',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          height: '100vh',
          boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.5)' : 'none'
        }}
      >
        <AdminSidebar />
      </div>

      {/* Main Content Area (right) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header 
          style={{
            height: '64px',
            backgroundColor: '#0B1120',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            zIndex: 30
          }}
        >
          {/* Left Side: Mobile Menu Button & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && (
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Menu size={20} />
              </button>
            )}

            {/* API Connectivity Badge */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isApiLive ? 'var(--accent-green)' : '#9CA3AF',
                background: isApiLive ? 'rgba(0, 245, 160, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: `1px solid ${isApiLive ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`
              }}
            >
              {isApiLive ? <Database size={13} /> : <Server size={13} />}
              <span>{isApiLive ? 'Live Connection' : 'Sandbox mode'}</span>
            </div>
          </div>

          {/* Center Title */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.02em' }}>
              STRUCTURAL ENGINE CONTROL
            </span>
          </div>

          {/* Right Side Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Notification Indicator */}
            <button 
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '6px',
                position: 'relative'
              }}
            >
              <Bell size={18} />
              <span 
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444'
                }}
              />
            </button>

            {/* Profile Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  textAlign: 'left'
                }}
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 160, 223, 0.15)',
                    border: '1px solid rgba(0, 160, 223, 0.3)',
                    color: '#00A0DF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  {currentUser?.email?.[0]?.toUpperCase() ?? <User size={13} />}
                </div>
                <div style={{ display: isMobile ? 'none' : 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {currentUser?.full_name || currentUser?.email?.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>
                    Tier 0 Root
                  </span>
                </div>
                <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
              </button>

              {dropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '180px',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    padding: '4px 0',
                    zIndex: 100
                  }}
                >
                  <button
                    onClick={() => navigate('/settings/config')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#9CA3AF',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                  >
                    <Settings size={14} />
                    <span>System Settings</span>
                  </button>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#EF4444'}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '2rem',
            background: '#090D1A'
          }}
        >
          <Outlet />
        </main>
      </div>
      <InviteUserModal />
    </div>
  );
}
