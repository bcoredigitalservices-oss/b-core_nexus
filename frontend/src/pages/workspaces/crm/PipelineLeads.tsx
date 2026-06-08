import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  TrendingUp, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Search, Filter, ArrowUpRight, Users, Target, Zap, Phone, Mail
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';

const CRM_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'crm',
  workspaceName: 'CRM',
  accentColor: '#00f2fe',
  icon: <Users size={18} />,
  navItems: [
    { label: 'Dashboard',          subPath: '',                icon: <TrendingUp size={15} /> },
    { label: 'Pipeline & Leads',   subPath: 'pipeline',        icon: <Target size={15} /> },
    { label: 'Customer Accounts',  subPath: 'accounts',        icon: <Users size={15} /> },
    { label: 'Sales Orders',       subPath: 'sales-orders',    icon: <TrendingUp size={15} /> },
    { label: 'Quotations',         subPath: 'quotations',      icon: <TrendingUp size={15} /> },
    { label: 'Contacts',           subPath: 'contacts',        icon: <Phone size={15} /> },
    { label: 'Tasks & ToDo',       subPath: 'tasks',           icon: <Target size={15} /> },
    { label: 'Interaction History', subPath: 'interactions',   icon: <TrendingUp size={15} /> },
  ],
};

const LIFECYCLE_STAGES = [
  { key: 'LEAD',            label: 'Lead',            color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'OPPORTUNITY',     label: 'Opportunity',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'ACTIVE_CUSTOMER', label: 'Active Customer', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'INACTIVE',        label: 'Inactive',        color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
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
  company_name: string; contact_name: string; email: string;
  phone: string; lifecycle_status: string;
}

export default function PipelineLeads() {
  const { authFetch } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { company_name: '', contact_name: '', email: '', phone: '', lifecycle_status: 'LEAD' }
  });

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.append('search', search);
      if (filterStatus) params.append('lifecycle_status', filterStatus);
      const res = await fetch(`${API}/customers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load pipeline data.');
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (e: any) { setErrorMsg(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true); setFormError(''); setFormSuccess('');
    try {
      const token = localStorage.getItem('bcore_token');
      const res = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to create record.');
      }
      setFormSuccess('Lead registered successfully!');
      setTimeout(() => { setIsModalOpen(false); fetchCustomers(); }, 1000);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, lifecycle_status: string) => {
    const token = localStorage.getItem('bcore_token');
    await fetch(`${API}/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lifecycle_status }),
    });
    fetchCustomers();
  };

  // Group by stage for kanban view
  const grouped: Record<string, Customer[]> = {};
  LIFECYCLE_STAGES.forEach(s => { grouped[s.key] = []; });
  customers.forEach(c => { if (grouped[c.lifecycle_status]) grouped[c.lifecycle_status].push(c); });

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Pipeline & Leads</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {total} records across {LIFECYCLE_STAGES.length} stages
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchCustomers} disabled={loading} className="btn btn-secondary" style={{ height: '40px', padding: '0 0.75rem' }}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700 }}>
              <Plus size={15} /> Add Lead
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'rgba(20,30,50,0.5)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem', height: '38px' }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ height: '38px', minWidth: '160px' }}>
            <option value="">All Stages</option>
            {LIFECYCLE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={fetchCustomers} className="btn btn-secondary" style={{ height: '38px' }}><Filter size={14} /> Apply</button>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={15} />{errorMsg}
          </div>
        )}

        {/* Kanban Board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1rem', alignItems: 'start' }}>
          {LIFECYCLE_STAGES.map(stage => (
            <div key={stage.key} style={{ background: 'rgba(20,30,50,0.45)', borderRadius: '14px', border: `1px solid ${stage.color}22`, overflow: 'hidden' }}>
              {/* Stage Header */}
              <div style={{ padding: '0.85rem 1rem', borderBottom: `2px solid ${stage.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${stage.color}08` }}>
                <span style={{ fontWeight: 700, color: stage.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stage.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: `${stage.color}20`, padding: '2px 8px', borderRadius: '10px' }}>{grouped[stage.key].length}</span>
              </div>
              {/* Cards */}
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '120px' }}>
                {loading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
                ) : grouped[stage.key].length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', opacity: 0.6 }}>No records</div>
                ) : (
                  grouped[stage.key].map(c => (
                    <div key={c.id} style={{ background: 'rgba(12,18,36,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: '0.25rem' }}>{c.company_name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{c.contact_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
                        <Mail size={11} />{c.email}
                      </div>
                      {/* Stage Advance */}
                      {stage.key !== 'ACTIVE_CUSTOMER' && stage.key !== 'INACTIVE' && (
                        <button
                          onClick={() => {
                            const next = LIFECYCLE_STAGES[LIFECYCLE_STAGES.findIndex(s => s.key === stage.key) + 1];
                            if (next) updateStatus(c.id, next.key);
                          }}
                          style={{ fontSize: '0.7rem', padding: '3px 8px', background: `${stage.color}18`, border: `1px solid ${stage.color}40`, borderRadius: '6px', color: stage.color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Advance <ArrowUpRight size={11} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {LIFECYCLE_STAGES.map(s => (
            <div key={s.key} style={{ background: 'rgba(20,30,50,0.45)', borderRadius: '12px', border: `1px solid ${s.color}20`, padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{grouped[s.key]?.length ?? 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#141b2e,#0c1224)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Register New Lead</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><AlertCircle size={14} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><CheckCircle2 size={14} />{formSuccess}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Company Name *</label>
                  <input type="text" placeholder="e.g. Acme Corp" {...register('company_name', { required: 'Required' })} />
                  {errors.company_name && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.company_name.message}</p>}
                </div>
                <div>
                  <label>Contact Name *</label>
                  <input type="text" placeholder="Primary contact" {...register('contact_name', { required: 'Required' })} />
                  {errors.contact_name && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.contact_name.message}</p>}
                </div>
              </div>
              <div>
                <label>Email *</label>
                <input type="email" placeholder="contact@company.com" {...register('email', { required: 'Required' })} />
                {errors.email && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.email.message}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Phone</label>
                  <input type="text" placeholder="+1 234 567 890" {...register('phone')} />
                </div>
                <div>
                  <label>Initial Stage *</label>
                  <select {...register('lifecycle_status')}>
                    {LIFECYCLE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Saving...' : 'Register Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </WorkspaceLayout>
  );
}
