import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  MessageSquare, Plus, X, AlertCircle, CheckCircle2, RefreshCw,
  Phone, Mail, Users, TrendingUp, Target, FileText
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const INTERACTION_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  CALL:    { icon: <Phone size={14} />,        color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  EMAIL:   { icon: <Mail size={14} />,         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  MEETING: { icon: <Users size={14} />,        color: 'var(--accent-primary)', bg: 'rgba(157,78,221,0.12)' },
  NOTE:    { icon: <MessageSquare size={14} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

interface Interaction { id: string; customer_id: string; interaction_type: string; summary: string; logged_by_user_id: string; timestamp: string; }
interface Customer { id: string; company_name: string; }
interface FormValues { customer_id: string; interaction_type: string; summary: string; }

export default function InteractionHistory() {
  const { currentUser } = useAppContext();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { customer_id: '', interaction_type: 'NOTE', summary: '' }
  });

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;
  const getToken = () => localStorage.getItem('bcore_token');

  const fetchAll = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterCustomer) params.append('customer_id', filterCustomer);
      const [intRes, custRes] = await Promise.all([
        fetch(`${API}/interactions?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/customers?limit=500`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const intData = await intRes.json();
      setInteractions(Array.isArray(intData) ? intData : []);
      const custData = await custRes.json(); setCustomers(custData.customers || []);
    } catch { setErrorMsg('Failed to load interaction history.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [filterCustomer]);

  const custMap = Object.fromEntries(customers.map(c => [c.id, c.company_name]));

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true); setFormError(''); setFormSuccess('');
    try {
      const payload = {
        ...values,
        logged_by_user_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        custom_attributes: {},
      };
      const res = await fetch(`${API}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to log interaction.');
      }
      setFormSuccess('Interaction logged!');
      setTimeout(() => { setIsModalOpen(false); fetchAll(); }, 800);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Interaction History</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Chronological activity log for all customer touchpoints</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} style={{ height: '38px', minWidth: '180px' }}>
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
            <button onClick={fetchAll} disabled={loading} className="btn btn-secondary" style={{ height: '38px', padding: '0 0.75rem' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700 }}>
              <Plus size={15} /> Log Interaction
            </button>
          </div>
        </div>

        {errorMsg && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><AlertCircle size={14} />{errorMsg}</div>}

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}><RefreshCw size={22} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.75rem' }} /><br />Loading...</div>
        ) : interactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            No interactions logged yet. Start by logging your first touchpoint.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {interactions.map((interaction, idx) => {
              const tc = INTERACTION_TYPE_CONFIG[interaction.interaction_type] || INTERACTION_TYPE_CONFIG.NOTE;
              return (
                <div key={interaction.id} style={{ display: 'flex', gap: '1rem', position: 'relative', paddingBottom: '1rem' }}>
                  {/* Timeline line */}
                  {idx < interactions.length - 1 && (
                    <div style={{ position: 'absolute', left: '19px', top: '38px', bottom: 0, width: '2px', background: 'rgba(255,255,255,0.06)' }} />
                  )}
                  {/* Icon */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: tc.bg, border: `1px solid ${tc.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.color, flexShrink: 0, marginTop: '0.25rem' }}>
                    {tc.icon}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.9rem 1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: tc.bg, color: tc.color, border: `1px solid ${tc.color}30` }}>{interaction.interaction_type}</span>
                        {custMap[interaction.customer_id] && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f2fe' }}>{custMap[interaction.customer_id]}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatTime(interaction.timestamp)}</span>
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>{interaction.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Interaction Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Log Interaction</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><AlertCircle size={14} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><CheckCircle2 size={14} />{formSuccess}</div>}
              <div>
                <label>Customer *</label>
                <select {...register('customer_id', { required: 'Customer required' })}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                {errors.customer_id && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.customer_id.message}</p>}
              </div>
              <div>
                <label>Type *</label>
                <select {...register('interaction_type')}>
                  <option value="CALL">📞 Call</option>
                  <option value="EMAIL">✉️ Email</option>
                  <option value="MEETING">🤝 Meeting</option>
                  <option value="NOTE">📝 Note</option>
                </select>
              </div>
              <div>
                <label>Summary *</label>
                <textarea rows={4} placeholder="Describe what happened..." {...register('summary', { required: 'Summary required' })} />
                {errors.summary && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.summary.message}</p>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Logging...' : 'Log Interaction'}
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
