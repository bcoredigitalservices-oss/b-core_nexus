import React from 'react';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function SerialNoWorkspace() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Serial No Management</h1>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem' }}>
        <UniversalDataGrid
          endpointUrl="/api/v1/workspaces/inventory/serial-numbers"
          title="Serial Numbers"
          pageSize={10}
          emptyMessage="No serial numbers found."
          columns={[
            { key: 'serial_no', label: 'Serial No', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
          ]}
        />
      </div>
    </div>
  );
}
