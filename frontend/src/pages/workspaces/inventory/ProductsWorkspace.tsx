import React from 'react';
import { Box } from 'lucide-react';
// @ts-ignore: UniversalDataGrid is a JSX component
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';


export default function ProductsWorkspace() {
  const columns = [
    { key: 'sku', label: 'SKU / Model', sortable: true },
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'category', label: 'Product Category', sortable: true },
    { key: 'status', label: 'Retail Status', sortable: true }
  ];

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        {/* Header Block */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 30, 50, 0.4) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box size={28} color="#d4af37" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Products View
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Enriched view of merchandise, bundled packages, and retail items.
            </p>
          </div>
        </div>

        {/* KPI Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} color="#d4af37" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Dynamic Bundles</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>0</div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Sync Status</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>Active</div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Bundle Rules</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>0 Configured</div>
            </div>
          </div>
        </div>

        {/* UniversalDataGrid Container */}
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--bg-card)'
            }}
          >
            <Box size={20} color="#d4af37" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Retail Products Catalog</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              endpointUrl="/api/v1/workspaces/inventory/products/bundles"
              title="Products"
              pageSize={10}
              emptyMessage="No products registered. Products view is in placeholder status."
              columns={columns}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

