import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

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
  }, [offset, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchItems();
  };

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
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
            onClick={() => navigate('/workspace/items/item/new')}
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
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 183, 3, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#ffb703" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Unique SKUs</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>{total}</div>
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
              <CheckCircle2 size={20} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Active Items</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>{items.filter(i => i.is_active).length}</div>
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
              <Layers size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Item Groups</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>{new Set(items.map(i => i.item_group)).size}</div>
            </div>
          </div>
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
    </div>
  );
}
