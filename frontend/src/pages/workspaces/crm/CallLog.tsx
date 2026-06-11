import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Phone, Plus, X, AlertCircle, CheckCircle2, RefreshCw,
  Search, Users, MessageSquare, Calendar, Trash2
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Interaction {
  id: string;
  customer_id: string;
  interaction_type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  summary: string;
  logged_by_user_id: string;
  timestamp: string;
}

interface Customer {
  id: string;
  company_name: string;
}

interface FormValues {
  customer_id: string;
  summary: string;
  duration_minutes: number;
  outcome: string;
}

export default function CallLog() {
  const { currentUser } = useAppContext();
  const [calls, setCalls] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { customer_id: '', summary: '', duration_minutes: 5, outcome: 'Connected' }
  });

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;
  const getToken = () => localStorage.getItem('bcore_token');

  const fetchCalls = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [intRes, custRes] = await Promise.all([
        fetch(`${API}/interactions?limit=200`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/customers?limit=500`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const intData = await intRes.json();
      const allInteractions = Array.isArray(intData) ? intData : [];
      // Filter only CALL interactions
      setCalls(allInteractions.filter((i: Interaction) => i.interaction_type === 'CALL'));
      
      const custData = await custRes.json();
      setCustomers(custData.customers || []);
    } catch {
      setErrorMsg('Failed to load call logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const custMap = Object.fromEntries(customers.map(c => [c.id, c.company_name]));

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      // Append outcome and duration details inside the summary or custom attributes
      const fullSummary = `[Call Duration: ${values.duration_minutes}m, Outcome: ${values.outcome}] - ${values.summary}`;
      
      const payload = {
        customer_id: values.customer_id,
        interaction_type: 'CALL',
        summary: fullSummary,
        logged_by_user_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        custom_attributes: {
          duration_minutes: Number(values.duration_minutes),
          outcome: values.outcome
        },
      };

      const res = await fetch(`${API}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to log call.');
      }
      setFormSuccess('Call logged successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchCalls();
      }, 900);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filter call log based on search query
  const filteredCalls = calls.filter(c => {
    const companyName = custMap[c.customer_id] || '';
    return companyName.toLowerCase().includes(search.toLowerCase()) || c.summary.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Call Log</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Track telephonic outreach, customer touchpoints, and call summaries.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchCalls} disabled={loading} className="btn btn-secondary" style={{ height: '40px', padding: '0 0.75rem' }}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f5a0,#00d980)', color: 'var(--text-main)', fontWeight: 700 }}>
              <Plus size={15} /> Log Call
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search call log..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem', height: '38px' }} />
          </div>
        </div>

        {errorMsg && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><AlertCircle size={14} />{errorMsg}</div>}

        {/* Table of Call Logs */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Call Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={22} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.75rem' }} /><br />Loading call log...
                    </td>
                  </tr>
                ) : filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No calls logged.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map(call => (
                    <tr key={call.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatTime(call.timestamp)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#00f5a0' }}>
                        {custMap[call.customer_id] || 'Unknown Customer'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 }}>
                            <Phone size={10} /> Call
                          </span>
                        </div>
                        {call.summary}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Call Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Log Phone Call</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><AlertCircle size={14} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><CheckCircle2 size={14} />{formSuccess}</div>}
              
              <div>
                <label>Customer *</label>
                <select {...register('customer_id', { required: 'Customer required' })}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                {errors.customer_id && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.customer_id.message}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Duration (Minutes) *</label>
                  <input type="number" min="1" {...register('duration_minutes', { required: 'Required' })} />
                </div>
                <div>
                  <label>Outcome</label>
                  <select {...register('outcome')}>
                    <option value="Connected">Connected</option>
                    <option value="Busy">Busy</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Wrong Number">Wrong Number</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Call Summary / Conversation Notes *</label>
                <textarea rows={4} placeholder="Describe the discussion outcome..." {...register('summary', { required: 'Notes required' })} />
                {errors.summary && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.summary.message}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Logging...' : 'Log Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
