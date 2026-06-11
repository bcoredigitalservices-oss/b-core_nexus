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
  TrendingUp,
  History,
  Building,
  Mail,
  Phone,
  User,
  Calendar
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  lifecycle_status: 'LEAD' | 'OPPORTUNITY' | 'ACTIVE_CUSTOMER' | 'INACTIVE';
  created_at: string;
  custom_attributes: Record<string, any>;
}

interface CustomerFormValues {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  lifecycle_status: 'LEAD' | 'OPPORTUNITY' | 'ACTIVE_CUSTOMER' | 'INACTIVE';
}

export default function CustomerAccounts() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      lifecycle_status: 'LEAD'
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm`;

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      // Fetch with limit 500 for local searching/pagination
      const response = await fetch(`${API_BASE}/customers?limit=500`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view CRM Workspace.');
        }
        throw new Error('Failed to load customer records.');
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching customer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = () => {
    reset({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      lifecycle_status: 'LEAD'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to onboard lead.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Lead successfully onboarded!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchCustomers();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while onboarding customer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Local filtering & search
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || c.lifecycle_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Customer Accounts & Leads
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Access corporate accounts, lead contact information, and lifecycle sales statuses.
            </p>
          </div>
          <button
            id="btn-onboard-lead"
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #00f5a0, #00d285)',
              color: '#0b0f19',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,245,160,0.3)',
            }}
          >
            <Plus size={16} />
            Onboard New Lead
          </button>
        </div>

        {/* Search, Filter & Action Bar */}
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
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search by company, contact name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '40px' }}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '40px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="LEAD">Leads</option>
              <option value="OPPORTUNITY">Opportunities</option>
              <option value="ACTIVE_CUSTOMER">Active Customers</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '40px', padding: '0 0.75rem' }}
            title="Refresh list"
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

        {/* Accounts Roster Table */}
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
                  <th style={{ padding: '1rem' }}>Company Name</th>
                  <th style={{ padding: '1rem' }}>Primary Contact</th>
                  <th style={{ padding: '1rem' }}>Email Address</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Lifecycle Status</th>
                  <th style={{ padding: '1rem' }}>Creation Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading accounts database...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No customers match the current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    let pillColor = '#fbbf24'; // Lead (Yellow/Amber)
                    let pillBg = 'rgba(251, 191, 36, 0.12)';
                    if (c.lifecycle_status === 'OPPORTUNITY') {
                      pillColor = '#3b82f6'; // Opportunity (Blue)
                      pillBg = 'rgba(59, 130, 246, 0.12)';
                    } else if (c.lifecycle_status === 'ACTIVE_CUSTOMER') {
                      pillColor = '#00f5a0'; // Active (Green)
                      pillBg = 'rgba(0, 245, 160, 0.12)';
                    } else if (c.lifecycle_status === 'INACTIVE') {
                      pillColor = 'var(--text-muted)'; // Inactive (Gray)
                      pillBg = 'rgba(100, 116, 139, 0.12)';
                    }

                    return (
                      <tr key={c.id} style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building size={14} color="#00f5a0" />
                            {c.company_name}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={12} color='var(--text-muted)' />
                            {c.contact_name}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} color='var(--text-muted)' />
                            {c.email}
                          </div>
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
                            {c.lifecycle_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={12} color='var(--text-muted)' />
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Onboard Lead Modal ─── */}
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
            maxWidth: '500px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(0,245,160,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card-hover)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                Onboard New Lead / Customer File
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

            {/* Modal Body / Form */}
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
                  background: 'rgba(0,245,160,0.1)',
                  border: '1px solid rgba(0,245,160,0.2)',
                  color: '#00f5a0',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <CheckCircle2 size={14} />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Company Name */}
              <div>
                <label>Company / Organization Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    style={{ paddingLeft: '2.2rem' }}
                    {...register('company_name', { required: 'Company name is required' })}
                  />
                </div>
                {errors.company_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.company_name.message}</p>}
              </div>

              {/* Contact Name */}
              <div>
                <label>Primary Contact Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    style={{ paddingLeft: '2.2rem' }}
                    {...register('contact_name', { required: 'Contact name is required' })}
                  />
                </div>
                {errors.contact_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.contact_name.message}</p>}
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      placeholder="john@acme.com"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('email', { required: 'Email address is required' })}
                    />
                  </div>
                  {errors.email && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.email.message}</p>}
                </div>
                <div>
                  <label>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="+1 (555) 0199"
                      style={{ paddingLeft: '2.2rem' }}
                      {...register('phone')}
                    />
                  </div>
                </div>
              </div>

              {/* Lifecycle status */}
              <div>
                <label>Initial Lifecycle Status *</label>
                <select {...register('lifecycle_status')}>
                  <option value="LEAD">Lead (Identified touchpoint)</option>
                  <option value="OPPORTUNITY">Opportunity (Qualified target)</option>
                  <option value="ACTIVE_CUSTOMER">Active Customer (Contract active)</option>
                  <option value="INACTIVE">Inactive (Churned / Dormant)</option>
                </select>
              </div>

              {/* Modal Footer */}
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
                    background: 'linear-gradient(135deg, #00f5a0, #00d285)',
                    color: '#0b0f19',
                    fontWeight: 700,
                    height: '38px',
                    boxShadow: '0 4px 12px rgba(0,245,160,0.2)',
                  }}
                >
                  {submitting ? 'Onboarding...' : 'Onboard Lead'}
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
