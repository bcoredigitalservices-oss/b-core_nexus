import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Server, 
  Cpu, 
  RefreshCw,
  Database,
  Users,
  Terminal,
  Settings,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface HealthData {
  api_uptime: string;
  api_uptime_detail: string;
  active_jwt_sessions: number;
  system_memory: string;
  system_memory_percent: string;
}

export default function SystemAdminDashboard() {
  const { authFetch } = useAppContext();
  
  const [health, setHealth] = useState<HealthData | null>(null);
  const [hardware, setHardware] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [pulse, setPulse] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [healthData, hardwareData, trafficData, pulseData] = await Promise.all([
        authFetch('/system/health'),
        authFetch('/system/telemetry/hardware'),
        authFetch('/system/telemetry/traffic'),
        authFetch('/system/telemetry/pulse')
      ]);

      setHealth(healthData);
      setHardware(hardwareData);
      setTraffic(trafficData);
      setPulse(pulseData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const ramData = [
    { name: 'Used RAM', value: hardware?.used_ram_bytes || 0 },
    { name: 'Available RAM', value: (hardware?.total_ram_bytes - hardware?.used_ram_bytes) || 0 }
  ];

  const totalRamGB = hardware ? (hardware.total_ram_bytes / (1024 * 1024 * 1024)).toFixed(1) : '16.0';
  const usedRamGB = hardware ? (hardware.used_ram_bytes / (1024 * 1024 * 1024)).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      <style>{`
        .telemetry-row-2 {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
          width: 100%;
        }
        .telemetry-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          width: 100%;
          margin-bottom: 2rem;
        }
        .quick-jump-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.15rem 1.5rem;
          border-radius: 10px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quick-jump-btn:hover {
          background: var(--bg-card) !important;
          border-color: var(--accent-primary) !important;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        @media (max-width: 900px) {
          .telemetry-row-2, .telemetry-row-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Welcome & Security Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #6d28d9 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(30, 58, 138, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cpu size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700, color: '#ffffff' }}>
              System Administration
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
              Real-time cluster infrastructure, node telemetry, and identity configuration profiles.
            </p>
          </div>
        </div>
        
        {/* Environment Status Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#ffffff',
            zIndex: 1
          }}
        >
          <Server size={14} color="#34d399" />
          <span>Cluster Node: bcore-prod-01</span>
        </div>
      </div>

      {/* Row 1: KPI Cards Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem',
          width: '100%'
        }}
      >
        {/* Card 1: API Uptime */}
        <div 
          className="glass-card-premium" 
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '150px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.15)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              API Uptime
            </span>
            <span style={{ color: 'var(--accent-purple)', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }}>
              <Activity size={24} />
            </span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {loading ? (
              <RefreshCw size={18} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--text-muted)' }} />
            ) : error ? (
              <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 800 }}>Error</div>
            ) : (
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-purple)', lineHeight: 1.1 }}>
                {health?.api_uptime || '99.98%'}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {loading ? 'Connecting...' : error ? 'Could not reach host' : health?.api_uptime_detail || 'Avg response: 45ms'}
            </div>
          </div>
        </div>

        {/* Card 2: Active Sessions */}
        <div 
          className="glass-card-premium" 
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '150px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(99, 91, 255, 0.15)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Active Sessions
            </span>
            <span style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 8px rgba(99, 91, 255, 0.5))' }}>
              <Users size={24} />
            </span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {loading ? (
              <RefreshCw size={18} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--text-muted)' }} />
            ) : error ? (
              <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 800 }}>Error</div>
            ) : (
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)', lineHeight: 1.1 }}>
                {health?.active_jwt_sessions ?? 0}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Concurrent active sessions on node
            </div>
          </div>
        </div>

        {/* Card 3: Memory Allocation */}
        <div 
          className="glass-card-premium" 
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '150px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Memory Utilization
            </span>
            <span style={{ color: 'var(--accent-green)', filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }}>
              <Database size={24} />
            </span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {loading ? (
              <RefreshCw size={18} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--text-muted)' }} />
            ) : error ? (
              <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 800 }}>Error</div>
            ) : (
              <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-green)', lineHeight: 1.1 }}>
                {hardware ? `${hardware.ram_usage_percent}%` : '26%'}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {loading ? 'Reading node...' : error ? 'Could not read RAM' : `${usedRamGB} GB / ${totalRamGB} GB allocated`}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (60/40 Split) */}
      <div className="telemetry-row-2">
        {/* Line Chart: Traffic Analysis */}
        <div className="glass-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Traffic Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Rolling 60-minute request rates and system exceptions.
            </p>
          </div>
          
          <div style={{ width: '100%', height: 300 }}>
            {traffic.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Waiting for traffic telemetry...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={traffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                  <XAxis 
                    dataKey="minute" 
                    tickFormatter={(tick) => {
                      try {
                        const parts = tick.split('T');
                        return parts.length > 1 ? parts[1].substring(0, 5) : tick;
                      } catch {
                        return tick;
                      }
                    }}
                    style={{ fontSize: '0.75rem', fill: 'var(--text-muted)', fontWeight: 500 }}
                  />
                  <YAxis style={{ fontSize: '0.75rem', fill: 'var(--text-muted)', fontWeight: 500 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-card)', 
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600 }} />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    name="Total Requests" 
                    stroke="var(--accent-primary)" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    name="Errors (500)" 
                    stroke="var(--accent-danger)" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Memory Allocations */}
        <div className="glass-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Memory Pool</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Host memory availability mapping.
            </p>
          </div>

          <div style={{ width: '100%', height: 300, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ramData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="var(--accent-primary)" />
                  <Cell fill="rgba(99, 91, 255, 0.12)" />
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `${(Number(value) / (1024*1024*1024)).toFixed(2)} GB`}
                  contentStyle={{ 
                    background: 'var(--bg-card)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Ring Stats Label */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {hardware ? `${hardware.ram_usage_percent}%` : '26%'}
              </div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                Used
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Pulse & Quick Actions (50/50 Split) */}
      <div className="telemetry-row-3">
        {/* Live Pulse Stream */}
        <div className="glass-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>System Event Pulse</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Recent events broadcasted on the cluster backplane.
            </p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>Event Type</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>User Email</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {pulse.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No events registered.
                    </td>
                  </tr>
                ) : (
                  pulse.map((event) => (
                    <tr key={event.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                        <span style={{
                          background: event.event_type === 'blocker_beacon' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 91, 255, 0.08)',
                          color: event.event_type === 'blocker_beacon' ? '#ef4444' : 'var(--accent-primary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {event.event_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)' }}>
                        {event.created_by_email || 'System Agent'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Jump Shortcuts */}
        <div className="glass-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Quick Actions</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Direct access links to administrative control panels.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            <Link to="/users" className="quick-jump-btn">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(99, 91, 255, 0.1)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                  <Users size={20} color="var(--accent-primary)" />
                </div>
                <span>Identity & Access Directory</span>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>

            <Link to="/events" className="quick-jump-btn">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                  <Shield size={20} color="var(--accent-green)" />
                </div>
                <span>Security & Audit Trails</span>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>

            <Link to="/settings/config" className="quick-jump-btn">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                  <Settings size={20} color="var(--accent-purple)" />
                </div>
                <span>System Settings & Themes</span>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}
