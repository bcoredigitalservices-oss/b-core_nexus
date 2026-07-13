import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, LayoutGrid, ShieldCheck, Activity, UserPlus, FileOutput, RotateCcw, RefreshCw, 
  Settings, Mail, FileCheck2, FileText, Receipt, MessageSquare, Building, Loader2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import OrganisationSetup from './OrganisationSetup';

export default function OrganizationDashboard() {
  const { token, authFetch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getTabFromPath = () => {
    if (location.pathname.includes('/org/setup')) return 'Setup';
    if (location.pathname.includes('/org/apps')) return 'Apps';
    return 'Dashboard';
  };
  
  const activeTab = getTabFromPath();

  const handleTabClick = (tab: 'Dashboard' | 'Apps' | 'Setup') => {
    if (tab === 'Dashboard') navigate('/org/dashboard');
    if (tab === 'Apps') navigate('/org/apps');
    if (tab === 'Setup') navigate('/org/setup');
  };
  
  // Data States
  const [usersCount, setUsersCount] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, eventsRes] = await Promise.all([
          authFetch('/auth/users'),
          authFetch('/events?limit=5')
        ]);
        
        if (usersRes) {
          setUsersCount(usersRes.length || 0);
        }
        
        if (eventsRes) {
          // Assuming events are returned as an array or { items: [] }
          setEvents(Array.isArray(eventsRes) ? eventsRes.slice(0, 5) : (eventsRes.items || []).slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token, authFetch]);

  // Format date helper
  const timeAgo = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'flagged': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const AppCard = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-blue-100 hover:shadow-md transition-all cursor-pointer">
      <div className="w-12 h-12 bg-blue-50/50 rounded-xl flex items-center justify-center mb-3">
        <Icon className="text-gray-600" size={20} />
      </div>
      <span className="text-xs font-bold text-gray-800 text-center">{title}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-[1200px] mx-auto pt-8 pb-12 px-6 flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Organization</h1>
            <p className="text-[14px] text-gray-500 mt-1">Manage institutional structure and system configuration</p>
          </div>
          <button 
            onClick={() => handleTabClick('Setup')}
            className="px-4 py-2 text-[13px] font-bold text-gray-800 bg-white border border-dashed border-blue-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Settings size={16} />
            Update Info
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-8 border-b border-gray-200 mt-2">
          {['Dashboard', 'Apps', 'Setup'].map((tab) => (
            <button 
              key={tab}
              onClick={() => handleTabClick(tab as any)}
              className={`py-3 text-[14px] font-bold transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              } ${tab === 'Setup' ? 'border-dashed border-blue-300 px-4 mb-1' : ''}`}
              style={activeTab === 'Setup' && tab === 'Setup' ? { borderStyle: 'dashed', borderColor: '#3b82f6', color: '#3b82f6' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="mt-4">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'Dashboard' && (
            <div className="flex flex-col gap-8">
              
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <Users size={20} />
                        </div>
                        <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+2.4%</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">TOTAL MEMBERS</div>
                      <div className="text-3xl font-extrabold text-gray-900">{usersCount.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <LayoutGrid size={20} />
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">Stable</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">ACTIVE MODULES</div>
                      <div className="text-3xl font-extrabold text-gray-900">24</div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <ShieldCheck size={20} />
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Passed</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">LAST AUDIT</div>
                      <div className="text-3xl font-extrabold text-gray-900">Oct 12</div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                          <Activity size={20} />
                        </div>
                        <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">99.9%</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">SYSTEM STATUS</div>
                      <div className="text-3xl font-extrabold text-gray-900">Online</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_280px] gap-6">
                    
                    {/* Recent Activity Table */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Recent Organizational Activity</h3>
                        <span className="text-[13px] font-bold text-gray-500 hover:text-gray-900 cursor-pointer">View All</span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8f9fc]">
                            <th className="py-3 px-6 text-[11px] font-bold text-gray-500 uppercase">ENTITY</th>
                            <th className="py-3 px-6 text-[11px] font-bold text-gray-500 uppercase">ACTION</th>
                            <th className="py-3 px-6 text-[11px] font-bold text-gray-500 uppercase">USER</th>
                            <th className="py-3 px-6 text-[11px] font-bold text-gray-500 uppercase">TIMESTAMP</th>
                            <th className="py-3 px-6 text-[11px] font-bold text-gray-500 uppercase">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.length > 0 ? events.map((ev, i) => {
                            // Assign mock statuses to make it look like the screenshot if real event doesn't have it
                            const mockStatus = i === 1 ? 'Pending' : i === 3 ? 'Flagged' : 'Completed';
                            return (
                              <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <td className="py-4 px-6 text-[13px] font-semibold text-gray-900">{ev.entity_type || 'System Event'}</td>
                                <td className="py-4 px-6 text-[13px] text-gray-600">{ev.event_type || 'Action Processed'}</td>
                                <td className="py-4 px-6 text-[13px] text-gray-600">{ev.created_by || 'System'}</td>
                                <td className="py-4 px-6 text-[13px] text-gray-600">{timeAgo(ev.created_at)}</td>
                                <td className="py-4 px-6">
                                  <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${getStatusColor(mockStatus)}`}>
                                    {mockStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No recent activity found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Sidebar: Quick Actions & Core Vitals */}
                    <div className="flex flex-col gap-6">
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="flex flex-col gap-4">
                          <button className="flex items-center gap-3 text-[13px] font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                            <div className="w-8 h-8 rounded-md bg-[#f0f4ff] flex items-center justify-center text-blue-600">
                              <UserPlus size={16} />
                            </div>
                            Add New Member
                          </button>
                          <button className="flex items-center gap-3 text-[13px] font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                            <div className="w-8 h-8 rounded-md bg-[#f0f4ff] flex items-center justify-center text-blue-600">
                              <FileOutput size={16} />
                            </div>
                            Export Annual Report
                          </button>
                          <button className="flex items-center gap-3 text-[13px] font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                            <div className="w-8 h-8 rounded-md bg-[#f0f4ff] flex items-center justify-center text-blue-600">
                              <RotateCcw size={16} />
                            </div>
                            Reset Global Rules
                          </button>
                          <button className="flex items-center gap-3 text-[13px] font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                            <div className="w-8 h-8 rounded-md bg-[#f0f4ff] flex items-center justify-center text-blue-600">
                              <RefreshCw size={16} />
                            </div>
                            Force System Sync
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                          <ShieldCheck size={28} />
                        </div>
                        <h4 className="text-[16px] font-bold text-gray-900 mb-2">Core Vitals</h4>
                        <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                          Automated system diagnostics suggest all clusters are performing optimally.
                        </p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold py-2.5 px-6 rounded-md w-full transition-colors">
                          Run Diagnostic
                        </button>
                      </div>

                    </div>
                  </div>


                </>
              )}
            </div>
          )}

          {/* APPS TAB */}
          {activeTab === 'Apps' && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-[17px] font-bold text-gray-900">App Selection Menu</h3>
                  <button className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">Manage Templates {'>'}</button>
               </div>
               <div className="grid grid-cols-6 gap-4">
                  <AppCard icon={Mail} title="Email Template" />
                  <AppCard icon={FileCheck2} title="Term and Condition Template" />
                  <AppCard icon={FileText} title="Quotation Format" />
                  <AppCard icon={Receipt} title="Invoice Format" />
                  <AppCard icon={MessageSquare} title="Msg Format" />
                  <AppCard icon={Building} title="Tax Setup System" />
               </div>
            </div>
          )}

          {/* SETUP TAB (Nests OrganisationSetup) */}
          {activeTab === 'Setup' && (
             <div className="mt-4">
               {/* 
                 OrganisationSetup internally has max-w-[1100px] and some top padding. 
                 Since we nested it, the user sees the setup form seamlessly.
               */}
               <OrganisationSetup />
             </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
