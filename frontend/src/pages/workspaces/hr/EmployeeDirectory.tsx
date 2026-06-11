import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Users,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  UserCheck,
  Calendar,
  Download,
  Briefcase,
  CalendarDays,
  DollarSign,
  User
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const HR_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'hr',
  workspaceName: 'HR & Payroll',
  accentColor: '#10b981',
  icon: <Users size={18} />,
  navItems: [
    { label: 'HR Dashboard',        subPath: '',             icon: <Layers size={15} /> },
    { label: 'Employee Directory',   subPath: 'employees',    icon: <UserCheck size={15} /> },
    { label: 'Leave Management',     subPath: 'leaves',       icon: <Calendar size={15} /> },
    { label: 'Payroll Export',       subPath: 'payroll',      icon: <Download size={15} /> },
  ],
};

interface Employee {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  job_title: string;
  hire_date: string;
  base_salary: number;
  employment_status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

interface IamUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface EmployeeFormValues {
  first_name: string;
  last_name: string;
  job_title: string;
  hire_date: string;
  base_salary: number;
  user_id: string; // optional linked B-Core User ID
  employment_status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

export default function EmployeeDirectory() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // IAM Users (dropdown options)
  const [iamUsers, setIamUsers] = useState<IamUser[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormValues>({
    defaultValues: {
      first_name: '',
      last_name: '',
      job_title: '',
      hire_date: new Date().toISOString().split('T')[0],
      base_salary: 50000,
      user_id: '',
      employment_status: 'ACTIVE'
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/hr`;
  const AUTH_BASE = `${import.meta.env.VITE_API_URL}/api/v1/auth`;

  const fetchEmployees = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      let url = `${API_BASE}/employees?page=${page}&page_size=${pageSize}`;
      if (statusFilter) {
        url += `&employment_status=${statusFilter}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view HR Workspace.');
        }
        throw new Error('Failed to retrieve employee directory records.');
      }

      const data = await response.json();
      setEmployees(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching employee directory data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIamUsers = async () => {
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${AUTH_BASE}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIamUsers(data || []);
      }
    } catch (err) {
      console.warn('Could not load IAM users list for employee linking. Falling back to simple registration.', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, statusFilter, searchQuery]);

  const handleOpenModal = () => {
    reset({
      first_name: '',
      last_name: '',
      job_title: '',
      hire_date: new Date().toISOString().split('T')[0],
      base_salary: 50000,
      user_id: '',
      employment_status: 'ACTIVE'
    });
    setFormError('');
    setFormSuccess('');
    fetchIamUsers();
    setIsModalOpen(true);
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    // Prepare payload
    const payload: any = {
      first_name: values.first_name,
      last_name: values.last_name,
      job_title: values.job_title,
      hire_date: values.hire_date,
      base_salary: Number(values.base_salary),
      employment_status: values.employment_status,
      user_id: values.user_id === '' ? null : values.user_id,
    };

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to onboard employee.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Employee record registered successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchEmployees();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while onboard employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceLayout config={HR_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Employee Directory
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Manage full-time personnel directory, active contracts, and secure IAM credentials linkages.
            </p>
          </div>
          <button
            id="btn-onboard-employee"
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'var(--text-main)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            <Plus size={16} />
            Onboard Employee
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search directory by name or job title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{ height: '40px' }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ height: '40px' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
          </div>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '40px', padding: '0 0.75rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
          </button>
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

        {/* Employees Grid Table */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '1rem' }}>Employee Name</th>
                  <th style={{ padding: '1rem' }}>Job Title</th>
                  <th style={{ padding: '1rem' }}>Hire Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Base Salary</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Employment Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading Employee records...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No employees registered. Click "Onboard Employee" to add records.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    let pillColor = 'var(--text-main)';
                    let pillBg = 'rgba(203, 213, 225, 0.12)';
                    if (emp.employment_status === 'ACTIVE') {
                      pillColor = '#10b981'; // Active (Green)
                      pillBg = 'rgba(16, 185, 129, 0.12)';
                    } else if (emp.employment_status === 'ON_LEAVE') {
                      pillColor = '#f59e0b'; // Leave (Orange)
                      pillBg = 'rgba(245, 158, 11, 0.12)';
                    } else if (emp.employment_status === 'TERMINATED') {
                      pillColor = '#ef4444'; // Terminated (Red)
                      pillBg = 'rgba(239, 68, 68, 0.12)';
                    }

                    return (
                      <tr key={emp.id} style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {emp.first_name} {emp.last_name}
                          {emp.user_id && (
                            <span style={{
                              marginLeft: '8px',
                              padding: '1px 5px',
                              background: 'rgba(59,130,246,0.12)',
                              color: '#3b82f6',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              border: '1px solid rgba(59,130,246,0.2)'
                            }} title="Linked with IAM login profile">
                              IAM Linked
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={14} color="#10b981" />
                            {emp.job_title}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          {emp.hire_date}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                          ${Number(emp.base_salary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            {emp.employment_status}
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
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-card)'
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

      {/* ─── Onboarding Modal ─── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #141b2e 0%, #0c1224 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(16,185,129,0.1)',
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
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card-hover)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                Onboard New Employee
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

              {/* Name fields */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>First Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    {...register('first_name', { required: 'First name is required' })}
                  />
                  {errors.first_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.first_name.message}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label>Last Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    {...register('last_name', { required: 'Last name is required' })}
                  />
                  {errors.last_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.last_name.message}</p>}
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label>Job Title *</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    style={{ paddingLeft: '2.2rem' }}
                    {...register('job_title', { required: 'Job title is required' })}
                  />
                </div>
                {errors.job_title && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.job_title.message}</p>}
              </div>

              {/* Hire Date & Base Salary */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Hire Date *</label>
                  <div style={{ position: 'relative' }}>
                    <CalendarDays size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="date"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('hire_date', { required: 'Hire date is required' })}
                    />
                  </div>
                  {errors.hire_date && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.hire_date.message}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label>Base Salary (USD/yr) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      placeholder="e.g. 75000"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('base_salary', {
                        required: 'Base salary is required',
                        min: { value: 1, message: 'Salary must be greater than 0' }
                      })}
                    />
                  </div>
                  {errors.base_salary && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.base_salary.message}</p>}
                </div>
              </div>

              {/* Optional IAM User link */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} color="#10b981" />
                  <span>Link IAM User Profile (Optional)</span>
                </label>
                <select {...register('user_id')}>
                  <option value="">-- Do Not Link (Unlinked Profile) --</option>
                  {iamUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email} {user.first_name || user.last_name ? `(${user.first_name || ''} ${user.last_name || ''})` : ''}
                    </option>
                  ))}
                </select>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
                  Allows the employee to authenticate and log in to link directories.
                </p>
              </div>

              {/* Status */}
              <div>
                <label>Employment Status *</label>
                <select {...register('employment_status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.25rem',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '38px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    height: '38px',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                  }}
                >
                  {submitting ? 'Onboarding...' : 'Onboard Employee'}
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
