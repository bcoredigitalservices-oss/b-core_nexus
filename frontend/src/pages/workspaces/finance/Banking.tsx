import React, { useState } from 'react';
import { Landmark, Plus, Filter, Calendar, X } from 'lucide-react';
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

export default function Banking() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const accentColor = '#0ea5e9'; // Sky Blue

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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Upload Statement</h3>
          <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Bank Account</label>
            <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}>
              <option>Main Operating Account</option>
              <option>Payroll Account</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Upload CSV/PDF</label>
            <input type="file" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Statement Date</label>
            <input type="date" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
          </div>
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
            Process Upload
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
              <Landmark size={32} />
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
                  Bank Clearance
                </h1>
                <span 
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: `linear-gradient(135deg, ${accentColor}, #0284c7)`,
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    boxShadow: `0 4px 12px ${accentColor}40`
                  }}
                >
                  Clearance & Statements
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                Upload statements and reconcile bank transactions seamlessly.
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
              <Plus size={18} /> Upload Statement
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  width: '200px', padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  width: '200px', padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Account</label>
            <select
              style={{
                width: '200px', padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)',
                borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem'
              }}
            >
              <option value="">Select Account...</option>
              <option value="main">Main Operating Account</option>
              <option value="payroll">Payroll Account</option>
            </select>
          </div>

          <button 
            style={{
              marginTop: '1.2rem',
              background: 'var(--bg-main)', border: '1px solid var(--border-color)',
              color: 'var(--text-main)', fontWeight: 600, height: '36px',
              padding: '0 1.25rem', borderRadius: '8px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Data Grid Container */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <UniversalDataGrid 
            endpointUrl={`/api/v1/workspaces/finance/payments?from_date=${fromDate}&to_date=${toDate}`}
            title=""
            columns={[
              { key: 'select', label: '☐', sortable: false },
              { key: 'payment_reference', label: 'Payment Entry', sortable: true },
              { key: 'amount', label: 'Amount', sortable: true },
              { key: 'payment_method', label: 'Payment Method', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'payment_date', label: 'Payment Date', sortable: true },
              { key: 'actions', label: '⚙', sortable: false }
            ]} 
          />
        </div>

      </div>
    </div>
  );
}
