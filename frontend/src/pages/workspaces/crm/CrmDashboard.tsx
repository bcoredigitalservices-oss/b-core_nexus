import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  TrendingUp,
  History,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  PhoneCall,
  UserPlus,
  FileText,
  ShoppingBag,
  DollarSign,
  FileCheck
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const CRM_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'crm',
  workspaceName: 'CRM',
  accentColor: '#00f5a0',
  icon: <Users size={18} />,
  navItems: [
    { label: 'Dashboard',           subPath: '',             icon: <Layers size={15} /> },
    { label: 'Pipeline & Leads',    subPath: 'pipeline',     icon: <TrendingUp size={15} /> },
    { label: 'Customer Accounts',   subPath: 'accounts',     icon: <Users size={15} /> },
    { label: 'Sales Orders',        subPath: 'sales-orders', icon: <ShoppingBag size={15} /> },
    { label: 'Quotations',          subPath: 'quotations',   icon: <FileText size={15} /> },
    { label: 'Contacts',            subPath: 'contacts',     icon: <PhoneCall size={15} /> },
    { label: 'Tasks & ToDo',        subPath: 'tasks',        icon: <FileCheck size={15} /> },
    { label: 'Interaction History', subPath: 'interactions', icon: <History size={15} /> },
  ],
};

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  lifecycle_status: 'LEAD' | 'OPPORTUNITY' | 'ACTIVE_CUSTOMER' | 'INACTIVE';
  created_at: string;
  custom_attributes: Record<string, any>;
}

interface SalesOrder {
  id: string;
  customer_id: string;
  order_reference: string;
  order_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  grand_total: number;
}

export default function CrmDashboard() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;

  const fetchCustomers = async () => {
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/customers?limit=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to access the CRM workspace.');
        }
        throw new Error('Failed to retrieve customer records.');
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching CRM dashboard data.');
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm/sales-orders?page_size=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch sales orders', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCustomers(), fetchSalesOrders()]);
      setLoading(false);
    };
    initData();
  }, []);

  // Compute Metrics
  const openOrdersCount = salesOrders.filter(so => so.status === 'DRAFT' || so.status === 'CONFIRMED').length;
  
  const now = new Date();
  const currentMonthOrders = salesOrders.filter(so => {
    if (so.status !== 'CONFIRMED' && so.status !== 'FULFILLED') return false;
    const orderDate = new Date(so.order_date);
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });
  const totalBookedRevenue = currentMonthOrders.reduce((sum, so) => sum + Number(so.grand_total), 0);

  const pendingFulfillmentsCount = salesOrders.filter(so => so.status === 'CONFIRMED').length;

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Commercial CRM Command Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Real-time sales lifecycle reporting, contact management, and pipeline analytics.
            </p>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              await Promise.all([fetchCustomers(), fetchSalesOrders()]);
              setLoading(false);
            }}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '38px', padding: '0 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            Sync Metrics
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

        {/* Metric Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Card 1: Open Sales Orders */}
          <div style={{
            background: 'rgba(20,30,50,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Open Sales Orders
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {loading ? '...' : openOrdersCount}
                </h3>
              </div>
              <div style={{
                background: 'rgba(0, 245, 160, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#00f5a0',
                border: '1px solid rgba(0, 245, 160, 0.15)'
              }}>
                <ShoppingBag size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#00f5a0' }}>
              <TrendingUp size={12} />
              <span>Draft & Confirmed status</span>
            </div>
          </div>

          {/* Card 2: Total Booked Revenue (MTD) */}
          <div style={{
            background: 'rgba(20,30,50,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Booked Revenue (MTD)
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {loading ? '...' : `$${totalBookedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </h3>
              </div>
              <div style={{
                background: 'rgba(147, 51, 234, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#a855f7',
                border: '1px solid rgba(147, 51, 234, 0.15)'
              }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#a855f7' }}>
              <CheckCircle2 size={12} />
              <span>Confirmed & Fulfilled this month</span>
            </div>
          </div>

          {/* Card 3: Pending Fulfillments */}
          <div style={{
            background: 'rgba(20,30,50,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pending Fulfillments
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {loading ? '...' : pendingFulfillmentsCount}
                </h3>
              </div>
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.15)'
              }}>
                <FileCheck size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#fbbf24' }}>
              <History size={12} />
              <span>Confirmed orders awaiting dispatch</span>
            </div>
          </div>
        </div>

        {/* Recent Accounts Roster */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'rgba(20,30,50,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Recent Account Roster
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
              Latest customer files added to the sales lifecycle database.
            </p>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  background: 'rgba(12,18,36,0.6)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '0.85rem' }}>Company</th>
                  <th style={{ padding: '0.85rem' }}>Contact Name</th>
                  <th style={{ padding: '0.85rem' }}>Email Address</th>
                  <th style={{ padding: '0.85rem' }}>Phone</th>
                  <th style={{ padding: '0.85rem', textAlign: 'center' }}>Lifecycle Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Syncing account registry...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No customers registered. Use the Commercial API or Accounts view to seed data.
                    </td>
                  </tr>
                ) : (
                  customers.slice(0, 10).map((c) => {
                    let statusColor = '#00f5a0';
                    let statusBg = 'rgba(0, 245, 160, 0.1)';
                    if (c.lifecycle_status === 'OPPORTUNITY') {
                      statusColor = '#3b82f6';
                      statusBg = 'rgba(59, 130, 246, 0.1)';
                    } else if (c.lifecycle_status === 'ACTIVE_CUSTOMER') {
                      statusColor = '#a855f7';
                      statusBg = 'rgba(168, 85, 247, 0.1)';
                    } else if (c.lifecycle_status === 'INACTIVE') {
                      statusColor = '#ff3366';
                      statusBg = 'rgba(255, 51, 102, 0.1)';
                    }

                    return (
                      <tr key={c.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                          {c.company_name}
                        </td>
                        <td style={{ padding: '0.85rem', color: '#cbd5e1' }}>
                          {c.contact_name}
                        </td>
                        <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>
                          {c.email}
                        </td>
                        <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>
                          {c.phone || '—'}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}33`
                          }}>
                            {c.lifecycle_status.replace('_', ' ')}
                          </span>
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
