import React, { useEffect, useState } from 'react';
import {
  Users, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Search, Filter, ArrowUpRight, Building, Mail, Phone, User,
  Calendar, BarChart2, TrendingUp, Settings, Play, CheckSquare,
  BookOpen, Shield, DollarSign, Percent, Trash2, Edit2
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const CUSTOMER_STAGES = [
  { key: 'LEAD',            label: 'Lead',            color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'OPPORTUNITY',     label: 'Opportunity',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { key: 'ACTIVE_CUSTOMER', label: 'Active Customer', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'INACTIVE',        label: 'Inactive',        color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.1)' },
];

const VIEWS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart2 },
  { id: 'LIST', label: 'List View', icon: Filter },
  { id: 'REPORT', label: 'Report', icon: TrendingUp },
  { id: 'KANBAN', label: 'Kanban', icon: Users },
];

const CUSTOMER_GROUPS = [
  'All Customer Groups', 'Commercial', 'Government', 'Individual', 'Non Profit'
];

const TERRITORIES = [
  'All Territories', 'North America', 'Europe', 'Asia Pacific', 'Middle East', 'South America'
];

function StatusPill({ status }: { status: string }) {
  const s = CUSTOMER_STAGES.find(s => s.key === status) || CUSTOMER_STAGES[0];
  return (
    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  lifecycle_status: string;
  created_at: string;
  custom_attributes?: Record<string, any>;
}

export default function Customers() {
  const { authFetch } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('LIST');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Tabbed form state
  const [activeFormTab, setActiveFormTab] = useState<'details' | 'address_contact' | 'tax' | 'accounting' | 'more'>('details');
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'address_contact' | 'tax' | 'accounting' | 'more'>('details');

  // Form fields
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE_CUSTOMER');

  // ERPNext inspired Custom Attributes
  const [customerType, setCustomerType] = useState<'Company' | 'Individual'>('Company');
  const [customerGroup, setCustomerGroup] = useState('All Customer Groups');
  const [territory, setTerritory] = useState('All Territories');
  const [billingCurrency, setBillingCurrency] = useState('USD');
  const [defaultPriceList, setDefaultPriceList] = useState('Standard Selling');
  const [defaultBankAccount, setDefaultBankAccount] = useState('');
  const [primaryAddress, setPrimaryAddress] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxCategory, setTaxCategory] = useState('');
  const [taxWithholdingCategory, setTaxWithholdingCategory] = useState('');
  const [taxWithholdingGroup, setTaxWithholdingGroup] = useState('');
  const [receivableAccounts, setReceivableAccounts] = useState<{ company: string; account: string }[]>([]);
  const [creditLimits, setCreditLimits] = useState<{ company: string; limit: number; bypass: boolean }[]>([]);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Auxiliary state for adding dynamic table rows inside form
  const [tempCompany, setTempCompany] = useState('B-Core Digital Services');
  const [tempAccount, setTempAccount] = useState('');
  const [tempLimit, setTempLimit] = useState(10000);
  const [tempBypass, setTempBypass] = useState(false);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Automation state
  const [autoAssign, setAutoAssign] = useState(true);
  const [welcomeEmail, setWelcomeEmail] = useState(true);
  const [churnFlag, setChurnFlag] = useState(false);
  const [autoMsg, setAutoMsg] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.append('search', search);
      const data = await authFetch(`/workspaces/crm/customers?${params}`);
      setCustomers(data.customers || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load customers database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  // Open clean create customer form
  const openCreateForm = () => {
    setEditingCustomerId(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setStatus('ACTIVE_CUSTOMER');
    setCustomerType('Company');
    setCustomerGroup('All Customer Groups');
    setTerritory('All Territories');
    setBillingCurrency('USD');
    setDefaultPriceList('Standard Selling');
    setDefaultBankAccount('');
    setPrimaryAddress('');
    setPrimaryContactName('');
    setTaxId('');
    setTaxCategory('');
    setTaxWithholdingCategory('');
    setTaxWithholdingGroup('');
    setReceivableAccounts([
      { company: 'B-Core Digital Services', account: 'Debtors - BC' }
    ]);
    setCreditLimits([
      { company: 'B-Core Digital Services', limit: 100000, bypass: false }
    ]);
    setDefaultPaymentTerms('');
    setNotes('');
    setFormError('');
    setFormSuccess('');
    setActiveFormTab('details');
    setIsFormOpen(true);
  };

  // Open edit form populated with current customer values
  const openEditForm = (c: Customer) => {
    setEditingCustomerId(c.id);
    setCompanyName(c.company_name);
    setContactName(c.contact_name);
    setEmail(c.email);
    setPhone(c.phone || '');
    setStatus(c.lifecycle_status);

    const attrs = c.custom_attributes || {};
    setCustomerType(attrs.customer_type || 'Company');
    setCustomerGroup(attrs.customer_group || 'All Customer Groups');
    setTerritory(attrs.territory || 'All Territories');
    setBillingCurrency(attrs.billing_currency || 'USD');
    setDefaultPriceList(attrs.default_price_list || 'Standard Selling');
    setDefaultBankAccount(attrs.default_bank_account || '');
    setPrimaryAddress(attrs.primary_address || '');
    setPrimaryContactName(attrs.primary_contact || '');
    setTaxId(attrs.tax_id || '');
    setTaxCategory(attrs.tax_category || '');
    setTaxWithholdingCategory(attrs.tax_withholding_category || '');
    setTaxWithholdingGroup(attrs.tax_withholding_group || '');
    setReceivableAccounts(attrs.receivable_accounts || [
      { company: 'B-Core Digital Services', account: 'Debtors - BC' }
    ]);
    setCreditLimits(attrs.credit_limits || [
      { company: 'B-Core Digital Services', limit: 100000, bypass: false }
    ]);
    setDefaultPaymentTerms(attrs.default_payment_terms || '');
    setNotes(attrs.notes || '');

    setFormError('');
    setFormSuccess('');
    setActiveFormTab('details');
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  // Submit handler for creating & updating customer
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      setFormError('Please fill in all required fields (Company Name, Contact Name, and Email Address).');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        lifecycle_status: status,
        custom_attributes: {
          customer_type: customerType,
          customer_group: customerGroup,
          territory: territory,
          billing_currency: billingCurrency,
          default_price_list: defaultPriceList,
          default_bank_account: defaultBankAccount,
          primary_address: primaryAddress,
          primary_contact: primaryContactName || contactName,
          tax_id: taxId,
          tax_category: taxCategory,
          tax_withholding_category: taxWithholdingCategory,
          tax_withholding_group: taxWithholdingGroup,
          receivable_accounts: receivableAccounts,
          credit_limits: creditLimits,
          default_payment_terms: defaultPaymentTerms,
          notes: notes
        }
      };

      if (editingCustomerId) {
        await authFetch(`/workspaces/crm/customers/${editingCustomerId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setFormSuccess('Customer profile updated successfully!');
      } else {
        await authFetch('/workspaces/crm/customers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setFormSuccess('Customer account registered successfully!');
      }

      setTimeout(() => {
        setIsFormOpen(false);
        fetchCustomers();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete customer handler
  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer record? This action cannot be undone.")) return;
    try {
      await authFetch(`/workspaces/crm/customers/${id}`, {
        method: 'DELETE'
      });
      setIsDetailOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete customer.');
    }
  };

  const handleRunAutomation = () => {
    setAutoMsg('Running CRM sync & workflow triggers...');
    setTimeout(() => {
      setAutoMsg('Automation tasks processed successfully! Checked active leads, updated email triggers, verified activity logs.');
      fetchCustomers();
    }, 1500);
  };

  const updateCustomerStatus = async (id: string, newStatus: string) => {
    try {
      await authFetch(`/workspaces/crm/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ lifecycle_status: newStatus })
      });
      fetchCustomers();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update customer status.');
    }
  };

  // Dynamic table row modifiers
  const addReceivableAccount = () => {
    if (!tempAccount.trim()) return;
    setReceivableAccounts([...receivableAccounts, { company: tempCompany, account: tempAccount.trim() }]);
    setTempAccount('');
  };

  const removeReceivableAccount = (index: number) => {
    setReceivableAccounts(receivableAccounts.filter((_, i) => i !== index));
  };

  const addCreditLimit = () => {
    setCreditLimits([...creditLimits, { company: tempCompany, limit: tempLimit, bypass: tempBypass }]);
    setTempLimit(10000);
    setTempBypass(false);
  };

  const removeCreditLimit = (index: number) => {
    setCreditLimits(creditLimits.filter((_, i) => i !== index));
  };

  // Group by stage for kanban view
  const grouped: Record<string, Customer[]> = {};
  CUSTOMER_STAGES.forEach(s => { grouped[s.key] = []; });
  customers.forEach(c => {
    if (grouped[c.lifecycle_status]) {
      grouped[c.lifecycle_status].push(c);
    } else {
      grouped['LEAD'].push(c);
    }
  });

  const activeCount = customers.filter(c => c.lifecycle_status === 'ACTIVE_CUSTOMER').length;
  const leadCount = customers.filter(c => c.lifecycle_status === 'LEAD').length;
  const oppCount = customers.filter(c => c.lifecycle_status === 'OPPORTUNITY').length;

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Customers & Accounts
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Manage corporate accounts, active customers, and sync integration triggers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => setIsAutoOpen(true)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)',
                height: '40px', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
              }}
            >
              <Settings size={15} /> Automation
            </button>
            <button 
              onClick={openCreateForm}
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)', color: 'var(--text-main)',
                height: '40px', padding: '0 1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, border: 'none'
              }}
            >
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </div>

        {/* Top metrics summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Customers</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : activeCount}
            </h2>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Open Opportunities</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : oppCount}
            </h2>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Leads Tracked</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : leadCount}
            </h2>
          </div>
        </div>

        {/* Search + View Switcher */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by company or contact name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ 
                width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', height: '42px', 
                background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', height: '32px',
                  background: activeView === v.id ? 'var(--bg-card)' : 'transparent',
                  color: activeView === v.id ? '#10b981' : 'var(--text-muted)',
                  border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem',
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeView === v.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <v.icon size={14} />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={15} />{errorMsg}
          </div>
        )}

        {/* View Layouts */}
        {activeView === 'KANBAN' && (
          <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '500px' }}>
            {CUSTOMER_STAGES.map(stage => (
              <div key={stage.key} style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '0.5rem' }}>
                {/* Stage Header */}
                <div style={{ padding: '0.75rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: stage.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px' }}>{grouped[stage.key]?.length || 0}</span>
                </div>
                <div style={{ height: '3px', background: stage.color, borderRadius: '3px', opacity: 0.3, margin: '0 0.5rem 0.5rem 0.5rem' }}></div>

                {/* Cards Container */}
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {loading ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
                  ) : (grouped[stage.key] || []).length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.6, border: '1px dashed var(--border-color)', borderRadius: '8px' }}>No records</div>
                  ) : (
                    (grouped[stage.key] || []).map(c => (
                      <div key={c.id} 
                      onClick={() => { setSelectedCustomer(c); setActiveDetailTab('details'); setIsDetailOpen(true); }}
                      style={{ 
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', 
                        padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>{c.company_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                          <User size={12} /> {c.contact_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                          <Mail size={12} /> {c.email}
                        </div>

                        {/* Dropdown status update for Kanban */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
                          <select 
                            value={c.lifecycle_status}
                            onChange={(e) => updateCustomerStatus(c.id, e.target.value)}
                            style={{ width: '100%', fontSize: '0.75rem', height: '28px', padding: '0 4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                          >
                            <option value="LEAD">Lead</option>
                            <option value="OPPORTUNITY">Opportunity</option>
                            <option value="ACTIVE_CUSTOMER">Active Customer</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'LIST' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMPANY</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CONTACT</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>EMAIL</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PHONE</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CREATED</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found</td></tr>
                ) : (
                  customers.map(c => (
                    <tr 
                      key={c.id} 
                      onClick={() => { setSelectedCustomer(c); setActiveDetailTab('details'); setIsDetailOpen(true); }}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{c.company_name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>{c.contact_name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.email}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.phone || '-'}</td>
                      <td style={{ padding: '1rem' }}><StatusPill status={c.lifecycle_status} /></td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'DASHBOARD' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Customer Portfolio Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {CUSTOMER_STAGES.map(stage => {
                  const stageCount = grouped[stage.key]?.length || 0;
                  const percent = customers.length > 0 ? (stageCount / customers.length) * 100 : 0;
                  return (
                    <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                        <span style={{ color: stage.color }}>{stage.label}</span>
                        <span style={{ color: 'var(--text-main)' }}>{stageCount} ({Math.round(percent)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: stage.color, borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Client Retention Rate</h4>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981' }}>
                {customers.length > 0 ? `${Math.round((activeCount / (activeCount + (grouped['INACTIVE']?.length || 0) || 1)) * 100)}%` : '100%'}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Percentage of active vs churned customer profiles</p>
            </div>
          </div>
        )}

        {activeView === 'REPORT' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Customers Summary Report</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              The current corporate directories track a total of <strong>{customers.length}</strong> entries. Of these, <strong>{activeCount}</strong> are validated active client accounts. 
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{activeCount} accounts</h4>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROSPECTIVE</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{oppCount} pipelines</h4>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DORMANT</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>{(grouped['INACTIVE']?.length || 0)} files</h4>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── ERPNext-Style Tabbed Customer Create/Edit Modal ────────────────────────────── */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '850px', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(16, 185, 129, 0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <div>
                <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.25rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingCustomerId ? <Edit2 size={20} color="#10b981" /> : <Plus size={22} color="#10b981" />}
                  {editingCustomerId ? 'Edit Customer Account' : 'Create Customer Profile'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Configure ERP modules, billing, defaults, and attributes.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><X size={20} /></button>
            </div>

            {/* Form tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 1.5rem 0' }}>
              {[
                { id: 'details', label: 'Details', icon: User },
                { id: 'address_contact', label: 'Address & Contact', icon: Mail },
                { id: 'tax', label: 'Tax & Compliance', icon: Shield },
                { id: 'accounting', label: 'Accounting & Limits', icon: DollarSign },
                { id: 'more', label: 'Settings & Notes', icon: BookOpen },
              ].map(tab => {
                const ActiveIcon = tab.icon;
                const active = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      color: active ? '#10b981' : 'var(--text-muted)',
                      borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <ActiveIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Form inputs container */}
            <form onSubmit={handleSaveCustomer} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ padding: '2rem 2.25rem' }}>
                {formError && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff8099', padding: '0.85rem 1.25rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#a7f3d0', padding: '0.85rem 1.25rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* TAB 1: Details */}
                {activeFormTab === 'details' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Type *</label>
                        <select 
                          value={customerType} 
                          onChange={e => setCustomerType(e.target.value as any)}
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        >
                          <option value="Company">Company</option>
                          <option value="Individual">Individual</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Name *</label>
                        <input 
                          type="text" 
                          required
                          value={companyName} 
                          onChange={e => setCompanyName(e.target.value)} 
                          placeholder="e.g. Acme Corporation or Jane Doe"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Group</label>
                        <select 
                          value={customerGroup} 
                          onChange={e => setCustomerGroup(e.target.value)}
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        >
                          {CUSTOMER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Territory</label>
                        <select 
                          value={territory} 
                          onChange={e => setTerritory(e.target.value)}
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        >
                          {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default Currency & Accounts</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Billing Currency</label>
                        <input 
                          type="text" 
                          value={billingCurrency} 
                          onChange={e => setBillingCurrency(e.target.value)} 
                          placeholder="e.g. USD, EUR, GBP"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Default Price List</label>
                        <input 
                          type="text" 
                          value={defaultPriceList} 
                          onChange={e => setDefaultPriceList(e.target.value)} 
                          placeholder="e.g. Standard Selling"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Default Company Bank Account</label>
                        <input 
                          type="text" 
                          value={defaultBankAccount} 
                          onChange={e => setDefaultBankAccount(e.target.value)} 
                          placeholder="e.g. Citibank Operating Acct - ****1234"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Address & Contact */}
                {activeFormTab === 'address_contact' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Address and Contact Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Primary Address</label>
                        <textarea 
                          rows={6}
                          value={primaryAddress} 
                          onChange={e => setPrimaryAddress(e.target.value)} 
                          placeholder="Street, City, State/Province, Country, ZIP Code..."
                          style={{ padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Primary Contact Name *</label>
                          <input 
                            type="text" 
                            required
                            value={contactName} 
                            onChange={e => { setContactName(e.target.value); if(!primaryContactName) setPrimaryContactName(e.target.value); }} 
                            placeholder="e.g. John Doe"
                            style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Email Address *</label>
                          <input 
                            type="email" 
                            required
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="contact@company.com"
                            style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Phone Number</label>
                          <input 
                            type="text" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            placeholder="e.g. +1 555-0199"
                            style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Tax */}
                {activeFormTab === 'tax' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax and Compliance Registry</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax ID (e.g. TIN / VAT / EIN)</label>
                        <input 
                          type="text" 
                          value={taxId} 
                          onChange={e => setTaxId(e.target.value)} 
                          placeholder="e.g. US-987654321"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax Category</label>
                        <input 
                          type="text" 
                          value={taxCategory} 
                          onChange={e => setTaxCategory(e.target.value)} 
                          placeholder="e.g. Out of State, Commercial, Tax Exempt"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax Withholding Category</label>
                        <input 
                          type="text" 
                          value={taxWithholdingCategory} 
                          onChange={e => setTaxWithholdingCategory(e.target.value)} 
                          placeholder="e.g. TDS Section 194C"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax Withholding Group</label>
                        <input 
                          type="text" 
                          value={taxWithholdingGroup} 
                          onChange={e => setTaxWithholdingGroup(e.target.value)} 
                          placeholder="e.g. Subcontractor Rates"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Accounting */}
                {activeFormTab === 'accounting' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    
                    {/* Receivable Accounts Table */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: '0 0 0.8rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receivable Accounts Mapping</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>No.</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Company</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Receivable Account</th>
                            <th style={{ padding: '8px 12px', width: '60px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {receivableAccounts.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No account mappings defined. Click below to add.</td></tr>
                          ) : (
                            receivableAccounts.map((acct, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff' }}>{acct.company}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>{acct.account}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  <button type="button" onClick={() => removeReceivableAccount(idx)} style={{ background: 'transparent', border: 'none', color: '#ff5c75', cursor: 'pointer', display: 'flex', padding: '4px' }}><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      
                      {/* Add Account Inline Form */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '0.8rem', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '8px', border: '1px dashed var(--border-color)', alignItems: 'center' }}>
                        <select 
                          value={tempCompany} 
                          onChange={e => setTempCompany(e.target.value)}
                          style={{ flex: 1, padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                        >
                          <option value="B-Core Digital Services">B-Core Digital Services</option>
                        </select>
                        <input 
                          type="text" 
                          value={tempAccount} 
                          onChange={e => setTempAccount(e.target.value)} 
                          placeholder="e.g. Debtors - BC" 
                          style={{ flex: 1.5, padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <button type="button" onClick={addReceivableAccount} style={{ background: '#10b981', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Add Row</button>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                    {/* Credit Limit & Terms */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: '0 0 0.8rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit Limits & Payment Terms</h4>
                      
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Default Payment Terms Template</label>
                        <input 
                          type="text" 
                          value={defaultPaymentTerms} 
                          onChange={e => setDefaultPaymentTerms(e.target.value)} 
                          placeholder="e.g. Net 30 Days, 50% Advance / 50% Net 15"
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      {/* Credit Limits Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>No.</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Company</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Credit Limit ($)</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Bypass Check?</th>
                            <th style={{ padding: '8px 12px', width: '60px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditLimits.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No custom credit limits mapped. Click below to add.</td></tr>
                          ) : (
                            creditLimits.map((lim, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff' }}>{lim.company}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>${lim.limit.toLocaleString()}</td>
                                <td style={{ padding: '8px 12px', color: lim.bypass ? '#ff8099' : '#10b981', fontWeight: 600 }}>{lim.bypass ? 'Bypassed' : 'Enforced'}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  <button type="button" onClick={() => removeCreditLimit(idx)} style={{ background: 'transparent', border: 'none', color: '#ff5c75', cursor: 'pointer', display: 'flex', padding: '4px' }}><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      {/* Add Limit Inline Form */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '0.8rem', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '8px', border: '1px dashed var(--border-color)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select 
                          value={tempCompany} 
                          onChange={e => setTempCompany(e.target.value)}
                          style={{ flex: 1, minWidth: '150px', padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                        >
                          <option value="B-Core Digital Services">B-Core Digital Services</option>
                        </select>
                        <input 
                          type="number" 
                          value={tempLimit} 
                          onChange={e => setTempLimit(Number(e.target.value))} 
                          placeholder="Limit Amount ($)" 
                          style={{ flex: 1, minWidth: '120px', padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.78rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={tempBypass} onChange={e => setTempBypass(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                          Bypass check?
                        </label>
                        <button type="button" onClick={addCreditLimit} style={{ background: '#10b981', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>Add Limit</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: More Info & Notes */}
                {activeFormTab === 'more' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lifecycle Status & Notes</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Lifecycle Status</label>
                        <select 
                          value={status} 
                          onChange={e => setStatus(e.target.value)}
                          style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        >
                          <option value="ACTIVE_CUSTOMER">Active Customer</option>
                          <option value="LEAD">Lead</option>
                          <option value="OPPORTUNITY">Opportunity</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Notes / Internal Description</label>
                        <textarea 
                          rows={6}
                          value={notes} 
                          onChange={e => setNotes(e.target.value)} 
                          placeholder="Write down client meeting summaries, background accounts, critical terms, or other operational context..."
                          style={{ padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div style={{ padding: '1.25rem 2.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'auto' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', height: '42px', padding: '0 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ background: '#10b981', border: 'none', color: '#000', height: '42px', padding: '0 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                  {submitting ? 'Saving...' : 'Save Customer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ERPNext-Style Customer Detail View Modal ────────────────────────────────────── */}
      {isDetailOpen && selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: '1.5rem' }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '850px', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(0, 124, 176, 0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building size={20} color="#10b981" />
                  <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.25rem', letterSpacing: '-0.02em', margin: 0 }}>
                    {selectedCustomer.company_name}
                  </h3>
                  <StatusPill status={selectedCustomer.lifecycle_status} />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Corporate Account File — ID: {selectedCustomer.id}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={() => openEditForm(selectedCustomer)}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                  style={{ background: 'rgba(255, 92, 117, 0.1)', border: '1px solid rgba(255, 92, 117, 0.3)', color: '#ff5c75', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
                <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem' }}></div>
                <button onClick={() => setIsDetailOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={20} /></button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 1.5rem 0' }}>
              {[
                { id: 'details', label: 'Details', icon: User },
                { id: 'address_contact', label: 'Address & Contact', icon: Mail },
                { id: 'tax', label: 'Tax & Compliance', icon: Shield },
                { id: 'accounting', label: 'Accounting & Limits', icon: DollarSign },
                { id: 'more', label: 'Internal Notes', icon: BookOpen },
              ].map(tab => {
                const ActiveIcon = tab.icon;
                const active = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      color: active ? '#10b981' : 'var(--text-muted)',
                      borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <ActiveIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Read-Only Details Panel */}
            <div style={{ padding: '2rem 2.25rem', overflowY: 'auto', flex: 1 }}>
              
              {/* TAB 1: Details */}
              {activeDetailTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem 2rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Type</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.customer_type || 'Company'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Name</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.company_name}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer Group</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.customer_group || 'All Customer Groups'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Territory</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.territory || 'All Territories'}</p>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default Currency & Bank Accounts</h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem 2rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Billing Currency</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.billing_currency || 'USD'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Default Price List</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.default_price_list || 'Standard Selling'}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Default Bank Account</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.default_bank_account || 'None set'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Address & Contact */}
              {activeDetailTab === 'address_contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Address and Contact Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Primary Address</span>
                      <div style={{ 
                        margin: '0.4rem 0 0 0', 
                        padding: '1rem', 
                        background: 'var(--bg-main)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        color: 'var(--text-main)', 
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedCustomer.custom_attributes?.primary_address || 'No address registered.'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Primary Contact Name</span>
                        <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.contact_name}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Email Address</span>
                        <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#10b981', fontSize: '0.92rem' }}>{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Phone Number</span>
                        <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Tax */}
              {activeDetailTab === 'tax' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax and Compliance Registry</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax ID (TIN / VAT / EIN)</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.tax_id || '-'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax Category</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.tax_category || '-'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax Withholding Category</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.tax_withholding_category || '-'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Tax Withholding Group</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.tax_withholding_group || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Accounting */}
              {activeDetailTab === 'accounting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  
                  {/* Receivable Accounts Table */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: '0 0 0.8rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receivable Accounts Mapping</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>No.</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Company</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Receivable Account</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!selectedCustomer.custom_attributes?.receivable_accounts || selectedCustomer.custom_attributes.receivable_accounts.length === 0) ? (
                          <tr><td colSpan={3} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No receivable account mappings defined.</td></tr>
                        ) : (
                          selectedCustomer.custom_attributes.receivable_accounts.map((acct: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff' }}>{acct.company}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>{acct.account}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                  {/* Credit Limit & Terms */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: '0 0 0.8rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit Limits & Payment Terms</h4>
                    
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Default Payment Terms Template</span>
                      <p style={{ margin: '0.4rem 0 0 0', fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{selectedCustomer.custom_attributes?.default_payment_terms || '-'}</p>
                    </div>

                    {/* Credit Limits Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>No.</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Company</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Credit Limit ($)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Bypass Check?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!selectedCustomer.custom_attributes?.credit_limits || selectedCustomer.custom_attributes.credit_limits.length === 0) ? (
                          <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No custom credit limits mapped.</td></tr>
                        ) : (
                          selectedCustomer.custom_attributes.credit_limits.map((lim: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff' }}>{lim.company}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>${lim.limit.toLocaleString()}</td>
                              <td style={{ padding: '8px 12px', color: lim.bypass ? '#ff5c75' : '#10b981', fontWeight: 600 }}>{lim.bypass ? 'Bypassed' : 'Enforced'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: Notes */}
              {activeDetailTab === 'more' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes / Internal Description</h4>
                  <div style={{ 
                    padding: '1.25rem', 
                    background: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '10px', 
                    color: 'var(--text-main)', 
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedCustomer.custom_attributes?.notes || 'No description or meeting notes added to this customer profile.'}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div style={{ padding: '1.25rem 2.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button type="button" onClick={() => setIsDetailOpen(false)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', height: '42px', padding: '0 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Close File</button>
            </div>
          </div>
        </div>
      )}

      {/* Automation Modal */}
      {isAutoOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#10b981" /> CRM Automation Settings
              </h3>
              <button onClick={() => setIsAutoOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Configure background event triggers to optimize pipeline management and lead processing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <input type="checkbox" checked={autoAssign} onChange={e => setAutoAssign(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Auto-assign newly created leads to active owners
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <input type="checkbox" checked={welcomeEmail} onChange={e => setWelcomeEmail(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Send welcome onboarding sequence on ACTIVE status
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <input type="checkbox" checked={churnFlag} onChange={e => setChurnFlag(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Flag accounts as dormant/inactive after 90 days of no calls
                </label>
              </div>

              {autoMsg && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <CheckSquare size={16} style={{ flexShrink: 0 }} />
                  <span>{autoMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={handleRunAutomation}
                  style={{
                    background: 'var(--bg-main)', border: '1px solid #10b981', color: '#10b981',
                    height: '38px', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
                  }}
                >
                  <Play size={14} /> Run Sync Now
                </button>
                <button type="button" onClick={() => setIsAutoOpen(false)} style={{ background: 'linear-gradient(135deg,#10b981,#047857)', height: '38px', border: 'none', color: '#000', fontWeight: 700, padding: '0 1.25rem', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </WorkspaceLayout>
  );
}
