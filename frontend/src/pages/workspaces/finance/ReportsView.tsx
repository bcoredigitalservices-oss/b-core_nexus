import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, LineChart, PieChart, TrendingUp } from 'lucide-react';

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState<'balance' | 'profit' | 'cash' | 'trial'>('balance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    ASSET: 0,
    LIABILITY: 0,
    EQUITY: 0
  });

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('bcore_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/workspaces/finance/reports/balance-sheet`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReportData({
          ASSET: data.ASSET || 0,
          LIABILITY: data.LIABILITY || 0,
          EQUITY: data.EQUITY || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const profitLoss = reportData.ASSET - (reportData.LIABILITY + reportData.EQUITY);
  const accentColor = '#2563eb'; // Blue

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        
        {/* Premium Glassmorphic Header */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${accentColor}15 0%, var(--bg-card) 100%)`,
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 10px 30px ${accentColor}10`
          }}
        >
          {/* Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
                boxShadow: `0 0 25px ${accentColor}20`
              }}
            >
              <BarChart3 size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.4rem' }}>
                <h1 
                  style={{ 
                    fontSize: '2rem', 
                    fontWeight: 800, 
                    color: 'var(--text-main)', 
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em',
                    margin: 0
                  }}
                >
                  Financial Reports
                </h1>
                <span 
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: `linear-gradient(135deg, ${accentColor}, #1d4ed8)`,
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    boxShadow: `0 4px 12px ${accentColor}40`
                  }}
                >
                  Reporting Engine
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                Generate balance sheets, income statements, and cash flows.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', zIndex: 1 }}>
            <button 
              onClick={fetchBalanceSheet}
              style={{
                background: accentColor,
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                height: '42px',
                padding: '0 1.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: `0 4px 12px ${accentColor}40`
              }}
            >
              <TrendingUp size={18} /> {loading ? 'Loading...' : 'Generate New Report'}
            </button>
          </div>
        </div>

        {/* View Switcher / Custom Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', width: 'max-content' }}>
          <button
            onClick={() => setActiveTab('balance')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'balance' ? '#2563eb15' : 'transparent',
              color: activeTab === 'balance' ? '#2563eb' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={16} /> Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'profit' ? '#2563eb15' : 'transparent',
              color: activeTab === 'profit' ? '#2563eb' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LineChart size={16} /> Profit and Loss
          </button>
          <button
            onClick={() => setActiveTab('cash')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'cash' ? '#2563eb15' : 'transparent',
              color: activeTab === 'cash' ? '#2563eb' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <TrendingUp size={16} /> Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('trial')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'trial' ? '#2563eb15' : 'transparent',
              color: activeTab === 'trial' ? '#2563eb' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <PieChart size={16} /> Trial Balance
          </button>
        </div>

        {/* Detailed Filtering Block */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <input type="text" defaultValue="LNT Plants And Equipments" style={{ flex: 1, minWidth: '200px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }} />
          <input type="text" placeholder="Finance Book" style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }} />
          <select style={{ flex: 1, minWidth: '150px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }}><option>Fiscal Year</option></select>
          <input type="text" defaultValue="2026" style={{ flex: 1, minWidth: '100px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }} />
          <input type="text" defaultValue="2026" style={{ flex: 1, minWidth: '100px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }} />
          <select style={{ flex: 1, minWidth: '120px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-main)' }}><option>Yearly</option></select>
        </div>

        {/* KPI Display Grid */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '3rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {activeTab === 'balance' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Total Asset</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.025em' }}>
                  ₦ {Number(reportData.ASSET).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Total Liability</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.025em' }}>
                  ₦ {Number(reportData.LIABILITY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Total Equity</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.025em' }}>
                  ₦ {Number(reportData.EQUITY).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Provisional Profit / Loss</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: profitLoss >= 0 ? '#10b981' : '#ef4444', letterSpacing: '0.025em' }}>
                  ₦ {Number(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</h3>
              <p>Select parameters and generate a new report to view data here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
