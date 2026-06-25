import React from 'react';
export default function InventorySettings() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Inventory Settings</h1>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', color: 'var(--text-muted)' }}>
        <p>Inventory settings configuration form goes here.</p>
      </div>
    </div>
  );
}
