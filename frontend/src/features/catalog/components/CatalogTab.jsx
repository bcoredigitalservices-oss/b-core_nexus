import React, { useState } from 'react';
import { Plus, Package, ShieldCheck, Hash } from 'lucide-react';

export default function CatalogTab({ localCatalog, setLocalCatalog, roleTier, logSystemEvent }) {
  const [catForm, setCatForm] = useState({ sku: '', title: '', attributes: '' });
  const [attrError, setAttrError] = useState('');

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
      setAttrError('');
    } catch {
      setAttrError('Invalid JSON format in custom attributes field.');
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

  const inputClass = "w-full py-2.5 px-3.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-text-main text-[0.9rem] placeholder:text-text-muted/60 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-accent-blue";
  const labelClass = "text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted";

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 p-6">
        {/* ── Register Form ─────────────────────────────────────────── */}
        <div>
          <h3 className="flex items-center gap-2 mb-4 pb-2.5 border-b border-color text-text-main font-bold text-[1rem]">
            <Plus size={18} className="text-accent-blue" /> Register Catalog SKU
          </h3>
          <form onSubmit={handleAddCatalog} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                required
                placeholder="e.g. SKU-SYS-NEX-99"
                value={catForm.sku}
                onChange={(e) => setCatForm({ ...catForm, sku: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nexus Core PCB Motherboard"
                value={catForm.title}
                onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Custom Attributes (JSONB Format)</label>
              <textarea
                rows="3"
                placeholder='{ "voltage_rating": 240, "warranty_months": 24 }'
                value={catForm.attributes}
                onChange={(e) => { setCatForm({ ...catForm, attributes: e.target.value }); setAttrError(''); }}
                className={`${inputClass} font-mono text-[0.8rem] resize-none ${attrError ? 'ring-2 ring-accent-danger/60' : ''}`}
              />
              {attrError && (
                <span className="text-[0.75rem] text-accent-danger">{attrError}</span>
              )}
            </div>

            <button
              type="submit"
              className="self-start flex items-center gap-2 py-2.5 px-5 rounded-lg font-bold text-[0.85rem] cursor-pointer bg-gradient-to-r from-accent-blue to-accent-primary text-white shadow-[0_0_15px_rgba(0,160,223,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,160,223,0.35)]"
            >
              <Plus size={15} />
              Register SKU
            </button>
          </form>
        </div>

        {/* ── Info Panel ─────────────────────────────────────────────── */}
        <div className="md:border-l md:border-color md:pl-8 flex flex-col justify-between gap-6">
          <div>
            <h4 className="flex items-center gap-2 mb-2 text-accent-purple font-bold text-[0.8rem] uppercase tracking-wider">
              <Package size={15} />
              Universal Catalog Master
            </h4>
            <p className="text-[0.85rem] text-text-muted leading-relaxed">
              The <span className="font-semibold text-text-main">Universal Catalog</span> serves as the system-wide core ledger for SKU identification.
            </p>
            <div className="mt-5 flex items-start gap-2 bg-black/20 p-4 rounded-lg border border-color">
              <Hash size={14} className="text-accent-purple mt-0.5 shrink-0" />
              <p className="text-[0.75rem] font-mono text-accent-purple leading-relaxed">
                SKU validation constraint: Catalog items require unique, non-duplicable SKU codes.
              </p>
            </div>
          </div>
          <div className="border-t border-color pt-4">
            <span className="flex items-center gap-1.5 text-[0.8rem] text-text-muted">
              <ShieldCheck size={14} />
              Active Roles Allowed to Edit:
            </span>
            <div className="flex gap-2 mt-2">
              <span className="badge badge-t1">Tier 1</span>
              <span className="badge badge-t2">Tier 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Registered SKUs Table ──────────────────────────────────────── */}
      <div className="glass-panel p-6">
        <h3 className="mb-4 text-text-main font-bold text-[1rem] flex items-center gap-2">
          Registered SKUs
          <span className="text-[0.7rem] font-semibold py-0.5 px-2 rounded-full bg-card-hover text-text-muted border border-color">
            {localCatalog.length}
          </span>
        </h3>

        {localCatalog.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-text-muted">
            <Package size={28} className="opacity-40" />
            <p className="text-[0.85rem]">No SKUs registered yet — add one using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full border-collapse text-left text-[0.85rem]">
              <thead>
                <tr className="border-b-2 border-color text-text-muted">
                  <th className="py-3 px-6 font-semibold text-[0.7rem] uppercase tracking-wider">SKU</th>
                  <th className="py-3 px-6 font-semibold text-[0.7rem] uppercase tracking-wider">Item Title</th>
                  <th className="py-3 px-6 font-semibold text-[0.7rem] uppercase tracking-wider">Attributes</th>
                  <th className="py-3 px-6 font-semibold text-[0.7rem] uppercase tracking-wider">Identity UUID</th>
                </tr>
              </thead>
              <tbody>
                {localCatalog.map((item) => {
                  const attrEntries = Object.entries(item.custom_attributes || {});
                  return (
                    <tr key={item.id} className="border-b border-color transition-colors duration-150 hover:bg-card-hover">
                      <td className="py-3 px-6 font-mono font-semibold text-accent-purple whitespace-nowrap">
                        {item.sku}
                      </td>
                      <td className="py-3 px-6 text-text-main">{item.title}</td>
                      <td className="py-3 px-6">
                        {attrEntries.length === 0 ? (
                          <span className="text-text-muted/50 font-mono text-[0.75rem]">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {attrEntries.map(([key, val]) => (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-accent-blue/10 border border-accent-blue/25 font-mono text-[0.7rem] text-accent-blue whitespace-nowrap"
                              >
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 font-mono text-[0.7rem] text-text-muted whitespace-nowrap">
                        {item.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
