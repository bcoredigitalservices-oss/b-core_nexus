import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function DirectoryTab({ localDirectory, setLocalDirectory, roleTier, logSystemEvent }) {
  const [dirForm, setDirForm] = useState({ profile_type: 'CUSTOMER', name: '', email: '', phone: '', attributes: '' });

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
    
    logSystemEvent(newProfile.id, dirForm.profile_type, 'status_change', {
      message: `Created new ${dirForm.profile_type}: ${dirForm.name}`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="var(--accent-blue)" /> Register Directory Profile
          </h3>
          <form onSubmit={handleAddDirectory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Profile Type</label>
              <select 
                value={dirForm.profile_type} 
                onChange={(e) => setDirForm({ ...dirForm, profile_type: e.target.value })}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Vendor</option>
                <option value="SITE">Internal Site</option>
              </select>
            </div>

            <div>
              <label>Profile Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Spedex Logistics Hub" 
                value={dirForm.name} 
                onChange={(e) => setDirForm({ ...dirForm, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="ops@company.com" 
                  value={dirForm.email} 
                  onChange={(e) => setDirForm({ ...dirForm, email: e.target.value })}
                />
              </div>
              <div>
                <label>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+1-555-0100" 
                  value={dirForm.phone} 
                  onChange={(e) => setDirForm({ ...dirForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label>Custom Attributes (JSONB Format)</label>
              <textarea 
                rows="3" 
                placeholder='{ "dock_count": 4, "max_weight_capacity_tons": 50 }' 
                value={dirForm.attributes} 
                onChange={(e) => setDirForm({ ...dirForm, attributes: e.target.value })}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Add Profile
            </button>
          </form>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>IMMUTABLE DIRECTORY MODEL</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              B-Core Nexus enforces a strict code-first schema.
            </p>
            <div style={{ marginTop: '1.5rem', background: 'rgba(14, 19, 34, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                role_tier check: Creating directory profiles requires TIER 2 (Directional) or higher privileges.
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
        <h3 style={{ marginBottom: '1rem' }}>Active Profiles Directory ({localDirectory.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Contact Details</th>
                <th style={{ padding: '0.75rem' }}>Custom Attributes (JSONB)</th>
                <th style={{ padding: '0.75rem' }}>UUID Identity</th>
              </tr>
            </thead>
            <tbody>
              {localDirectory.map((profile) => (
                <tr key={profile.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${profile.profile_type.toLowerCase()}`}>
                      {profile.profile_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{profile.name}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                    <div>{profile.email || 'N/A'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{profile.phone || ''}</div>
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                    {JSON.stringify(profile.custom_attributes)}
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {profile.id}
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
