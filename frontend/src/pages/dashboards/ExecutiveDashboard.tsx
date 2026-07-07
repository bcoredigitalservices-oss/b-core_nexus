import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users,
  LayoutGrid,
  Globe, 
  Activity,
  ArrowRight,
  Shield,
  Layers,
  Server,
  Zap,
  Briefcase
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, 
  AreaChart, Area, 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function ExecutiveDashboard() {
  const { token, currentUser } = useAppContext();
  const navigate = useNavigate();

  // Data States
  const [orgProfile, setOrgProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch all data in parallel
        const [orgRes, usersRes, deptsRes, worksRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/organization/profile`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/users`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/iam/departments`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/iam/workspaces`, { headers })
        ]);

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrgProfile(orgData);
        }
        
        if (usersRes.ok) {
          const userData = await usersRes.json();
          setUsers(userData);
        }

        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          setDepartments(deptsData);
        }

        if (worksRes.ok) {
          const worksData = await worksRes.json();
          setWorkspaces(worksData);
        }

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Transform Data for Charts
  
  // 1. Department Chart Data (Count users per department, simulated if empty)
  const deptData = departments.length > 0 ? departments.map((d, i) => ({
    name: d.name,
    value: Math.floor(Math.random() * 20) + 5 // Simulated size if real counts aren't available
  })) : [
    { name: 'Engineering', value: 40 },
    { name: 'Sales', value: 30 },
    { name: 'Marketing', value: 20 },
    { name: 'HR', value: 10 }
  ];
  const COLORS = ['#9d4edd', '#00f2fe', '#00f5a0', '#ffb703', '#ff0076'];

  // 2. Simulated System Health Activity (Last 7 Days)
  const healthData = [
    { name: 'Mon', requests: 4000, latency: 24 },
    { name: 'Tue', requests: 3000, latency: 22 },
    { name: 'Wed', requests: 2000, latency: 28 },
    { name: 'Thu', requests: 2780, latency: 20 },
    { name: 'Fri', requests: 1890, latency: 21 },
    { name: 'Sat', requests: 2390, latency: 25 },
    { name: 'Sun', requests: 3490, latency: 23 },
  ];

  // 3. Workspace Status Data
  const workspaceData = workspaces.length > 0 ? workspaces.map(w => ({
    name: w.name || w.industry_vertical,
    active: 1
  })) : [
    { name: 'CRM', active: 1 },
    { name: 'HR', active: 1 },
    { name: 'Finance', active: 1 },
    { name: 'Inventory', active: 1 }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-text-muted">
        <Activity size={32} className="animate-spin mr-4" />
        Loading Organization Data...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-8">
      
      {/* Welcome & Overview Header Banner */}
      <div className="bg-gradient-to-br from-[#9d4edd]/8 to-[#00f2fe]/3 border border-color rounded-2xl py-8 px-10 flex justify-between items-center flex-wrap gap-6 relative overflow-hidden shadow-lg">
        <div 
          className="absolute -top-1/5 -right-1/10 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(157, 78, 221, 0.15) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        
        <div className="flex items-center gap-6 z-10">
          <div className="bg-[#9d4edd]/15 border border-[#9d4edd]/30 rounded-2xl p-4 flex items-center justify-center shadow-[0_0_20px_rgba(157, 78, 221, 0.2)]">
            <Building size={32} className="text-[#9d4edd]" />
          </div>
          <div>
            <h1 className="text-[1.8rem] font-bold text-text-main font-display mb-1.5 tracking-tight">
              {orgProfile?.legal_name || 'Organization Dashboard'}
            </h1>
            <p className="text-text-muted text-[0.9rem] max-w-[600px] leading-relaxed">
              Welcome back, {currentUser?.username || 'Executive'}. Here is the live operating status of your organization, including department health and active workspaces.
            </p>
          </div>
        </div>
        
        {/* Dynamic Vertical Badge */}
        <div className="flex items-center gap-2.5 bg-card py-2 px-5 rounded-full border border-[#9d4edd]/30 text-[0.85rem] font-semibold z-10 shadow-md">
          <Globe size={16} className="text-[#ffb703]" />
          <span>Currency: {orgProfile?.base_currency || 'USD'}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="glass-panel p-7 relative overflow-hidden bg-main border border-color rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[0.8rem] uppercase tracking-wider text-text-muted font-bold">Total Personnel</span>
            <span className="text-[#00f2fe] bg-card-hover p-1.5 rounded-lg border border-color">
              <Users size={20} />
            </span>
          </div>
          <div className="mt-6">
            <div className="text-[2.2rem] font-extrabold font-display text-text-main leading-none">
              {users.length}
            </div>
            <div className="text-[0.78rem] text-text-muted mt-2">
              Registered IAM Users
            </div>
          </div>
        </div>

        <div className="glass-panel p-7 relative overflow-hidden bg-main border border-color rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[0.8rem] uppercase tracking-wider text-text-muted font-bold">Active Departments</span>
            <span className="text-[#00f5a0] bg-card-hover p-1.5 rounded-lg border border-color">
              <Layers size={20} />
            </span>
          </div>
          <div className="mt-6">
            <div className="text-[2.2rem] font-extrabold font-display text-text-main leading-none">
              {departments.length}
            </div>
            <div className="text-[0.78rem] text-text-muted mt-2">
              Operational divisions
            </div>
          </div>
        </div>

        <div className="glass-panel p-7 relative overflow-hidden bg-main border border-color rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[0.8rem] uppercase tracking-wider text-text-muted font-bold">Cluster Workspaces</span>
            <span className="text-[#ffb703] bg-card-hover p-1.5 rounded-lg border border-color">
              <LayoutGrid size={20} />
            </span>
          </div>
          <div className="mt-6">
            <div className="text-[2.2rem] font-extrabold font-display text-text-main leading-none">
              {workspaces.length}
            </div>
            <div className="text-[0.78rem] text-text-muted mt-2">
              Provisioned & running
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start w-full">
        
        {/* Left Column: Charts */}
        <div className="flex flex-col gap-8 w-full">
          
          {/* System Health Chart */}
          <div className="glass-panel p-6 bg-main border border-color rounded-2xl w-full">
            <h3 className="text-[1.1rem] font-bold text-text-main mb-6 flex items-center gap-2">
              <Zap size={20} className="text-[#00f2fe]" />
              System Activity & Health
            </h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9d4edd" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#9d4edd" fillOpacity={1} fill="url(#colorReq)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Department Distribution */}
            <div className="glass-panel p-6 bg-main border border-color rounded-2xl w-full">
              <h3 className="text-[1.1rem] font-bold text-text-main mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-[#ffb703]" />
                Department Spread
              </h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Workspace Distribution */}
            <div className="glass-panel p-6 bg-main border border-color rounded-2xl w-full">
              <h3 className="text-[1.1rem] font-bold text-text-main mb-6 flex items-center gap-2">
                <Server size={20} className="text-[#00f5a0]" />
                Workspace Provisioning
              </h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workspaceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="active" fill="#00f5a0" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Shortcuts */}
        <div className="flex flex-col gap-8 w-full">
          
          {/* Quick Shortcuts */}
          <div className="glass-panel bg-main border border-color rounded-2xl w-full">
            <h3 className="text-[1.1rem] font-bold text-text-main mb-6 p-6 pb-0 flex items-center gap-2">
              <Shield size={20} className="text-[#9d4edd]" />
              Administrative Shortcuts
            </h3>
            
            <div className="p-6 pt-0 flex flex-col gap-4">
              
              <button 
                onClick={() => navigate('/users')}
                className="btn glass-panel justify-between w-full p-5 text-[0.95rem] text-left border border-[#9d4edd]/30 bg-[#9d4edd]/5 cursor-pointer rounded-xl flex items-center transition-all duration-200 text-text-main hover:bg-[#9d4edd]/10"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} color="#9d4edd" />
                  <span className="font-semibold">User Console</span>
                </div>
                <ArrowRight size={18} className="text-text-muted" />
              </button>

              <button 
                onClick={() => navigate('/departments')}
                className="btn glass-panel justify-between w-full p-5 text-[0.95rem] text-left border border-[#00f2fe]/30 bg-[#00f2fe]/5 cursor-pointer rounded-xl flex items-center transition-all duration-200 text-text-main hover:bg-[#00f2fe]/10"
              >
                <div className="flex items-center gap-3">
                  <Layers size={20} color="#00f2fe" />
                  <span className="font-semibold">Departments & Mgmt</span>
                </div>
                <ArrowRight size={18} className="text-text-muted" />
              </button>

              <button 
                onClick={() => navigate('/workspaces')}
                className="btn glass-panel justify-between w-full p-5 text-[0.95rem] text-left border border-[#00f5a0]/30 bg-[#00f5a0]/5 cursor-pointer rounded-xl flex items-center transition-all duration-200 text-text-main hover:bg-[#00f5a0]/10"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid size={20} color="#00f5a0" />
                  <span className="font-semibold">Active Workspaces</span>
                </div>
                <ArrowRight size={18} className="text-text-muted" />
              </button>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
