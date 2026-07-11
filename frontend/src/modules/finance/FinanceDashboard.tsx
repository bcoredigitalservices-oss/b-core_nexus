import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Layers,
  BookOpen,
  FileText,
  Percent,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  is_active: boolean;
}

export default function FinanceDashboard() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg(err.message || 'An error occurred while fetching finance dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="flex h-full w-full bg-white overflow-hidden text-gray-800">
      <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-gray-50">
        <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              General Ledger & Financial Control
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Pluggable accounting environment. Enforces balanced debits/credits and account validation.
            </p>
          </div>
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '38px', padding: '0 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            Sync Ledger
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

        {/* Metric Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Card 1: Total Assets */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Assets
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  $1,245,680.00
                </h3>
              </div>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.15)'
              }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981' }}>
              <ArrowUpRight size={12} />
              <span>+4.2% from previous month</span>
            </div>
          </div>

          {/* Card 2: Total Liabilities */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Liabilities
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  $412,350.00
                </h3>
              </div>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <TrendingDown size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ef4444' }}>
              <ArrowDownRight size={12} />
              <span>-1.8% debt amortization</span>
            </div>
          </div>

          {/* Card 3: Net Revenue */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Net Revenue
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  $833,330.00
                </h3>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981' }}>
              <ArrowUpRight size={12} />
              <span>+12.4% fiscal year earnings</span>
            </div>
          </div>
        </div>

        {/* Chart of Accounts Summary */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Chart of Accounts (COA) Status
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
              Overview of general ledger accounts active in the double-entry matrix.
            </p>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '0.85rem' }}>Account Code</th>
                  <th style={{ padding: '0.85rem' }}>Account Name</th>
                  <th style={{ padding: '0.85rem' }}>Account Type</th>
                  <th style={{ padding: '0.85rem', textAlign: 'center' }}>Posting Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Querying ledger structures...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No accounts registered. Seed the Chart of Accounts to activate ledger entries.
                    </td>
                  </tr>
                ) : (
                  accounts.slice(0, 10).map((acc) => {
                    let typeColor = 'var(--text-main)';
                    if (acc.account_type === 'ASSET') typeColor = '#3b82f6';
                    else if (acc.account_type === 'LIABILITY') typeColor = '#f59e0b';
                    else if (acc.account_type === 'EQUITY') typeColor = '#a855f7';
                    else if (acc.account_type === 'REVENUE') typeColor = '#10b981';
                    else if (acc.account_type === 'EXPENSE') typeColor = '#ef4444';

                    return (
                      <tr key={acc.id} style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {acc.account_code}
                        </td>
                        <td style={{ padding: '0.85rem', color: 'var(--text-main)' }}>
                          {acc.account_name}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span style={{ color: typeColor, fontWeight: 600, fontSize: '0.8rem' }}>
                            {acc.account_type}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: acc.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: acc.is_active ? '#10b981' : '#ef4444',
                            border: `1px solid ${acc.is_active ? '#10b981' : '#ef4444'}33`
                          }}>
                            {acc.is_active ? 'Active' : 'Archived'}
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
        </div>
      </main>
    </div>
  );
}
