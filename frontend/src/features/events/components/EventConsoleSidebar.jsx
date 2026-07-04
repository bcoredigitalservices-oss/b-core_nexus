import React from 'react';
import { Shield, Activity, Send, Wifi, Inbox } from 'lucide-react';

const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--text-muted)]';
const fieldClass =
  'w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition-colors focus:border-[var(--accent-blue)]';

export default function EventConsoleSidebar({
  roleTier,
  getRoleLabel,
  localDirectory,
  localCatalog,
  eventConsole,
  setEventConsole,
  handlePostEvent,
  localEvents,
  getEntityNameById,
}) {
  return (
    <section className="flex flex-col gap-6">
      {/* Identity Info Panel */}
      <div className="glass-panel border border-[var(--border-color)] p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-[0.85rem] text-[var(--text-muted)]">
          <Shield size={14} /> SECURITY PROFILE DATA
        </h4>
        <div className="flex flex-col gap-1 text-[0.8rem]">
          <div>
            Active Node ID: <code className="text-[var(--accent-purple)]">nexus-node-01</code>
          </div>
          <div>
            Tenant Mode: <code className="text-[var(--accent-blue)]">Isolated Container</code>
          </div>
          <div>
            Authority Level: <span className={`badge badge-t${roleTier}`}>{getRoleLabel(roleTier)}</span>
          </div>
        </div>
      </div>

      {/* Interactive Event Console */}
      <div className="glass-panel">
        <h3 className="mb-4 flex items-center gap-2 text-[1.1rem]">
          <Activity size={18} className="text-[var(--accent-blue)]" /> Event Engine Console
        </h3>

        <form onSubmit={handlePostEvent} className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>Target Entity</label>
            <select
              value={eventConsole.entity_id}
              onChange={(e) => {
                const id = e.target.value;
                const dMatch = localDirectory.find((d) => d.id === id);
                const type = dMatch ? dMatch.profile_type : 'CATALOG_ITEM';
                setEventConsole({ ...eventConsole, entity_id: id, entity_type: type });
              }}
              className={fieldClass}
            >
              <option value="">-- Choose Profile/SKU --</option>
              <optgroup label="Directory Profiles">
                {localDirectory.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.profile_type})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Catalog Items">
                {localCatalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sku} - {c.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className={labelClass}>Event Type</label>
            <select
              value={eventConsole.event_type}
              onChange={(e) => setEventConsole({ ...eventConsole, event_type: e.target.value })}
              className={fieldClass}
            >
              <option value="message">Standard Operator Note</option>
              <option value="status_change">System State Change</option>
              <option value="blocker_beacon">🔴 Blocker Beacon (Emergency)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Message Content</label>
            <textarea
              rows="3"
              required
              placeholder="Type event payload description..."
              value={eventConsole.message}
              onChange={(e) => setEventConsole({ ...eventConsole, message: e.target.value })}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            className={`btn ${eventConsole.event_type === 'blocker_beacon' ? 'btn-danger' : 'btn-primary'} flex items-center justify-center gap-2`}
          >
            {eventConsole.event_type === 'blocker_beacon' ? 'Trigger Blocker Beacon' : 'Post Event'}
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Real-time Context stream */}
      <div className="glass-panel flex max-h-[450px] flex-1 flex-col">
        <h3 className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-2 text-[1.1rem]">
          <span>Live Feed Stream</span>
          <Wifi size={14} className="self-center text-[var(--accent-green)]" />
        </h3>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {localEvents.map((evt) => {
            const isBeacon = evt.event_type === 'blocker_beacon';
            return (
              <div
                key={evt.id}
                className="rounded-md border p-3"
                style={{
                  backgroundColor: isBeacon ? 'rgba(255, 51, 102, 0.1)' : 'var(--bg-input)',
                  borderColor: isBeacon ? 'var(--accent-danger)' : 'var(--border-color)',
                }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-[family-name:var(--font-display)] text-[0.7rem] font-semibold text-[var(--accent-blue)]">
                    {evt.event_type.toUpperCase()}
                  </span>
                  <span className="text-[0.65rem] text-[var(--text-muted)]">{new Date(evt.created_at).toLocaleTimeString()}</span>
                </div>

                <p className="text-[0.8rem] leading-[1.3]">{evt.payload.message}</p>

                <div className="mt-1.5 flex items-center justify-between text-[0.65rem] text-[var(--text-muted)]">
                  <span>Target: {getEntityNameById(evt.entity_id)}</span>
                  <span className="italic">By {evt.created_by}</span>
                </div>
              </div>
            );
          })}

          {localEvents.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-[0.85rem] text-[var(--text-muted)]">
              <Inbox size={20} className="opacity-50" />
              No active event streams.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
