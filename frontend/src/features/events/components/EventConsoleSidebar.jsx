import React from 'react';
import { Shield, Activity, Send, Wifi } from 'lucide-react';

export default function EventConsoleSidebar({
  roleTier,
  getRoleLabel,
  localDirectory,
  localCatalog,
  eventConsole,
  setEventConsole,
  handlePostEvent,
  localEvents,
  getEntityNameById
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Identity Info Panel */}
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Shield size={14} /> SECURITY PROFILE DATA
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
          <div>Active Node ID: <code style={{ color: 'var(--accent-purple)' }}>nexus-node-01</code></div>
          <div>Tenant Mode: <code style={{ color: 'var(--accent-blue)' }}>Isolated Container</code></div>
          <div>Authority Level: <span className={`badge badge-t${roleTier}`}>{getRoleLabel(roleTier)}</span></div>
        </div>
      </div>

      {/* Interactive Event Console */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Activity size={18} color="var(--accent-blue)" /> Event Engine Console
        </h3>

        <form onSubmit={handlePostEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div>
            <label>Target Entity</label>
            <select 
              value={eventConsole.entity_id} 
              onChange={(e) => {
                const id = e.target.value;
                const dMatch = localDirectory.find(d => d.id === id);
                const type = dMatch ? dMatch.profile_type : 'CATALOG_ITEM';
                setEventConsole({ ...eventConsole, entity_id: id, entity_type: type });
              }}
            >
              <option value="">-- Choose Profile/SKU --</option>
              <optgroup label="Directory Profiles">
                {localDirectory.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.profile_type})</option>
                ))}
              </optgroup>
              <optgroup label="Catalog Items">
                {localCatalog.map(c => (
                  <option key={c.id} value={c.id}>{c.sku} - {c.title}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label>Event Type</label>
            <select 
              value={eventConsole.event_type}
              onChange={(e) => setEventConsole({ ...eventConsole, event_type: e.target.value })}
            >
              <option value="message">Standard Operator Note</option>
              <option value="status_change">System State Change</option>
              <option value="blocker_beacon">🔴 Blocker Beacon (Emergency)</option>
            </select>
          </div>

          <div>
            <label>Message Content</label>
            <textarea 
              rows="3" 
              required
              placeholder="Type event payload description..." 
              value={eventConsole.message} 
              onChange={(e) => setEventConsole({ ...eventConsole, message: e.target.value })}
            />
          </div>

          <button type="submit" className={`btn ${eventConsole.event_type === 'blocker_beacon' ? 'btn-danger' : 'btn-primary'}`}>
            {eventConsole.event_type === 'blocker_beacon' ? 'Trigger Blocker Beacon' : 'Post Event'}
            <Send size={14} />
          </button>

        </form>
      </div>

      {/* Real-time Context stream */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
          <span>Live Feed Stream</span>
          <Wifi size={14} color="var(--accent-green)" style={{ alignSelf: 'center' }} />
        </h3>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {localEvents.map((evt) => (
            <div key={evt.id} style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: evt.event_type === 'blocker_beacon' ? 'rgba(255, 51, 102, 0.1)' : 'var(--bg-input)',
              border: `1px solid ${evt.event_type === 'blocker_beacon' ? 'var(--accent-danger)' : 'var(--border-color)'}`
            }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'var(--font-display)' }}>
                  {evt.event_type.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(evt.created_at).toLocaleTimeString()}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                {evt.payload.message}
              </p>

              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>Target: {getEntityNameById(evt.entity_id)}</span>
                <span style={{ fontStyle: 'italic' }}>By {evt.created_by}</span>
              </div>
            </div>
          ))}
          
          {localEvents.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
              No active event streams.
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
