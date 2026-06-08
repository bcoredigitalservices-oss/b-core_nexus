import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Wallet,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  BookOpen,
  FileText,
  Percent,
  Hash,
  FileSignature,
  DollarSign
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const FINANCE_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'finance',
  workspaceName: 'Finance',
  accentColor: '#3b82f6',
  icon: <Wallet size={18} />,
  navItems: [
    { label: 'Financial Dashboard', subPath: '',             icon: <Layers size={15} /> },
    { label: 'Chart of Accounts',   subPath: 'accounts',     icon: <BookOpen size={15} /> },
    { label: 'Journal Entries',     subPath: 'journal',      icon: <FileText size={15} /> },
    { label: 'Tax Config',          subPath: 'tax',          icon: <Percent size={15} /> },
  ],
};

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  is_active: boolean;
}

interface AccountFormValues {
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}

export default function ChartOfAccounts() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // Grid/List State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountFormValues>({
    defaultValues: {
      account_code: '',
      account_name: '',
      account_type: 'ASSET'
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/finance`;

  const fetchAccounts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view Finance Workspace.');
        }
        throw new Error('Failed to retrieve Chart of Accounts records.');
      }

      const data = await response.json();
      setAccounts(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching account records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleMutation = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.workspace === 'finance' && (customEvent.detail?.entity === 'journal_entry' || customEvent.detail?.entity === 'account')) {
        console.log('[WS Trigger] Finance mutation received. Reloading chart of accounts...');
        fetchAccounts();
      }
    };
    window.addEventListener('STATE_MUTATION', handleMutation);
    return () => window.removeEventListener('STATE_MUTATION', handleMutation);
  }, []);

  const handleOpenModal = () => {
    reset({
      account_code: '',
      account_name: '',
      account_type: 'ASSET'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: AccountFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to register account.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('GL Account registered successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchAccounts();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while registering account.');
    } finally {
      setSubmitting(false);
    }
  };

  // Local filtering by search query
  const filteredAccounts = accounts.filter(acc => {
    return (
      acc.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.account_type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <WorkspaceLayout config={FINANCE_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Chart of Accounts (COA)
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Configure and audit General Ledger account codes representing your financial structure.
            </p>
          </div>
          <button
            id="btn-register-account"
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}
          >
            <Plus size={16} />
            Register New Account
          </button>
        </div>

        {/* Search & Action Bar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'rgba(20,30,50,0.5)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search accounts by code, name, or classification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '40px' }}
            />
          </div>
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '40px', padding: '0 0.75rem' }}
            title="Refresh Chart of Accounts"
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

        {/* Accounts Table */}
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
                  <th style={{ padding: '1rem', width: '20%' }}>Account Code</th>
                  <th style={{ padding: '1rem' }}>Account Name</th>
                  <th style={{ padding: '1rem', width: '25%' }}>Account Type</th>
                  <th style={{ padding: '1rem', textAlign: 'center', width: '20%' }}>Posting Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
                      Loading Chart of Accounts database...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No ledger accounts match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    let pillColor = '#cbd5e1';
                    let pillBg = 'rgba(203, 213, 225, 0.12)';
                    if (acc.account_type === 'ASSET') {
                      pillColor = '#3b82f6'; // Asset (Blue)
                      pillBg = 'rgba(59, 130, 246, 0.12)';
                    } else if (acc.account_type === 'LIABILITY') {
                      pillColor = '#f59e0b'; // Liability (Orange/Amber)
                      pillBg = 'rgba(245, 158, 11, 0.12)';
                    } else if (acc.account_type === 'EQUITY') {
                      pillColor = '#a855f7'; // Equity (Purple)
                      pillBg = 'rgba(168, 85, 247, 0.12)';
                    } else if (acc.account_type === 'REVENUE') {
                      pillColor = '#10b981'; // Revenue (Green)
                      pillBg = 'rgba(16, 185, 129, 0.12)';
                    } else if (acc.account_type === 'EXPENSE') {
                      pillColor = '#ef4444'; // Expense (Red)
                      pillBg = 'rgba(239, 68, 68, 0.12)';
                    }

                    return (
                      <tr key={acc.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Hash size={14} color="#3b82f6" />
                            {acc.account_code}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: '#e2e8f0' }}>
                          {acc.account_name}
                        </td>
                        <td style={{ padding: '1rem' }}>
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
                            {acc.account_type}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: acc.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: acc.is_active ? '#10b981' : '#ef4444',
                            border: `1px solid ${acc.is_active ? '#10b981' : '#ef4444'}33`
                          }}>
                            {acc.is_active ? 'Active' : 'Locked'}
                          </span>
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

      {/* ─── Account Creation Modal ─── */}
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
            maxWidth: '500px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 32px rgba(59,130,246,0.1)',
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
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                Register General Ledger Account
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

              {/* Account Code */}
              <div>
                <label>Account Code *</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. 1000, 2100"
                    style={{ paddingLeft: '2.2rem' }}
                    {...register('account_code', { 
                      required: 'Account code is required',
                      pattern: {
                        value: /^[a-zA-Z0-9-]+$/,
                        message: 'Account code must be alphanumeric'
                      }
                    })}
                  />
                </div>
                {errors.account_code && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.account_code.message}</p>}
              </div>

              {/* Account Name */}
              <div>
                <label>Account Name *</label>
                <div style={{ position: 'relative' }}>
                  <FileSignature size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. Cash in Bank, Accounts Payable"
                    style={{ paddingLeft: '2.2rem' }}
                    {...register('account_name', { required: 'Account name is required' })}
                  />
                </div>
                {errors.account_name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.account_name.message}</p>}
              </div>

              {/* Account Type Classification */}
              <div>
                <label>Account Type Classification *</label>
                <select {...register('account_type')}>
                  <option value="ASSET">ASSET (Balance Sheet - Resources Owned)</option>
                  <option value="LIABILITY">LIABILITY (Balance Sheet - Debts/Obligations)</option>
                  <option value="EQUITY">EQUITY (Balance Sheet - Owner Share)</option>
                  <option value="REVENUE">REVENUE (Income Statement - Earnings)</option>
                  <option value="EXPENSE">EXPENSE (Income Statement - Costs)</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
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
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#ffffff',
                    fontWeight: 700,
                    height: '38px',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
                  }}
                >
                  {submitting ? 'Registering...' : 'Register Account'}
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
