import React from 'react';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function StockAgeing() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Stock Ageing Report</h1>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem' }}>
        <UniversalDataGrid
          endpointUrl="/api/v1/workspaces/inventory/reports/ageing"
          title="Stock Ageing"
          pageSize={10}
          emptyMessage="No data available."
          columns={[
            { key: 'item', label: 'Item', sortable: true },
            { key: 'warehouse', label: 'Warehouse', sortable: true },
            { key: 'age', label: 'Age (Days)', sortable: true },
          ]}
        />
      </div>
    </div>
  );
}
