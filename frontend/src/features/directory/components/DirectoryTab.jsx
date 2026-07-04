import React, { useMemo, useState } from 'react';
import { Plus, Lock, CheckCircle2, XCircle, Copy, Check, Building2, Truck, User, Inbox } from 'lucide-react';

const TYPE_META = {
  CUSTOMER: { label: 'Customer', icon: User, ring: 'ring-sky-400/30', text: 'text-sky-300', dot: 'bg-sky-400', bg: 'bg-sky-400/10' },
  VENDOR: { label: 'Vendor', icon: Truck, ring: 'ring-amber-400/30', text: 'text-amber-300', dot: 'bg-amber-400', bg: 'bg-amber-400/10' },
  SITE: { label: 'Internal Site', icon: Building2, ring: 'ring-emerald-400/30', text: 'text-emerald-300', dot: 'bg-emerald-400', bg: 'bg-emerald-400/10' },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type] ?? TYPE_META.CUSTOMER;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

function CopyableId({ id }) {
  const [copied, setCopied] = useState(false);
  const short = `${id.slice(0, 8)}…${id.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — ignore silently
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={id}
      className="group inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1 font-mono text-[11px] text-slate-500 transition-colors hover:border-slate-700 hover:text-slate-300"
    >
      {short}
      {copied ? (
        <Check size={11} className="text-emerald-400" />
      ) : (
        <Copy size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

export default function DirectoryTab({ localDirectory, setLocalDirectory, roleTier, logSystemEvent }) {
  const [dirForm, setDirForm] = useState({ profile_type: 'CUSTOMER', name: '', email: '', phone: '', attributes: '' });
  const [denied, setDenied] = useState(false);

  const canEdit = roleTier <= 2;

  const attributesState = useMemo(() => {
    const trimmed = dirForm.attributes.trim();
    if (!trimmed) return { status: 'empty', value: {} };
    try {
      const parsed = JSON.parse(trimmed);
      return { status: 'valid', value: parsed };
    } catch {
      return { status: 'invalid', value: null };
    }
  }, [dirForm.attributes]);

  const handleAddDirectory = (e) => {
    e.preventDefault();
    setDenied(false);

    if (!canEdit) {
      setDenied(true);
      return;
    }
    if (attributesState.status === 'invalid') return;

    const newProfile = {
      id: crypto.randomUUID(),
      profile_type: dirForm.profile_type,
      name: dirForm.name,
      email: dirForm.email || null,
      phone: dirForm.phone || null,
      is_active: true,
      custom_attributes: attributesState.value,
    };

    setLocalDirectory([newProfile, ...localDirectory]);
    setDirForm({ profile_type: 'CUSTOMER', name: '', email: '', phone: '', attributes: '' });

    logSystemEvent(newProfile.id, dirForm.profile_type, 'status_change', {
      message: `Created new ${dirForm.profile_type}: ${dirForm.name}`,
    });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50';
  const labelClass = 'mb-1.5 block text-xs font-medium text-slate-400';

  return (
    <div className="flex flex-col gap-6 text-slate-200">
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur lg:grid-cols-2">
        {/* Form */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-semibold tracking-tight text-slate-100">
            <Plus size={16} className="text-indigo-400" />
            Register Directory Profile
          </h3>

          {denied && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
              <Lock size={15} className="mt-0.5 shrink-0" />
              <span>Permission denied. Directory profile management requires Tier 2 (Directional) or Tier 1 (Admin) privileges.</span>
            </div>
          )}

          <form onSubmit={handleAddDirectory} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Profile Type</label>
              <select
                value={dirForm.profile_type}
                onChange={(e) => setDirForm({ ...dirForm, profile_type: e.target.value })}
                className={inputClass}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Vendor</option>
                <option value="SITE">Internal Site</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Profile Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Spedex Logistics Hub"
                value={dirForm.name}
                onChange={(e) => setDirForm({ ...dirForm, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  placeholder="ops@company.com"
                  value={dirForm.email}
                  onChange={(e) => setDirForm({ ...dirForm, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+1-555-0100"
                  value={dirForm.phone}
                  onChange={(e) => setDirForm({ ...dirForm, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">Custom Attributes (JSONB Format)</label>
                {attributesState.status === 'valid' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 size={12} /> Valid JSON
                  </span>
                )}
                {attributesState.status === 'invalid' && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400">
                    <XCircle size={12} /> Invalid JSON
                  </span>
                )}
              </div>
              <textarea
                rows="3"
                placeholder='{ "dock_count": 4, "max_weight_capacity_tons": 50 }'
                value={dirForm.attributes}
                onChange={(e) => setDirForm({ ...dirForm, attributes: e.target.value })}
                className={`${inputClass} resize-none font-mono text-xs ${
                  attributesState.status === 'invalid' ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/50' : ''
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={attributesState.status === 'invalid'}
              className="self-start rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Add Profile
            </button>
          </form>
        </div>

        {/* Info + live preview */}
        <div className="flex flex-col justify-between border-t border-slate-800 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">Immutable Directory Model</h4>
            <p className="text-sm leading-relaxed text-slate-500">B-Core Nexus enforces a strict code-first schema.</p>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-rose-500/60" />
                <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
                <span className="ml-2 font-mono text-[11px] text-slate-600">payload.preview.json</span>
              </div>
              <pre className="overflow-x-auto px-3 py-3 font-mono text-[11px] leading-relaxed text-slate-400">
                <span className="text-slate-600">{'{'}</span>{'\n'}
                {'  '}"profile_type": <span className="text-sky-300">"{dirForm.profile_type}"</span>,{'\n'}
                {'  '}"name": <span className="text-emerald-300">"{dirForm.name || '—'}"</span>,{'\n'}
                {'  '}"email": <span className="text-slate-300">{dirForm.email ? `"${dirForm.email}"` : 'null'}</span>,{'\n'}
                {'  '}"phone": <span className="text-slate-300">{dirForm.phone ? `"${dirForm.phone}"` : 'null'}</span>,{'\n'}
                {'  '}"custom_attributes":{' '}
                <span className={attributesState.status === 'invalid' ? 'text-rose-400' : 'text-amber-300'}>
                  {attributesState.status === 'invalid' ? '⚠ unparsed' : JSON.stringify(attributesState.value)}
                </span>
                {'\n'}
                <span className="text-slate-600">{'}'}</span>
              </pre>
            </div>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5">
              <p className="font-mono text-[11px] leading-relaxed text-indigo-300/80">
                role_tier check: creating directory profiles requires TIER 2 (Directional) or higher privileges.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-xs text-slate-500">Active roles allowed to edit</span>
            <div className="flex gap-2">
              <span className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-2 py-1 text-[11px] font-medium text-indigo-300">Tier 1</span>
              <span className="rounded-md border border-indigo-400/20 bg-indigo-400/5 px-2 py-1 text-[11px] font-medium text-indigo-300/80">Tier 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-100">
          Active Profiles Directory <span className="text-slate-500">({localDirectory.length})</span>
        </h3>

        {localDirectory.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 py-14 text-center">
            <Inbox size={22} className="text-slate-700" />
            <p className="text-sm text-slate-500">No directory profiles yet.</p>
            <p className="text-xs text-slate-600">Register one above to see it listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Contact Details</th>
                  <th className="px-3 py-3 font-medium">Custom Attributes (JSONB)</th>
                  <th className="px-3 py-3 font-medium">UUID Identity</th>
                </tr>
              </thead>
              <tbody>
                {localDirectory.map((profile) => (
                  <tr key={profile.id} className="border-b border-slate-800/70 transition-colors hover:bg-slate-800/20">
                    <td className="px-3 py-3">
                      <TypeBadge type={profile.profile_type} />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-100">{profile.name}</td>
                    <td className="px-3 py-3 text-xs">
                      <div className="text-slate-300">{profile.email || <span className="text-slate-600">N/A</span>}</div>
                      <div className="text-slate-500">{profile.phone || ''}</div>
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-3 font-mono text-xs text-indigo-300/90">
                      {JSON.stringify(profile.custom_attributes)}
                    </td>
                    <td className="px-3 py-3">
                      <CopyableId id={profile.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
