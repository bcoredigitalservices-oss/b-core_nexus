import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Phone, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Search, Mail, Briefcase, Star, Users, TrendingUp, Target, Trash2
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Contact {
  id: string; customer_id: string; first_name: string; last_name: string;
  email?: string; phone?: string; job_title?: string; is_primary: boolean; created_at: string;
}
interface Customer { id: string; company_name: string; contact_name: string; }
interface FormValues {
  customer_id: string; first_name: string; last_name: string;
  email: string; phone: string; job_title: string; is_primary: boolean;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { customer_id: '', first_name: '', last_name: '', email: '', phone: '', job_title: '', is_primary: false }
  });

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;

  const getToken = () => localStorage.getItem('bcore_token');

  const fetchAll = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (search) params.append('search', search);
      const [ctRes, custRes] = await Promise.all([
        fetch(`${API}/contacts?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/customers?limit=500`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const ctData = await ctRes.json(); setContacts(ctData.contacts || []);
      const custData = await custRes.json(); setCustomers(custData.customers || []);
    } catch { setErrorMsg('Failed to load contacts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const custMap = Object.fromEntries(customers.map(c => [c.id, c.company_name]));

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true); setFormError(''); setFormSuccess('');
    try {
      const res = await fetch(`${API}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...values, is_primary: Boolean(values.is_primary) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to create contact.');
      }
      setFormSuccess('Contact added successfully!');
      setTimeout(() => { setIsModalOpen(false); fetchAll(); }, 900);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    await fetch(`${API}/contacts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    fetchAll();
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Contact Directory</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{contacts.length} contacts registered</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchAll} disabled={loading} className="btn btn-secondary" style={{ height: '40px', padding: '0 0.75rem' }}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700 }}>
              <Plus size={15} /> Add Contact
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search contacts by name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchAll()} style={{ paddingLeft: '2.2rem', height: '38px' }} />
          </div>
          <button onClick={fetchAll} className="btn btn-secondary" style={{ height: '38px' }}>Search</button>
        </div>

        {errorMsg && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><AlertCircle size={14} />{errorMsg}</div>}

        {/* Grid of contact cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}><RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} /><br />Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>No contacts found. Add your first contact.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
            {contacts.map(c => (
              <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                {c.is_primary && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={10} /> Primary
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.9rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#00f2fe20,#3b82f620)', border: '1px solid rgba(0,242,254,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#00f2fe', fontSize: '1rem' }}>
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{c.first_name} {c.last_name}</div>
                    {c.job_title && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.job_title}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {c.email && <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Mail size={12} />{c.email}</span>}
                  {c.phone && <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Phone size={12} />{c.phone}</span>}
                  {custMap[c.customer_id] && <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Briefcase size={12} />{custMap[c.customer_id]}</span>}
                </div>
                <button onClick={() => deleteContact(c.id)} style={{ marginTop: '1rem', background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Add Contact</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><AlertCircle size={14} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><CheckCircle2 size={14} />{formSuccess}</div>}
              <div>
                <label>Linked Customer *</label>
                <select {...register('customer_id', { required: 'Customer required' })}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                {errors.customer_id && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.customer_id.message}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>First Name *</label>
                  <input type="text" {...register('first_name', { required: 'Required' })} />
                  {errors.first_name && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.first_name.message}</p>}
                </div>
                <div>
                  <label>Last Name *</label>
                  <input type="text" {...register('last_name', { required: 'Required' })} />
                  {errors.last_name && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.last_name.message}</p>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label>Email</label><input type="email" placeholder="email@company.com" {...register('email')} /></div>
                <div><label>Phone</label><input type="text" placeholder="+1 234 567 890" {...register('phone')} /></div>
              </div>
              <div><label>Job Title</label><input type="text" placeholder="e.g. Procurement Manager" {...register('job_title')} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" {...register('is_primary')} style={{ width: 'auto' }} />
                Mark as Primary Contact
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Saving...' : 'Add Contact'}
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
