import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, Database, Server, User, ChevronDown, Bell, LogOut, Settings, 
  MessageSquare, Send, X, ShieldAlert 
} from 'lucide-react';
import TierOneSidebar from '../components/navigation/TierOneSidebar';
import { useAppContext } from '../context/AppContext';

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  avatarColor: string;
  message: string;
  timestamp: string;
}

export default function TierOneLayout() {
  const { isApiLive, currentUser, systemSettings, logout, isBooting } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isWorkspaceRoute = location.pathname.startsWith('/workspaces');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Active Chat states
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Dhruv Dubey',
      role: 'Tier 0 Admin',
      avatarColor: 'rgba(0, 160, 223, 0.2)',
      message: 'Initialised the global document sequencing ledger. Ready for production rules.',
      timestamp: '21:42'
    },
    {
      id: '2',
      sender: 'Sarah Jenkins',
      role: 'Tier 1 Director',
      avatarColor: 'rgba(157, 78, 221, 0.2)',
      message: 'Excellent. I am reviewing the multi-jurisdictional tax reporting configurations now.',
      timestamp: '21:45'
    },
    {
      id: '3',
      sender: 'System Alert Engine',
      role: 'Automated Agent',
      avatarColor: 'rgba(0, 245, 160, 0.15)',
      message: 'Active Catalog replication synchronised successfully across 8 global nodes.',
      timestamp: '21:50'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Me',
      role: 'Tier 1 Executive',
      avatarColor: 'rgba(157, 78, 221, 0.2)',
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
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
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          gap: '1.5rem'
        }}
      >
        <div className="appshell-boot__spinner" style={{ borderTopColor: '#9d4edd', width: '40px', height: '40px' }} />
        <p style={{ fontSize: '0.95rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Initialising Tier 1 Executive Workspace…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      
      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
        />
      )}

      {/* Sidebar (sticky left) */}
      {!isWorkspaceRoute && (
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
          <TierOneSidebar />
        </div>
      )}

      {/* Main Content & Chat Container (right) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header 
          style={{
            height: '64px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
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
                  color: 'var(--text-muted)',
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
                color: isApiLive ? 'var(--accent-green)' : 'var(--text-muted)',
                background: isApiLive ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card-hover)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: `1px solid ${isApiLive ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`
              }}
            >
              {isApiLive ? <Database size={13} /> : <Server size={13} />}
              <span>{isApiLive ? 'Live Connection' : 'Sandbox mode'}</span>
            </div>
          </div>

          {/* Center Title */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>
              BUSINESS OPERATIONS CENTRE
            </span>
          </div>

          {/* Right Side Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            {/* Active Chat Toggle Button */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              style={{
                background: chatOpen ? 'var(--bg-card-hover)' : 'transparent',
                border: 'none',
                color: chatOpen ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={chatOpen ? 'Hide Active Chat' : 'Show Active Chat'}
            >
              <MessageSquare size={18} />
            </button>

            {/* Notification Indicator */}
            <button 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                  color: 'var(--text-main)',
                  textAlign: 'left'
                }}
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--accent-primary)',
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
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {currentUser?.full_name || currentUser?.email?.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Tier 1 Executive
                  </span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {dropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '180px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '4px 0',
                    zIndex: 100
                  }}
                >
                  <button
                    onClick={() => navigate('/settings/profile')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <User size={14} />
                    <span>My Profile</span>
                  </button>
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
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Settings size={14} />
                    <span>System Settings</span>
                  </button>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
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

        {/* Inner layout with main content and right-side chat */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          
          {/* Scrollable Main Content */}
          <main 
            style={{ 
              flex: 1, 
              overflow: isWorkspaceRoute ? 'hidden' : 'auto', 
              padding: isWorkspaceRoute ? '0' : '2rem',
              background: 'var(--bg-main)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Outlet />
          </main>

          {/* Right-Side "Active Chat" Panel */}
          <div 
            style={{
              width: chatOpen ? '280px' : '0px',
              opacity: chatOpen ? 1 : 0,
              visibility: chatOpen ? 'visible' : 'hidden',
              backgroundColor: 'var(--bg-card)',
              borderLeft: chatOpen ? '1px solid var(--border-color)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, visibility 0.2s',
              zIndex: 25,
              position: 'relative'
            }}
          >
            {/* Chat Header */}
            <div 
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(157, 78, 221, 0.02)'
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Active Chat</h3>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Real-time team communication</p>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Message Stream */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                scrollbarWidth: 'thin'
              }}
            >
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div 
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: msg.avatarColor,
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {msg.sender[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.sender}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                    <span 
                      style={{ 
                        display: 'inline-block', 
                        fontSize: '0.65rem', 
                        color: 'var(--accent-primary)', 
                        fontWeight: 600, 
                        marginBottom: '4px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.02em' 
                      }}
                    >
                      {msg.role}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Box */}
            <form 
              onSubmit={handleSendChat}
              style={{
                padding: '1rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-card-hover)'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Send a message..." 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                    padding: '8px 32px 8px 10px',
                    height: '34px'
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: chatInput.trim() ? '#9d4edd' : 'var(--text-muted)',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  disabled={!chatInput.trim()}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>

          </div>

        </div>
      </div>
    </div>
  );
}
