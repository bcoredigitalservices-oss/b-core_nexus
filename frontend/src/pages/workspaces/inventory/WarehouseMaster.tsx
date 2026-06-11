import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Warehouse as WarehouseIcon,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Layers,
  Package,
  FileText
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
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

interface Warehouse {
  id: string;
  name: string;
  location_address: string;
  is_active: boolean;
  custom_attributes: Record<string, any>;
}

interface WarehouseFormValues {
  name: string;
  location_address: string;
}

export default function WarehouseMaster() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WarehouseFormValues>({
    defaultValues: {
      name: '',
      location_address: '',
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  const fetchWarehouses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/warehouses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view this workspace.');
        }
        throw new Error('Failed to load warehouses.');
      }

      const data = await response.json();
      setWarehouses(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenModal = () => {
    reset({
      name: '',
      location_address: '',
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: WarehouseFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to register warehouse.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Warehouse registered successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchWarehouses();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while registering the warehouse.');
    } finally {
      setSubmitting(false);
    }
  };

  // Local Search Filtering
  const filteredWarehouses = warehouses.filter(wh => 
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.location_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <WorkspaceLayout config={INVENTORY_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Warehouse Master Registry
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Register and oversee physical storage locations, distribution points, and cold chain depots.
            </p>
          </div>
          <button
            id="btn-register-warehouse"
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
            Register Warehouse
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
              placeholder="Search warehouses by name, address, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '40px' }}
            />
          </div>
          <button
            onClick={fetchWarehouses}
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
                  <th style={{ padding: '1rem' }}>Warehouse ID</th>
                  <th style={{ padding: '1rem' }}>Warehouse Name</th>
                  <th style={{ padding: '1rem' }}>Physical Address</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading warehouses...
                    </td>
                  </tr>
                ) : filteredWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No warehouses match the query.
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map((wh) => (
                    <tr key={wh.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {wh.id}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <WarehouseIcon size={14} color="#ffb703" />
                          {wh.name}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={12} color='var(--text-muted)' />
                          {wh.location_address}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: wh.is_active ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255,51,102,0.12)',
                          color: wh.is_active ? '#00f5a0' : '#ff3366',
                          border: `1px solid ${wh.is_active ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255,51,102,0.2)'}`
                        }}>
                          {wh.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Register Warehouse Modal ─── */}
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
                Register New Warehouse Location
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

              <div>
                <label>Warehouse Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dallas Cold Storage Terminal"
                  {...register('name', { required: 'Warehouse Name is required' })}
                />
                {errors.name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.name.message}</p>}
              </div>

              <div>
                <label>Physical Address / GPS Coordinates *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. 1044 Industrial Pkwy, Dallas, TX 75201"
                    style={{ paddingLeft: '2.2rem' }}
                    {...register('location_address', { required: 'Physical address is required' })}
                  />
                </div>
                {errors.location_address && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.location_address.message}</p>}
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
                  {submitting ? 'Registering...' : 'Register Warehouse'}
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
    </WorkspaceLayout>
  );
}
