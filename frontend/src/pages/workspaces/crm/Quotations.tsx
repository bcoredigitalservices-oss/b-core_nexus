import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FileText, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Trash2, ChevronLeft, ChevronRight, TrendingUp, Users, Target, Phone
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.12)' },
  SENT:     { label: 'Sent',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ACCEPTED: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  EXPIRED:  { label: 'Expired',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>{s.label}</span>;
}

interface Quotation { id: string; customer_id: string; quotation_reference: string; quotation_date: string; expiry_date?: string; status: string; grand_total: number; notes?: string; created_at: string; }
interface Customer { id: string; company_name: string; }
interface LineValue { description: string; quantity: string; unit_price: string; line_total: string; }
interface FormValues { customer_id: string; quotation_reference: string; quotation_date: string; expiry_date: string; status: string; notes: string; lines: LineValue[]; }

export default function Quotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const PAGE_SIZE = 15;

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: { customer_id: '', quotation_reference: `QT-${new Date().getFullYear()}-001`, quotation_date: new Date().toISOString().split('T')[0], expiry_date: '', status: 'DRAFT', notes: '', lines: [{ description: '', quantity: '1', unit_price: '0', line_total: '0' }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = watch('lines');

  useEffect(() => {
    watchedLines.forEach((line, i) => {
      const q = parseFloat(line.quantity) || 0;
      const p = parseFloat(line.unit_price) || 0;
      const expected = (q * p).toFixed(4);
      if (line.line_total !== expected) setValue(`lines.${i}.line_total`, expected);
    });
  }, [JSON.stringify(watchedLines)]);

  const grandTotal = watchedLines.reduce((acc, l) => acc + (parseFloat(l.line_total) || 0), 0);

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;
  const getToken = () => localStorage.getItem('bcore_token');

  const fetchAll = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const [qRes, custRes] = await Promise.all([
        fetch(`${API}/quotations?page=${page}&page_size=${PAGE_SIZE}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/customers?limit=500`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const qData = await qRes.json(); setQuotations(qData.items || []); setTotal(qData.total || 0);
      const custData = await custRes.json(); setCustomers(custData.customers || []);
    } catch { setErrorMsg('Failed to load quotations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [page]);

  const custMap = Object.fromEntries(customers.map(c => [c.id, c.company_name]));

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true); setFormError(''); setFormSuccess('');
    try {
      const payload = {
        customer_id: values.customer_id,
        quotation_reference: values.quotation_reference,
        quotation_date: values.quotation_date,
        expiry_date: values.expiry_date || null,
        status: values.status,
        notes: values.notes || null,
        grand_total: grandTotal,
        lines: values.lines.map(l => ({
          description: l.description,
          quantity: parseFloat(l.quantity),
          unit_price: parseFloat(l.unit_price),
          line_total: parseFloat(l.line_total),
        })),
      };
      const res = await fetch(`${API}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to create quotation.');
      }
      setFormSuccess('Quotation created!');
      setTimeout(() => { setIsModalOpen(false); fetchAll(); }, 900);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`${API}/quotations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAll();
  };

  const deleteQuotation = async (id: string) => {
    if (!confirm('Delete this quotation?')) return;
    await fetch(`${API}/quotations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    fetchAll();
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Quotations</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{total} quotations across all statuses</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchAll} disabled={loading} className="btn btn-secondary" style={{ height: '40px', padding: '0 0.75rem' }}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700 }}>
              <Plus size={15} /> New Quotation
            </button>
          </div>
        </div>

        {errorMsg && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><AlertCircle size={14} />{errorMsg}</div>}

        {/* Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Reference</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Expiry</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={22} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.75rem' }} /><br />Loading quotations...
                  </td></tr>
                ) : quotations.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No quotations found.</td></tr>
                ) : quotations.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>{q.quotation_reference}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-main)' }}>{custMap[q.customer_id] || q.customer_id.slice(0, 8)}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)' }}>{q.quotation_date}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)' }}>{q.expiry_date || '—'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}><StatusPill status={q.status} /></td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: '#fff' }}>${Number(q.grand_total).toFixed(2)}</td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {q.status === 'DRAFT' && (
                          <button onClick={() => updateStatus(q.id, 'SENT')} style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}>Send</button>
                        )}
                        {q.status === 'SENT' && (
                          <>
                            <button onClick={() => updateStatus(q.id, 'ACCEPTED')} style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', cursor: 'pointer' }}>Accept</button>
                            <button onClick={() => updateStatus(q.id, 'REJECTED')} style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>Reject</button>
                          </>
                        )}
                        <button onClick={() => deleteQuotation(q.id)} style={{ padding: '4px 6px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '6px', color: '#ff3366', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', height: '30px', fontSize: '0.75rem' }}><ChevronLeft size={13} /></button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= total} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', height: '30px', fontSize: '0.75rem' }}><ChevronRight size={13} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Create Quotation</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><AlertCircle size={14} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><CheckCircle2 size={14} />{formSuccess}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Customer *</label>
                  <select {...register('customer_id', { required: 'Required' })}>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                  {errors.customer_id && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.customer_id.message}</p>}
                </div>
                <div>
                  <label>Reference *</label>
                  <input type="text" {...register('quotation_reference', { required: 'Required' })} />
                  {errors.quotation_reference && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.quotation_reference.message}</p>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div><label>Date *</label><input type="date" {...register('quotation_date', { required: 'Required' })} /></div>
                <div><label>Expiry Date</label><input type="date" {...register('expiry_date')} /></div>
                <div>
                  <label>Status</label>
                  <select {...register('status')}>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                  </select>
                </div>
              </div>
              <div><label>Notes</label><textarea rows={2} placeholder="Optional notes..." {...register('notes')} /></div>

              {/* Line Items */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Line Items</span>
                  <button type="button" onClick={() => append({ description: '', quantity: '1', unit_price: '0', line_total: '0' })} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', borderRadius: '6px', color: '#00f2fe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> Add Line
                  </button>
                </div>
                {fields.map((field, i) => (
                  <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                    <div><input type="text" placeholder="Description" {...register(`lines.${i}.description`, { required: true })} /></div>
                    <div><input type="number" placeholder="Qty" step="0.01" {...register(`lines.${i}.quantity`)} /></div>
                    <div><input type="number" placeholder="Unit Price" step="0.01" {...register(`lines.${i}.unit_price`)} /></div>
                    <div>
                      <input type="number" readOnly style={{ background: 'rgba(0,0,0,0.3)', color: '#00f5a0' }} value={watchedLines[i]?.line_total || '0'} {...register(`lines.${i}.line_total`)} />
                    </div>
                    <button type="button" onClick={() => fields.length > 1 && remove(i)} style={{ padding: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '6px', color: '#ff3366', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                ))}
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#00f5a0', marginTop: '0.5rem' }}>
                  Total: ${grandTotal.toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Creating...' : 'Create Quotation'}
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
