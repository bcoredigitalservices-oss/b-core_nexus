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
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 2s linear infinite;
        }
      `}</style>

      {/* Welcome & Security Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 border border-white/10 rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 relative overflow-hidden shadow-lg">
        <div className="flex items-center gap-5 z-10">
          <div className="bg-white/12 border border-white/20 rounded-xl p-3 flex items-center justify-center">
            <Cpu size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-[1.6rem] font-bold text-white font-display mb-1">
              System Administration
            </h1>
            <p className="text-white/80 text-[0.875rem]">
              Real-time cluster infrastructure, node telemetry, and identity configuration profiles.
            </p>
          </div>
        </div>
        
        {/* Environment Status Badge */}
        <div className="flex items-center gap-2.5 bg-white/15 py-2 px-4 rounded-full border border-white/20 text-[0.85rem] font-semibold text-white z-10">
          <Server size={14} className="text-[#34d399]" />
          <span>Cluster Node: bcore-prod-01</span>
        </div>
      </div>

      {/* Row 1: KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Card 1: API Uptime */}
        <div className="glass-card-premium flex flex-col justify-between min-h-[150px] relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-accent-purple/15 filter blur-[30px] pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[0.8rem] uppercase tracking-wider text-text-muted font-bold">
              API Uptime
            </span>
            <span className="text-accent-purple filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
              <Activity size={24} />
            </span>
          </div>
          <div className="mt-4">
            {loading ? (
              <RefreshCw size={18} className="spin text-text-muted" />
            ) : error ? (
              <div className="text-[1rem] text-red-500 font-extrabold">Error</div>
            ) : (
              <div className="text-[2.4rem] font-extrabold font-display text-accent-purple leading-none">
                {health?.api_uptime || '99.98%'}
              </div>
            )}
            <div className="text-[0.75rem] text-text-muted mt-1.5">
              {loading ? 'Connecting...' : error ? 'Could not reach host' : health?.api_uptime_detail || 'Avg response: 45ms'}
            </div>
          </div>
        </div>

        {/* Card 2: Active Sessions */}
        <div className="glass-card-premium flex flex-col justify-between min-h-[150px] relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-accent-primary/15 filter blur-[30px] pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[0.8rem] uppercase tracking-wider text-text-muted font-bold">
              Active Sessions
            </span>
            <span className="text-accent-primary filter drop-shadow-[0_0_8px_rgba(99,91,255,0.5)]">
              <Users size={24} />
            </span>
          </div>
          <div className="mt-4">
            {loading ? (
              <RefreshCw size={18} className="spin text-text-muted" />
            ) : error ? (
              <div className="text-[1rem] text-red-500 font-extrabold">Error</div>
            ) : (
              <div className="text-[2.4rem] font-extrabold font-display text-accent-primary leading-none">
                {health?.active_jwt_sessions ?? 0}
              </div>
            )}
            <div className="text-[0.75rem] text-text-muted mt-1.5">
              Concurrent active sessions on node
            </div>
          </div>
        </div>

        {/* Card 3: Memory Allocation */}
        <div className="glass-card-premium flex flex-col justify-between min-h-[150px] relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-accent-green/15 filter blur-[30px] pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[0.8rem] uppercase tracking-wider text-text-muted font-bold">
              Memory Utilization
            </span>
            <span className="text-accent-green filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              <Database size={24} />
            </span>
          </div>
          <div className="mt-4">
            {loading ? (
              <RefreshCw size={18} className="spin text-text-muted" />
            ) : error ? (
              <div className="text-[1rem] text-red-500 font-extrabold">Error</div>
            ) : (
              <div className="text-[2.4rem] font-extrabold font-display text-accent-green leading-none">
                {hardware ? `${hardware.ram_usage_percent}%` : '26%'}
              </div>
            )}
            <div className="text-[0.75rem] text-text-muted mt-1.5">
              {loading ? 'Reading node...' : error ? 'Could not read RAM' : `${usedRamGB} GB / ${totalRamGB} GB allocated`}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (60/40 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 w-full">
        {/* Line Chart: Traffic Analysis */}
        <div className="glass-card-premium flex flex-col gap-4">
          <div>
            <h3 className="text-[1.1rem] font-bold m-0">Traffic Analysis</h3>
            <p className="text-text-muted text-[0.8rem] mt-1">
              Rolling 60-minute request rates and system exceptions.
            </p>
          </div>
          
          <div className="w-full h-[300px]">
            {traffic.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted">
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
        <div className="glass-card-premium flex flex-col gap-4 relative">
          <div>
            <h3 className="text-[1.1rem] font-bold m-0">Memory Pool</h3>
            <p className="text-text-muted text-[0.8rem] mt-1">
              Host memory availability mapping.
            </p>
          </div>

          <div className="w-full h-[300px] relative">
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-[1.75rem] font-extrabold text-text-main leading-none">
                {hardware ? `${hardware.ram_usage_percent}%` : '26%'}
              </div>
              <div className="text-[0.7rem] uppercase text-text-muted font-bold tracking-wider mt-1">
                Used
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Pulse & Quick Actions (50/50 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-8">
        {/* Live Pulse Stream */}
        <div className="glass-card-premium flex flex-col gap-4 overflow-hidden">
          <div>
            <h3 className="text-[1.1rem] font-bold m-0">System Event Pulse</h3>
            <p className="text-text-muted text-[0.8rem] mt-1">
              Recent events broadcasted on the cluster backplane.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.85rem]">
              <thead>
                <tr className="border-b border-color text-left">
                  <th className="py-3 px-2 text-text-muted font-bold">Event Type</th>
                  <th className="py-3 px-2 text-text-muted font-bold">User Email</th>
                  <th className="py-3 px-2 text-text-muted font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {pulse.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 px-4 text-center text-text-muted">
                      No events registered.
                    </td>
                  </tr>
                ) : (
                  pulse.map((event) => (
                    <tr key={event.id} className="border-b border-color">
                      <td className="py-3 px-2 font-semibold">
                        <span className={`py-0.5 px-2 rounded text-[0.75rem] font-bold ${
                          event.event_type === 'blocker_beacon' 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-accent-primary/8 text-accent-primary'
                        }`}>
                          {event.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-text-main">
                        {event.created_by_email || 'System Agent'}
                      </td>
                      <td className="py-3 px-2 text-text-muted">
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
        <div className="glass-card-premium flex flex-col gap-4">
          <div>
            <h3 className="text-[1.1rem] font-bold m-0">Quick Actions</h3>
            <p className="text-text-muted text-[0.8rem] mt-1">
              Direct access links to administrative control panels.
            </p>
          </div>

          <div className="flex flex-col gap-4 flex-1 justify-center">
            <Link to="/users" className="flex items-center justify-between p-4 px-6 rounded-lg bg-main border border-color text-text-main font-semibold transition-all duration-200 hover:bg-card hover:border-accent-primary hover:translate-x-1 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-accent-primary/10 p-1.5 rounded-md flex">
                  <Users size={20} className="text-accent-primary" />
                </div>
                <span>Identity & Access Directory</span>
              </div>
              <ArrowRight size={16} className="text-text-muted" />
            </Link>

            <Link to="/events" className="flex items-center justify-between p-4 px-6 rounded-lg bg-main border border-color text-text-main font-semibold transition-all duration-200 hover:bg-card hover:border-accent-primary hover:translate-x-1 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-accent-green/10 p-1.5 rounded-md flex">
                  <Shield size={20} className="text-accent-green" />
                </div>
                <span>Security & Audit Trails</span>
              </div>
              <ArrowRight size={16} className="text-text-muted" />
            </Link>

            <Link to="/settings/config" className="flex items-center justify-between p-4 px-6 rounded-lg bg-main border border-color text-text-main font-semibold transition-all duration-200 hover:bg-card hover:border-accent-primary hover:translate-x-1 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-accent-purple/10 p-1.5 rounded-md flex">
                  <Settings size={20} className="text-accent-purple" />
                </div>
                <span>System Settings & Themes</span>
              </div>
              <ArrowRight size={16} className="text-text-muted" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
