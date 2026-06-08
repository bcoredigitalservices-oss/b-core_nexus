import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import {
  Users,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  TrendingUp,
  History,
  FileText,
  ShoppingBag,
  Trash2,
  Calendar,
  DollarSign,
  Tag
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
    { label: 'Interaction History', subPath: 'interactions', icon: <History size={15} /> },
  ],
};

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  base_price: number;
}

interface SalesOrderLine {
  id: string;
  sales_order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface SalesOrder {
  id: string;
  customer_id: string;
  order_reference: string;
  order_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  grand_total: number;
  lines: SalesOrderLine[];
}

interface SalesOrderFormValues {
  customer_id: string;
  order_reference: string;
  order_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  lines: {
    item_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

export default function SalesOrders() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Lookup Options
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Lookup Maps
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [itemMap, setItemMap] = useState<Record<string, { sku: string; name: string }>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<SalesOrderFormValues>({
    defaultValues: {
      customer_id: '',
      order_reference: '',
      order_date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      lines: [{ item_id: '', quantity: 1, unit_price: 0, line_total: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const watchLines = useWatch({
    control,
    name: 'lines'
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;
  const INV_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      // Fetch customers
      const custRes = await fetch(`${API_BASE}/customers?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (custRes.ok) {
        const data = await custRes.json();
        const custs = data.customers || [];
        setCustomers(custs);
        const map: Record<string, string> = {};
        custs.forEach((c: any) => {
          map[c.id] = c.company_name;
        });
        setCustomerMap(map);
      }

      // Fetch Inventory Items
      const itemRes = await fetch(`${INV_BASE}/items?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (itemRes.ok) {
        const data = await itemRes.json();
        const itemsList = data.items || [];
        setItems(itemsList);
        const map: Record<string, { sku: string; name: string }> = {};
        itemsList.forEach((it: any) => {
          map[it.id] = { sku: it.sku, name: it.name };
        });
        setItemMap(map);
      }
    } catch (err) {
      console.warn('Failed to load customers or items options.', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/sales-orders?page=${page}&page_size=${pageSize}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to access the CRM Workspace.');
        }
        throw new Error('Failed to retrieve Sales Order records.');
      }

      const data = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching sales orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  useEffect(() => {
    const handleMutation = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.workspace === 'crm' && customEvent.detail?.entity === 'sales_order') {
        console.log('[WS Trigger] State mutation received. Reloading sales orders...');
        fetchOrders();
      }
    };
    window.addEventListener('STATE_MUTATION', handleMutation);
    return () => window.removeEventListener('STATE_MUTATION', handleMutation);
  }, []);

  const handleOpenModal = () => {
    reset({
      customer_id: '',
      order_reference: `SO-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      order_date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      lines: [{ item_id: '', quantity: 1, unit_price: 0, line_total: 0 }]
    });
    setFormError('');
    setFormSuccess('');
    setCustomerSearch('');
    setIsModalOpen(true);
  };

  // Watch lines to calculate totals
  const watchLinesComputed = (watchLines || []).map((line: any) => {
    const qty = Number(line?.quantity) || 0;
    const price = Number(line?.unit_price) || 0;
    return {
      ...line,
      line_total: Number((qty * price).toFixed(4))
    };
  });

  const grandTotal = watchLinesComputed.reduce((sum, line) => sum + line.line_total, 0);

  const handleItemSelect = (index: number, itemId: string) => {
    const matchedItem = items.find(it => it.id === itemId);
    if (matchedItem) {
      setValue(`lines.${index}.unit_price`, matchedItem.base_price);
    }
  };

  const onSubmit = async (values: SalesOrderFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    // Pre-calculate line totals & grand total to ensure float accuracy matches Pydantic
    const payloadLines = values.lines.map(line => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unit_price) || 0;
      return {
        item_id: line.item_id,
        quantity: qty,
        unit_price: price,
        line_total: Number((qty * price).toFixed(4)),
        custom_attributes: {}
      };
    });

    const payloadGrandTotal = payloadLines.reduce((sum, line) => sum + line.line_total, 0);

    const payload = {
      customer_id: values.customer_id,
      order_reference: values.order_reference,
      order_date: values.order_date,
      status: values.status,
      grand_total: Number(payloadGrandTotal.toFixed(4)),
      lines: payloadLines,
      custom_attributes: {}
    };

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/sales-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to create sales order.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Sales Order created successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchOrders();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered customer list for search dropdown
  const filteredCustomers = customers.filter(cust =>
    cust.company_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    cust.contact_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Sales Orders
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Create, confirm, and monitor commercial customer purchase orders and cross-workspace inventory bookings.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="btn btn-secondary"
              style={{ height: '38px', padding: '0 0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button
              id="btn-create-order"
              onClick={handleOpenModal}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #00f5a0, #00d980)',
                color: '#0a0f1d',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,245,160,0.2)',
              }}
            >
              <Plus size={16} />
              Create Sales Order
            </button>
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

        {/* Data Grid Table */}
        <div style={{
          background: 'rgba(20,30,50,0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  background: 'rgba(12,18,36,0.6)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '1rem' }}>Order Reference</th>
                  <th style={{ padding: '1rem' }}>Customer Name</th>
                  <th style={{ padding: '1rem' }}>Order Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Grand Total</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading Sales Orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No sales orders found. Click "Create Sales Order" to register new records.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    let pillColor = '#94a3b8';
                    let pillBg = 'rgba(148, 163, 184, 0.12)';
                    if (ord.status === 'CONFIRMED') {
                      pillColor = '#3b82f6';
                      pillBg = 'rgba(59, 130, 246, 0.12)';
                    } else if (ord.status === 'FULFILLED') {
                      pillColor = '#10b981';
                      pillBg = 'rgba(16, 185, 129, 0.12)';
                    } else if (ord.status === 'CANCELLED') {
                      pillColor = '#ef4444';
                      pillBg = 'rgba(239, 68, 68, 0.12)';
                    }

                    return (
                      <tr key={ord.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} color="#00f5a0" />
                            {ord.order_reference}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: '#e2e8f0' }}>
                          {customerMap[ord.customer_id] || ord.customer_id}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          {ord.order_date}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                          ${Number(ord.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: pillBg,
                            color: pillColor,
                            border: `1px solid ${pillColor}22`
                          }}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {total > pageSize && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(12,18,36,0.4)'
            }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(total / pageSize)} ({total} records)
              </span>
              <button
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Sales Order Creation Modal ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #141b2e 0%, #0c1224 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(0,245,160,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="#00f5a0" />
                Create New Sales Order
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form scrollable container */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10b981',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <CheckCircle2 size={14} />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* ─── Top Section: Header ─── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {/* Customer Select dropdown */}
                  <div>
                    <label>Customer *</label>
                    <select
                      {...register('customer_id', { required: 'Customer is required' })}
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.company_name} ({c.contact_name})
                        </option>
                      ))}
                    </select>
                    {errors.customer_id && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.customer_id.message}</p>}
                  </div>

                  {/* Order Reference */}
                  <div>
                    <label>Order Reference *</label>
                    <div style={{ position: 'relative' }}>
                      <Tag size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="SO-YYYY-XXX"
                        style={{ paddingLeft: '2.2rem' }}
                        {...register('order_reference', { required: 'Order reference is required' })}
                      />
                    </div>
                    {errors.order_reference && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.order_reference.message}</p>}
                  </div>

                  {/* Order Date */}
                  <div>
                    <label>Order Date *</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="date"
                        style={{ paddingLeft: '2.2rem' }}
                        {...register('order_date', { required: 'Order date is required' })}
                      />
                    </div>
                    {errors.order_date && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.order_date.message}</p>}
                  </div>

                  {/* Status */}
                  <div>
                    <label>Order Status *</label>
                    <select {...register('status')}>
                      <option value="DRAFT">DRAFT</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="FULFILLED">FULFILLED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                {/* ─── Middle Section: Line Items ─── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                      Order Line Items
                    </h4>
                    <button
                      type="button"
                      onClick={() => append({ item_id: '', quantity: 1, unit_price: 0, line_total: 0 })}
                      className="btn btn-secondary"
                      style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={12} />
                      Add Row
                    </button>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem', width: '45%' }}>Inventory Item *</th>
                          <th style={{ padding: '0.75rem', width: '15%', textAlign: 'right' }}>Qty *</th>
                          <th style={{ padding: '0.75rem', width: '20%', textAlign: 'right' }}>Unit Price (USD) *</th>
                          <th style={{ padding: '0.75rem', width: '15%', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '0.75rem', width: '5%', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => {
                          const qty = Number(watchLinesComputed[index]?.quantity) || 0;
                          const price = Number(watchLinesComputed[index]?.unit_price) || 0;
                          const total = qty * price;

                          return (
                            <tr key={field.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              {/* Item select */}
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <select
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                  {...register(`lines.${index}.item_id` as const, { required: true })}
                                  onChange={(e) => handleItemSelect(index, e.target.value)}
                                >
                                  <option value="">-- Select Catalog Item --</option>
                                  {items.map(it => (
                                    <option key={it.id} value={it.id}>
                                      {it.name} [{it.sku}]
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Qty */}
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <input
                                  type="number"
                                  step="any"
                                  min="0.0001"
                                  style={{ height: '36px', textAlign: 'right', padding: '0 0.5rem', fontSize: '0.8rem' }}
                                  {...register(`lines.${index}.quantity` as const, {
                                    required: true,
                                    valueAsNumber: true,
                                    validate: v => v > 0
                                  })}
                                />
                              </td>

                              {/* Price */}
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  style={{ height: '36px', textAlign: 'right', padding: '0 0.5rem', fontSize: '0.8rem' }}
                                  {...register(`lines.${index}.unit_price` as const, {
                                    required: true,
                                    valueAsNumber: true,
                                    validate: v => v >= 0
                                  })}
                                />
                              </td>

                              {/* Calculated line total */}
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Delete button */}
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  disabled={fields.length === 1}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: fields.length === 1 ? 'var(--text-muted)' : '#ff3366',
                                    cursor: fields.length === 1 ? 'not-allowed' : 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    opacity: fields.length === 1 ? 0.4 : 1
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ─── Bottom Section: Grand Total & Buttons ─── */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginTop: '0.5rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      Aggregate Grand Total
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00f5a0', fontFamily: 'var(--font-display)', marginTop: '0.2rem' }}>
                      ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ height: '40px', padding: '0 1.25rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #00f5a0, #00d980)',
                        color: '#0a0f1d',
                        fontWeight: 700,
                        height: '40px',
                        padding: '0 1.5rem',
                        boxShadow: '0 4px 12px rgba(0,245,160,0.2)',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Create Order'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
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
