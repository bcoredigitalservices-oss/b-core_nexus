import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import {
  Users, Plus, RefreshCw, X, AlertCircle, CheckCircle2, Layers, TrendingUp, History,
  FileText, ShoppingBag, Trash2, Calendar, DollarSign, Tag, Search, CheckSquare, Printer, MessageCircle, Download
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  custom_attributes?: any;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  base_price: number;
}

interface QuotationTax {
  type: 'Actual' | 'Percent';
  account_head: string;
  rate: number;
  amount: number;
}

interface QuotationLog {
  timestamp: string;
  user: string;
  action: string;
  comment: string;
}

interface QuotationLine {
  item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  custom_attributes: {
    delivery_date?: string;
  };
}

interface QuotationFormValues {
  customer_id: string;
  quotation_reference: string;
  quotation_date: string;
  expiry_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  grand_total: number;
  custom_attributes: {
    series?: string;
    quotation_type?: string;
    is_subcontracted?: boolean;
    delivery_date?: string;
    title?: string;
    tax_category?: string;
    shipping_rule?: string;
    incoterm?: string;
    rounding_adjustment?: number;
    rounded_total?: number;
    advance_paid?: number;
    taxes?: QuotationTax[];
    logs?: QuotationLog[];
    billing_address?: string;
    shipping_address?: string;
    company_address?: string;
    company_contact_person?: string;
    terms?: string;
  };
  lines: QuotationLine[];
}

