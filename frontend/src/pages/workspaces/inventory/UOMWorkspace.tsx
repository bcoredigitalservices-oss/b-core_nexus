import React from 'react';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function UOMWorkspace() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Unit of Measure Master</h1>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem' }}>
        <UniversalDataGrid
          endpointUrl="/api/v1/workspaces/inventory/uom"
          title="UOM Master"
          pageSize={10}
          emptyMessage="No Units of Measure found."
          columns={[
            { key: 'name', label: 'UOM Name', sortable: true },
            { key: 'symbol', label: 'Symbol', sortable: true },
          ]}
        />
      </div>
    </div>
  );
}
