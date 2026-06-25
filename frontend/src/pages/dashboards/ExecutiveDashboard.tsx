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
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/iam/users`, { headers }),
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <Activity size={32} className="animate-spin" style={{ marginRight: '1rem' }} />
        Loading Organization Data...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Welcome & Overview Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 242, 254, 0.03) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(157, 78, 221, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(157, 78, 221, 0.15)',
              border: '1px solid rgba(157, 78, 221, 0.3)',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(157, 78, 221, 0.2)'
            }}
          >
            <Building size={32} color="#9d4edd" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '0.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {orgProfile?.legal_name || 'Organization Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: '1.5' }}>
              Welcome back, {currentUser?.username || 'Executive'}. Here is the live operating status of your organization, including department health and active workspaces.
            </p>
          </div>
        </div>
        
        {/* Dynamic Vertical Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'var(--bg-card)',
            padding: '0.6rem 1.2rem',
            borderRadius: '24px',
            border: '1px solid rgba(157, 78, 221, 0.3)',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Globe size={16} color="#ffb703" />
          <span>Currency: {orgProfile?.base_currency || 'USD'}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>Total Personnel</span>
            <span style={{ color: '#00f2fe', background: 'var(--bg-card-hover)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Users size={20} />
            </span>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', lineHeight: 1.1 }}>
              {users.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Registered IAM Users
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>Active Departments</span>
            <span style={{ color: '#00f5a0', background: 'var(--bg-card-hover)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Layers size={20} />
            </span>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', lineHeight: 1.1 }}>
              {departments.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Operational divisions
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>Cluster Workspaces</span>
            <span style={{ color: '#ffb703', background: 'var(--bg-card-hover)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <LayoutGrid size={20} />
            </span>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', lineHeight: 1.1 }}>
              {workspaces.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Provisioned & running
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* System Health Chart */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#00f2fe" />
              System Activity & Health
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Department Distribution */}
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#ffb703" />
                Department Spread
              </h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
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
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={20} color="#00f5a0" />
                Workspace Provisioning
              </h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Shortcuts */}
          <div className="glass-panel" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="#9d4edd" />
              Administrative Shortcuts
            </h3>
            
            <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <button 
                onClick={() => navigate('/users')}
                className="btn glass-panel" 
                style={{ 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '1.2rem', 
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  border: '1px solid rgba(157, 78, 221, 0.3)',
                  background: 'rgba(157, 78, 221, 0.05)',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-main)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(157, 78, 221, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(157, 78, 221, 0.05)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={20} color="#9d4edd" />
                  <span style={{ fontWeight: 600 }}>User Console</span>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </button>

              <button 
                onClick={() => navigate('/departments')}
                className="btn glass-panel" 
                style={{ 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '1.2rem', 
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  background: 'rgba(0, 242, 254, 0.05)',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-main)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.05)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Layers size={20} color="#00f2fe" />
                  <span style={{ fontWeight: 600 }}>Departments & Mgmt</span>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </button>

              <button 
                onClick={() => navigate('/workspaces')}
                className="btn glass-panel" 
                style={{ 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '1.2rem', 
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  border: '1px solid rgba(0, 245, 160, 0.3)',
                  background: 'rgba(0, 245, 160, 0.05)',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-main)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 245, 160, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 245, 160, 0.05)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LayoutGrid size={20} color="#00f5a0" />
                  <span style={{ fontWeight: 600 }}>Active Workspaces</span>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </button>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
