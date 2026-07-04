import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Database, Server, User, ChevronDown, Bell, LogOut, Settings, 
  MessageSquare, Send, X, LayoutGrid 
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
  const isHub = location.pathname === '/workspace' || location.pathname === '/workspace/' || location.pathname === '/workspaces' || location.pathname === '/workspaces/';
  const isWorkspaceAppRoute = (location.pathname.startsWith('/workspace/') || location.pathname.startsWith('/workspaces/')) && !isHub;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Desktop sidebar expand/collapse now lives here (not buried inside the
  // sidebar component) so the header and any future layout math can react to
  // it too — mirrors the pattern used by AppShell/Sidebar for Tier 2.
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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
      <div className="flex flex-col items-center justify-center h-screen bg-card text-text-main gap-6">
        <div className="appshell-boot__spinner border-t-[#9d4edd] w-10 h-10" />
        <p className="text-[0.95rem] tracking-[0.05em] text-text-muted">Initialising Tier 1 Executive Workspace…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-main text-text-main">

      {!isWorkspaceAppRoute && (
        <TierOneSidebar
          isExpanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(v => !v)}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        <header className="h-16 bg-header border-b border-color flex items-center justify-between px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              id="header-hub-btn-t1"
              onClick={() => navigate('/workspace')}
              className={`items-center gap-1.5 text-[0.75rem] font-bold text-text-muted bg-card-hover border border-color rounded-lg py-1.5 px-3 cursor-pointer transition-all duration-200 mr-3 hover:text-text-main hover:border-black/20 ${
                isMobile ? 'hidden' : 'flex'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Workspace Hub</span>
            </button>

            <div className={`flex items-center gap-1.5 text-[0.75rem] font-semibold py-1 px-2.5 rounded-full border ${
              isApiLive 
                ? 'text-accent-green bg-accent-green/10 border-accent-green/20' 
                : 'text-text-muted bg-card-hover border-color'
            }`}>
              {isApiLive ? <Database size={13} /> : <Server size={13} />}
              <span>{isApiLive ? 'Live Connection' : 'Sandbox mode'}</span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-[0.875rem] font-bold text-text-main tracking-wider font-display">
              BUSINESS OPERATIONS CENTRE
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`border-none cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none ${
                chatOpen ? 'bg-card-hover text-accent-primary' : 'bg-transparent text-text-muted hover:text-text-main'
              }`}
              title={chatOpen ? 'Hide Active Chat' : 'Show Active Chat'}
            >
              <MessageSquare size={18} />
            </button>

            <button className="bg-transparent border-none text-text-muted cursor-pointer p-2 relative flex items-center justify-center hover:text-text-main">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-danger" />
            </button>

            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                className="bg-transparent border-none flex items-center gap-2 cursor-pointer text-text-main text-left"
              >
                <div className="w-7 h-7 rounded-full bg-card-hover border border-color text-accent-primary flex items-center justify-center font-bold text-[0.8rem]">
                  {currentUser?.email?.[0]?.toUpperCase() ?? <User size={13} />}
                </div>
                <div className={`flex flex-col ${isMobile ? 'hidden' : 'flex'}`}>
                  <span className="text-[0.8rem] font-semibold text-text-main leading-tight">
                    {currentUser?.full_name || currentUser?.email?.split('@')[0]}
                  </span>
                  <span className="text-[0.65rem] text-text-muted leading-tight">
                    Tier 1 Executive
                  </span>
                </div>
                <ChevronDown size={14} className="text-text-muted" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-[180px] bg-card border border-color rounded-lg shadow-lg py-1 z-[100]">
                  <button
                    onClick={() => navigate('/settings/profile')}
                    className="flex items-center gap-2 w-full py-2 px-3 bg-transparent border-none text-text-muted text-[0.8rem] cursor-pointer text-left transition-colors duration-150 hover:text-text-main"
                  >
                    <User size={14} />
                    <span>My Profile</span>
                  </button>
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

        <div className="flex-1 flex relative overflow-hidden">
          
          <main 
            className={`flex-1 overflow-hidden bg-main flex flex-col min-h-0 ${
              isWorkspaceAppRoute ? 'p-0' : (isMobile ? 'p-8 pb-[76px]' : 'p-8')
            }`}
          >
            <div className={isWorkspaceAppRoute ? 'flex-1 overflow-hidden flex flex-col' : 'flex-1 overflow-y-auto'}>
              <Outlet />
            </div>
          </main>

          <div 
            className="flex flex-col h-full z-25 relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              width: chatOpen ? '280px' : '0px',
              opacity: chatOpen ? 1 : 0,
              visibility: chatOpen ? 'visible' : 'hidden',
              backgroundColor: 'var(--bg-card)',
              borderLeft: chatOpen ? '1px solid var(--border-color)' : 'none',
              boxShadow: chatOpen ? '-4px 0 20px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <div className="py-3.5 px-4 border-b border-color flex items-center justify-between bg-card">
              <div>
                <h3 className="text-[0.9rem] font-bold text-text-main">Active Chat</h3>
                <p className="text-[0.65rem] text-text-muted">Real-time team communication</p>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 flex items-center justify-center rounded transition-colors duration-150 hover:text-text-main"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex gap-2 items-start">
                  <div 
                    className="w-7 h-7 rounded-full text-accent-primary flex items-center justify-center font-bold text-[0.75rem] shrink-0 border border-color"
                    style={{ backgroundColor: msg.avatarColor }}
                  >
                    {msg.sender[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[0.75rem] font-semibold text-text-main overflow-hidden text-overflow-ellipsis white-space-nowrap">
                        {msg.sender}
                      </span>
                      <span className="text-[0.6rem] text-text-muted ml-1">
                        {msg.timestamp}
                      </span>
                    </div>
                    <span className="inline-block text-[0.65rem] text-accent-primary font-semibold mb-1 uppercase tracking-wider">
                      {msg.role}
                    </span>
                    <p className="text-[0.75rem] text-text-main leading-relaxed break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form 
              onSubmit={handleSendChat}
              className="py-3.5 px-4 border-t border-color bg-card bg-opacity-20"
            >
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  placeholder="Send a message..." 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-input border border-color rounded-lg text-text-main text-[0.75rem] py-2 pl-2.5 pr-8 h-[34px] focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-accent-primary cursor-pointer flex items-center p-1 hover:text-text-main"
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
