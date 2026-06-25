import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  TrendingUp, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Search, Filter, ArrowUpRight, Users, Target, Zap, Phone, Mail, Eye
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const LIFECYCLE_STAGES = [
  { key: 'LEAD',            label: 'Lead',            color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'INACTIVE',        label: 'Inactive',        color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.12)' },
];

const VIEWS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: Target },
  { id: 'LIST', label: 'List View', icon: Filter },
  { id: 'REPORT', label: 'Report', icon: TrendingUp },
  { id: 'KANBAN', label: 'Kanban', icon: Zap },
];

function StatusPill({ status }: { status: string }) {
  const s = LIFECYCLE_STAGES.find(s => s.key === status) || LIFECYCLE_STAGES[0];
  return (
    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

interface Customer {
  id: string; company_name: string; contact_name: string; email: string;
  phone?: string; lifecycle_status: string; created_at: string;
}

interface FormValues {
  // Lead Info
  series: string;
  product_title: string;
  lead_owner: string;
  salutation: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  lifecycle_status: string;
  lead_potential: string;
  recontact_interval_days: string;
  request_type: string;
  request_type_other?: string;
  type_of_lead: string;

  // Contact Info
  email: string;
  mobile_no: string;
  phone: string;
  whatsapp: string;
  fax: string;

  // Organization
  organization_name: string;
  annual_revenue: string;
  territory: string;
  no_of_employees: string;
  industry: string;
  market_segment: string;

  // Address
  city: string;
  state_province: string;
  country: string;
}

export default function PipelineLeads() {
  const { authFetch, currentUser } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeView, setActiveView] = useState('KANBAN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(['company', 'contact', 'email', 'status', 'actions']);
  const [showColMenu, setShowColMenu] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      series: '', product_title: '', lead_owner: '', salutation: '',
      first_name: '', middle_name: '', last_name: '', gender: '', lifecycle_status: 'LEAD',
      lead_potential: 'High', recontact_interval_days: '', request_type: '', request_type_other: '', type_of_lead: 'By Call',
      email: '', mobile_no: '', phone: '', whatsapp: '', fax: '',
      organization_name: '', annual_revenue: '', territory: '', no_of_employees: '1-10',
      industry: '', market_segment: '', city: '', state_province: '', country: ''
    }
  });

  const watchRequestType = watch('request_type');

  const openEditForm = (c: any) => {
    setEditingLeadId(c.id);
    setFormError('');
    setFormSuccess('');
    
    setValue('email', c.email || '');
    setValue('mobile_no', c.phone || '');
    setValue('organization_name', c.company_name || '');
    setValue('lifecycle_status', c.lifecycle_status || 'LEAD');
    
    const nameParts = (c.contact_name || '').split(' ');
    setValue('first_name', nameParts[0] || '');
    setValue('last_name', nameParts.slice(1).join(' ') || '');
    
    const attrs = c.custom_attributes || {};
    setValue('series', attrs.series || '');
    setValue('product_title', attrs.product_title || '');
    setValue('lead_owner', attrs.lead_owner || '');
    setValue('salutation', attrs.salutation || '');
    setValue('middle_name', attrs.middle_name || '');
    setValue('gender', attrs.gender || '');
    setValue('lead_potential', attrs.lead_potential || 'High');
    setValue('recontact_interval_days', attrs.recontact_interval_days || '');
    
    if (['Product Enquiry', 'Request for Information', 'Suggestion', ''].includes(attrs.request_type || '')) {
      setValue('request_type', attrs.request_type || '');
      setValue('request_type_other', '');
    } else {
      setValue('request_type', 'Other');
      setValue('request_type_other', attrs.request_type || '');
    }
    
    setValue('type_of_lead', attrs.type_of_lead || 'By Call');
    setValue('whatsapp', attrs.whatsapp || '');
    setValue('phone', attrs.phone || '');
    setValue('fax', attrs.fax || '');
    setValue('annual_revenue', attrs.annual_revenue || '');
    setValue('territory', attrs.territory || '');
    setValue('no_of_employees', attrs.no_of_employees || '1-10');
    setValue('industry', attrs.industry || '');
    setValue('market_segment', attrs.market_segment || '');
    setValue('city', attrs.city || '');
    setValue('state_province', attrs.state_province || '');
    setValue('country', attrs.country || '');
    
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && !editingLeadId) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      setValue('series', `CRM-LEAD-${year}-${rand}`);
      
      const ownerName = currentUser?.first_name 
        ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() 
        : currentUser?.email || currentUser?.username || 'Unknown';
      setValue('lead_owner', ownerName);
    }
  }, [isModalOpen, editingLeadId, setValue, currentUser]);

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.append('search', search);
      if (filterStatus) params.append('lifecycle_status', filterStatus);
      const data = await authFetch(`/workspaces/crm/customers?${params}`);
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (e: any) { setErrorMsg(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [search, filterStatus]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true); setFormError(''); setFormSuccess('');
    try {
      const payload = {
        company_name: values.organization_name || 'Unknown',
        contact_name: `${values.first_name} ${values.last_name}`.trim() || 'Unknown',
        email: values.email || 'no-reply@unknown.com',
        phone: values.mobile_no || values.phone || null,
        lifecycle_status: values.lifecycle_status,
        custom_attributes: {
          series: values.series,
          product_title: values.product_title,
          lead_owner: values.lead_owner,
          salutation: values.salutation,
          first_name: values.first_name,
          middle_name: values.middle_name,
          last_name: values.last_name,
          gender: values.gender,
          lead_potential: values.lead_potential,
          recontact_interval_days: values.recontact_interval_days,
          request_type: values.request_type === 'Other' ? values.request_type_other : values.request_type,
          type_of_lead: values.type_of_lead,
          whatsapp: values.whatsapp,
          fax: values.fax,
          annual_revenue: values.annual_revenue,
          territory: values.territory,
          no_of_employees: values.no_of_employees,
          industry: values.industry,
          market_segment: values.market_segment,
          city: values.city,
          state_province: values.state_province,
          country: values.country,
        }
      };
      if (editingLeadId) {
        await authFetch(`/workspaces/crm/customers/${editingLeadId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFormSuccess('Lead updated successfully!');
      } else {
        await authFetch(`/workspaces/crm/customers`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFormSuccess('Lead registered successfully!');
      }
      setTimeout(() => { setIsModalOpen(false); setEditingLeadId(null); fetchCustomers(); }, 1000);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, lifecycle_status: string) => {
    try {
      await authFetch(`/workspaces/crm/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ lifecycle_status }),
      });
      fetchCustomers();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // Group by stage for kanban view
  const grouped: Record<string, Customer[]> = {};
  LIFECYCLE_STAGES.forEach(s => { grouped[s.key] = []; });
  customers.forEach(c => { if (grouped[c.lifecycle_status]) grouped[c.lifecycle_status].push(c); });

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Pipeline & Leads</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem', fontWeight: 500 }}>
              {total} records across {LIFECYCLE_STAGES.length} stages
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchCustomers} disabled={loading} style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)',
              height: '40px', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button onClick={() => { reset(); setEditingLeadId(null); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} style={{ 
              background: '#059669', color: '#ffffff', border: 'none', height: '40px', padding: '0 1.25rem',
              borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}>
              <Plus size={16} /> Add Lead
            </button>
          </div>
        </div>

        {/* Search + Filter + View Switcher */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ 
                width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', height: '42px', 
                background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
              }} 
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            style={{ 
              height: '42px', minWidth: '150px', padding: '0 1rem', background: 'var(--bg-main)',
              border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)',
              fontSize: '0.9rem', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="">All Stages</option>
            {LIFECYCLE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          
          <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', height: '32px',
                  background: activeView === v.id ? 'var(--bg-card)' : 'transparent',
                  color: activeView === v.id ? '#059669' : 'var(--text-muted)',
                  border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem',
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeView === v.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <v.icon size={14} />
                {v.label}
              </button>
            ))}
          </div>
          {activeView === 'LIST' && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowColMenu(!showColMenu)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px', width: '42px',
                  background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px',
                  color: 'var(--text-main)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <Eye size={16} />
              </button>
              {showColMenu && (
                <div style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '150px' }}>
                  {[
                    { id: 'company', label: 'COMPANY' },
                    { id: 'contact', label: 'CONTACT' },
                    { id: 'email', label: 'EMAIL' },
                    { id: 'owner', label: 'LEAD OWNER' },
                    { id: 'type', label: 'TYPE OF LEAD' },
                    { id: 'status', label: 'STATUS' },
                    { id: 'actions', label: 'ACTIONS' }
                  ].map(col => (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.includes(col.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setVisibleColumns(prev => [...prev, col.id]);
                          else setVisibleColumns(prev => prev.filter(c => c !== col.id));
                        }} 
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={15} />{errorMsg}
          </div>
        )}

        {/* Active View Render */}
        {activeView === 'KANBAN' && (
          <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '500px' }}>
            {LIFECYCLE_STAGES.map(stage => (
              <div key={stage.key} style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '0.5rem' }}>
                {/* Stage Header */}
                <div style={{ padding: '0.75rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: stage.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px' }}>{grouped[stage.key].length}</span>
                </div>
                <div style={{ height: '3px', background: stage.color, borderRadius: '3px', opacity: 0.3, margin: '0 0.5rem 0.5rem 0.5rem' }}></div>
                
                {/* Cards Container */}
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {loading ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
                  ) : grouped[stage.key].length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.6, border: '1px dashed var(--border-color)', borderRadius: '8px' }}>No records</div>
                  ) : (
                    grouped[stage.key].map(c => (
                      <div key={c.id} style={{ 
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', 
                        padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => openEditForm(c)}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{c.company_name}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.4rem', fontWeight: 500 }}>
                          <Users size={12} color="var(--text-muted)" /> {c.contact_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          <Mail size={12} /> {c.email}
                        </div>
                        
                        {/* Stage Advance */}
                        {stage.key === 'LEAD' && (
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(c.id, 'OPPORTUNITY');
                              }}
                              style={{ 
                                width: '100%', fontSize: '0.75rem', padding: '6px 8px', background: 'var(--bg-main)', 
                                border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                fontWeight: 600, transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = stage.color + '15'; e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.color = stage.color; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                            >
                              Convert to Deal <ArrowUpRight size={13} />
                            </button>
                          </div>
                        )}
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
                  {visibleColumns.includes('company') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMPANY</th>}
                  {visibleColumns.includes('contact') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CONTACT</th>}
                  {visibleColumns.includes('email') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>EMAIL</th>}
                  {visibleColumns.includes('owner') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>LEAD OWNER</th>}
                  {visibleColumns.includes('type') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TYPE OF LEAD</th>}
                  {visibleColumns.includes('status') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS</th>}
                  {visibleColumns.includes('actions') && <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {customers.filter(c => c.lifecycle_status === 'LEAD' || c.lifecycle_status === 'INACTIVE').length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No leads found</td></tr>
                ) : (
                  customers.filter(c => c.lifecycle_status === 'LEAD' || c.lifecycle_status === 'INACTIVE').map(c => (
                    <tr key={c.id} 
                        style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                        onClick={() => openEditForm(c)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {visibleColumns.includes('company') && <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{c.company_name}</td>}
                      {visibleColumns.includes('contact') && <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.contact_name}</td>}
                      {visibleColumns.includes('email') && <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.email}</td>}
                      {visibleColumns.includes('owner') && <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(c as any).custom_attributes?.lead_owner || '-'}</td>}
                      {visibleColumns.includes('type') && <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(c as any).custom_attributes?.type_of_lead || '-'}</td>}
                      {visibleColumns.includes('status') && <td style={{ padding: '1rem' }}><StatusPill status={c.lifecycle_status} /></td>}
                      {visibleColumns.includes('actions') && <td style={{ padding: '1rem' }}>
                        {c.lifecycle_status === 'LEAD' && (
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'OPPORTUNITY'); }} style={{ background: 'transparent', border: '1px solid #059669', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Convert to Deal</button>
                        )}
                      </td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'DASHBOARD' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#059669' }}>{grouped['LEAD']?.length || 0}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase' }}>Active Leads in Pipeline</div>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-muted)' }}>{grouped['INACTIVE']?.length || 0}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase' }}>Inactive Leads</div>
            </div>
          </div>
        )}

        {activeView === 'REPORT' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Lead Generation Report</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              This report provides a high-level summary of your lead generation funnel. Currently, there are <strong>{grouped['LEAD']?.length || 0}</strong> active leads awaiting conversion into deals. Ensure timely follow-ups to maximize your opportunity creation rate.
            </p>
          </div>
        )}
      </div>

      {/* Extended Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-main)', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '95vh', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.25rem' }}>{editingLeadId ? 'Edit Lead' : 'Create Lead'}</h3>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingLeadId(null); }} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '6px' }}><X size={16} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: 'var(--bg-card)' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><AlertCircle size={16} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><CheckCircle2 size={16} />{formSuccess}</div>}

              {/* Lead Info Section */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Lead Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Series</label>
                    <input type="text" readOnly {...register('series')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'not-allowed' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Product Title</label>
                    <input type="text" {...register('product_title')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lead Owner</label>
                    <input type="text" readOnly {...register('lead_owner')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'not-allowed' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Salutation</label>
                    <input type="text" {...register('salutation')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>First Name *</label>
                    <input type="text" {...register('first_name', { required: 'Required' })} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Middle Name</label>
                    <input type="text" {...register('middle_name')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Last Name</label>
                    <input type="text" {...register('last_name')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gender</label>
                    <input type="text" {...register('gender')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status *</label>
                    <select {...register('lifecycle_status')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      {LIFECYCLE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lead Potential *</label>
                    <select {...register('lead_potential')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Recontact Interval (days) *</label>
                    <input type="number" {...register('recontact_interval_days')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Request Type</label>
                    <select {...register('request_type')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <option value="">Select...</option>
                      <option value="Product Enquiry">Product Enquiry</option>
                      <option value="Request for Information">Request for Information</option>
                      <option value="Suggestion">Suggestion</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {watchRequestType === 'Other' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Other Request Type *</label>
                      <input type="text" {...register('request_type_other', { required: 'Required' })} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Type Of Lead</label>
                    <select {...register('type_of_lead')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <option value="By Call">By Call</option>
                      <option value="By Visit">By Visit</option>
                      <option value="By Email">By Email</option>
                      <option value="By Flyer">By Flyer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Contact Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email</label>
                    <input type="email" {...register('email')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mobile No</label>
                    <input type="text" {...register('mobile_no')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone</label>
                    <input type="text" {...register('phone')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>WhatsApp</label>
                    <input type="text" {...register('whatsapp')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Fax</label>
                    <input type="text" {...register('fax')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              {/* Organization Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Organization</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Organization Name *</label>
                    <input type="text" {...register('organization_name', { required: 'Required' })} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Revenue</label>
                    <input type="text" {...register('annual_revenue')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Territory</label>
                    <input type="text" {...register('territory')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>No of Employees</label>
                    <select {...register('no_of_employees')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="200+">200+</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Industry</label>
                    <input type="text" {...register('industry')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Market Segment</label>
                    <input type="text" {...register('market_segment')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              {/* Address & Contacts Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Address & Contacts</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '2 / 3' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>City</label>
                    <input type="text" {...register('city')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '2 / 3' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>State/Province</label>
                    <input type="text" {...register('state_province')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '2 / 3' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Country</label>
                    <input type="text" {...register('country')} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              <div style={{ position: 'sticky', bottom: '-1.5rem', background: 'var(--bg-card)', padding: '1rem 0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', height: '40px', padding: '0 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ background: '#059669', border: 'none', color: '#fff', height: '40px', padding: '0 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}>
                  {submitting ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
    </WorkspaceLayout>
  );
}
