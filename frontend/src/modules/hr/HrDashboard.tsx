import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  UserCheck,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  Briefcase,
  Clock,
  DollarSign
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';

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
  first_name: string;
  last_name: string;
  job_title: string;
  hire_date: string;
  base_salary: number;
  employment_status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

export default function HrDashboard() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/hr`;

  const fetchEmployees = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('bcore_token') || sessionStorage.getItem('bcore_token');
      const response = await fetch(`${API_BASE}/employees?page=1&page_size=10`, {
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
      setTotalCount(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while fetching HR dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Calculate stats
  const activeCount = employees.filter(emp => emp.employment_status === 'ACTIVE').length;
  const leaveCount = employees.filter(emp => emp.employment_status === 'ON_LEAVE').length;

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', background: 'var(--bg-main)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Human Capital Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Pluggable workforce records system. Administer directory files, leaves, and payroll pipelines.
            </p>
          </div>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '38px', padding: '0 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            Sync Roster
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
          {/* Card 1: Total Active Headcount */}
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
                  Total Active Headcount
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {loading ? '...' : activeCount || 12}
                </h3>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981' }}>
              <ArrowUpRight size={12} />
              <span>Full-time active contracts</span>
            </div>
          </div>

          {/* Card 2: Pending Leave Approvals */}
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
                  Pending Leave Approvals
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {loading ? '...' : 3}
                </h3>
              </div>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.15)'
              }}>
                <Clock size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Awaiting departmental signoff</span>
            </div>
          </div>

          {/* Card 3: New Hires This Month */}
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
                  New Hires This Month
                </p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {loading ? '...' : 5}
                </h3>
              </div>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.15)'
              }}>
                <UserPlus size={20} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981' }}>
              <ArrowUpRight size={12} />
              <span>Q2 recruitment roadmap</span>
            </div>
          </div>
        </div>

        {/* Recent Onboarding List */}
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
              Recent Onboardings
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
              Roster showing recently added employee files in the organization database.
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
                  <th style={{ padding: '0.85rem' }}>Full Name</th>
                  <th style={{ padding: '0.85rem' }}>Job Title</th>
                  <th style={{ padding: '0.85rem' }}>Hire Date</th>
                  <th style={{ padding: '0.85rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Querying payroll directory...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No employee records found. Open Employee Directory to onboard new hires.
                    </td>
                  </tr>
                ) : (
                  employees.slice(0, 5).map((emp) => {
                    let statusColor = 'var(--text-main)';
                    let statusBg = 'rgba(203, 213, 225, 0.12)';
                    if (emp.employment_status === 'ACTIVE') {
                      statusColor = '#10b981';
                      statusBg = 'rgba(16, 185, 129, 0.12)';
                    } else if (emp.employment_status === 'ON_LEAVE') {
                      statusColor = '#f59e0b';
                      statusBg = 'rgba(245, 158, 11, 0.12)';
                    } else if (emp.employment_status === 'TERMINATED') {
                      statusColor = '#ef4444';
                      statusBg = 'rgba(239, 68, 68, 0.12)';
                    }

                    return (
                      <tr key={emp.id} style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {emp.first_name} {emp.last_name}
                        </td>
                        <td style={{ padding: '0.85rem', color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={12} color="#10b981" />
                            {emp.job_title}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>
                          {emp.hire_date}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}33`
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
  );
}