export default function Quotations() {
  const { authFetch, user } = useAppContext();
  const navigate = useNavigate();

  // Data State
  const [quotations, setQuotations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Lookups
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, any>>({});
  const [itemMap, setItemMap] = useState<Record<string, { sku: string; name: string }>>({});

  // Form & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'ADDRESS' | 'TERMS' | 'ITEMS' | 'TAXES' | 'LOGS'>('DETAILS');

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<QuotationFormValues>({
    defaultValues: {
      customer_id: '',
      quotation_reference: '',
      quotation_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'DRAFT',
      grand_total: 0,
      custom_attributes: {
        series: 'SAL-ORD-YYYY-',
        quotation_type: 'Sales',
        is_subcontracted: false,
        delivery_date: '',
        title: '',
        tax_category: '',
        shipping_rule: '',
        incoterm: '',
        rounding_adjustment: 0,
        rounded_total: 0,
        advance_paid: 0,
        taxes: [],
        logs: [],
        billing_address: '',
        shipping_address: '',
        company_address: '',
        company_contact_person: '',
        terms: ''
      },
      lines: []
    }
  });

  const { fields: lineFields, append: appendLine, remove: removeLine } = useFieldArray({
    control,
    name: 'lines'
  });

  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({
    control,
    name: 'custom_attributes.taxes'
  });

  const { fields: logFields, append: appendLog } = useFieldArray({
    control,
    name: 'custom_attributes.logs'
  });

  const watchLines = useWatch({ control, name: 'lines' }) || [];
  const watchTaxes = useWatch({ control, name: 'custom_attributes.taxes' }) || [];
  const watchRounding = useWatch({ control, name: 'custom_attributes.rounding_adjustment' }) || 0;
  const watchCustomerId = useWatch({ control, name: 'customer_id' });

  // Auto-fill Customer Details
  useEffect(() => {
    if (watchCustomerId && customerMap[watchCustomerId]) {
      const cust = customerMap[watchCustomerId];
      const attrs = cust.custom_attributes || {};
      setValue('custom_attributes.billing_address', attrs.billing_address || '');
      setValue('custom_attributes.shipping_address', attrs.shipping_address || '');
      setValue('custom_attributes.company_address', attrs.company_address || '');
      setValue('custom_attributes.company_contact_person', cust.contact_name || '');
    }
  }, [watchCustomerId, customerMap, setValue]);

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;
  const INV_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      const custRes = await fetch(`${API_BASE}/customers?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data.customers || []);
        const map: Record<string, any> = {};
        (data.customers || []).forEach((c: any) => map[c.id] = c);
        setCustomerMap(map);
      }
      const itemRes = await fetch(`${INV_BASE}/items?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItems(data.items || []);
        const map: Record<string, { sku: string; name: string }> = {};
        (data.items || []).forEach((it: any) => map[it.id] = { sku: it.sku, name: it.name });
        setItemMap(map);
      }
    } catch (err) {}
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/quotations?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setQuotations(data.items || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [page]);

  // Computed Totals
  const watchLinesComputed = watchLines.map((line: any) => {
    const qty = Number(line?.quantity) || 0;
    const price = Number(line?.unit_price) || 0;
    return { ...line, line_total: Number((qty * price).toFixed(4)) };
  });

  const linesTotal = watchLinesComputed.reduce((sum, line) => sum + line.line_total, 0);

  const watchTaxesComputed = watchTaxes.map((tax: any) => {
    const rate = Number(tax?.rate) || 0;
    const amount = tax.type === 'Percent' ? linesTotal * (rate / 100) : rate;
    return { ...tax, amount: Number(amount.toFixed(4)) };
  });

  const taxesTotal = watchTaxesComputed.reduce((sum, tax) => sum + tax.amount, 0);
  const grandTotal = linesTotal + taxesTotal;
  const roundedTotal = grandTotal + Number(watchRounding);

  const handleOpenCreate = () => {
    setEditingQuotationId(null);
    reset({
      customer_id: '',
      quotation_reference: `SO-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      quotation_date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      grand_total: 0,
      custom_attributes: {
        series: 'SAL-ORD-YYYY-',
        quotation_type: 'Sales',
        is_subcontracted: false,
        delivery_date: '',
        title: '',
        tax_category: '',
        shipping_rule: '',
        incoterm: '',
        rounding_adjustment: 0,
        rounded_total: 0,
        advance_paid: 0,
        taxes: [],
        logs: []
      },
      lines: [{ item_id: '', quantity: 1, unit_price: 0, line_total: 0, custom_attributes: {} }]
    });
    setFormError('');
    setFormSuccess('');
    setActiveTab('DETAILS');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (quotationId: string) => {
    setFormError('');
    setFormSuccess('');
    setActiveTab('DETAILS');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/quotations/${quotationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load quotation');
      const quotation = await response.json();

      reset({
        customer_id: quotation.customer_id,
        quotation_reference: quotation.quotation_reference,
        quotation_date: quotation.quotation_date,
        status: quotation.status,
        grand_total: quotation.grand_total,
        custom_attributes: {
          series: quotation.custom_attributes?.series || 'SAL-ORD-YYYY-',
          quotation_type: quotation.custom_attributes?.quotation_type || 'Sales',
          is_subcontracted: quotation.custom_attributes?.is_subcontracted || false,
          delivery_date: quotation.custom_attributes?.delivery_date || '',
          title: quotation.custom_attributes?.title || '',
          tax_category: quotation.custom_attributes?.tax_category || '',
          shipping_rule: quotation.custom_attributes?.shipping_rule || '',
          incoterm: quotation.custom_attributes?.incoterm || '',
          rounding_adjustment: quotation.custom_attributes?.rounding_adjustment || 0,
          rounded_total: quotation.custom_attributes?.rounded_total || 0,
          advance_paid: quotation.custom_attributes?.advance_paid || 0,
          taxes: quotation.custom_attributes?.taxes || [],
          logs: quotation.custom_attributes?.logs || []
        },
        lines: quotation.lines.map((l: any) => ({
          item_id: l.item_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          line_total: l.line_total,
          custom_attributes: l.custom_attributes || {}
        }))
      });
      setEditingQuotationId(quotationId);
      setIsModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!editingQuotationId) return;
    const ord = quotations.find(o => o.id === editingQuotationId);
    if (!ord) return;
    const text = `*Quotation*: ${ord.quotation_reference}%0A*Customer*: ${customerMap[ord.customer_id]}%0A*Total*: $${Number(ord.grand_total).toLocaleString()}%0A*Status*: ${ord.status}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleExportCSV = () => {
    if (!editingQuotationId) return;
    const ord = quotations.find(o => o.id === editingQuotationId);
    if (!ord) return;
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Quotation Reference,Customer,Quotation Date,Status,Grand Total\n"
        + `${ord.quotation_reference},${customerMap[ord.customer_id]},${ord.quotation_date},${ord.status},${ord.grand_total}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_quotation_${ord.quotation_reference}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = async (values: QuotationFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    // Prepare payload
    const payloadLines = values.lines.map((line, idx) => ({
      item_id: line.item_id,
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      line_total: watchLinesComputed[idx].line_total,
      custom_attributes: line.custom_attributes
    }));

    const payloadTaxes = (values.custom_attributes.taxes || []).map((tax, idx) => ({
      ...tax,
      amount: watchTaxesComputed[idx].amount
    }));

    const payload = {
      customer_id: values.customer_id,
      quotation_reference: values.quotation_reference,
      quotation_date: values.quotation_date,
      status: values.status,
      grand_total: Number(grandTotal.toFixed(4)),
      lines: payloadLines,
      custom_attributes: {
        ...values.custom_attributes,
        taxes: payloadTaxes,
        rounded_total: Number(roundedTotal.toFixed(4)),
        rounding_adjustment: Number(watchRounding)
      }
    };

    try {
      const token = localStorage.getItem('bcore_token');
      const url = editingQuotationId ? `${API_BASE}/quotations/${editingQuotationId}` : `${API_BASE}/quotations`;
      const method = editingQuotationId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to save sales quotation.');
      }

      setFormSuccess('Quotation saved successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchQuotations();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLog = (e: any) => {
    e.preventDefault();
    const comment = prompt('Enter review comment:');
    if (comment) {
      appendLog({
        timestamp: new Date().toISOString(),
        user: user?.full_name || 'Current User',
        action: 'Reviewed',
        comment
      });
    }
  };

  // KPIs
  const pipelineTotal = quotations.filter(o => o.status === 'DRAFT' || o.status === 'CONFIRMED').reduce((s, o) => s + Number(o.grand_total), 0);
  const fulfilledTotal = quotations.filter(o => o.status === 'FULFILLED').reduce((s, o) => s + Number(o.grand_total), 0);

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          {/* Header Block */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(59, 130, 246, 0.03) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '14px',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '0.75rem' }}>
                <ShoppingBag size={28} color="#00f2fe" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Quotation Registry
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.3rem 0 0 0' }}>
                  ERP Advanced view for Quotations.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Pipeline</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f2fe' }}>${pipelineTotal.toLocaleString()}</span>
              </div>
              <div style={{ width: '1px', height: '35px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fulfilled</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>${fulfilledTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={fetchQuotations} className="btn btn-secondary"><RefreshCw size={14} /></button>
              <button onClick={handleOpenCreate} className="btn btn-primary"><Plus size={16} /> Create Quotation</button>
            </div>
          </div>

          {/* List View */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Quotation Reference</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((ord) => (
                  <tr key={ord.id} onClick={() => handleOpenEdit(ord.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{ord.quotation_reference}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{customerMap[ord.customer_id] || ord.customer_id}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{ord.quotation_date}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#00f5a0' }}>${Number(ord.grand_total).toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{ord.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Advanced Quotation Modal ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)', borderRadius: '16px',
            width: '95vw', maxWidth: '1200px', height: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {editingQuotationId ? 'Edit Quotation' : 'Create Quotation'}
                </h3>
                {editingQuotationId && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={14} color="var(--text-muted)" /> Export
                    </button>
                    <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Printer size={14} color="var(--text-muted)" /> Print
                    </button>
                    <button onClick={handleWhatsAppShare} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageCircle size={14} color="#25D366" /> Share via WhatsApp
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '2rem', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              {['DETAILS', 'ADDRESS', 'TERMS', 'ITEMS', 'TAXES', 'LOGS'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  style={{
                    background: 'none', border: 'none', padding: '1rem 0',
                    color: activeTab === tab ? '#00f2fe' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '2px solid #00f2fe' : '2px solid transparent',
                    fontWeight: activeTab === tab ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              <form id="sales-quotation-form" onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {formError && <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '1rem', borderRadius: '8px' }}>{formError}</div>}
                
                {/* Details Tab */}
                {activeTab === 'DETAILS' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ color: '#00f2fe' }}>Primary Info</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Series</label>
                        <select {...register('custom_attributes.series')} style={{ height: '36px' }}>
                          <option value="SAL-ORD-YYYY-">SAL-ORD-YYYY-</option>
                          <option value="MAINT-YYYY-">MAINT-YYYY-</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Customer *</label>
                        <select {...register('customer_id', { required: true })} style={{ height: '36px' }}>
                          <option value="">-- Choose --</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Date *</label>
                        <input type="date" {...register('quotation_date', { required: true })} style={{ height: '36px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Valid Till *</label>
                        <input type="date" {...register('expiry_date', { required: true })} style={{ height: '36px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ color: '#00f2fe' }}>Additional Info</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Quotation Type</label>
                        <select {...register('custom_attributes.quotation_type')} style={{ height: '36px' }}>
                          <option value="Sales">Sales</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Quotation Reference *</label>
                        <input type="text" {...register('quotation_reference', { required: true })} style={{ height: '36px' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <input type="checkbox" {...register('custom_attributes.is_subcontracted')} style={{ width: '18px', height: '18px' }} />
                        <label style={{ margin: 0 }}>Is Subcontracted</label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.8rem' }}>
                        <label>Title</label>
                        <input type="text" {...register('custom_attributes.title')} placeholder="Optional title..." style={{ height: '36px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Status *</label>
                        <select {...register('status')} style={{ height: '36px' }}>
                          <option value="DRAFT">DRAFT</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="FULFILLED">FULFILLED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address & Contact Tab */}
                {activeTab === 'ADDRESS' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ color: '#00f2fe' }}>Customer Addresses</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Billing Address</label>
                        <textarea {...register('custom_attributes.billing_address')} rows={3} placeholder="Billing Address..." style={{ resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Shipping Address</label>
                        <textarea {...register('custom_attributes.shipping_address')} rows={3} placeholder="Shipping Address..." style={{ resize: 'vertical' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ color: '#00f2fe' }}>Company Address</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Company Address</label>
                        <textarea {...register('custom_attributes.company_address')} rows={4} placeholder="Company Address..." style={{ resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label>Company Contact Person</label>
                        <input {...register('custom_attributes.company_contact_person')} type="text" placeholder="Contact Person..." style={{ height: '36px' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms Tab */}
                {activeTab === 'TERMS' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: '#00f2fe' }}>Terms and Conditions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label>Terms</label>
                      <textarea {...register('custom_attributes.terms')} rows={12} placeholder="Enter quotation terms and conditions here..." style={{ resize: 'vertical', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                )}

                {/* Items Tab */}
                {activeTab === 'ITEMS' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                      <button type="button" onClick={() => appendLine({ item_id: '', quantity: 1, unit_price: 0, line_total: 0, custom_attributes: {} })} className="btn btn-secondary">
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '1rem', textAlign: 'left' }}>Item Code</th>
                          <th style={{ padding: '1rem', textAlign: 'left' }}>Delivery Date</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Rate (NGN)</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Amount (NGN)</th>
                          <th style={{ padding: '1rem', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineFields.map((field, idx) => (
                          <tr key={field.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <select {...register(`lines.${idx}.item_id`)} onChange={(e) => {
                                const matched = items.find(it => it.id === e.target.value);
                                if (matched) setValue(`lines.${idx}.unit_price`, matched.base_price);
                              }} style={{ height: '36px' }}>
                                <option value="">-- Item --</option>
                                {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input type="date" {...register(`lines.${idx}.custom_attributes.delivery_date`)} style={{ height: '36px' }} />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input type="number" step="any" {...register(`lines.${idx}.quantity`)} style={{ textAlign: 'right', height: '36px' }} />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input type="number" step="any" {...register(`lines.${idx}.unit_price`)} style={{ textAlign: 'right', height: '36px' }} />
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                              {watchLinesComputed[idx]?.line_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button type="button" onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Taxes Tab */}
                {activeTab === 'TAXES' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}><label>Tax Category</label><input type="text" {...register('custom_attributes.tax_category')} style={{ height: '36px' }} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}><label>Shipping Rule</label><input type="text" {...register('custom_attributes.shipping_rule')} style={{ height: '36px' }} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}><label>Incoterm</label><input type="text" {...register('custom_attributes.incoterm')} style={{ height: '36px' }} /></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ color: '#00f2fe' }}>Sales Taxes and Charges</h4>
                      <button type="button" onClick={() => appendTax({ type: 'Percent', account_head: '', rate: 0, amount: 0 })} className="btn btn-secondary">
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '1rem', textAlign: 'left' }}>Account Head</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Rate</th>
                          <th style={{ padding: '1rem', textAlign: 'right' }}>Amount (NGN)</th>
                          <th style={{ padding: '1rem', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxFields.map((field, idx) => (
                          <tr key={field.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <select {...register(`custom_attributes.taxes.${idx}.type`)} style={{ height: '36px' }}>
                                <option value="Percent">Percent</option>
                                <option value="Actual">Actual</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input type="text" {...register(`custom_attributes.taxes.${idx}.account_head`)} style={{ height: '36px' }} />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input type="number" step="any" {...register(`custom_attributes.taxes.${idx}.rate`)} style={{ textAlign: 'right', height: '36px' }} />
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                              {watchTaxesComputed[idx]?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button type="button" onClick={() => removeTax(idx)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'LOGS' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h4 style={{ color: '#00f2fe' }}>Review Logs & Activity</h4>
                      <button type="button" onClick={handleAddLog} className="btn btn-secondary">
                        <CheckSquare size={14} /> Add Review Log
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {logFields.map((log, idx) => (
                        <div key={log.id} style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #00f2fe' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{log.user} ({log.action})</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{log.comment}</p>
                        </div>
                      ))}
                      {logFields.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No logs added yet.</p>}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer with Totals & Submit */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-card-hover)', borderTop: '1px solid var(--border-color)' }}>
              {/* Totals Box */}
              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Items (NGN)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{linesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Taxes (NGN)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{taxesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rounding</span>
                  <input type="number" step="any" {...register('custom_attributes.rounding_adjustment')} style={{ width: '90px', height: '32px', fontSize: '0.9rem', textAlign: 'right' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#00f5a0', textTransform: 'uppercase' }}>Grand Total (NGN)</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00f5a0' }}>{roundedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ padding: '0 1.5rem', height: '44px' }}>Cancel</button>
                <button type="submit" form="sales-quotation-form" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #00f5a0, #00d980)', color: '#000', padding: '0 1.5rem', height: '44px', fontWeight: 700 }}>
                  {submitting ? 'Saving...' : 'Save Quotation'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
