import React, { useState, useEffect } from 'react';
import { Settings, Palette, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ModuleState {
  key: string;
  name: string;
  status: 'DEPLOYED' | 'STANDBY' | 'OFFLINE';
  enabled: boolean;
  loading: boolean;
  description: string;
}

export default function SystemSettingsDashboard() {
  const { 
    authFetch,
    currentUser,
    preferences,
    globalDefaults,
    updatePersonalPreference,
    updateGlobalPreference,
    playUISound
  } = useAppContext();
  
  // Workspace Orchestration state
  const [modules, setModules] = useState<ModuleState[]>([
    { key: 'inventory_engine', name: 'Inventory Engine', status: 'DEPLOYED', enabled: true, loading: false, description: 'Core warehouse, item storage, and ledger sync routing.' },
    { key: 'auth_gateway', name: 'Auth Gateway', status: 'DEPLOYED', enabled: true, loading: false, description: 'User JWT session manager, claims verification, and TOTP router.' },
    { key: 'webhooks_processor', name: 'Webhooks Processor', status: 'STANDBY', enabled: false, loading: false, description: 'Outbound real-time webhook ingestion queues and retry loops.' },
    { key: 'audit_logger', name: 'Audit Logger', status: 'DEPLOYED', enabled: true, loading: false, description: 'Immutable transaction ledger recorder and compliance auditor.' },
    { key: 'sequence_dispatcher', name: 'Sequence Dispatcher', status: 'DEPLOYED', enabled: true, loading: false, description: 'Thread-safe document sequence generation and number assignment.' },
    { key: 'notification_router', name: 'Notification Router', status: 'OFFLINE', enabled: false, loading: false, description: 'System alerts, emails, and WebPush dispatch management.' }
  ]);

  // Load modules state from the backend system profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authFetch('/system/profile');
        if (profile && profile.active_modules) {
          setModules(prev => prev.map(m => {
            const hasKey = profile.active_modules.hasOwnProperty(m.key);
            const isEnabled = hasKey ? profile.active_modules[m.key] : m.enabled;
            return {
              ...m,
              enabled: isEnabled,
              status: isEnabled ? 'DEPLOYED' : 'OFFLINE'
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load active modules from backend profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleModule = async (moduleKey: string) => {
    setModules(prev => prev.map(m => {
      if (m.key === moduleKey) {
        return { ...m, loading: true };
      }
      return m;
    }));

    try {
      const res = await authFetch(`/system/modules/${moduleKey}/toggle`, {
        method: 'POST',
      });
      
      setModules(prev => prev.map(m => {
        if (m.key === moduleKey) {
          const nextEnabled = res.is_active;
          return {
            ...m,
            enabled: nextEnabled,
            status: nextEnabled ? 'DEPLOYED' : 'OFFLINE',
            loading: false
          };
        }
        return m;
      }));
    } catch (err: any) {
      alert(err.message || `Failed to toggle module ${moduleKey}`);
      setModules(prev => prev.map(m => {
        if (m.key === moduleKey) {
          return { ...m, loading: false };
        }
        return m;
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
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

      {/* Header Banner */}
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
            <Settings size={28} color="var(--accent-purple)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700 }}>
              System Configuration
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage cluster module states and user interface personalization settings.
            </p>
          </div>
        </div>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
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

        {/* Theme & Personalisation Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 0, padding: 0 }}>
          {/* Personal Preferences Card */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', margin: 0 }}>
            <div 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Palette size={20} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Personal Preferences</h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Configure your individual interface preferences. These configurations will apply instantly and override global defaults.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Enterprise Palette
                  </label>
                  <select 
                    value={preferences.theme || 'Stripe Blurple'}
                    onChange={(e) => {
                      updatePersonalPreference('theme', e.target.value);
                      playUISound('success');
                    }}
                    onClick={() => playUISound('click')}
                    style={{ width: '100%', maxWidth: '350px', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', font: 'inherit' }}
                  >
                    <option value="Stripe Blurple">Stripe Blurple</option>
                    <option value="Vercel Crisp">Vercel Crisp</option>
                    <option value="Azure Cloud">Azure Cloud</option>
                    <option value="Linear Cool">Linear Cool</option>
                    <option value="Tech Teal">Tech Teal</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Display Mode
                  </label>
                  <select 
                    value={preferences.mode || 'light'}
                    onChange={(e) => {
                      updatePersonalPreference('mode', e.target.value);
                      playUISound('success');
                    }}
                    onClick={() => playUISound('click')}
                    style={{ width: '100%', maxWidth: '350px', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', font: 'inherit' }}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    System Font
                  </label>
                  <select 
                    value={preferences.font || 'Inter'}
                    onChange={(e) => {
                      updatePersonalPreference('font', e.target.value);
                      playUISound('success');
                    }}
                    onClick={() => playUISound('click')}
                    style={{ width: '100%', maxWidth: '350px', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', font: 'inherit' }}
                  >
                    <option value="Inter">Inter (Clean & Corporate)</option>
                    <option value="Outfit">Outfit (Premium & Rounded)</option>
                    <option value="Roboto">Roboto (Technical & Clean)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '350px', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    UI Sound Effects
                  </span>
                  <label className="module-toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.sounds !== false}
                      onChange={(e) => {
                        updatePersonalPreference('sounds', e.target.checked);
                      }}
                      onClick={() => playUISound('click')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Global Defaults Card (Tier 0/1 reference only) */}
          {currentUser && currentUser.role_tier <= 1 && (
            <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', margin: 0 }}>
              <div 
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <Palette size={20} color="var(--accent-purple)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Global Default Settings</h2>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Define the default visual configurations for all cluster workspace members who have not customized their profile preferences.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Default Palette
                    </label>
                    <select 
                      value={globalDefaults.theme || 'Stripe Blurple'}
                      onChange={(e) => {
                        updateGlobalPreference('theme', e.target.value);
                        playUISound('success');
                      }}
                      onClick={() => playUISound('click')}
                      style={{ width: '100%', maxWidth: '350px', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', font: 'inherit' }}
                    >
                      <option value="Stripe Blurple">Stripe Blurple</option>
                      <option value="Vercel Crisp">Vercel Crisp</option>
                      <option value="Azure Cloud">Azure Cloud</option>
                      <option value="Linear Cool">Linear Cool</option>
                      <option value="Tech Teal">Tech Teal</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Default Display Mode
                    </label>
                    <select 
                      value={globalDefaults.mode || 'light'}
                      onChange={(e) => {
                        updateGlobalPreference('mode', e.target.value);
                        playUISound('success');
                      }}
                      onClick={() => playUISound('click')}
                      style={{ width: '100%', maxWidth: '350px', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', font: 'inherit' }}
                    >
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Default System Font
                    </label>
                    <select 
                      value={globalDefaults.font || 'Inter'}
                      onChange={(e) => {
                        updateGlobalPreference('font', e.target.value);
                        playUISound('success');
                      }}
                      onClick={() => playUISound('click')}
                      style={{ width: '100%', maxWidth: '350px', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', font: 'inherit' }}
                    >
                      <option value="Inter">Inter (Clean & Corporate)</option>
                      <option value="Outfit">Outfit (Premium & Rounded)</option>
                      <option value="Roboto">Roboto (Technical & Clean)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '350px', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Default UI Sound Effects
                    </span>
                    <label className="module-toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={globalDefaults.sounds !== false}
                        onChange={(e) => {
                          updateGlobalPreference('sounds', e.target.checked);
                        }}
                        onClick={() => playUISound('click')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
