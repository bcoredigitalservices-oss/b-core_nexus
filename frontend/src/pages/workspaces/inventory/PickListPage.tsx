import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, ArrowLeft } from 'lucide-react';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function PickListPage() {
  const navigate = useNavigate();

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'purpose', label: 'Purpose', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/workspace/inventory/stock')}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--text-main)' }}>
              Pick List
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.2rem 0 0' }}>
              Warehouse pick instructions for order fulfilment and transfers.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/workspace/inventory/pick-list/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            border: 'none', borderRadius: '10px',
            padding: '0.625rem 1.25rem',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(167,139,250,0.3)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={16} /> Add Pick List
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', padding: '1rem' }}>
        <UniversalDataGrid
          endpointUrl="/api/v1/workspaces/inventory/pick-list"
          title="Pick Lists"
          pageSize={10}
          emptyMessage="No pick lists available."
          columns={columns}
        />
      </div>
    </div>
  );
}
