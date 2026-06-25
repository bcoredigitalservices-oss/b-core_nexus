import React, { useState } from 'react';
import { X } from 'lucide-react';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function ItemManufacturerWorkspace() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const token = localStorage.getItem('bcore_token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory/item-manufacturers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newItemName.trim() })
      });
      setIsModalOpen(false);
      setNewItemName('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to create Item Manufacturer');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Item Manufacturers</h1>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem' }}>
        <UniversalDataGrid
          key={refreshKey}
          endpointUrl="/api/v1/workspaces/inventory/item-manufacturers"
          title="Item Manufacturers"
          pageSize={10}
          emptyMessage="No Item Manufacturers found."
          onAdd={() => setIsModalOpen(true)}
          columns={[
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
          ]}
        />
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', width: '400px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>Create Item Manufacturer</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
             </div>
             <form onSubmit={handleSubmit}>
               <div style={{ marginBottom: '1.5rem' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Manufacturer Name</label>
                 <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} autoFocus style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }} placeholder="e.g. Acme Corp" />
               </div>
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                 <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                 <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Create</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
