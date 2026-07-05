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
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#635bff]/5 to-[#00f2fe]/5 border border-color rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 z-10">
          <div className="bg-[#635bff]/10 border border-[#635bff]/20 rounded-xl p-3 flex items-center justify-center">
            <Layers size={28} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-[1.6rem] font-bold text-text-main font-display mb-1">
              Structural Engine Control
            </h1>
            <p className="text-text-muted text-[0.875rem]">
              Manage registered catalog items, asset registry, warehouse operations and live stock health.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        {activeTab === 'items' && (
          <div className="flex gap-3 z-10">
            <button 
              className="btn btn-secondary flex items-center gap-1.5" 
              onClick={() => setIsGroupModalOpen(true)}
            >
              <Plus size={16} />
              + Item Group
            </button>
            <button 
              className="btn btn-secondary flex items-center gap-1.5" 
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileSpreadsheet size={16} />
              Bulk Import CSV
            </button>
            
            <button 
              className="btn btn-primary flex items-center gap-1.5" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation Bar */}
      <div className="flex gap-2 bg-white/2 backdrop-blur-[10px] border border-color rounded-xl p-1 w-fit">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-[18px] rounded-lg border-none text-[0.85rem] cursor-pointer transition-all duration-200 border-b-2 ${
                active 
                  ? 'bg-[#635bff]/12 text-text-main font-bold shadow-[0_0_10px_rgba(99,91,255,0.15)] border-b-accent-primary' 
                  : 'bg-transparent text-text-muted font-medium border-b-transparent hover:text-text-main'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conditional Content Area */}
      {activeTab === 'items' && (
        <div className="glass-panel p-0 overflow-hidden">
          <div className="py-5 px-6 border-b border-color flex items-center gap-3">
            <Layers size={20} className="text-accent-primary" />
            <h2 className="text-[1.1rem] font-semibold text-text-main">Catalog Items Registry</h2>
          </div>
          <div className="p-5">
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
                    <span className="badge badge-t3 uppercase text-[0.7rem]">
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
        <div className="glass-panel p-0 overflow-hidden">
          <div className="py-5 px-6 border-b border-color flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-accent-primary" />
              <h2 className="text-[1.1rem] font-semibold text-text-main">Asset Registry</h2>
            </div>
            <button 
              className="btn btn-primary flex items-center gap-1.5 py-1.5 px-3.5 text-[0.8rem]"
              onClick={() => alert('Register Asset action placeholder.')}
            >
              <Plus size={14} />
              Register Asset
            </button>
          </div>
          <div className="p-5">
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
                      className={`inline-block py-0.5 px-2 rounded-full text-[0.75rem] font-bold border ${
                        v === 'In Use' 
                          ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20' 
                          : v === 'Scrapped' 
                            ? 'bg-red-500/12 text-red-400 border-red-500/20' 
                            : 'bg-amber-500/12 text-amber-400 border-amber-500/20'
                      }`}
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
        <div className="glass-panel p-0 overflow-hidden">
          <div className="py-5 px-6 border-b border-color flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-accent-primary" />
              <h2 className="text-[1.1rem] font-semibold text-text-main">Warehouses Control</h2>
            </div>
            <button 
              className="btn btn-primary flex items-center gap-1.5 py-1.5 px-3.5 text-[0.8rem]"
              onClick={() => alert('Create Warehouse action placeholder.')}
            >
              <Plus size={14} />
              Create Warehouse
            </button>
          </div>
          <div className="p-5">
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
                      className={`inline-block py-0.5 px-2 rounded-full text-[0.75rem] font-bold border ${
                        v 
                          ? 'bg-blue-500/12 text-blue-400 border-blue-500/20' 
                          : 'bg-slate-500/12 text-slate-400 border-slate-500/20'
                      }`}
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
        <div className="glass-panel p-0 overflow-hidden">
          <div className="py-5 px-6 border-b border-color flex items-center gap-3">
            <Layers size={20} className="text-accent-primary" />
            <h2 className="text-[1.1rem] font-semibold text-text-main">Stock Health & Balances</h2>
          </div>
          <div className="p-5">
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

