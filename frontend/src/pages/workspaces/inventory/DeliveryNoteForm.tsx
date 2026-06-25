import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function DeliveryNoteForm() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/workspace/inventory/delivery-notes')}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--text-main)' }}>
              New Delivery Note
            </h1>
          </div>
        </div>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            border: 'none', borderRadius: '10px',
            padding: '0.625rem 1.25rem',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <Save size={16} /> Save
        </button>
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Series</label>
          <input type="text" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Customer</label>
          <input type="text" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date</label>
          <input type="date" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Posting Time</label>
          <input type="time" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
        </div>
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', padding: '1rem' }}>
        <UniversalDataGrid
          endpointUrl="/api/v1/workspaces/inventory/delivery-notes/dummy-items"
          title="Items"
          pageSize={10}
          emptyMessage="No items added."
          columns={[
            { key: 'item_code', label: 'Item Code' },
            { key: 'qty', label: 'Quantity' },
            { key: 'uom', label: 'UOM' },
            { key: 'rate', label: 'Rate' },
            { key: 'amount', label: 'Amount' },
            { key: 'target_warehouse', label: 'Target Warehouse' }
          ]}
        />
      </div>
    </div>
  );
}
