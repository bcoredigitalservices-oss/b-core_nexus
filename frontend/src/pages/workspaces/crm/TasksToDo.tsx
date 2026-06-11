import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  CheckSquare, Plus, X, AlertCircle, CheckCircle2, RefreshCw,
  Calendar, Flag, Trash2, Users, TrendingUp, Target, Phone, Edit3
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  LOW:    { label: 'Low',    color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.12)', dot: 'var(--text-muted)' },
  MEDIUM: { label: 'Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  dot: '#3b82f6' },
  HIGH:   { label: 'High',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  URGENT: { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   dot: '#ef4444' },
};

const STATUS_COLUMNS = [
  { key: 'TODO',        label: 'To Do',       color: 'var(--text-muted)' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { key: 'DONE',        label: 'Done',        color: '#10b981' },
];

interface Task { id: string; title: string; description?: string; customer_id?: string; due_date?: string; status: string; priority: string; created_at: string; }
interface Customer { id: string; company_name: string; }
interface FormValues { title: string; description: string; customer_id: string; due_date: string; status: string; priority: string; }

export default function TasksToDo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { title: '', description: '', customer_id: '', due_date: '', status: 'TODO', priority: 'MEDIUM' }
  });

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;
  const getToken = () => localStorage.getItem('bcore_token');

  const fetchAll = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      const [taskRes, custRes] = await Promise.all([
        fetch(`${API}/tasks?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/customers?limit=500`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const taskData = await taskRes.json(); setTasks(taskData.items || []);
      const custData = await custRes.json(); setCustomers(custData.customers || []);
    } catch { setErrorMsg('Failed to load tasks.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [filterStatus, filterPriority]);

  const custMap = Object.fromEntries(customers.map(c => [c.id, c.company_name]));

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true); setFormError(''); setFormSuccess('');
    try {
      const payload = { ...values, customer_id: values.customer_id || null, due_date: values.due_date || null };
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to create task.');
      }
      setFormSuccess('Task created!');
      setTimeout(() => { setIsModalOpen(false); fetchAll(); }, 800);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    await fetch(`${API}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAll();
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    fetchAll();
  };

  const grouped: Record<string, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Tasks & To-Do</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{tasks.length} total · {grouped.TODO.length} open · {grouped.IN_PROGRESS.length} in progress</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ height: '38px', minWidth: '130px' }}>
              <option value="">All Priorities</option>
              {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
            </select>
            <button onClick={fetchAll} disabled={loading} className="btn btn-secondary" style={{ height: '38px', padding: '0 0.75rem' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { reset(); setFormError(''); setFormSuccess(''); setIsModalOpen(true); }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700 }}>
              <Plus size={15} /> New Task
            </button>
          </div>
        </div>

        {errorMsg && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}><AlertCircle size={14} />{errorMsg}</div>}

        {/* Kanban Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {STATUS_COLUMNS.map(col => (
            <div key={col.key} style={{ background: 'var(--bg-card)', borderRadius: '14px', border: `1px solid ${col.color}22`, overflow: 'hidden' }}>
              {/* Column Header */}
              <div style={{ padding: '0.85rem 1rem', borderBottom: `2px solid ${col.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${col.color}08` }}>
                <span style={{ fontWeight: 700, color: col.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: `${col.color}20`, padding: '2px 8px', borderRadius: '10px' }}>{grouped[col.key].length}</span>
              </div>
              {/* Task Cards */}
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '200px' }}>
                {loading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
                ) : grouped[col.key].length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', opacity: 0.6 }}>No tasks</div>
                ) : (
                  grouped[col.key].map(task => {
                    const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                    const isOverdue = task.due_date && task.due_date < todayStr && task.status !== 'DONE';
                    return (
                      <div key={task.id} style={{ background: 'var(--bg-card)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', flex: 1, lineHeight: 1.3 }}>{task.title}</div>
                          <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, background: pc.bg, color: pc.color, flexShrink: 0 }}>{pc.label}</span>
                        </div>
                        {task.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{task.description}</div>}
                        {task.customer_id && custMap[task.customer_id] && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>📋 {custMap[task.customer_id]}</div>
                        )}
                        {task.due_date && (
                          <div style={{ fontSize: '0.7rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.6rem' }}>
                            <Calendar size={10} />{task.due_date}{isOverdue ? ' ⚠ Overdue' : ''}
                          </div>
                        )}
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {col.key === 'TODO' && (
                            <button onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')} style={{ fontSize: '0.68rem', padding: '2px 7px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '5px', color: '#3b82f6', cursor: 'pointer' }}>Start</button>
                          )}
                          {col.key === 'IN_PROGRESS' && (
                            <button onClick={() => updateTaskStatus(task.id, 'DONE')} style={{ fontSize: '0.68rem', padding: '2px 7px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '5px', color: '#10b981', cursor: 'pointer' }}>✓ Done</button>
                          )}
                          {col.key === 'DONE' && (
                            <button onClick={() => updateTaskStatus(task.id, 'TODO')} style={{ fontSize: '0.68rem', padding: '2px 7px', background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: '5px', color: 'var(--text-muted)', cursor: 'pointer' }}>Reopen</button>
                          )}
                          <button onClick={() => deleteTask(task.id)} style={{ padding: '2px 5px', background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '5px', color: '#ff3366', cursor: 'pointer' }}><Trash2 size={10} /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Create Task</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><AlertCircle size={14} />{formError}</div>}
              {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}><CheckCircle2 size={14} />{formSuccess}</div>}
              <div>
                <label>Task Title *</label>
                <input type="text" placeholder="e.g. Follow up with client" {...register('title', { required: 'Title required' })} />
                {errors.title && <p style={{ color: '#ff3366', fontSize: '0.72rem', marginTop: '4px' }}>{errors.title.message}</p>}
              </div>
              <div><label>Description</label><textarea rows={2} placeholder="Optional details..." {...register('description')} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Priority</label>
                  <select {...register('priority')}>
                    {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                  </select>
                </div>
                <div>
                  <label>Status</label>
                  <select {...register('status')}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Due Date</label>
                  <input type="date" {...register('due_date')} />
                </div>
                <div>
                  <label>Linked Customer</label>
                  <select {...register('customer_id')}>
                    <option value="">No customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ height: '38px' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '38px' }}>
                  {submitting ? 'Creating...' : 'Create Task'}
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
