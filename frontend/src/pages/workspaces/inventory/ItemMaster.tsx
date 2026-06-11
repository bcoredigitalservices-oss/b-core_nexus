import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Layers,
  FileText
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import DynamicFieldRenderer from '../../../components/forms/DynamicFieldRenderer';

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const INVENTORY_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'inventory',
  workspaceName: 'Inventory',
  accentColor: '#ffb703',
  icon: <Package size={18} />,
  navItems: [
    { label: 'Dashboard',    subPath: '',            icon: <Layers size={15} /> },
    { label: 'Item Master',  subPath: 'items',       icon: <Package size={15} /> },
    { label: 'Warehouses',   subPath: 'warehouses',  icon: <Layers size={15} /> },
    { label: 'Stock Ledger', subPath: 'stock-ledger', icon: <FileText size={15} /> },
  ],
};

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  base_price: number | string;
  uom: string;
  item_group: string;
  is_active: boolean;
  custom_attributes: Record<string, any>;
}

interface ItemFormValues {
  sku: string;
  name: string;
  description: string;
  base_price: string;
  uom: string;
  item_group: string;
  custom_attributes?: Record<string, any>;
}

export default function ItemMaster() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [itemSchema, setItemSchema] = useState<any[]>([]);

  const fetchItemSchema = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspace/config/item-schema`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setItemSchema(data || []);
      }
    } catch (err) {
      console.error('Failed to load item schema config:', err);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemFormValues>({
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      base_price: '0.00',
      uom: 'Piece',
      item_group: 'General',
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) {
        queryParams.append('search', search);
      }

      const response = await fetch(`${API_BASE}/items?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view this workspace.');
        }
        throw new Error('Failed to load item catalog.');
      }

      const data = await response.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchItemSchema();
  }, [offset, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchItems();
  };

  const handleOpenModal = () => {
    reset({
      sku: '',
      name: '',
      description: '',
      base_price: '0.00',
      uom: 'Piece',
      item_group: 'General',
      custom_attributes: {},
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: ItemFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          base_price: parseFloat(values.base_price) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to create inventory item.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Item registered successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setOffset(0);
        fetchItems();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating the item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceLayout config={INVENTORY_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Item Master Catalog
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Create, view, and manage the system-wide product and SKU directory.
            </p>
          </div>
          <button
            id="btn-add-new-item"
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
            Add New Item
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
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', gap: '0.75rem', minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by SKU or item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', height: '40px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ height: '40px' }}>
              Search
            </button>
          </form>
          <button
            onClick={fetchItems}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '40px', padding: '0 0.75rem' }}
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Error notification */}
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

        {/* Data Grid / Table */}
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
                  <th style={{ padding: '1rem' }}>Item Group</th>
                  <th style={{ padding: '1rem' }}>UOM</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Base Price</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading item master catalog...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No items registered in the inventory catalog.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffb703' }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        <span style={{
                          background: 'var(--bg-card-hover)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-color)'
                        }}>
                          {item.item_group}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.uom}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                        ${parseFloat(item.base_price.toString()).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: item.is_active ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255,51,102,0.12)',
                          color: item.is_active ? '#00f5a0' : '#ff3366',
                          border: `1px solid ${item.is_active ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255,51,102,0.2)'}`
                        }}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && items.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} records
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', gap: '4px', height: '32px', fontSize: '0.75rem' }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', gap: '4px', height: '32px', fontSize: '0.75rem' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Item Modal ─── */}
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
            maxWidth: '540px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(255,183,3,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
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
                Register New Inventory Item
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
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>SKU (Stock Keeping Unit) *</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-RM-909"
                    {...register('sku', { required: 'SKU is required' })}
                  />
                  {errors.sku && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.sku.message}</p>}
                </div>
                <div>
                  <label>Base Price ($ USD) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.00"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('base_price', {
                        required: 'Base price is required',
                        min: { value: 0, message: 'Base price must be greater than or equal to 0' }
                      })}
                    />
                  </div>
                  {errors.base_price && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.base_price.message}</p>}
                </div>
              </div>

              <div>
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Aluminium Sheet A4"
                  {...register('name', { required: 'Item Name is required' })}
                />
                {errors.name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.name.message}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Unit of Measure (UOM)</label>
                  <select {...register('uom')}>
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Kg">Kilogram (Kg)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Meter">Meter (M)</option>
                  </select>
                </div>
                <div>
                  <label>Item Group</label>
                  <select {...register('item_group')}>
                    <option value="General">General</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>
              </div>

              <DynamicFieldRenderer schema={itemSchema} register={register} errors={errors} />

              <div>
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional details, supplier notes or specifications..."
                  {...register('description')}
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
                  {submitting ? 'Registering...' : 'Register Item'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Styles keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </WorkspaceLayout>
  );
}
