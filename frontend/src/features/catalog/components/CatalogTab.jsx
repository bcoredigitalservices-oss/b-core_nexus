import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function CatalogTab({ localCatalog, setLocalCatalog, roleTier, logSystemEvent }) {
  const [catForm, setCatForm] = useState({ sku: '', title: '', attributes: '' });

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="var(--accent-blue)" /> Register Catalog SKU
          </h3>
          <form onSubmit={handleAddCatalog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>SKU (Stock Keeping Unit) *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. SKU-SYS-NEX-99" 
                value={catForm.sku} 
                onChange={(e) => setCatForm({ ...catForm, sku: e.target.value })}
              />
            </div>

            <div>
              <label>Title *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Nexus Core PCB Motherboard" 
                value={catForm.title} 
                onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
              />
            </div>

            <div>
              <label>Custom Attributes (JSONB Format)</label>
              <textarea 
                rows="3" 
                placeholder='{ "voltage_rating": 240, "warranty_months": 24 }' 
                value={catForm.attributes} 
                onChange={(e) => setCatForm({ ...catForm, attributes: e.target.value })}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Register SKU
            </button>
          </form>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-purple)' }}>UNIVERSAL CATALOG MASTER</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              The **Universal Catalog** serves as the system-wide core ledger for SKU identification.
            </p>
            <div style={{ marginTop: '1.5rem', background: 'rgba(14, 19, 34, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                SKU validation constraint: Catalog items require unique, non-duplicable SKU codes.
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Roles Allowed to Edit:</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="badge badge-t1">Tier 1</span>
              <span className="badge badge-t2">Tier 2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem' }}>Registered SKUs ({localCatalog.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>SKU</th>
                <th style={{ padding: '0.75rem' }}>Item Title</th>
                <th style={{ padding: '0.75rem' }}>Attributes</th>
                <th style={{ padding: '0.75rem' }}>Identity UUID</th>
              </tr>
            </thead>
            <tbody>
              {localCatalog.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-purple)' }}>
                    {item.sku}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{item.title}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                    {JSON.stringify(item.custom_attributes)}
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {item.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
