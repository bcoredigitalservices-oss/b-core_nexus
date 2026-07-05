import React, { useState, useEffect } from 'react';
import {
  Users, Package, Activity, AlertTriangle, RefreshCw, Layers, Database, Server, User
} from 'lucide-react';
import DirectoryTab from '../features/directory/components/DirectoryTab';
import CatalogTab from '../features/catalog/components/CatalogTab';
import VirtualGridTab from '../features/virtualized/components/VirtualGridTab';
import EventConsoleSidebar from '../features/events/components/EventConsoleSidebar';
import OfflineCacheManager from '../services/OfflineCacheManager';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

const TABS = [
  { key: 'directory', label: 'Global Directory', icon: Users },
  { key: 'catalog', label: 'Universal Catalog', icon: Package },
  { key: 'virtualized', label: 'Virtualized Grid (100k Rows)', icon: Activity },
];

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
        const headers = { Authorization: `Bearer ${token}` };

        const dirRes = await fetch(`${API_BASE_URL}/directory`, { headers });
        if (dirRes.ok) setLocalDirectory(await dirRes.json());

        const catRes = await fetch(`${API_BASE_URL}/catalog`, { headers });
        if (catRes.ok) setLocalCatalog(await catRes.json());

        const evtRes = await fetch(`${API_BASE_URL}/events`, { headers });
        if (evtRes.ok) setLocalEvents(await evtRes.json());
      } catch (err) {
        console.error('Failed to fetch backend data:', err);
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
      const url = import.meta.env.VITE_API_URL || '';
      const checkUrl = url ? `${url}/` : '/api/v1/system/health';
      const res = await fetch(checkUrl);
      
      const isProxyError = res.status === 502 || res.status === 504;
      const isHtml = res.headers.get('content-type')?.includes('text/html');
      
      if (!isProxyError && !isHtml) {
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
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        console.log('Logged into FastAPI Backend as admin@bcore.local');
      }
    } catch (e) {
      console.warn('FastAPI token acquisition failed:', e);
    }
  };

  const handlePostEvent = (e) => {
    e.preventDefault();
    if (!eventConsole.entity_id) {
      alert('Please select a target entity ID from the dropdown or paste a UUID.');
      return;
    }

    if (eventConsole.event_type === 'blocker_beacon') {
      const beaconData = {
        entity_id: eventConsole.entity_id,
        entity_type: eventConsole.entity_type,
        message: eventConsole.message || 'Emergency halt triggered by Operator',
        blocked_by: getRoleLabel(roleTier),
      };
      setBlockerBeacon(beaconData);

      logSystemEvent(eventConsole.entity_id, eventConsole.entity_type, 'blocker_beacon', {
        message: `EMERGENCY BLOCKER BEACON: ${beaconData.message}`,
        status: 'blocked',
      });
      setEventConsole((prev) => ({ ...prev, message: '' }));
      return;
    }

    logSystemEvent(eventConsole.entity_id, eventConsole.entity_type, eventConsole.event_type, { message: eventConsole.message });
    setEventConsole((prev) => ({ ...prev, message: '' }));
  };

  const logSystemEvent = (entityId, entityType, eventType, payload) => {
    const newEvent = {
      id: crypto.randomUUID(),
      entity_id: entityId,
      entity_type: entityType,
      event_type: eventType,
      payload,
      created_by: getRoleLabel(roleTier),
      created_at: new Date().toISOString(),
    };
    setLocalEvents([newEvent, ...localEvents]);
  };

  const resolveBeacon = () => {
    if (roleTier > 3) {
      alert('Permission Denied: Only Tier 1 (Admin), Tier 2 (Directional), or Tier 3 (Supervisor) can resolve Blocker Beacons.');
      return;
    }

    if (blockerBeacon) {
      logSystemEvent(blockerBeacon.entity_id, blockerBeacon.entity_type, 'resolve_blocker', {
        message: 'Emergency Blocker Beacon cleared and resolved.',
        resolved_by: getRoleLabel(roleTier),
      });
      setBlockerBeacon(null);
    }
  };

  const getEntityNameById = (id) => {
    const dMatch = localDirectory.find((d) => d.id === id);
    if (dMatch) return dMatch.name;
    const cMatch = localCatalog.find((c) => c.id === id);
    if (cMatch) return cMatch.sku;
    return id;
  };

  const getRoleLabel = (tier) => {
    switch (tier) {
      case 1: return 'Admin (Tier 1)';
      case 2: return 'Directional (Tier 2)';
      case 3: return 'Leadership (Tier 3)';
      case 4: return 'Execution (Tier 4)';
      default: return 'Guest';
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Banner Navigation */}
      <header
        className={`sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-color)] bg-[rgba(20,27,46,0.9)] px-8 py-4 backdrop-blur-[10px] ${blockerBeacon ? 'beacon-active' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] p-2">
            <Layers size={24} color="#0b0f19" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold">B-CORE NEXUS</h1>
            <p className="text-[0.7rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">Headless ERP Core</p>
          </div>
        </div>

        {/* Backend Connect Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[rgba(14,19,34,0.6)] px-3.5 py-1.5 text-[0.8rem]">
            {isConnecting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[var(--text-muted)]">Probing API...</span>
              </>
            ) : isApiLive ? (
              <>
                <Database size={14} className="text-[var(--accent-green)]" />
                <span className="font-semibold text-[var(--accent-green)]">API Connected (Live)</span>
              </>
            ) : (
              <>
                <Server size={14} className="text-[var(--accent-warning)]" />
                <span className="text-[var(--text-muted)]">Sandbox Simulation</span>
              </>
            )}
            <button
              onClick={checkBackendConnection}
              title="Refresh connection status"
              className="flex cursor-pointer border-none bg-transparent p-0 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Active User Tier Manager */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[0.85rem] text-[var(--text-muted)]">
              <User size={14} />
              <span>Identity Profile:</span>
            </div>
            <select
              value={roleTier}
              onChange={(e) => setRoleTier(Number(e.target.value))}
              className="w-auto cursor-pointer rounded-md border-[var(--border-color)] py-1.5 pl-3 pr-7 text-[0.85rem] font-semibold"
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
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-[1fr_350px] gap-8 p-8">
        {/* Left Side: Workspaces */}
        <section className="flex flex-col gap-6">
          {/* Emergency Blocker Beacon Banner */}
          {blockerBeacon && (
            <div className="beacon-banner">
              <div className="flex items-center gap-4">
                <AlertTriangle size={28} className="animate-pulse text-[var(--accent-danger)]" />
                <div>
                  <h4 className="text-base font-bold text-[var(--accent-danger)]">BLOCKER BEACON ACTIVE</h4>
                  <p className="text-[0.85rem] text-[#ffb7b7]">
                    Entity: <strong>{getEntityNameById(blockerBeacon.entity_id)}</strong> is BLOCKED. {blockerBeacon.message} (Triggered by{' '}
                    {blockerBeacon.blocked_by})
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {roleTier > 3 ? (
                  <div className="flex flex-col items-end">
                    <button className="btn btn-danger cursor-not-allowed opacity-50" disabled>
                      Resolve (Requires Tier 1-3)
                    </button>
                    <span className="mt-1 text-[0.65rem] text-[var(--accent-danger)]">Only Tier 1-3 can execute resolution payload</span>
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
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} className="mr-2 inline-block align-middle" />
                {label}
              </button>
            ))}
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
          {activeTab === 'virtualized' && <VirtualGridTab />}
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
      <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-input)] px-6 py-6 text-center text-[0.8rem] text-[var(--text-muted)]">
        B-Core Nexus Autonomous ERP Engine. Code-first layout compliance checked. Made for Antigravity pair programming.
      </footer>
    </div>
  );
}
