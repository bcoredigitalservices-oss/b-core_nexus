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
      <div className="flex flex-col items-center justify-center h-screen bg-card text-text-main gap-6">
        <div className="appshell-boot__spinner border-t-[#00A0DF] w-10 h-10" />
        <p className="text-[0.95rem] tracking-[0.05em] text-text-muted">Initialising Tier 0 Admin Workspace…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-text-main">
      
      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-40"
        />
      )}

      {/* Sidebar (sticky left) */}
      <div 
        className={`h-screen z-50 transition-all duration-300 ${
          isMobile ? 'fixed' : 'relative'
        } ${
          isMobile && !mobileSidebarOpen ? 'hidden' : 'block'
        } ${
          isMobile ? 'shadow-2xl' : 'shadow-none'
        }`}
      >
        <AdminSidebar />
      </div>

      {/* Main Content Area (right) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-header border-b border-color flex items-center justify-between px-8 z-30 flex-shrink-0">
          {/* Left Side: Mobile Menu Button & Status */}
          <div className="flex items-center gap-4">
            {isMobile && (
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 flex items-center"
              >
                <Menu size={20} />
              </button>
            )}

            {/* API Connectivity Badge */}
            <div className={`flex items-center gap-1.5 text-[0.75rem] font-semibold py-1 px-2.5 rounded-full border ${
              isApiLive 
                ? 'text-accent-green bg-accent-green/10 border-accent-green/20' 
                : 'text-text-muted bg-card-hover border-color'
            }`}>
              {isApiLive ? <Database size={13} /> : <Server size={13} />}
              <span>{isApiLive ? 'Live Connection' : 'Sandbox mode'}</span>
            </div>
          </div>

          {/* Center Title */}
          <div className="flex items-center">
            <span className="text-[0.875rem] font-semibold text-text-muted tracking-wider">
              STRUCTURAL ENGINE CONTROL
            </span>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-5">
            {/* Notification Indicator */}
            <button className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 relative flex items-center justify-center hover:text-text-main">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-danger" />
            </button>

            {/* Profile Selector */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                className="bg-transparent border-none flex items-center gap-2 cursor-pointer text-text-main text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#00A0DF]/10 border border-[#00A0DF]/30 text-[#00A0DF] flex items-center justify-center font-bold text-[0.8rem]">
                  {currentUser?.email?.[0]?.toUpperCase() ?? <User size={13} />}
                </div>
                <div className={`flex flex-col ${isMobile ? 'hidden' : 'flex'}`}>
                  <span className="text-[0.8rem] font-semibold text-text-main leading-tight">
                    {currentUser?.full_name || currentUser?.email?.split('@')[0]}
                  </span>
                  <span className="text-[0.65rem] text-text-muted leading-tight">
                    Tier 0 Root
                  </span>
                </div>
                <ChevronDown size={14} className="text-text-muted" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-[180px] bg-card border border-color rounded-lg shadow-lg py-1 z-[100]">
                  <button
                    onClick={() => navigate('/settings/config')}
                    className="flex items-center gap-2 w-full py-2 px-3 bg-transparent border-none text-text-muted text-[0.8rem] cursor-pointer text-left transition-colors duration-150 hover:text-text-main"
                  >
                    <Settings size={14} />
                    <span>System Settings</span>
                  </button>
                  <div className="border-t border-color my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full py-2 px-3 bg-transparent border-none text-accent-danger text-[0.8rem] cursor-pointer text-left transition-colors duration-150 hover:text-red-400"
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
        <main className="flex-1 overflow-y-auto p-8 bg-main">
          <Outlet />
        </main>
      </div>
      <InviteUserModal />
    </div>
  );
}
