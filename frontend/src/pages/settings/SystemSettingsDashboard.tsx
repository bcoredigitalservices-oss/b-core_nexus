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

const STATUS_BADGE: Record<ModuleState['status'], string> = {
  DEPLOYED: 'bg-[rgba(0,245,160,0.08)] border-[rgba(0,245,160,0.2)] text-[var(--accent-green)]',
  STANDBY: 'bg-[rgba(157,78,221,0.08)] border-[rgba(157,78,221,0.2)] text-[var(--accent-purple)]',
  OFFLINE: 'bg-white/[0.04] border-white/[0.08] text-[var(--text-muted)]',
};

// ─── Reusable bits ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange, onClick }: { checked: boolean; onChange: (v: boolean) => void; onClick?: () => void }) {
  return (
    <label className="group relative inline-block h-[22px] w-11 shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        onClick={onClick}
        className="peer h-0 w-0 opacity-0"
      />
      <span className="absolute inset-0 cursor-pointer rounded-full border border-[var(--border-color)] bg-white/[0.08] transition-colors duration-300 peer-checked:border-[var(--accent-green)] peer-checked:bg-[rgba(0,245,160,0.12)] before:absolute before:bottom-[3px] before:left-[3px] before:h-[14px] before:w-[14px] before:rounded-full before:bg-[var(--text-muted)] before:transition-transform before:duration-300 peer-checked:before:translate-x-[22px] peer-checked:before:bg-[var(--accent-green)]" />
    </label>
  );
}

function SettingSelect({
  label,
  value,
  onChange,
  onClick,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClick?: () => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={onClick}
        className="w-full max-w-[350px] rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3.5 py-2.5 font-inherit text-[var(--text-main)] outline-none transition-colors focus:border-[var(--accent-blue)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, onClick }: { label: string; checked: boolean; onChange: (v: boolean) => void; onClick?: () => void }) {
  return (
    <div className="flex max-w-[350px] items-center justify-between pt-2">
      <span className="text-sm font-semibold text-[var(--text-main)]">{label}</span>
      <Toggle checked={checked} onChange={onChange} onClick={onClick} />
    </div>
  );
}

function Card({ icon, iconColor, title, badge, children }: { icon: React.ReactNode; iconColor: string; title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-panel m-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] px-6 py-5">
        <div className="flex items-center gap-3">
          <span style={{ color: iconColor }}>{icon}</span>
          <h2 className="text-[1.1rem] font-semibold">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

const PALETTE_OPTIONS = [
  { value: 'Stripe Blurple', label: 'B-Core Warm Premium (Default)' },
  { value: 'Vercel Crisp', label: 'Vercel Crisp' },
  { value: 'Azure Cloud', label: 'Azure Cloud' },
  { value: 'Linear Cool', label: 'Linear Cool' },
  { value: 'Tech Teal', label: 'Tech Teal' },
];
const MODE_OPTIONS = [
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
];
const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Clean & Corporate)' },
  { value: 'Outfit', label: 'Outfit (Premium & Rounded)' },
  { value: 'Roboto', label: 'Roboto (Technical & Clean)' },
];

// ─── Main component ─────────────────────────────────────────────────────────

