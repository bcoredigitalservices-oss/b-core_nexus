import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Activity, 
  Server, 
  ShieldAlert, 
  Cpu, 
  Settings,
  RefreshCw,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
// @ts-ignore: UniversalDataGrid is a JSX component, TypeScript might complain about the missing type definitions.
import UniversalDataGrid from '../../components/ui/UniversalDataGrid';
import { useAppContext } from '../../context/AppContext';
import CommandCenter from '../../components/admin/CommandCenter';

interface HealthData {
  api_uptime: string;
  api_uptime_detail: string;
  active_jwt_sessions: number;
  system_memory: string;
  system_memory_percent: string;
}

interface ModuleState {
  key: string;
  name: string;
  status: 'DEPLOYED' | 'STANDBY' | 'OFFLINE';
  enabled: boolean;
  loading: boolean;
  description: string;
}

export default function SystemAdminDashboard() {
  const { authFetch } = useAppContext();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [gridKey, setGridKey] = useState(0);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);

  // Workspace Orchestration state
  const [modules, setModules] = useState<ModuleState[]>([
    { key: 'inventory_engine', name: 'Inventory Engine', status: 'DEPLOYED', enabled: true, loading: false, description: 'Core warehouse, item storage, and ledger sync routing.' },
    { key: 'auth_gateway', name: 'Auth Gateway', status: 'DEPLOYED', enabled: true, loading: false, description: 'User JWT session manager, claims verification, and TOTP router.' },
    { key: 'webhooks_processor', name: 'Webhooks Processor', status: 'STANDBY', enabled: false, loading: false, description: 'Outbound real-time webhook ingestion queues and retry loops.' },
    { key: 'audit_logger', name: 'Audit Logger', status: 'DEPLOYED', enabled: true, loading: false, description: 'Immutable transaction ledger recorder and compliance auditor.' },
    { key: 'sequence_dispatcher', name: 'Sequence Dispatcher', status: 'DEPLOYED', enabled: true, loading: false, description: 'Thread-safe document sequence generation and number assignment.' },
    { key: 'notification_router', name: 'Notification Router', status: 'OFFLINE', enabled: false, loading: false, description: 'System alerts, emails, and WebPush dispatch management.' }
  ]);

  const fetchHealth = async () => {
    try {
      const data = await authFetch('/system/health');
      setHealth(data);
      setHealthError(null);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to fetch cluster health');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // refresh health every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRevoke = async (userId: string) => {
    if (confirm("Are you sure you want to revoke this user's active session and disable access?")) {
      setRevokingUser(userId);
      try {
        await authFetch(`/auth/users/${userId}/revoke`, { method: 'POST' });
        // Increment grid key to force reload the UniversalDataGrid
        setGridKey(prev => prev + 1);
        // Refresh health stats to reflect updated active users count
        fetchHealth();
      } catch (err: any) {
        alert(err.message || "Failed to revoke session");
      } finally {
        setRevokingUser(null);
      }
    }
  };

  const handleToggleModule = (moduleKey: string) => {
    setModules(prev => prev.map(m => {
      if (m.key === moduleKey) {
        return { ...m, loading: true };
      }
      return m;
    }));

    // Simulate cluster re-orchestration latency
    setTimeout(() => {
      setModules(prev => prev.map(m => {
        if (m.key === moduleKey) {
          const nextEnabled = !m.enabled;
          return {
            ...m,
            enabled: nextEnabled,
            status: nextEnabled ? 'DEPLOYED' : 'OFFLINE',
            loading: false
          };
        }
        return m;
      }));
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      <style>{`
        .udg-th--actions, .udg-td--actions {
          display: none !important;
        }
        .btn-revoke {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-weight: 600;
        }
        .btn-revoke:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.22);
          border-color: rgba(239, 68, 68, 0.45);
          transform: translateY(-1px);
        }
        .btn-revoke:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .module-toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 22px;
        }
        .module-toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.08);
          transition: .3s;
          border-radius: 34px;
          border: 1px solid var(--border-color);
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: var(--text-muted);
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: rgba(0, 245, 160, 0.12);
          border-color: var(--accent-green);
        }
        input:checked + .toggle-slider:before {
          transform: translateX(22px);
          background-color: var(--accent-green);
        }
        .module-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          transition: background-color 0.2s ease;
        }
        .module-item:hover {
          background-color: rgba(255, 255, 255, 0.01);
        }
        .module-item:last-child {
          border-bottom: none;
        }
        .badge-deployed {
          background: rgba(0, 245, 160, 0.08);
          border: 1px solid rgba(0, 245, 160, 0.2);
          color: var(--accent-green);
        }
        .badge-standby {
          background: rgba(157, 78, 221, 0.08);
          border: 1px solid rgba(157, 78, 221, 0.2);
          color: var(--accent-purple);
        }
        .badge-offline {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
        }
      `}</style>
      
      {/* Welcome & Security Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(157, 78, 221, 0.05) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cpu size={28} color="var(--accent-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700 }}>
              System Administration
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
            background: 'rgba(20, 27, 46, 0.6)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 1
          }}
        >
          <Server size={14} color="var(--accent-green)" />
          <span>Cluster Node: bcore-prod-01</span>
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
        {/* KPI Card 1: API Uptime */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px',
            position: 'relative',
            overflow: 'hidden'
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
              background: 'rgba(157, 78, 221, 0.15)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              API Uptime
            </span>
            <span style={{ color: 'var(--accent-purple)' }}>
              <Activity size={24} />
            </span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {healthLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '2.2rem' }}>
                <RefreshCw size={18} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--text-muted)' }} />
              </div>
            ) : healthError ? (
              <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 600 }}>Error</div>
            ) : (
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-purple)', lineHeight: 1.1 }}>
                {health?.api_uptime || '99.98%'}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {healthLoading ? 'Fetching health status...' : healthError ? 'Could not reach node' : health?.api_uptime_detail || 'Avg response: 45ms'}
            </div>
          </div>
        </div>

        {/* KPI Card 2: Active JWT Sessions */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px',
            position: 'relative',
            overflow: 'hidden'
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
              background: 'rgba(0, 242, 254, 0.15)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Active JWT Sessions
            </span>
            <span style={{ color: 'var(--accent-blue)' }}>
              <Users size={24} />
            </span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {healthLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '2.2rem' }}>
                <RefreshCw size={18} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--text-muted)' }} />
              </div>
            ) : healthError ? (
              <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 600 }}>Error</div>
            ) : (
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-blue)', lineHeight: 1.1 }}>
                {health?.active_jwt_sessions ?? 0}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Concurrent active sessions
            </div>
          </div>
        </div>

        {/* KPI Card 3: System Memory */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '130px',
            position: 'relative',
            overflow: 'hidden'
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
              background: 'rgba(0, 245, 160, 0.15)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              System Memory
            </span>
            <span style={{ color: 'var(--accent-green)' }}>
              <Database size={24} />
            </span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {healthLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '2.2rem' }}>
                <RefreshCw size={18} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--text-muted)' }} />
              </div>
            ) : healthError ? (
              <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 600 }}>Error</div>
            ) : (
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-green)', lineHeight: 1.1 }}>
                {health?.system_memory || '4.2 GB / 16.0 GB'}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {healthLoading ? 'Fetching usage...' : healthError ? 'Could not read memory' : `Memory Used: ${health?.system_memory_percent || '0%'}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Data management grid and settings panel */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* Main Left Column: Identity & Access Control */}
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <ShieldAlert size={20} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Identity & Access</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              key={gridKey}
              endpointUrl="/api/v1/auth/users"
              title="Registered Users"
              pageSize={10}
              emptyMessage="No active users registered on this node."
              columns={[
                { key: 'email', label: 'Email', sortable: true },
                {
                  key: 'role_tier',
                  label: 'Tier',
                  sortable: true,
                  render: (value: any) => (
                    <span className={`badge badge-t${value}`}>
                      Tier {value}
                    </span>
                  )
                },
                {
                  key: 'is_active',
                  label: 'Status',
                  sortable: true,
                  render: (value: any) => (
                    <span className={`badge ${value ? 'badge-site' : 'badge-t4'}`}>
                      {value ? 'Active' : 'Inactive'}
                    </span>
                  )
                },
                {
                  key: 'revoke_session',
                  label: 'Control',
                  render: (_: any, row: any) => (
                    row.is_active ? (
                      <button
                        className="btn-revoke"
                        onClick={() => handleRevoke(row.id)}
                        disabled={revokingUser === row.id}
                      >
                        <Lock size={12} />
                        {revokingUser === row.id ? 'Revoking...' : 'Revoke Session'}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Unlock size={12} style={{ opacity: 0.5 }} />
                        Revoked
                      </span>
                    )
                  )
                }
              ]}
            />
          </div>
        </div>

        {/* Main Right Column: Orchestration & Command Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Workspace Orchestration */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', margin: 0 }}>
            <div 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings size={20} color="var(--accent-purple)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Workspace Orchestration</h2>
              </div>
              <span 
                className="badge" 
                style={{ 
                  background: 'rgba(0, 242, 254, 0.08)', 
                  border: '1px solid rgba(0, 242, 254, 0.2)', 
                  color: 'var(--accent-blue)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                Cluster Status: ACTIVE
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {modules.map((mod) => (
                <div key={mod.key} className="module-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '75%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mod.name}</span>
                      <span className={`badge badge-${mod.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        {mod.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {mod.description}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {mod.loading ? (
                      <Loader2 size={16} className="spin" style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-green)' }} />
                    ) : (
                      <label className="module-toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={mod.enabled}
                          onChange={() => handleToggleModule(mod.key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Command Center */}
          <CommandCenter />
        </div>
      </div>

    </div>
  );
}
