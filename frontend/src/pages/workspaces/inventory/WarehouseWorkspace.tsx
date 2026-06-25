import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Folder, Box } from 'lucide-react';
// @ts-ignore: UniversalDataGrid is a JSX component
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';


export default function WarehouseWorkspace() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/inventory/warehouses`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('bcore_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setWarehouses(data);
        }
      } catch (err) {
        console.error('Failed to fetch warehouses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const totalWarehouses = warehouses.length;
  const groupLocations = warehouses.filter(w => w.is_group).length;
  const binLocations = warehouses.filter(w => !w.is_group).length;

  const columns = [
    { key: 'name', label: 'Warehouse Name', sortable: true },
    { 
      key: 'is_group', 
      label: 'Is Group Location', 
      sortable: true, 
      render: (v: boolean) => (
        <span 
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: v ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
            color: v ? '#3b82f6' : '#64748b',
            border: `1px solid ${v ? '#3b82f6' : '#64748b'}33`
          }}
        >
          {v ? 'Yes (Group)' : 'No (Store/Bin)'}
        </span>
      ) 
    },
    { 
      key: 'parent_id', 
      label: 'Parent Location ID', 
      sortable: true,
      render: (v: string) => v ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{v}</span> : <em style={{ opacity: 0.5 }}>None</em>
    }
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
            <WarehouseIcon size={28} color="#d4af37" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Warehouse Operations
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Configure physical/virtual warehouse nodes and manage locations.
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
              <WarehouseIcon size={20} color="#d4af37" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Total Warehouses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {loading ? '...' : totalWarehouses}
              </div>
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
              <Folder size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Group Nodes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {loading ? '...' : groupLocations}
              </div>
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
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(100, 116, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} color="#64748b" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Bins / Stores</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {loading ? '...' : binLocations}
              </div>
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
            <WarehouseIcon size={20} color="#d4af37" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Locations & Warehouses</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              endpointUrl="/api/v1/inventory/warehouses"
              title="Warehouses"
              pageSize={10}
              emptyMessage="No warehouses registered yet."
              columns={columns}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
