import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Shield, Users, Package, Activity, AlertTriangle, Send, 
  Plus, RefreshCw, Layers, CheckCircle, Database, Server, User, Key, Wifi, AlertOctagon
} from 'lucide-react';
import DirectoryTab from './features/directory/components/DirectoryTab';
import CatalogTab from './features/catalog/components/CatalogTab';
import VirtualGridTab from './features/virtualized/components/VirtualGridTab';
import EventConsoleSidebar from './features/events/components/EventConsoleSidebar';



const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;


const SEED_CATALOG = [
  { id: '44444444-4444-4444-4444-444444444444', sku: 'SKU-FLT-FORK-09', title: 'Heavy Duty Forklift Battery Pack', is_active: true, custom_attributes: { cells: 48, weight_kg: 850 } },
  { id: '55555555-5555-5555-5555-555555555555', sku: 'SKU-LOG-PAL-50', title: 'Euro Standard Wood Pallet (Pack of 50)', is_active: true, custom_attributes: { heat_treated: true } },
  { id: '66666666-6666-6666-6666-666666666666', sku: 'SKU-SYS-NEX-01', title: 'Nexus Core Ingestion Gateway Unit', is_active: true, custom_attributes: { firmware: 'v2.4.1', protocols: ['MODBUS', 'OPC-UA'] } }
];

const SEED_EVENTS = [
  { id: 'e1', entity_id: '33333333-3333-3333-3333-333333333333', entity_type: 'SITE', event_type: 'status_change', payload: { message: 'Gate 4 reported online', status: 'optimal' }, created_by: 'System', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'e2', entity_id: '44444444-4444-4444-4444-444444444444', entity_type: 'CATALOG_ITEM', event_type: 'message', payload: { message: 'Re-ordered 5 units for Terminal B stock.' }, created_by: 'Supervisor', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
];

// Seed 100k virtual items list once to prevent heavy re-renders
const VIRTUAL_LIST_SIZE = 100000;
const VIRTUAL_ITEMS = Array.from({ length: VIRTUAL_LIST_SIZE }, (_, i) => ({
  index: i,
  sku: `SKU-NEX-${String(i + 1).padStart(6, '0')}`,
  title: `Industrial Core Nexus Module Unit #${i + 1}`,
  custom_attributes: {
    criticality: i % 10 === 0 ? 'High' : 'Normal',
    power_draw_w: 120 + (i % 8) * 15,
    factory_batch: `B-${1000 + Math.floor(i / 100)}`
  }
}));

export default function App() {
  // Mode & Tiers
  const [activeTab, setActiveTab] = useState('directory');
  const [roleTier, setRoleTier] = useState(1); // 1 = Admin, 4 = Executor
  const [isApiLive, setIsApiLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [token, setToken] = useState('');

  // Sandbox Local Storage (Fallback)
  const [localDirectory, setLocalDirectory] = useState([]);

  const [localCatalog, setLocalCatalog] = useState([]);

  const [localEvents, setLocalEvents] = useState([]);

  // Blocker Beacon state
  const [blockerBeacon, setBlockerBeacon] = useState(() => {
    const saved = localStorage.getItem('bcore_beacon');
    return saved ? JSON.parse(saved) : null; 
    // Format: { entity_id: '...', entity_type: '...', message: '...', blocked_by: '...' }
  });

  // Form inputs
  const [dirForm, setDirForm] = useState({ profile_type: 'CUSTOMER', name: '', email: '', phone: '', attributes: '' });
  const [catForm, setCatForm] = useState({ sku: '', title: '', attributes: '' });
  const [eventConsole, setEventConsole] = useState({ entity_id: '', entity_type: 'SITE', message: '', event_type: 'message' });

  // Virtualization Scroll Parent
  const parentRef = useRef(null);

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

  // Sync sandbox state to LocalStorage

  useEffect(() => {
    localStorage.setItem('bcore_directory', JSON.stringify(localDirectory));
  }, [localDirectory]);

  useEffect(() => {
    localStorage.setItem('bcore_catalog', JSON.stringify(localCatalog));
  }, [localCatalog]);

  useEffect(() => {
    localStorage.setItem('bcore_events', JSON.stringify(localEvents));
  }, [localEvents]);

  useEffect(() => {
    if (blockerBeacon) {
      localStorage.setItem('bcore_beacon', JSON.stringify(blockerBeacon));
    } else {
      localStorage.removeItem('bcore_beacon');
    }
  }, [blockerBeacon]);

  const checkBackendConnection = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/`);
      if (res.ok) {
        setIsApiLive(true);
        // Attempt quick JWT login with default seeded credentials
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

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: VIRTUAL_LIST_SIZE,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  // Handle Form submissions (Local mode handles cleanly, API mode syncs if live)
  const handleAddDirectory = (e) => {
    e.preventDefault();
    if (roleTier > 2) {
      alert("Permission Denied: Directory profile management requires Tier 2 (Directional) or Tier 1 (Admin) privileges.");
      return;
    }

    let parsedAttributes = {};
    try {
      if (dirForm.attributes.trim()) {
        parsedAttributes = JSON.parse(dirForm.attributes);
      }
    } catch {
      alert("Invalid JSON format in custom attributes field.");
      return;
    }

    const newProfile = {
      id: crypto.randomUUID(),
      profile_type: dirForm.profile_type,
      name: dirForm.name,
      email: dirForm.email || null,
      phone: dirForm.phone || null,
      is_active: true,
      custom_attributes: parsedAttributes
    };

    setLocalDirectory([newProfile, ...localDirectory]);
    setDirForm({ profile_type: 'CUSTOMER', name: '', email: '', phone: '', attributes: '' });
    
    // Log creation event
    logSystemEvent(newProfile.id, dirForm.profile_type, 'status_change', {
      message: `Created new ${dirForm.profile_type}: ${dirForm.name}`
    });
  };

  const handleAddCatalog = (e) => {
    e.preventDefault();
    if (roleTier > 2) {
      alert("Permission Denied: Universal Catalog management requires Tier 2 (Directional) or Tier 1 (Admin) privileges.");
      return;
    }

    let parsedAttributes = {};
    try {
      if (catForm.attributes.trim()) {
        parsedAttributes = JSON.parse(catForm.attributes);
      }
    } catch {
      alert("Invalid JSON format in custom attributes field.");
      return;
    }

    const newItem = {
      id: crypto.randomUUID(),
      sku: catForm.sku,
      title: catForm.title,
      is_active: true,
      custom_attributes: parsedAttributes
    };

    setLocalCatalog([newItem, ...localCatalog]);
    setCatForm({ sku: '', title: '', attributes: '' });

    logSystemEvent(newItem.id, 'CATALOG_ITEM', 'status_change', {
      message: `Registered SKU ${newItem.sku}: ${newItem.title}`
    });
  };

  const handlePostEvent = (e) => {
    e.preventDefault();
    if (!eventConsole.entity_id) {
      alert("Please select a target entity ID from the dropdown or paste a UUID.");
      return;
    }

    // Emergency beacon trigger validation
    if (eventConsole.event_type === 'blocker_beacon') {
      const entityName = getEntityNameById(eventConsole.entity_id) || 'Asset';
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
    // Check permission: Tier 1-3 can execute, Tier 4 cannot
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
