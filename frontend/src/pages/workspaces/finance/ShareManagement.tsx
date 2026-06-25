import React, { useState } from 'react';
import { Briefcase, Plus, Filter, Users, RefreshCw, X } from 'lucide-react';
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function ShareManagement() {
  const [activeTab, setActiveTab] = useState<'shareholders' | 'transfers' | 'dividends'>('shareholders');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  let accentColor = '#8b5cf6';
  if (activeTab === 'transfers') accentColor = '#3b82f6';
  if (activeTab === 'dividends') accentColor = '#10b981';

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {/* Sliding Drawer for Create Form */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: isDrawerOpen ? 0 : '-400px',
          width: '400px',
          height: '100vh',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {activeTab === 'shareholders' ? 'New Shareholder' : activeTab === 'transfers' ? 'Record Transfer' : 'Declare Dividend'}
          </h3>
          <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeTab === 'shareholders' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Shareholder Name</label>
                <input type="text" placeholder="John Doe" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Email Address</label>
                <input type="email" placeholder="john@example.com" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Initial Shares</label>
                <input type="number" placeholder="1000" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
            </>
          ) : activeTab === 'transfers' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>From Shareholder</label>
                <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}>
                  <option>Select sender...</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>To Shareholder</label>
                <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}>
                  <option>Select receiver...</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Quantity</label>
                <input type="number" placeholder="500" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Dividend Amount per Share</label>
                <input type="number" placeholder="0.50" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Declaration Date</label>
                <input type="date" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
            </>
          )}
          <button 
            style={{ 
              marginTop: 'auto', 
              background: accentColor, 
              color: '#fff', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${accentColor}40`
            }}
            onClick={() => setIsDrawerOpen(false)}
          >
            Save Record
          </button>
        </div>
      </div>

      {/* Main Content Backdrop Overlay */}
      {isDrawerOpen && (
        <div 
          onClick={() => setIsDrawerOpen(false)} 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)', zIndex: 99, cursor: 'pointer' }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', opacity: isDrawerOpen ? 0.8 : 1, transition: 'opacity 0.2s' }}>
        
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
              <Briefcase size={32} />
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
                  Shareholder Equity
                </h1>
                <span 
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: `linear-gradient(135deg, ${accentColor}, ${activeTab === 'shareholders' ? '#6d28d9' : activeTab === 'transfers' ? '#2563eb' : '#059669'})`,
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    boxShadow: `0 4px 12px ${accentColor}40`
                  }}
                >
                  {activeTab === 'shareholders' ? 'Registry' : activeTab === 'transfers' ? 'Transfers' : 'Dividends'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                Manage company shares, transfers, and dividend distributions.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', zIndex: 1 }}>
            <button 
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontWeight: 600,
                height: '42px',
                padding: '0 1.25rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}
            >
              <Filter size={16} /> Filters
            </button>
            <button 
              onClick={() => setIsDrawerOpen(true)}
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
              <Plus size={18} /> {activeTab === 'shareholders' ? 'New Shareholder' : activeTab === 'transfers' ? 'Record Transfer' : 'Declare Dividend'}
            </button>
          </div>
        </div>

        {/* View Switcher / Custom Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', width: 'max-content' }}>
          <button
            onClick={() => setActiveTab('shareholders')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'shareholders' ? '#8b5cf615' : 'transparent',
              color: activeTab === 'shareholders' ? '#8b5cf6' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Users size={16} /> Shareholders Registry
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'transfers' ? '#3b82f615' : 'transparent',
              color: activeTab === 'transfers' ? '#3b82f6' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={16} /> Share Transfers
          </button>
          <button
            onClick={() => setActiveTab('dividends')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === 'dividends' ? '#10b98115' : 'transparent',
              color: activeTab === 'dividends' ? '#10b981' : 'var(--text-muted)',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Briefcase size={16} /> Dividends
          </button>
        </div>

        {/* Data Grid Container */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <UniversalDataGrid 
            endpointUrl={`/api/v1/workspaces/finance/shares?type=${activeTab}`} 
            title=""
            columns={
              activeTab === 'shareholders' ? [
                { key: 'select', label: '☐', sortable: false },
                { key: 'shareholder_name', label: 'Shareholder', sortable: true },
                { key: 'folio_number', label: 'Folio No.', sortable: true },
                { key: 'total_shares', label: 'Total Shares', sortable: true },
                { key: 'equity_percentage', label: 'Equity (%)', sortable: true },
                { key: 'status', label: 'Status', sortable: true }
              ] : activeTab === 'transfers' ? [
                { key: 'select', label: '☐', sortable: false },
                { key: 'transfer_date', label: 'Date', sortable: true },
                { key: 'from_folio', label: 'Transferor Folio', sortable: true },
                { key: 'to_folio', label: 'Transferee Folio', sortable: true },
                { key: 'no_of_shares', label: 'Shares', sortable: true },
                { key: 'status', label: 'Status', sortable: true }
              ] : [
                { key: 'select', label: '☐', sortable: false },
                { key: 'declaration_date', label: 'Declared On', sortable: true },
                { key: 'dividend_amount', label: 'Amt/Share', sortable: true },
                { key: 'total_payout', label: 'Total Payout', sortable: true },
                { key: 'payment_status', label: 'Status', sortable: true }
              ]
            } 
          />
        </div>

      </div>
    </div>
  );
}
