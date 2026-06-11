import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  TrendingUp, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Search, Filter, ArrowUpRight, Users, Target, Phone, Mail, DollarSign, Calendar, Landmark
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const DEAL_STAGES = [
  { key: 'QUALIFICATION',   label: 'Qualification',   color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { key: 'PROPOSAL',        label: 'Proposal/Quote',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'NEGOTIATION',     label: 'Negotiation',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'CLOSED_WON',      label: 'Closed Won',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
];

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  lifecycle_status: string;
  custom_attributes: {
    deal_value?: number;
    deal_stage?: string;
    probability?: number;
    close_date?: string;
  };
  created_at: string;
}

interface FormValues {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  deal_value: number;
  deal_stage: string;
  probability: number;
  close_date: string;
}

export default function Deals() {
  const { authFetch } = useAppContext();
  const [deals, setDeals] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      deal_value: 5000,
      deal_stage: 'QUALIFICATION',
      probability: 50,
      close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;

  const fetchDeals = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      // Fetch customers with status OPPORTUNITY
      const params = new URLSearchParams({ limit: '200', lifecycle_status: 'OPPORTUNITY' });
      if (search) params.append('search', search);
      const res = await fetch(`${API}/customers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load deals data.');
      const data = await res.json();
      setDeals(data.customers || []);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('bcore_token');
      const payload = {
        company_name: values.company_name,
        contact_name: values.contact_name,
        email: values.email,
        phone: values.phone || null,
        lifecycle_status: 'OPPORTUNITY',
        custom_attributes: {
          deal_value: Number(values.deal_value),
          deal_stage: values.deal_stage,
          probability: Number(values.probability),
          close_date: values.close_date
        }
      };

      const res = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to create deal.');
      }
      setFormSuccess('Deal created successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchDeals();
      }, 1000);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDealStage = async (id: string, customer: Customer, newStage: string) => {
    try {
      const token = localStorage.getItem('bcore_token');
      const updatedAttributes = {
        ...customer.custom_attributes,
        deal_stage: newStage
      };

      // If moving to CLOSED_WON, optionally we can keep lifecycle_status as OPPORTUNITY or advance it. Let's keep it as OPPORTUNITY but stage CLOSED_WON.
      const res = await fetch(`${API}/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          custom_attributes: updatedAttributes
        }),
      });

      if (!res.ok) throw new Error('Failed to update stage.');
      fetchDeals();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // Group by deal stage
  const grouped: Record<string, Customer[]> = {};
  DEAL_STAGES.forEach(s => { grouped[s.key] = []; });
  deals.forEach(d => {
    const stage = d.custom_attributes?.deal_stage || 'QUALIFICATION';
    if (grouped[stage]) {
      grouped[stage].push(d);
    } else {
      grouped['QUALIFICATION'].push(d);
    }
  });

  // Calculate metrics
  const totalValue = deals.reduce((acc, d) => acc + (Number(d.custom_attributes?.deal_value) || 0), 0);
  const weightedValue = deals.reduce((acc, d) => {
    const val = Number(d.custom_attributes?.deal_value) || 0;
    const prob = Number(d.custom_attributes?.probability) || 50;
    return acc + (val * prob) / 100;
  }, 0);

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Deals Pipeline</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Track negotiation stages, deal values, and win probabilities across active commercial opportunities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchDeals} disabled={loading} className="btn btn-secondary" style={{ height: '40px', padding: '0 0.75rem' }}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f5a0,#00d980)', color: 'var(--text-main)', fontWeight: 700 }}>
              <Plus size={15} /> Add Deal
            </button>
          </div>
        </div>

        {/* Top metrics summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Deals</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : deals.length}
            </h2>
          </div>
          <div className="glass-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Pipeline Value</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00f5a0', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : `$${totalValue.toLocaleString()}`}
            </h2>
          </div>
          <div className="glass-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Weighted Pipeline Value</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : `$${Math.round(weightedValue).toLocaleString()}`}
            </h2>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-card)', padding: '1.0rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search deals by company name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchDeals()} style={{ paddingLeft: '2.2rem', height: '38px' }} />
          </div>
          <button onClick={fetchDeals} className="btn btn-secondary" style={{ height: '38px' }}><Filter size={14} /> Filter</button>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={15} />{errorMsg}
          </div>
        )}

        {/* Kanban Board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          {DEAL_STAGES.map(stage => {
            const stageDeals = grouped[stage.key] || [];
            const stageValue = stageDeals.reduce((sum, d) => sum + (Number(d.custom_attributes?.deal_value) || 0), 0);

            return (
              <div key={stage.key} style={{ background: 'var(--bg-card)', borderRadius: '14px', border: `1px solid ${stage.color}22`, overflow: 'hidden' }}>
                {/* Column Header */}
                <div style={{ padding: '0.85rem 1rem', borderBottom: `2px solid ${stage.color}30`, display: 'flex', flexDirection: 'column', gap: '4px', background: `${stage.color}08` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: stage.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stage.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: `${stage.color}20`, padding: '2px 8px', borderRadius: '10px' }}>{stageDeals.length}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Value: ${stageValue.toLocaleString()}
                  </div>
                </div>

                {/* Cards Container */}
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '150px' }}>
                  {loading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
                  ) : stageDeals.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', opacity: 0.6 }}>No deals</div>
                  ) : (
                    stageDeals.map(d => {
                      const dealValue = Number(d.custom_attributes?.deal_value) || 0;
                      const prob = Number(d.custom_attributes?.probability) || 0;
                      const closeDate = d.custom_attributes?.close_date || '';

                      return (
                        <div key={d.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: '0.25rem' }}>{d.company_name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{d.contact_name}</div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#00f5a0' }}>${dealValue.toLocaleString()}</span>
                            <span style={{ color: 'var(--text-muted)' }}>Prob: {prob}%</span>
                          </div>

                          {closeDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                              <Calendar size={11} /> Est: {closeDate}
                            </div>
                          )}

                          {/* Advance/Actions */}
                          {stage.key !== 'CLOSED_WON' && (
                            <button
                              onClick={() => {
                                const nextIndex = DEAL_STAGES.findIndex(s => s.key === stage.key) + 1;
                                const nextStage = DEAL_STAGES[nextIndex]?.key;
                                if (nextStage) updateDealStage(d.id, d, nextStage);
                              }}
                              style={{
                                fontSize: '0.7rem',
                                padding: '3px 8px',
                                background: `${stage.color}18`,
                                border: `1px solid ${stage.color}40`,
                                borderRadius: '6px',
                                color: stage.color,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content'
                              }}
                            >
                              Advance <ArrowUpRight size={11} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Add New Deal</h3>
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
                  <label>Deal Value (USD) *</label>
                  <input type="number" {...register('deal_value', { required: 'Required', min: 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Probability (%) *</label>
                  <input type="number" min="0" max="100" {...register('probability', { required: 'Required' })} />
                </div>
                <div>
                  <label>Initial Stage</label>
                  <select {...register('deal_stage')}>
                    {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label>Target Close Date *</label>
                <input type="date" {...register('close_date', { required: 'Required' })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Saving...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
