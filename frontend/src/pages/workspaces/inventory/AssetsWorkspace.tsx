import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  UserPlus, 
  Undo2, 
  X, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';

interface Asset {
  id: string;
  asset_name: string;
  item_id: string;
  item_name?: string;
  purchase_date: string;
  gross_purchase_amount: number;
  status: 'Available' | 'Allocated' | 'Maintenance';
  allocated_to_user_id?: string;
  allocated_to_user_email?: string;
  location_id?: string;
  location_name?: string;
  custom_attributes: Record<string, any>;
}

export default function AssetsWorkspace() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Lookups
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Target asset for allocation
  const [targetAsset, setTargetAsset] = useState<Asset | null>(null);

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate } } = useForm<any>({
    defaultValues: {
      asset_name: '',
      item_id: '',
      purchase_date: new Date().toISOString().substring(0, 16),
      gross_purchase_amount: 0.0,
      location_id: ''
    }
  });

  const { register: registerAllocate, handleSubmit: handleSubmitAllocate, reset: resetAllocate, formState: { errors: errorsAllocate } } = useForm<any>({
    defaultValues: {
      allocated_to_user_id: '',
      location_id: ''
    }
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch assets
      const assetsRes = await fetch(`${API_BASE}/assets`, { headers });
      if (!assetsRes.ok) throw new Error('Failed to load assets.');
      const assetsData = await assetsRes.json();
      setAssets(assetsData || []);

      // Fetch items
      const itemsRes = await fetch(`${API_BASE}/items?limit=500`, { headers });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }

      // Fetch warehouses
      const warehousesRes = await fetch(`${API_BASE}/warehouses`, { headers });
      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData || []);
      }

      // Fetch users
      const usersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/users`, { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    resetCreate({
      asset_name: '',
      item_id: items[0]?.id || '',
      purchase_date: new Date().toISOString().substring(0, 16),
      gross_purchase_amount: 0.0,
      location_id: warehouses[0]?.id || ''
    });
    setFormError('');
    setFormSuccess('');
    setIsCreateOpen(true);
  };

  const handleOpenAllocateModal = (asset: Asset) => {
    setTargetAsset(asset);
    resetAllocate({
      allocated_to_user_id: users[0]?.id || '',
      location_id: asset.location_id || warehouses[0]?.id || ''
    });
    setFormError('');
    setFormSuccess('');
    setIsAllocateOpen(true);
  };

  const onCreateSubmit = async (values: any) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('bcore_token');
      const payload = {
        ...values,
        purchase_date: new Date(values.purchase_date).toISOString(),
        gross_purchase_amount: Number(values.gross_purchase_amount),
        location_id: values.location_id || null
      };

      const response = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to register asset.');
      }

      setFormSuccess('Asset registered successfully!');
      setTimeout(() => {
        setIsCreateOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const onAllocateSubmit = async (values: any) => {
    if (!targetAsset) return;
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('bcore_token');
      const payload = {
        allocated_to_user_id: values.allocated_to_user_id,
        location_id: values.location_id || null
      };

      const response = await fetch(`${API_BASE}/assets/${targetAsset.id}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to allocate asset.');
      }

      setFormSuccess('Asset allocated successfully!');
      setTimeout(() => {
        setIsAllocateOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnAsset = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to return asset "${asset.asset_name}" to warehouse inventory?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/assets/${asset.id}/return`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to return asset.');
      }
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to delete asset "${asset.asset_name}"?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/assets/${asset.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to delete asset.');
      }
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    }
  };

  const totalAssets = assets.length;
  const grossPurchaseValue = assets.reduce((acc, curr) => acc + Number(curr.gross_purchase_amount || 0), 0);
  const activeAssets = assets.filter(a => a.status === 'Allocated').length;

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-main)' }}>
              Asset Registry
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Track, allocate, and audit physical and digital enterprise assets.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ffb703, #f59e0b)',
              color: '#0b0f19',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(255,183,3,0.3)',
            }}
          >
            <Plus size={16} />
            Register Asset
          </button>
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
              <Layers size={20} color="#d4af37" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Total Assets</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {loading ? '...' : totalAssets}
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
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Gross Purchase Value</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {loading ? '...' : `$${grossPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
              <CheckCircle2 size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Active (Allocated)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
                {loading ? '...' : activeAssets}
              </div>
            </div>
          </div>
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
          <div 
            style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Layers size={20} color="#d4af37" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>All Registered Assets</h2>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="btn btn-secondary"
              style={{ height: '32px', padding: '0 0.75rem' }}
              title="Refresh list"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '1rem' }}>Asset Name</th>
                  <th style={{ padding: '1rem' }}>Model / Catalog Item</th>
                  <th style={{ padding: '1rem' }}>Purchase Date</th>
                  <th style={{ padding: '1rem' }}>Purchase Amount</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Holder / Location</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading asset database...
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No assets registered yet. Click "Register Asset" to begin.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {asset.asset_name}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                        {asset.item_name || 'Unknown Item'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                        {asset.gross_purchase_amount !== undefined ? `$${Number(asset.gross_purchase_amount).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: asset.status === 'Available' ? 'rgba(0, 245, 160, 0.12)' : asset.status === 'Allocated' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: asset.status === 'Available' ? '#00f5a0' : asset.status === 'Allocated' ? '#3b82f6' : '#f59e0b',
                          border: `1px solid ${asset.status === 'Available' ? '#00f5a0' : asset.status === 'Allocated' ? '#3b82f6' : '#f59e0b'}33`
                        }}>
                          {asset.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {asset.status === 'Allocated' ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{asset.allocated_to_user_email}</span>
                            {asset.location_name && <span style={{ fontSize: '0.75rem' }}>@{asset.location_name}</span>}
                          </div>
                        ) : asset.location_name ? (
                          <span>Stored at {asset.location_name}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {asset.status === 'Available' && (
                            <button
                              onClick={() => handleOpenAllocateModal(asset)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '4px 8px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                fontSize: '0.8rem',
                                height: '28px',
                                background: 'rgba(0, 245, 160, 0.1)',
                                color: '#00f5a0',
                                border: '1px solid rgba(0, 245, 160, 0.2)'
                              }}
                              title="Allocate to User"
                            >
                              <UserPlus size={12} />
                              Allocate
                            </button>
                          )}
                          {asset.status === 'Allocated' && (
                            <button
                              onClick={() => handleReturnAsset(asset)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '4px 8px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                fontSize: '0.8rem',
                                height: '28px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.2)'
                              }}
                              title="Return to Stock"
                            >
                              <Undo2 size={12} />
                              Return
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="btn"
                            style={{ 
                              padding: '4px 8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '0.8rem', 
                              height: '28px',
                              background: 'rgba(255, 51, 102, 0.1)', 
                              color: '#ff3366',
                              border: '1px solid rgba(255, 51, 102, 0.2)'
                            }}
                            title="Delete Asset"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── Register Asset Modal ─── */}
      {isCreateOpen && (
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
            maxWidth: '500px',
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
                Register New Enterprise Asset
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitCreate(onCreateSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
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

              <div>
                <label>Asset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. MacBook Pro M3 (Dev-042)"
                  {...registerCreate('asset_name', { required: 'Asset Name is required' })}
                />
                {errorsCreate.asset_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errorsCreate.asset_name.message}</p>}
              </div>

              <div>
                <label>Catalog Item Model *</label>
                <select {...registerCreate('item_id', { required: 'Catalog item reference is required' })}>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.sku} — {item.name}</option>
                  ))}
                  {items.length === 0 && <option value="">No items registered in catalog</option>}
                </select>
                {errorsCreate.item_id && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errorsCreate.item_id.message}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Purchase Date *</label>
                  <input
                    type="datetime-local"
                    {...registerCreate('purchase_date', { required: 'Purchase Date is required' })}
                  />
                  {errorsCreate.purchase_date && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errorsCreate.purchase_date.message}</p>}
                </div>
                <div>
                  <label>Purchase Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1200.00"
                    {...registerCreate('gross_purchase_amount', { required: 'Purchase cost is required', min: 0 })}
                  />
                  {errorsCreate.gross_purchase_amount && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errorsCreate.gross_purchase_amount.message}</p>}
                </div>
              </div>

              <div>
                <label>Storage / Warehouse Location</label>
                <select {...registerCreate('location_id')}>
                  <option value="">No specific warehouse (Virtual / On the fly)</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
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
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '38px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ffb703, #f59e0b)',
                    color: '#0b0f19',
                    fontWeight: 700,
                    height: '38px',
                    boxShadow: '0 4px 12px rgba(255,183,3,0.2)',
                  }}
                >
                  {submitting ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Allocate Asset Modal ─── */}
      {isAllocateOpen && targetAsset && (
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
            maxWidth: '500px',
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
                Allocate Asset custody
              </h3>
              <button
                onClick={() => setIsAllocateOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitAllocate(onAllocateSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                Allocating asset <strong style={{ color: 'var(--text-main)' }}>{targetAsset.asset_name}</strong> ({targetAsset.item_name})
              </div>

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

              <div>
                <label>Allocate to User *</label>
                <select {...registerAllocate('allocated_to_user_id', { required: 'Custody holder is required' })}>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email} ({u.first_name || ''} {u.last_name || ''})</option>
                  ))}
                  {users.length === 0 && <option value="">No users found in directory</option>}
                </select>
                {errorsAllocate.allocated_to_user_id && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errorsAllocate.allocated_to_user_id.message}</p>}
              </div>

              <div>
                <label>Allocation Location / Warehouse Context</label>
                <select {...registerAllocate('location_id')}>
                  <option value="">Keep current location</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
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
                  onClick={() => setIsAllocateOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '38px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || users.length === 0}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ffb703, #f59e0b)',
                    color: '#0b0f19',
                    fontWeight: 700,
                    height: '38px',
                    boxShadow: '0 4px 12px rgba(255,183,3,0.2)',
                  }}
                >
                  {submitting ? 'Allocating...' : 'Confirm Allocation'}
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
      `}</style>
    </div>
  );
}
