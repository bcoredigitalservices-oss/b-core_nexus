import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Activity,
  Layers,
  Briefcase,
  CheckSquare,
  Clock,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FolderOpen,
  User
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const OPERATIONS_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'operations',
  workspaceName: 'Operations',
  accentColor: '#06b6d4', // Vibrant Operations Cyan
  icon: <Activity size={18} />,
  navItems: [
    { label: 'Operations Overview', subPath: '',             icon: <Layers size={15} /> },
    { label: 'Active Projects',     subPath: 'projects',     icon: <Briefcase size={15} /> },
    { label: 'My Tasks',            subPath: 'tasks',        icon: <CheckSquare size={15} /> },
    { label: 'Timesheets',          subPath: 'timesheets',   icon: <Clock size={15} /> },
  ],
};

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
}

interface Project {
  id: string;
  project_name: string;
  customer_id: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  start_date: string;
  target_end_date: string;
}

interface ProjectFormValues {
  project_name: string;
  customer_id: string;
  start_date: string;
  target_end_date: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
}

export default function ActiveProjects() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Lookup Options
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProjectFormValues>({
    defaultValues: {
      project_name: '',
      customer_id: '',
      start_date: new Date().toISOString().split('T')[0],
      target_end_date: new Date().toISOString().split('T')[0],
      status: 'PLANNING'
    }
  });

  const watchStartDate = watch('start_date');

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/operations`;
  const CRM_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${CRM_BASE}/customers?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const custs = data.customers || [];
        setCustomers(custs);
        const map: Record<string, string> = {};
        custs.forEach((c: any) => {
          map[c.id] = c.company_name;
        });
        setCustomerMap(map);
      }
    } catch (err) {
      console.warn('Failed to load customers for project mapping.', err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/projects?page=${page}&page_size=${pageSize}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view operations projects.');
        }
        throw new Error('Failed to retrieve Operations project records.');
      }

      const data = await response.json();
      setProjects(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const handleOpenModal = () => {
    reset({
      project_name: '',
      customer_id: '',
      start_date: new Date().toISOString().split('T')[0],
      target_end_date: new Date().toISOString().split('T')[0],
      status: 'PLANNING'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to create project.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Project initialized successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchProjects();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceLayout config={OPERATIONS_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Active Projects
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Monitor scope, scheduling, and lifecycle state across client delivery projects.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={fetchProjects}
              disabled={loading}
              className="btn btn-secondary"
              style={{ height: '38px', padding: '0 0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button
              id="btn-init-project"
              onClick={handleOpenModal}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#0a0f1d',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(6,182,212,0.2)',
              }}
            >
              <Plus size={16} />
              Initialize Project
            </button>
          </div>
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
          background: 'rgba(20,30,50,0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  background: 'rgba(12,18,36,0.6)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '1rem' }}>Project Name</th>
                  <th style={{ padding: '1rem' }}>Linked Customer</th>
                  <th style={{ padding: '1rem' }}>Start Date</th>
                  <th style={{ padding: '1rem' }}>Target End Date</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading Projects...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No projects active. Click "Initialize Project" to register new project milestones.
                    </td>
                  </tr>
                ) : (
                  projects.map((proj) => {
                    let pillColor = '#94a3b8';
                    let pillBg = 'rgba(148, 163, 184, 0.12)';
                    if (proj.status === 'ACTIVE') {
                      pillColor = '#06b6d4';
                      pillBg = 'rgba(6, 182, 212, 0.12)';
                    } else if (proj.status === 'COMPLETED') {
                      pillColor = '#10b981';
                      pillBg = 'rgba(16, 185, 129, 0.12)';
                    } else if (proj.status === 'ON_HOLD') {
                      pillColor = '#f59e0b';
                      pillBg = 'rgba(245, 158, 11, 0.12)';
                    }

                    return (
                      <tr key={proj.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FolderOpen size={14} color="#06b6d4" />
                            {proj.project_name}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: '#e2e8f0' }}>
                          {customerMap[proj.customer_id] || proj.customer_id}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          {proj.start_date}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          {proj.target_end_date}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: pillBg,
                            color: pillColor,
                            border: `1px solid ${pillColor}22`
                          }}>
                            {proj.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {total > pageSize && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(12,18,36,0.4)'
            }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(total / pageSize)} ({total} records)
              </span>
              <button
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Project Creation Modal ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #141b2e 0%, #0c1224 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(6,182,212,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={18} color="#06b6d4" />
                Initialize New Project
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {formError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,51,102,0.1)',
                  border: '1px solid rgba(255,51,102,0.2)',
                  color: '#ff3366',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <CheckCircle2 size={14} />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Project Name */}
              <div>
                <label>Project Name *</label>
                <input
                  type="text"
                  placeholder="E.g., Warehouse Terminals Modernization"
                  {...register('project_name', { required: 'Project name is required' })}
                />
                {errors.project_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.project_name.message}</p>}
              </div>

              {/* Customer Select dropdown */}
              <div>
                <label>Customer *</label>
                <select
                  {...register('customer_id', { required: 'Customer is required' })}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_name})
                    </option>
                  ))}
                </select>
                {errors.customer_id && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.customer_id.message}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Start Date */}
                <div>
                  <label>Start Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="date"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('start_date', { required: 'Start date is required' })}
                    />
                  </div>
                  {errors.start_date && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.start_date.message}</p>}
                </div>

                {/* Target End Date */}
                <div>
                  <label>Target End Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="date"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('target_end_date', {
                        required: 'Target end date is required',
                        validate: value => value >= watchStartDate || 'End date cannot be earlier than start date'
                      })}
                    />
                  </div>
                  {errors.target_end_date && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.target_end_date.message}</p>}
                </div>
              </div>

              {/* Status */}
              <div>
                <label>Project Status *</label>
                <select {...register('status')}>
                  <option value="PLANNING">PLANNING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '38px', padding: '0 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: '#0a0f1d',
                    fontWeight: 700,
                    height: '38px',
                    padding: '0 1.5rem',
                    boxShadow: '0 4px 12px rgba(6,182,212,0.2)',
                  }}
                >
                  {submitting ? 'Initializing...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </WorkspaceLayout>
  );
}
