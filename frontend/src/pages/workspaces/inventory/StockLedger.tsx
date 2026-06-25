import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Package,
  Warehouse as WarehouseIcon,
  ChevronsUpDown,
  Check
} from 'lucide-react';

import { useAppContext } from '../../../context/AppContext';

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const INVENTORY_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'inventory',
  workspaceName: 'Inventory',
  accentColor: '#ffb703',
  icon: <Package size={18} />,
  navItems: [
    { label: 'Dashboard',    subPath: '',            icon: <Layers size={15} /> },
    { label: 'Item Master',  subPath: 'items',       icon: <Package size={15} /> },
    { label: 'Warehouses',   subPath: 'warehouses',  icon: <WarehouseIcon size={15} /> },
    { label: 'Stock Ledger', subPath: 'stock-ledger', icon: <FileText size={15} /> },
  ],
};

interface StockLevel {
  item_name: string;
  sku: string;
  warehouse_name: string;
  current_qty: number;
}

interface Item {
  id: string;
  sku: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface AdjustmentFormValues {
  item_id: string;
  warehouse_id: string;
  transaction_type: 'IN' | 'OUT';
  qty_change: string;
  reference_note?: string;
}

export default function StockLedgerPage() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid State
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Searchable Dropdowns Local State
  const [itemSearch, setItemSearch] = useState('');
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<AdjustmentFormValues>({
    defaultValues: {
      item_id: '',
      warehouse_id: '',
      transaction_type: 'IN',
      qty_change: '1.00',
      reference_note: ''
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  // Fetch Live Stock Levels
  const fetchStockLevels = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/stock/levels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view this workspace.');
        }
        throw new Error('Failed to load stock levels.');
      }

      const data = await response.json();
      setStockLevels(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching stock levels.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch items and warehouses for modal select
  const fetchModalData = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      
      // Fetch Items
      const itemsRes = await fetch(`${API_BASE}/items?limit=500`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItemsList(itemsData.items || []);
      }

      // Fetch Warehouses
      const whRes = await fetch(`${API_BASE}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (whRes.ok) {
        const whData = await whRes.json();
        setWarehousesList(whData || []);
      }
    } catch (err) {
      console.error('Failed to pre-fetch modal selection lists:', err);
    }
  };

  useEffect(() => {
    fetchStockLevels();
    fetchModalData();
  }, []);

  useEffect(() => {
    const handleMutation = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.workspace === 'inventory' && customEvent.detail?.entity === 'stock_ledger') {
        console.log('[WS Trigger] Stock level mutation received. Reloading stock ledger...');
        fetchStockLevels();
      }
    };
    window.addEventListener('STATE_MUTATION', handleMutation);
    return () => window.removeEventListener('STATE_MUTATION', handleMutation);
  }, []);

  const handleOpenModal = () => {
    reset({
      item_id: '',
      warehouse_id: '',
      transaction_type: 'IN',
      qty_change: '1.00',
      reference_note: ''
    });
    setSelectedItem(null);
    setItemSearch('');
    setSelectedWarehouse(null);
    setWarehouseSearch('');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: AdjustmentFormValues) => {
    if (!values.item_id) {
      setFormError('Please select a valid item.');
      return;
    }
    if (!values.warehouse_id) {
      setFormError('Please select a valid warehouse.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/stock/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: values.item_id,
          warehouse_id: values.warehouse_id,
          qty_change: parseFloat(values.qty_change) || 0,
          transaction_type: values.transaction_type,
          reference_note: values.reference_note || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to record stock movement.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Stock adjustment logged successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchStockLevels();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Main list filters
  const filteredStock = stockLevels.filter(stock => 
    stock.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Search filtering dropdowns
  const filteredItems = itemsList.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.sku.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const filteredWarehouses = warehousesList.filter(wh => 
    wh.name.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', background: 'var(--bg-main)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Stock Ledger & Live Levels
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Monitor live stock levels grouped by storage terminal and record inventory inflows or outflows.
            </p>
          </div>
          <button
            id="btn-log-stock-movement"
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ffb703, #f59e0b)',
              color: '#0b0f19',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(255,183,3,0.3)',
            }}
          >
            <Plus size={16} />
            Log Stock Movement
          </button>
        </div>

        {/* Search & Action Bar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search by SKU, item, or warehouse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '40px' }}
            />
          </div>
          <button
            onClick={fetchStockLevels}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '40px', padding: '0 0.75rem' }}
            title="Refresh levels"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,51,102,0.1)',
            border: '1px solid rgba(255,51,102,0.25)',
            color: '#ff3366',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stock Levels Glassmorphic Table */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '1rem' }}>SKU</th>
                  <th style={{ padding: '1rem' }}>Item Name</th>
                  <th style={{ padding: '1rem' }}>Warehouse Location</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Current Quantity</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading aggregated stock levels...
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No stock records found in the ledger.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((stock, idx) => {
                    const isLow = stock.current_qty < 10;
                    return (
                      <tr key={idx} style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffb703' }}>
                          {stock.sku}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {stock.item_name}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <WarehouseIcon size={12} color='var(--text-muted)' />
                            {stock.warehouse_name}
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isLow ? '#f59e0b' : 'var(--text-main)'
                        }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {isLow && <AlertTriangle size={14} color="#f59e0b" style={{ animation: 'pulse 2s infinite' }} />}
                            {stock.current_qty.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Adjustment / Movement Modal ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #141b2e 0%, #0c1224 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(255,183,3,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible' // Allow searchable dropdown lists to overlap overflow
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card-hover)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                Log Stock Movement / Adjustment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'visible' }}>
              
              {formError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,51,102,0.1)',
                  border: '1px solid rgba(255,51,102,0.2)',
                  color: '#ff3366',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,245,160,0.1)',
                  border: '1px solid rgba(0,245,160,0.2)',
                  color: '#00f5a0',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <CheckCircle2 size={14} />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Searchable Item Selector */}
              <div style={{ position: 'relative' }}>
                <label>Select Item (SKU / Name) *</label>
                <div 
                  onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: selectedItem ? 'var(--text-main)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  <span>{selectedItem ? `[${selectedItem.sku}] ${selectedItem.name}` : 'Choose an inventory item...'}</span>
                  <ChevronsUpDown size={16} color="var(--text-muted)" />
                </div>

                {itemDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    zIndex: 10000,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <input
                      type="text"
                      placeholder="Type SKU or Name to search..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem' }}
                      autoFocus
                    />
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                      {filteredItems.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No matching items found.
                        </div>
                      ) : (
                        filteredItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              setValue('item_id', item.id);
                              setItemDropdownOpen(false);
                              setItemSearch('');
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: selectedItem?.id === item.id ? '#ffb703' : 'var(--text-main)',
                              backgroundColor: selectedItem?.id === item.id ? 'rgba(255,183,3,0.08)' : 'transparent',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = selectedItem?.id === item.id ? 'rgba(255,183,3,0.08)' : 'transparent';
                            }}
                          >
                            <span><strong>{item.sku}</strong> - {item.name}</span>
                            {selectedItem?.id === item.id && <Check size={14} color="#ffb703" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Searchable Warehouse Selector */}
              <div style={{ position: 'relative' }}>
                <label>Select Warehouse Location *</label>
                <div 
                  onClick={() => setWarehouseDropdownOpen(!warehouseDropdownOpen)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: selectedWarehouse ? 'var(--text-main)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  <span>{selectedWarehouse ? selectedWarehouse.name : 'Choose storage terminal...'}</span>
                  <ChevronsUpDown size={16} color="var(--text-muted)" />
                </div>

                {warehouseDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    zIndex: 9999,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <input
                      type="text"
                      placeholder="Type name to search..."
                      value={warehouseSearch}
                      onChange={(e) => setWarehouseSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem' }}
                      autoFocus
                    />
                    <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                      {filteredWarehouses.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No matching warehouses.
                        </div>
                      ) : (
                        filteredWarehouses.map(wh => (
                          <div
                            key={wh.id}
                            onClick={() => {
                              setSelectedWarehouse(wh);
                              setValue('warehouse_id', wh.id);
                              setWarehouseDropdownOpen(false);
                              setWarehouseSearch('');
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: selectedWarehouse?.id === wh.id ? '#ffb703' : 'var(--text-main)',
                              backgroundColor: selectedWarehouse?.id === wh.id ? 'rgba(255,183,3,0.08)' : 'transparent',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = selectedWarehouse?.id === wh.id ? 'rgba(255,183,3,0.08)' : 'transparent';
                            }}
                          >
                            <span>{wh.name}</span>
                            {selectedWarehouse?.id === wh.id && <Check size={14} color="#ffb703" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Type & Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Transaction Type *</label>
                  <select {...register('transaction_type')}>
                    <option value="IN">IN (Stock Increase)</option>
                    <option value="OUT">OUT (Stock Decrease)</option>
                  </select>
                </div>
                <div>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="1.00"
                    {...register('qty_change', {
                      required: 'Quantity is required',
                      validate: (val) => parseFloat(val) > 0 || 'Quantity must be greater than zero'
                    })}
                  />
                  {errors.qty_change && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.qty_change.message}</p>}
                </div>
              </div>

              {/* Reference note */}
              <div>
                <label>Reference / Note</label>
                <input
                  type="text"
                  placeholder="e.g. PO-88392, stocktaking correction..."
                  {...register('reference_note')}
                />
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.25rem',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '38px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ffb703, #f59e0b)',
                    color: '#0b0f19',
                    fontWeight: 700,
                    height: '38px',
                    boxShadow: '0 4px 12px rgba(255,183,3,0.2)',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Log Adjustment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