export default function SystemSettingsDashboard() {
  const {
    authFetch,
    currentUser,
    preferences,
    globalDefaults,
    updatePersonalPreference,
    updateGlobalPreference,
    playUISound,
  } = useAppContext();

  const [modules, setModules] = useState<ModuleState[]>([
    { key: 'inventory_engine', name: 'Inventory Engine', status: 'DEPLOYED', enabled: true, loading: false, description: 'Core warehouse, item storage, and ledger sync routing.' },
    { key: 'auth_gateway', name: 'Auth Gateway', status: 'DEPLOYED', enabled: true, loading: false, description: 'User JWT session manager, claims verification, and TOTP router.' },
    { key: 'webhooks_processor', name: 'Webhooks Processor', status: 'STANDBY', enabled: false, loading: false, description: 'Outbound real-time webhook ingestion queues and retry loops.' },
    { key: 'audit_logger', name: 'Audit Logger', status: 'DEPLOYED', enabled: true, loading: false, description: 'Immutable transaction ledger recorder and compliance auditor.' },
    { key: 'sequence_dispatcher', name: 'Sequence Dispatcher', status: 'DEPLOYED', enabled: true, loading: false, description: 'Thread-safe document sequence generation and number assignment.' },
    { key: 'notification_router', name: 'Notification Router', status: 'OFFLINE', enabled: false, loading: false, description: 'System alerts, emails, and WebPush dispatch management.' },
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authFetch('/system/profile');
        if (profile && profile.active_modules) {
          setModules((prev) =>
            prev.map((m) => {
              const hasKey = profile.active_modules.hasOwnProperty(m.key);
              const isEnabled = hasKey ? profile.active_modules[m.key] : m.enabled;
              return { ...m, enabled: isEnabled, status: isEnabled ? 'DEPLOYED' : 'OFFLINE' };
            })
          );
        }
      } catch (err) {
        console.error('Failed to load active modules from backend profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleModule = async (moduleKey: string) => {
    setModules((prev) => prev.map((m) => (m.key === moduleKey ? { ...m, loading: true } : m)));

    try {
      const res = await authFetch(`/system/modules/${moduleKey}/toggle`, { method: 'POST' });
      setModules((prev) =>
        prev.map((m) => {
          if (m.key !== moduleKey) return m;
          const nextEnabled = res.is_active;
          return { ...m, enabled: nextEnabled, status: nextEnabled ? 'DEPLOYED' : 'OFFLINE', loading: false };
        })
      );
    } catch (err: any) {
      alert(err.message || `Failed to toggle module ${moduleKey}`);
      setModules((prev) => prev.map((m) => (m.key === moduleKey ? { ...m, loading: false } : m)));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
      {/* Header Banner */}
      <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-gradient-to-br from-[rgba(0,242,254,0.05)] to-[rgba(157,78,221,0.05)] px-8 py-7">
        <div className="z-10 flex items-center gap-5">
          <div className="flex items-center justify-center rounded-xl border border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.1)] p-3">
            <Settings size={28} className="text-[var(--accent-purple)]" />
          </div>
          <div>
            <h1 className="mb-1 font-[family-name:var(--font-display)] text-[1.6rem] font-bold">System Configuration</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage cluster module states and user interface personalization settings.</p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
        {/* Workspace Orchestration */}
        <Card
          icon={<Settings size={20} />}
          iconColor="var(--accent-purple)"
          title="Workspace Orchestration"
          badge={
            <span className="rounded-full border border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.08)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-blue)]">
              Cluster Status: ACTIVE
            </span>
          }
        >
          <div className="flex flex-col">
            {modules.map((mod) => (
              <div
                key={mod.key}
                className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-[1.1rem] transition-colors duration-200 last:border-b-0 hover:bg-white/[0.01]"
              >
                <div className="flex max-w-[75%] flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[0.95rem] font-semibold">{mod.name}</span>
                    <span className={`rounded-full border px-1.5 py-px text-[0.65rem] font-semibold ${STATUS_BADGE[mod.status]}`}>
                      {mod.status}
                    </span>
                  </div>
                  <span className="text-[0.8rem] leading-[1.3] text-[var(--text-muted)]">{mod.description}</span>
                </div>

                <div className="flex items-center gap-3">
                  {mod.loading ? (
                    <Loader2 size={16} className="animate-spin text-[var(--accent-green)]" />
                  ) : (
                    <Toggle checked={mod.enabled} onChange={() => handleToggleModule(mod.key)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Theme & Personalisation Configuration */}
        <div className="m-0 flex flex-col gap-6 p-0">
          <Card icon={<Palette size={20} />} iconColor="var(--accent-primary)" title="Personal Preferences">
            <div className="flex flex-col gap-6 p-6">
              <p className="text-[0.85rem] text-[var(--text-muted)]">
                Configure your individual interface preferences. These configurations will apply instantly and override global defaults.
              </p>

              <div className="flex flex-col gap-5">
                <SettingSelect
                  label="Enterprise Palette"
                  value={preferences.theme || 'Stripe Blurple'}
                  options={PALETTE_OPTIONS}
                  onClick={() => playUISound('click')}
                  onChange={(v) => {
                    updatePersonalPreference('theme', v);
                    playUISound('success');
                  }}
                />
                <SettingSelect
                  label="Display Mode"
                  value={preferences.mode || 'light'}
                  options={MODE_OPTIONS}
                  onClick={() => playUISound('click')}
                  onChange={(v) => {
                    updatePersonalPreference('mode', v);
                    playUISound('success');
                  }}
                />
                <SettingSelect
                  label="System Font"
                  value={preferences.font || 'Inter'}
                  options={FONT_OPTIONS}
                  onClick={() => playUISound('click')}
                  onChange={(v) => {
                    updatePersonalPreference('font', v);
                    playUISound('success');
                  }}
                />
                <ToggleRow
                  label="UI Sound Effects"
                  checked={preferences.sounds !== false}
                  onClick={() => playUISound('click')}
                  onChange={(v) => updatePersonalPreference('sounds', v)}
                />
              </div>
            </div>
          </Card>

          {/* Global Defaults Card (Admin/system:write permissions only) */}
          {currentUser && (currentUser.permissions?.includes('system:write') || currentUser.permissions?.includes('*:*')) && (
            <Card icon={<Palette size={20} />} iconColor="var(--accent-purple)" title="Global Default Settings">
              <div className="flex flex-col gap-6 p-6">
                <p className="text-[0.85rem] text-[var(--text-muted)]">
                  Define the default visual configurations for all cluster workspace members who have not customized their profile preferences.
                </p>

                <div className="flex flex-col gap-5">
                  <SettingSelect
                    label="Default Palette"
                    value={globalDefaults.theme || 'Stripe Blurple'}
                    options={PALETTE_OPTIONS}
                    onClick={() => playUISound('click')}
                    onChange={(v) => {
                      updateGlobalPreference('theme', v);
                      playUISound('success');
                    }}
                  />
                  <SettingSelect
                    label="Default Display Mode"
                    value={globalDefaults.mode || 'light'}
                    options={MODE_OPTIONS}
                    onClick={() => playUISound('click')}
                    onChange={(v) => {
                      updateGlobalPreference('mode', v);
                      playUISound('success');
                    }}
                  />
                  <SettingSelect
                    label="Default System Font"
                    value={globalDefaults.font || 'Inter'}
                    options={FONT_OPTIONS}
                    onClick={() => playUISound('click')}
                    onChange={(v) => {
                      updateGlobalPreference('font', v);
                      playUISound('success');
                    }}
                  />
                  <ToggleRow
                    label="Default UI Sound Effects"
                    checked={globalDefaults.sounds !== false}
                    onClick={() => playUISound('click')}
                    onChange={(v) => updateGlobalPreference('sounds', v)}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}