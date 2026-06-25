import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Building2, 
  ClipboardList, 
  ShoppingCart, 
  Receipt, 
  Plus, 
  RefreshCw, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Percent, 
  FileText, 
  Edit,
  PhoneCall,
  SlidersHorizontal,
  Calculator
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { BUYING_SIDEBAR } from './buyingSidebarConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  group: string;
  tax_id: string;
  is_active: boolean;
}

interface MaterialRequest {
  id: string;
  request_date: string;
  required_by?: string;
  status: 'Draft' | 'Submitted';
  items: any[];
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  order_date: string;
  total_amount: number;
  status: 'Draft' | 'Submitted';
  items: any[];
}

interface PurchaseInvoice {
  id: string;
  supplier_id: string;
  invoice_date: string;
  amount: number;
  tax_amount: number;
  status: 'Draft' | 'Submitted' | 'Paid';
}

interface Item {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Props {
  type: 'suppliers' | 'material-requests' | 'purchase-orders' | 'purchase-invoices' | 'contacts' | 'rfq' | 'settings' | 'taxes';
}

export default function ProcurementModuleWorkspace({ type }: Props) {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Core Lists
  const [records, setRecords] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Check if current type is handled locally (mock) or via database backend API
  const isMockType = !['suppliers', 'material-requests', 'purchase-orders', 'purchase-invoices'].includes(type);

  // Form Handling
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<any>({
    defaultValues: {
      name: '',
      group: 'Local',
      tax_id: '',
      is_active: true,
      request_date: new Date().toISOString().slice(0, 10),
      required_by: '',
      order_date: new Date().toISOString().slice(0, 10),
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      total_amount: 0,
      amount: 0,
      tax_amount: 0,
      supplier_id: '',
      purchase_receipt_id: '',
      items: [{ item_id: '', qty: 1, rate: 0, warehouse_id: '' }],
      // Mock fields
      email: '',
      phone: '',
      rfq_date: new Date().toISOString().slice(0, 10),
      status: 'Draft',
      items_count: 1,
      value: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Base API URLs
  const API_PROCUREMENT = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/procurement`;
  const API_INVENTORY = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;
  const token = () => localStorage.getItem('bcore_token');

  // Fetch Meta Data (Suppliers, Items, Warehouses) for dynamic select forms
  const fetchMeta = async () => {
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      
      const [suppliersRes, itemsRes, warehousesRes] = await Promise.all([
        fetch(`${API_PROCUREMENT}/suppliers`, { headers }),
        fetch(`${API_INVENTORY}/items`, { headers }),
        fetch(`${API_INVENTORY}/warehouses`, { headers })
      ]);

      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (itemsRes.ok) {
        const json = await itemsRes.json();
        setItems(Array.isArray(json) ? json : (json.items ?? []));
      }
      if (warehousesRes.ok) setWarehouses(await warehousesRes.json());
    } catch (e) {
      console.error("Meta fetch error", e);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMsg('');

    if (isMockType) {
      const localKey = `bcore_mock_${type}`;
      let data = localStorage.getItem(localKey);
      if (!data) {
        let seed: any[] = [];
        if (type === 'contacts') {
          seed = [
            { id: "contact-1", name: "Jane Smith", supplier_id: "Acme Corp", email: "jane@acme.com", phone: "+1 555-0192" },
            { id: "contact-2", name: "Tony Stark", supplier_id: "Stark Industries", email: "tony@stark.com", phone: "+1 555-0193" }
          ];
        } else if (type === 'rfq') {
          seed = [
            { id: "rfq-1", rfq_date: "2026-06-20", supplier_id: "Stark Industries", status: "Submitted", items_count: 3 },
            { id: "rfq-2", rfq_date: "2026-06-22", supplier_id: "Acme Corp", status: "Draft", items_count: 1 }
          ];
        } else if (type === 'settings') {
          seed = [
            { id: "setting-1", name: "Allow Over-receipt", value: "No", group: "Material intake" },
            { id: "setting-2", name: "Double Signature Limit", value: "$10,000", group: "PO Authorization" },
            { id: "setting-3", name: "Mandatory Tax ID", value: "Yes", group: "Supplier Registration" }
          ];
        } else if (type === 'taxes') {
          seed = [
            { id: "tax-1", name: "Standard VAT (15%)", value: "15.00%", group: "VAT Input Account" },
            { id: "tax-2", name: "Zero Rated GST", value: "0.00%", group: "Tax Exempt Account" }
          ];
        }
        localStorage.setItem(localKey, JSON.stringify(seed));
        setRecords(seed);
      } else {
        setRecords(JSON.parse(data));
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_PROCUREMENT}/${type}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${type}.`);
      }

      const data = await response.json();
      setRecords(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || `An error occurred while fetching ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  // Run on Mount or workspace change
  useEffect(() => {
    fetchMeta();
    fetchRecords();
    
    // Auto-open modal if URL query has ?new=true (e.g. from Dashboard PO button)
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      handleOpenModal();
      // clean query params without reload
      navigate(location.pathname, { replace: true });
    }
  }, [type, location.search]);

  const handleOpenModal = () => {
    setEditingRecord(null);
    reset({
      name: '',
      group: type === 'settings' ? 'PO Authorization' : type === 'taxes' ? 'VAT Input Account' : 'Local',
      tax_id: '',
      is_active: true,
      request_date: new Date().toISOString().slice(0, 10),
      required_by: '',
      order_date: new Date().toISOString().slice(0, 10),
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      total_amount: 0,
      amount: 0,
      tax_amount: 0,
      supplier_id: suppliers[0]?.id || '',
      purchase_receipt_id: '',
      items: [{ item_id: items[0]?.id || '', qty: 1, rate: 0, warehouse_id: warehouses[0]?.id || '' }],
      // Mock fields
      email: '',
      phone: '',
      rfq_date: new Date().toISOString().slice(0, 10),
      status: 'Draft',
      items_count: 1,
      value: ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: any) => {
    setEditingRecord(rec);
    reset({
      name: rec.name || '',
      group: rec.group || 'Local',
      tax_id: rec.tax_id || '',
      is_active: rec.is_active ?? true,
      request_date: rec.request_date ? rec.request_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      required_by: rec.required_by ? rec.required_by.slice(0, 10) : '',
      order_date: rec.order_date ? rec.order_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      invoice_date: rec.invoice_date ? rec.invoice_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      due_date: rec.due_date ? rec.due_date.slice(0, 10) : '',
      total_amount: rec.total_amount || 0,
      amount: rec.amount || 0,
      tax_amount: rec.tax_amount || 0,
      supplier_id: rec.supplier_id || '',
      purchase_receipt_id: rec.purchase_receipt_id || '',
      items: rec.items?.map((item: any) => ({
        item_id: item.item_id,
        qty: Number(item.qty),
        rate: Number(item.rate || 0),
        warehouse_id: item.warehouse_id || ''
      })) || [{ item_id: '', qty: 1, rate: 0, warehouse_id: '' }],
      // Mock fields
      email: rec.email || '',
      phone: rec.phone || '',
      rfq_date: rec.rfq_date || new Date().toISOString().slice(0, 10),
      status: rec.status || 'Draft',
      items_count: rec.items_count || 1,
      value: rec.value || ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleToggleSubmit = async (rec: any) => {
    if (rec.status !== 'Draft') return;
    if (isMockType) {
      const localKey = `bcore_mock_${type}`;
      let current = JSON.parse(localStorage.getItem(localKey) || '[]');
      current = current.map((r: any) => r.id === rec.id ? { ...r, status: 'Submitted' } : r);
      localStorage.setItem(localKey, JSON.stringify(current));
      fetchRecords();
      return;
    }

    const targetStatus = 'Submitted';
    try {
      const response = await fetch(`${API_PROCUREMENT}/${type}/${rec.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      if (!response.ok) {
        throw new Error("Failed to submit document.");
      }
      fetchRecords();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit document.");
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete this record? This cannot be undone.`)) {
      return;
    }

    if (isMockType) {
      const localKey = `bcore_mock_${type}`;
      let current = JSON.parse(localStorage.getItem(localKey) || '[]');
      current = current.filter((r: any) => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(current));
      fetchRecords();
      return;
    }

    try {
      const response = await fetch(`${API_PROCUREMENT}/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete record.');
      }
      fetchRecords();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete record.');
    }
  };

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    if (isMockType) {
      try {
        const localKey = `bcore_mock_${type}`;
        let current = JSON.parse(localStorage.getItem(localKey) || '[]');
        if (editingRecord) {
          current = current.map((r: any) => r.id === editingRecord.id ? { ...r, ...values } : r);
        } else {
          const newRec = {
            id: `mock-${type}-${Date.now()}`,
            ...values
          };
          current.push(newRec);
        }
        localStorage.setItem(localKey, JSON.stringify(current));
        setFormSuccess('Record updated successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchRecords();
        }, 1000);
      } catch (err: any) {
        setFormError(err.message || 'An error occurred.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Pre-process dates to ISO for backend API
    if (values.request_date) values.request_date = new Date(values.request_date).toISOString();
    if (values.required_by) values.required_by = new Date(values.required_by).toISOString();
    if (values.order_date) values.order_date = new Date(values.order_date).toISOString();
    if (values.invoice_date) values.invoice_date = new Date(values.invoice_date).toISOString();
    if (values.due_date) values.due_date = new Date(values.due_date).toISOString();

    // Map items fields to proper types
    if (values.items) {
      values.items = values.items.map((i: any) => ({
        ...i,
        qty: Number(i.qty),
        rate: Number(i.rate || 0)
      }));
    }

    try {
      const url = editingRecord
        ? `${API_PROCUREMENT}/${type}/${editingRecord.id}`
        : `${API_PROCUREMENT}/${type}`;
      const method = editingRecord ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to submit data.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Record updated successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchRecords();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering local records
  const filteredRecords = records.filter(rec => {
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    if (type === 'suppliers') {
      return rec.name?.toLowerCase().includes(term) || rec.group?.toLowerCase().includes(term);
    }
    if (type === 'contacts') {
      return rec.name?.toLowerCase().includes(term) || rec.supplier_id?.toLowerCase().includes(term) || rec.email?.toLowerCase().includes(term);
    }
    if (type === 'settings' || type === 'taxes') {
      return rec.name?.toLowerCase().includes(term) || rec.value?.toLowerCase().includes(term) || rec.group?.toLowerCase().includes(term);
    }
    return rec.id?.toLowerCase().includes(term) || (rec.status && rec.status.toLowerCase().includes(term));
  });

  // Dynamic Module configurations
  const config = {
    suppliers: {
      title: 'Suppliers Registry',
      desc: 'Register and manage company-wide supplier databases, UOM parameters, and tax attributes.',
      icon: <Building2 size={24} color="#d4af37" />,
      btnLabel: 'Add Supplier',
      tableHeaders: ['Supplier Name', 'Group / Region', 'Tax ID', 'Status'],
    },
    'material-requests': {
      title: 'Material Requests',
      desc: 'Formulate, approve, and sequence physical material requisitions for manufacturing and stock intake.',
      icon: <ClipboardList size={24} color="#d4af37" />,
      btnLabel: 'New Material Request',
      tableHeaders: ['Request Date', 'Required By', 'Status', 'Line Items'],
    },
    'purchase-orders': {
      title: 'Purchase Orders',
      desc: 'Issue buying requests, track total purchase amounts, and manage vendor document pipelines.',
      icon: <ShoppingCart size={24} color="#d4af37" />,
      btnLabel: 'New Purchase Order',
      tableHeaders: ['Order Date', 'Supplier', 'Total Amount', 'Status'],
    },
    'purchase-invoices': {
      title: 'Purchase Invoices',
      desc: 'Register incoming supplier invoices against purchase receipts and ledger payment schedules.',
      icon: <Receipt size={24} color="#d4af37" />,
      btnLabel: 'New Purchase Invoice',
      tableHeaders: ['Invoice Date', 'Supplier', 'Net Amount', 'Tax Amount', 'Status'],
    },
    contacts: {
      title: 'Vendor Contacts',
      desc: 'Manage individual supplier contacts, email registries, and phone lines.',
      icon: <PhoneCall size={24} color="#d4af37" />,
      btnLabel: 'Add Contact',
      tableHeaders: ['Name', 'Supplier', 'Email', 'Phone'],
    },
    rfq: {
      title: 'Request for Quotations (RFQ)',
      desc: 'Draft and dispatch RFQs to multiple suppliers for competitive pricing reviews.',
      icon: <FileText size={24} color="#d4af37" />,
      btnLabel: 'New RFQ',
      tableHeaders: ['RFQ Date', 'Supplier', 'Status', 'Line Items'],
    },
    settings: {
      title: 'Buying Settings',
      desc: 'Define global constraints, double-sign limits, and workflow parameters.',
      icon: <SlidersHorizontal size={24} color="#d4af37" />,
      btnLabel: 'New Setting Option',
      tableHeaders: ['Parameter', 'Value', 'Module Scope'],
    },
    taxes: {
      title: 'Buying Tax Templates',
      desc: 'Set up date-effective VAT, GST, and tariff rules for automatically mapping invoice entries.',
      icon: <Calculator size={24} color="#d4af37" />,
      btnLabel: 'New Tax Template',
      tableHeaders: ['Tax Template Name', 'Rate (%)', 'Account Link'],
    }
  }[type] || {
    title: 'Procurement Settings',
    desc: 'Configure settings and metadata variables.',
    icon: <FileText size={24} color="#d4af37" />,
    btnLabel: 'New Record',
    tableHeaders: ['Variable', 'Value', 'Status']
  };

  return (
    <WorkspaceLayout config={BUYING_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {config.icon}
              {config.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {config.desc}
            </p>
          </div>
          <button
            id={`btn-create-${type}`}
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              color: '#0b0f19',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            {config.btnLabel}
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
              placeholder={`Search ${type} records...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '40px' }}
            />
          </div>
          <button
            onClick={fetchRecords}
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

        {/* Data Grid Table */}
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
                  <th style={{ padding: '1rem' }}>Record ID</th>
                  {config.tableHeaders.map((header) => (
                    <th key={header} style={{ padding: '1rem' }}>{header}</th>
                  ))}
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2 + config.tableHeaders.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={2 + config.tableHeaders.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No records match the query.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rec.id.slice(0, 8)}…
                      </td>
                      
                      {/* Dynamic Columns Rendering based on Workspace Type */}
                      {type === 'suppliers' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{rec.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rec.group}</td>
                          <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{rec.tax_id || '—'}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: rec.is_active ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255,51,102,0.12)',
                              color: rec.is_active ? '#00f5a0' : '#ff3366',
                              border: `1px solid ${rec.is_active ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255,51,102,0.2)'}`
                            }}>{rec.is_active ? 'Active' : 'Inactive'}</span>
                          </td>
                        </>
                      )}

                      {type === 'material-requests' && (
                        <>
                          <td style={{ padding: '1rem' }}>{new Date(rec.request_date).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                            {rec.required_by ? new Date(rec.required_by).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <button
                              disabled={rec.status !== 'Draft'}
                              onClick={() => handleToggleSubmit(rec)}
                              style={{
                                border: 'none', background: 'none', padding: 0, cursor: rec.status === 'Draft' ? 'pointer' : 'default'
                              }}
                            >
                              <span style={{
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                background: rec.status === 'Submitted' ? 'rgba(0, 245, 160, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: rec.status === 'Submitted' ? '#00f5a0' : '#f59e0b',
                                border: `1px solid ${rec.status === 'Submitted' ? 'rgba(0, 245, 160, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                              }}>{rec.status} {rec.status === 'Draft' && '⚙️ Click to Submit'}</span>
                            </button>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rec.items?.length || 0} requested</td>
                        </>
                      )}

                      {type === 'purchase-orders' && (
                        <>
                          <td style={{ padding: '1rem' }}>{new Date(rec.order_date).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {suppliers.find(s => s.id === rec.supplier_id)?.name || rec.supplier_id.slice(0, 8) + '…'}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>${Number(rec.total_amount).toFixed(2)}</td>
                          <td style={{ padding: '1rem' }}>
                            <button
                              disabled={rec.status !== 'Draft'}
                              onClick={() => handleToggleSubmit(rec)}
                              style={{
                                border: 'none', background: 'none', padding: 0, cursor: rec.status === 'Draft' ? 'pointer' : 'default'
                              }}
                            >
                              <span style={{
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                background: rec.status === 'Submitted' ? 'rgba(0, 245, 160, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: rec.status === 'Submitted' ? '#00f5a0' : '#f59e0b',
                                border: `1px solid ${rec.status === 'Submitted' ? 'rgba(0, 245, 160, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                              }}>{rec.status} {rec.status === 'Draft' && '⚙️ Click to Submit'}</span>
                            </button>
                          </td>
                        </>
                      )}

                      {type === 'purchase-invoices' && (
                        <>
                          <td style={{ padding: '1rem' }}>{new Date(rec.invoice_date).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {suppliers.find(s => s.id === rec.supplier_id)?.name || rec.supplier_id.slice(0, 8) + '…'}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>${Number(rec.amount).toFixed(2)}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>${Number(rec.tax_amount || 0).toFixed(2)}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: rec.status === 'Paid' ? 'rgba(0, 245, 160, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: rec.status === 'Paid' ? '#00f5a0' : '#f59e0b',
                              border: `1px solid ${rec.status === 'Paid' ? 'rgba(0, 245, 160, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                            }}>{rec.status}</span>
                          </td>
                        </>
                      )}

                      {type === 'contacts' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{rec.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rec.supplier_id}</td>
                          <td style={{ padding: '1rem' }}>{rec.email || '—'}</td>
                          <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>{rec.phone || '—'}</td>
                        </>
                      )}

                      {type === 'rfq' && (
                        <>
                          <td style={{ padding: '1rem' }}>{rec.rfq_date}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{rec.supplier_id}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: rec.status === 'Submitted' ? 'rgba(0, 245, 160, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: rec.status === 'Submitted' ? '#00f5a0' : '#f59e0b',
                              border: `1px solid ${rec.status === 'Submitted' ? 'rgba(0, 245, 160, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                            }}>{rec.status}</span>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rec.items_count || 0} items</td>
                        </>
                      )}

                      {type === 'settings' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{rec.name}</td>
                          <td style={{ padding: '1rem' }}>{rec.value}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rec.group}</td>
                        </>
                      )}

                      {type === 'taxes' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{rec.name}</td>
                          <td style={{ padding: '1rem' }}>{rec.value}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rec.group}</td>
                        </>
                      )}

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', height: '28px' }}
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id, rec.name || '')}
                            className="btn"
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', height: '28px', background: 'rgba(255, 51, 102, 0.1)', color: '#ff3366', border: '1px solid rgba(255, 51, 102, 0.2)' }}
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

        {/* ─── Dynamic Workspace Creation Modal (Premium Light Theme Sub-Form) ─── */}
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px', width: '100%', maxWidth: '600px',
              boxShadow: '0 24px 48px -12px rgba(15,23,42,0.18), 0 0 32px rgba(212,175,55,0.05)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90vh'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.25rem 1.5rem', borderBottom: '1px solid #cbd5e1', background: '#f8fafc'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-display)' }}>
                  {editingRecord ? `Edit ${type.slice(0, -1).replace('-', ' ')}` : `New ${type.slice(0, -1).replace('-', ' ')}`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body / Form Container */}
              <div style={{ overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
                <form onSubmit={handleSubmit(onSubmit)} className="proc-light-form" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {formError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <AlertCircle size={14} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.2)', color: '#00f5a0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <CheckCircle2 size={14} />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {/* Dynamic Form Fields based on modules */}
                  {type === 'suppliers' && (
                    <>
                      <div>
                        <label>Supplier Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Acme Corp"
                          {...register('name', { required: 'Supplier name is required' })}
                        />
                      </div>
                      <div>
                        <label>Supplier Group</label>
                        <select {...register('group')}>
                          <option value="Local">Local</option>
                          <option value="International">International</option>
                          <option value="Distributor">Distributor</option>
                        </select>
                      </div>
                      <div>
                        <label>Tax ID</label>
                        <input type="text" placeholder="e.g. TX-99120" {...register('tax_id')} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <input type="checkbox" id="is_active" {...register('is_active')} style={{ width: 'auto' }} />
                        <label htmlFor="is_active" style={{ margin: 0 }}>Active / Operational</label>
                      </div>
                    </>
                  )}

                  {type === 'material-requests' && (
                    <>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label>Request Date *</label>
                          <input type="date" {...register('request_date', { required: 'Date is required' })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label>Required By</label>
                          <input type="date" {...register('required_by')} />
                        </div>
                      </div>

                      {/* Items Subform */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ margin: 0 }}>Requested Line Items *</label>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}
                            onClick={() => append({ item_id: items[0]?.id || '', qty: 1, warehouse_id: warehouses[0]?.id || '' })}
                          >
                            + Add Line Item
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {fields.map((field, idx) => (
                            <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select style={{ flex: 2 }} {...register(`items.${idx}.item_id`)}>
                                {items.map((item) => (
                                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Qty"
                                style={{ flex: 1 }}
                                {...register(`items.${idx}.qty`, { required: true, min: 1 })}
                              />
                              <select style={{ flex: 2 }} {...register(`items.${idx}.warehouse_id`)}>
                                {warehouses.map((wh) => (
                                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                                ))}
                              </select>
                              {fields.length > 1 && (
                                <button type="button" onClick={() => remove(idx)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '4px' }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {type === 'purchase-orders' && (
                    <>
                      <div>
                        <label>Supplier *</label>
                        <select {...register('supplier_id', { required: 'Supplier is required' })}>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label>Order Date *</label>
                          <input type="date" {...register('order_date', { required: 'Order date is required' })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label>Total Net Amount ($) *</label>
                          <input type="number" step="0.01" {...register('total_amount', { required: 'Amount is required' })} />
                        </div>
                      </div>

                      {/* Items Subform */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ margin: 0 }}>Order Line Items *</label>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}
                            onClick={() => append({ item_id: items[0]?.id || '', qty: 1, rate: 0 })}
                          >
                            + Add Line Item
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {fields.map((field, idx) => (
                            <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select style={{ flex: 2 }} {...register(`items.${idx}.item_id`)}>
                                {items.map((item) => (
                                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Qty"
                                style={{ flex: 1 }}
                                {...register(`items.${idx}.qty`, { required: true, min: 1 })}
                              />
                              <input
                                type="number"
                                placeholder="Rate"
                                step="0.01"
                                style={{ flex: 1 }}
                                {...register(`items.${idx}.rate`, { required: true })}
                              />
                              {fields.length > 1 && (
                                <button type="button" onClick={() => remove(idx)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '4px' }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {type === 'purchase-invoices' && (
                    <>
                      <div>
                        <label>Supplier *</label>
                        <select {...register('supplier_id', { required: 'Supplier is required' })}>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label>Invoice Date *</label>
                          <input type="date" {...register('invoice_date', { required: 'Invoice date is required' })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label>Due Date</label>
                          <input type="date" {...register('due_date')} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label>Net Invoice Amount ($) *</label>
                          <input type="number" step="0.01" {...register('amount', { required: 'Amount is required' })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label>Tax Amount ($)</label>
                          <input type="number" step="0.01" {...register('tax_amount')} />
                        </div>
                      </div>
                    </>
                  )}

                  {type === 'contacts' && (
                    <>
                      <div>
                        <label>Contact Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Jane Smith"
                          {...register('name', { required: 'Name is required' })}
                        />
                      </div>
                      <div>
                        <label>Supplier *</label>
                        <select {...register('supplier_id', { required: 'Supplier is required' })}>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                          <option value="Acme Corp">Acme Corp</option>
                          <option value="Stark Industries">Stark Industries</option>
                        </select>
                      </div>
                      <div>
                        <label>Email</label>
                        <input type="email" placeholder="jane@acme.com" {...register('email')} />
                      </div>
                      <div>
                        <label>Phone Number</label>
                        <input type="text" placeholder="+1 555-0192" {...register('phone')} />
                      </div>
                    </>
                  )}

                  {type === 'rfq' && (
                    <>
                      <div>
                        <label>RFQ Date *</label>
                        <input type="date" {...register('rfq_date', { required: 'Date is required' })} />
                      </div>
                      <div>
                        <label>Supplier *</label>
                        <select {...register('supplier_id', { required: 'Supplier is required' })}>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                          <option value="Acme Corp">Acme Corp</option>
                          <option value="Stark Industries">Stark Industries</option>
                        </select>
                      </div>
                      <div>
                        <label>Status</label>
                        <select {...register('status')}>
                          <option value="Draft">Draft</option>
                          <option value="Submitted">Submitted</option>
                        </select>
                      </div>
                      <div>
                        <label>Line Items Count</label>
                        <input type="number" min="1" {...register('items_count')} />
                      </div>
                    </>
                  )}

                  {type === 'settings' && (
                    <>
                      <div>
                        <label>Parameter Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Allow Over-receipt"
                          {...register('name', { required: 'Parameter name is required' })}
                        />
                      </div>
                      <div>
                        <label>Value *</label>
                        <input type="text" placeholder="e.g. Yes" {...register('value', { required: 'Value is required' })} />
                      </div>
                      <div>
                        <label>Module Scope</label>
                        <input type="text" placeholder="e.g. PO Authorization" {...register('group')} />
                      </div>
                    </>
                  )}

                  {type === 'taxes' && (
                    <>
                      <div>
                        <label>Template Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Standard VAT (15%)"
                          {...register('name', { required: 'Template name is required' })}
                        />
                      </div>
                      <div>
                        <label>Rate (%) *</label>
                        <input type="text" placeholder="e.g. 15.00%" {...register('value', { required: 'Rate is required' })} />
                      </div>
                      <div>
                        <label>Account Link</label>
                        <input type="text" placeholder="e.g. VAT Input Account" {...register('group')} />
                      </div>
                    </>
                  )}

                  {/* Modal Footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
                    borderTop: '1px solid #cbd5e1', paddingTop: '1.25rem', marginTop: '0.5rem'
                  }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ height: '38px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                        color: '#0b0f19',
                        fontWeight: 700,
                        height: '38px',
                        boxShadow: '0 4px 12px rgba(212,175,55,0.2)',
                      }}
                    >
                      {submitting ? 'Submitting...' : (editingRecord ? 'Save Changes' : 'Submit Record')}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1.5s linear infinite; }
        
        /* Light modal sub-form overrides */
        .proc-light-form label {
          color: #334155 !important;
          font-weight: 600 !important;
          font-size: 0.8rem !important;
          margin-bottom: 4px !important;
          display: block !important;
        }
        .proc-light-form input, .proc-light-form select, .proc-light-form textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          padding: 0.6rem 0.85rem !important;
          width: 100% !important;
          font-size: 0.85rem !important;
        }
        .proc-light-form input:focus, .proc-light-form select:focus {
          border-color: #d4af37 !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.15) !important;
          outline: none !important;
        }
        .proc-light-form input::placeholder {
          color: #94a3b8 !important;
        }
        .proc-light-form select option {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
      `}</style>
    </WorkspaceLayout>
  );
}
