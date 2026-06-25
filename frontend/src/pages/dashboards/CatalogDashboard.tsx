import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layers, FileSpreadsheet, Plus } from 'lucide-react';
// @ts-ignore: UniversalDataGrid is a JSX component
import UniversalDataGrid from '../../components/ui/UniversalDataGrid';
import { useAppContext } from '../../context/AppContext';
import CreateItemModal from '../../components/catalog/CreateItemModal';
import BulkImportModal from '../../components/catalog/BulkImportModal';
import CreateItemGroupModal from '../../components/catalog/CreateItemGroupModal';


export default function CatalogDashboard() {
  const { authFetch } = useAppContext();
  const [gridKey, setGridKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'items' | 'assets' | 'warehouses' | 'stock'>('items');

  // Modal open states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Cached item groups to map UUIDs to names in columns
  const [itemGroups, setItemGroups] = useState<any[]>([]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await authFetch('/catalog/groups');
        if (groups) setItemGroups(groups);
      } catch (err) {
        console.error('Failed to load item groups for mapping:', err);
      }
    };
    loadGroups();
  }, [authFetch]);

  const getItemGroupName = (groupId: string | null) => {
    if (!groupId) return <em style={{ opacity: 0.5 }}>Unassigned</em>;
    const match = itemGroups.find(g => g.id === groupId);
    return match ? match.name : <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{groupId.substring(0, 8)}</span>;
  };

  const tabs = [
    { id: 'items', label: 'Items & Groups' },
    { id: 'assets', label: 'Asset Registry' },
    { id: 'warehouses', label: 'Warehouses' },
    { id: 'stock', label: 'Stock Health' },
  ] as const;

  const location = useLocation();
  const isInventoryRoute = location.pathname.startsWith('/workspace/inventory');

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(99, 91, 255, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(99, 91, 255, 0.1)',
              border: '1px solid rgba(99, 91, 255, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={28} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700 }}>
              Structural Engine Control
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage registered catalog items, asset registry, warehouse operations and live stock health.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        {activeTab === 'items' && (
          <div style={{ display: 'flex', gap: '0.75rem', zIndex: 1 }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsGroupModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              + Item Group
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsImportModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={16} />
              Bulk Import CSV
            </button>
            
            <button 
              className="btn btn-primary" 
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation Bar */}
      <div 
        style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '5px',
          width: 'fit-content'
        }}
      >
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: active ? 'rgba(99, 91, 255, 0.12)' : 'transparent',
                color: active ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 0 10px rgba(99, 91, 255, 0.15)' : 'none',
                borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conditional Content Area */}
      {activeTab === 'items' && (
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <Layers size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Catalog Items Registry</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              key={`grid-items-${gridKey}`}
              endpointUrl="/api/v1/catalog/items"
              title="Catalog Items"
              pageSize={10}
              emptyMessage="No catalog items found. Click Add Item to begin."
              columns={[
                { key: 'sku', label: 'SKU (Primary)', sortable: true },
                { key: 'name', label: 'Name', sortable: true },
                { 
                  key: 'catalog_type', 
                  label: 'Catalog Type', 
                  sortable: true,
                  render: (value: string) => (
                    <span className="badge badge-t3" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {value.replace('_', ' ')}
                    </span>
                  )
                },
                { key: 'default_uom', label: 'Default UOM', sortable: true },
                {
                  key: 'item_group_id',
                  label: 'Item Group',
                  sortable: true,
                  render: (value: any) => getItemGroupName(value)
                }
              ]}
            />
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Layers size={20} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Asset Registry</h2>
            </div>
            <button 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => alert('Register Asset action placeholder.')}
            >
              <Plus size={14} />
              Register Asset
            </button>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              key="grid-assets"
              endpointUrl="/api/v1/inventory/assets"
              title="Assets"
              pageSize={10}
              emptyMessage="No assets registered yet."
              columns={[
                { key: 'asset_name', label: 'Asset Name', sortable: true },
                { 
                  key: 'status', 
                  label: 'Status', 
                  sortable: true,
                  render: (v: string) => (
                    <span 
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: v === 'In Use' ? 'rgba(16, 185, 129, 0.12)' : v === 'Scrapped' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: v === 'In Use' ? '#10b981' : v === 'Scrapped' ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${v === 'In Use' ? '#10b981' : v === 'Scrapped' ? '#ef4444' : '#f59e0b'}33`
                      }}
                    >
                      {v}
                    </span>
                  )
                },
                { 
                  key: 'purchase_date', 
                  label: 'Purchase Date', 
                  sortable: true,
                  render: (v: string) => v ? new Date(v).toLocaleDateString() : '—'
                },
                { 
                  key: 'gross_purchase_amount', 
                  label: 'Gross Purchase Amount', 
                  sortable: true,
                  render: (v: any) => v !== undefined && v !== null ? `$${Number(v).toFixed(2)}` : '—'
                }
              ]}
            />
          </div>
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Layers size={20} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Warehouses Control</h2>
            </div>
            <button 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => alert('Create Warehouse action placeholder.')}
            >
              <Plus size={14} />
              Create Warehouse
            </button>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              key="grid-warehouses"
              endpointUrl="/api/v1/inventory/warehouses"
              title="Warehouses"
              pageSize={10}
              emptyMessage="No warehouses registered yet."
              columns={[
                { key: 'name', label: 'Warehouse Name', sortable: true },
                { 
                  key: 'is_group', 
                  label: 'Is Group', 
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
                      {v ? 'Yes (Group)' : 'No (Bin)'}
                    </span>
                  )
                }
              ]}
            />
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <Layers size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Stock Health & Balances</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <UniversalDataGrid
              key="grid-stock"
              endpointUrl="/api/v1/inventory/stock-balance"
              title="Stock Balances"
              pageSize={10}
              emptyMessage="No stock balances found."
              columns={[
                { key: 'item_id', label: 'Item ID', sortable: true },
                { key: 'warehouse_id', label: 'Warehouse ID', sortable: true },
                { 
                  key: 'actual_qty', 
                  label: 'Actual Qty', 
                  sortable: true,
                  render: (v: any) => v !== undefined && v !== null ? Number(v).toLocaleString() : '0'
                }
              ]}
            />
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      <CreateItemModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setGridKey(prev => prev + 1);
        }}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          setGridKey(prev => prev + 1);
        }}
      />

      {/* Create Item Group Modal */}
      <CreateItemGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={() => {
          setIsGroupModalOpen(false);
          setGridKey(prev => prev + 1);
        }}
      />
    </div>
  );

  return content;
}

