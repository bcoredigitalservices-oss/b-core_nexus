import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Users, Package, Activity, AlertTriangle, RefreshCw, Layers, Database, Server, User
} from 'lucide-react';
import DirectoryTab from '../features/directory/components/DirectoryTab';
import CatalogTab from '../features/catalog/components/CatalogTab';
import VirtualGridTab from '../features/virtualized/components/VirtualGridTab';
import EventConsoleSidebar from '../features/events/components/EventConsoleSidebar';
import OfflineCacheManager from '../services/OfflineCacheManager';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

const VIRTUAL_LIST_SIZE = 100000;

export default function Sandbox() {
  // Mode & Tiers
  const [activeTab, setActiveTab] = useState('directory');
  const [roleTier, setRoleTier] = useState(1); // 1 = Admin, 4 = Executor
  const [isApiLive, setIsApiLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [token, setToken] = useState('');

  // Sandbox Local Storage (Fallback)
  const [localDirectory, setLocalDirectory] = useState(() => OfflineCacheManager.getDirectory());
  const [localCatalog, setLocalCatalog] = useState(() => OfflineCacheManager.getCatalog());
  const [localEvents, setLocalEvents] = useState(() => OfflineCacheManager.getEvents());
  const [blockerBeacon, setBlockerBeacon] = useState(() => OfflineCacheManager.getBeacon());

  // Form inputs
  const [eventConsole, setEventConsole] = useState({ entity_id: '', entity_type: 'SITE', message: '', event_type: 'message' });

  // Auto-detect backend on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Fetch real data when token is available
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch Directory Profiles
        const dirRes = await fetch(`${API_BASE_URL}/directory`, { headers });
        if (dirRes.ok) {
          const data = await dirRes.json();
          setLocalDirectory(data);
        }

        // Fetch Catalog Items
        const catRes = await fetch(`${API_BASE_URL}/catalog`, { headers });
        if (catRes.ok) {
          const data = await catRes.json();
          setLocalCatalog(data);
        }

        // Fetch Events
        const evtRes = await fetch(`${API_BASE_URL}/events`, { headers });
        if (evtRes.ok) {
          const data = await evtRes.json();
          setLocalEvents(data);
        }
      } catch (err) {
        console.error("Failed to fetch backend data:", err);
      }
    };

    fetchData();
  }, [token]);

  // Sync sandbox state to OfflineCacheManager
  useEffect(() => {
    OfflineCacheManager.saveDirectory(localDirectory);
  }, [localDirectory]);

  useEffect(() => {
    OfflineCacheManager.saveCatalog(localCatalog);
  }, [localCatalog]);

  useEffect(() => {
    OfflineCacheManager.saveEvents(localEvents);
  }, [localEvents]);

  useEffect(() => {
    OfflineCacheManager.saveBeacon(blockerBeacon);
  }, [blockerBeacon]);

  const checkBackendConnection = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/`);
      if (res.ok) {
        setIsApiLive(true);
        await attemptAutoLogin();
      } else {
        setIsApiLive(false);
      }
    } catch {
      setIsApiLive(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const attemptAutoLogin = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', 'admin@bcore.local');
      formData.append('password', 'admin123');

      const res = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        console.log("Logged into FastAPI Backend as admin@bcore.local");
      }
    } catch (e) {
      console.warn("FastAPI token acquisition failed:", e);
    }
  };

  const handlePostEvent = (e) => {
    e.preventDefault();
    if (!eventConsole.entity_id) {
      alert("Please select a target entity ID from the dropdown or paste a UUID.");
      return;
    }

    if (eventConsole.event_type === 'blocker_beacon') {
      const beaconData = {
        entity_id: eventConsole.entity_id,
        entity_type: eventConsole.entity_type,
        message: eventConsole.message || 'Emergency halt triggered by Operator',
        blocked_by: getRoleLabel(roleTier)
      };
      setBlockerBeacon(beaconData);
      
      logSystemEvent(eventConsole.entity_id, eventConsole.entity_type, 'blocker_beacon', {
        message: `EMERGENCY BLOCKER BEACON: ${beaconData.message}`,
        status: 'blocked'
      });
      setEventConsole(prev => ({ ...prev, message: '' }));
      return;
    }

    logSystemEvent(
      eventConsole.entity_id,
      eventConsole.entity_type,
      eventConsole.event_type,
      { message: eventConsole.message }
    );
    setEventConsole(prev => ({ ...prev, message: '' }));
  };

  const logSystemEvent = (entityId, entityType, eventType, payload) => {
    const newEvent = {
      id: crypto.randomUUID(),
      entity_id: entityId,
      entity_type: entityType,
      event_type: eventType,
      payload: payload,
      created_by: getRoleLabel(roleTier),
      created_at: new Date().toISOString()
    };
    setLocalEvents([newEvent, ...localEvents]);
  };

  const resolveBeacon = () => {
    if (roleTier > 3) {
      alert("Permission Denied: Only Tier 1 (Admin), Tier 2 (Directional), or Tier 3 (Supervisor) can resolve Blocker Beacons.");
      return;
    }

    if (blockerBeacon) {
      logSystemEvent(
        blockerBeacon.entity_id, 
        blockerBeacon.entity_type, 
        'resolve_blocker', 
        { message: 'Emergency Blocker Beacon cleared and resolved.', resolved_by: getRoleLabel(roleTier) }
      );
      setBlockerBeacon(null);
    }
  };

  const getEntityNameById = (id) => {
    const dMatch = localDirectory.find(d => d.id === id);
    if (dMatch) return dMatch.name;
    const cMatch = localCatalog.find(c => c.id === id);
    if (cMatch) return cMatch.sku;
    return id;
  };

  const getRoleLabel = (tier) => {
    switch(tier) {
      case 1: return 'Admin (Tier 1)';
      case 2: return 'Directional (Tier 2)';
      case 3: return 'Leadership (Tier 3)';
      case 4: return 'Execution (Tier 4)';
      default: return 'Guest';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Banner Navigation */}
      <header style={{
        background: 'rgba(20, 27, 46, 0.9)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }} className={blockerBeacon ? 'beacon-active' : ''}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={24} color="#0b0f19" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>B-CORE NEXUS</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Headless ERP Core</p>
          </div>
        </div>

        {/* Backend Connect Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', background: 'rgba(14, 19, 34, 0.6)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            {isConnecting ? (
              <>
                <RefreshCw size={14} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ color: 'var(--text-muted)' }}>Probing API...</span>
              </>
            ) : isApiLive ? (
              <>
                <Database size={14} color="var(--accent-green)" />
                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>API Connected (Live)</span>
              </>
            ) : (
              <>
                <Server size={14} color="var(--accent-warning)" />
                <span style={{ color: 'var(--text-muted)' }}>Sandbox Simulation</span>
              </>
            )}
            <button 
              onClick={checkBackendConnection}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}
              title="Refresh connection status"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Active User Tier Manager */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <User size={14} />
              <span>Identity Profile:</span>
            </div>
            <select 
              value={roleTier} 
              onChange={(e) => setRoleTier(Number(e.target.value))}
              style={{
                width: 'auto',
                padding: '0.35rem 1.75rem 0.35rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '6px',
                borderColor: 'var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <option value={1}>Admin (Tier 1)</option>
              <option value={2}>Directional (Tier 2)</option>
              <option value={3}>Leadership (Tier 3)</option>
              <option value={4}>Execution (Tier 4)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1600px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Left Side: Workspaces */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Emergency Blocker Beacon Banner */}
          {blockerBeacon && (
            <div className="beacon-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AlertTriangle size={28} color="var(--accent-danger)" style={{ animation: 'pulse-glow 1s infinite alternate' }} />
                <div>
                  <h4 style={{ color: 'var(--accent-danger)', fontWeight: 700, fontSize: '1rem' }}>BLOCKER BEACON ACTIVE</h4>
                  <p style={{ fontSize: '0.85rem', color: '#ffb7b7' }}>
                    Entity: <strong>{getEntityNameById(blockerBeacon.entity_id)}</strong> is BLOCKED. {blockerBeacon.message} (Triggered by {blockerBeacon.blocked_by})
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {roleTier > 3 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <button className="btn btn-danger" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                      Resolve (Requires Tier 1-3)
                    </button>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-danger)', marginTop: '0.25rem' }}>Only Tier 1-3 can execute resolution payload</span>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={resolveBeacon}>
                    Resolve Blocker
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              <Users size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Global Directory
            </button>
            <button 
              className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <Package size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Universal Catalog
            </button>
            <button 
              className={`tab-btn ${activeTab === 'virtualized' ? 'active' : ''}`}
              onClick={() => setActiveTab('virtualized')}
            >
              <Activity size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Virtualized Grid (100k Rows)
            </button>
          </div>

          {/* Tab 1: Global Directory */}
          {activeTab === 'directory' && (
            <DirectoryTab 
              localDirectory={localDirectory} 
              setLocalDirectory={setLocalDirectory} 
              roleTier={roleTier} 
              logSystemEvent={logSystemEvent} 
            />
          )}

          {/* Tab 2: Universal Catalog */}
          {activeTab === 'catalog' && (
            <CatalogTab 
              localCatalog={localCatalog} 
              setLocalCatalog={setLocalCatalog} 
              roleTier={roleTier} 
              logSystemEvent={logSystemEvent} 
            />
          )}

          {/* Tab 3: Virtualized 100k Rows */}
          {activeTab === 'virtualized' && (
            <VirtualGridTab />
          )}

        </section>

        {/* Right Side: Sidebar Event Stream & Console */}
        <EventConsoleSidebar 
          roleTier={roleTier}
          getRoleLabel={getRoleLabel}
          localDirectory={localDirectory}
          localCatalog={localCatalog}
          eventConsole={eventConsole}
          setEventConsole={setEventConsole}
          handlePostEvent={handlePostEvent}
          localEvents={localEvents}
          getEntityNameById={getEntityNameById}
        />
        </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-input)',
        marginTop: 'auto'
      }}>
        B-Core Nexus Autonomous ERP Engine. Code-first layout compliance checked. Made for Antigravity pair programming.
      </footer>

    </div>
  );
}
