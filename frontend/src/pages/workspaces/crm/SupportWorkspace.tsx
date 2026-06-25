import React, { useState } from 'react';
import { Headphones, Plus, AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

export default function SupportWorkspace() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([
    { id: '1', customer: 'Global Logix', issue: 'API Webhook retry payload latency too high', priority: 'High', status: 'Pending' },
    { id: '2', customer: 'Nexus Cargo', issue: 'Cold room thermostat calibration sensor fault', priority: 'Critical', status: 'Open' },
    { id: '3', customer: 'Transit Hubs Ltd', issue: 'Incorrect item ledger weight auto-calculated on purchase receipt', priority: 'Medium', status: 'Resolved' },
  ]);

  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;
  const pendingTicketsCount = tickets.filter(t => t.status === 'Pending').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        {/* Header Block */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(20, 30, 50, 0.4) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div 
              style={{
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Headphones size={28} color="#00f2fe" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Support & Helpdesk
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Manage customer service inquiries, configure ticket priorities and assign support tasks.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/workspace')}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back to Hub
          </button>
        </div>

        {/* Live calculated KPIs row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-card)', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Tickets</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{openTicketsCount}</h2>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '10px', color: '#ef4444' }}>
              <AlertCircle size={20} />
            </div>
          </div>

          <div className="glass-panel" style={{ background: 'var(--bg-card)', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Tickets</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{pendingTicketsCount}</h2>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>

          <div className="glass-panel" style={{ background: 'var(--bg-card)', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolved Tickets</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{resolvedTicketsCount}</h2>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Active Service Requests</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-main)' }}>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Inquiry Description</th>
                  <th style={{ padding: '1rem' }}>Priority</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.1rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{ticket.customer}</td>
                    <td style={{ padding: '1.1rem 1rem', color: 'var(--text-main)' }}>{ticket.issue}</td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        background: ticket.priority === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : ticket.priority === 'High' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: ticket.priority === 'Critical' ? '#ef4444' : ticket.priority === 'High' ? '#f59e0b' : '#3b82f6'
                      }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        background: ticket.status === 'Open' ? 'rgba(239, 68, 68, 0.08)' : ticket.status === 'Pending' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        color: ticket.status === 'Open' ? '#ef4444' : ticket.status === 'Pending' ? '#f59e0b' : '#10b981'
                      }}>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
    </WorkspaceLayout>
  );
}
