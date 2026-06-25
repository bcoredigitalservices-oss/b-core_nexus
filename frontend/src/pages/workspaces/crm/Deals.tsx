import React, { useEffect, useState } from 'react';
import {
  TrendingUp, RefreshCw, AlertCircle, Search, Filter, ArrowUpRight,
  Users, Target, Mail, Calendar, DollarSign, BarChart2, PieChart
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

const DEAL_STAGES = [
  { key: 'QUALIFICATION',   label: 'Qualification',   color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  { key: 'PROPOSAL',        label: 'Proposal/Quote',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { key: 'NEGOTIATION',     label: 'Negotiation',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'CLOSED_WON',      label: 'Closed Won',      color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
];

const VIEWS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart2 },
  { id: 'LIST', label: 'List View', icon: Filter },
  { id: 'REPORT', label: 'Report', icon: TrendingUp },
  { id: 'KANBAN', label: 'Kanban', icon: Target },
];

function StatusPill({ status }: { status: string }) {
  const s = DEAL_STAGES.find(s => s.key === status) || DEAL_STAGES[0];
  return (
    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  lifecycle_status: string;
  custom_attributes: {
    deal_value?: number;
    deal_stage?: string;
    probability?: number;
    close_date?: string;
  };
  created_at: string;
}

export default function Deals() {
  const { authFetch } = useAppContext();
  const [deals, setDeals] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('KANBAN');

  const fetchDeals = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.append('search', search);
      const data = await authFetch(`/workspaces/crm/customers?${params}`);
      
      const filtered = (data.customers || []).filter((c: any) => {
        return c.lifecycle_status === 'OPPORTUNITY' || c.lifecycle_status === 'ACTIVE_CUSTOMER';
      }).map((c: any) => {
        if (c.lifecycle_status === 'ACTIVE_CUSTOMER') {
          if (!c.custom_attributes) c.custom_attributes = {};
          c.custom_attributes.deal_stage = 'CLOSED_WON';
        }
        return c;
      });

      setDeals(filtered);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load deals data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [search]);

  const updateDealStage = async (id: string, customer: Customer, newStage: string) => {
    try {
      const updatedAttributes = {
        ...customer.custom_attributes,
        deal_stage: newStage
      };

      const payload: any = {
        custom_attributes: updatedAttributes
      };
      
      if (newStage === 'CLOSED_WON') {
        payload.lifecycle_status = 'ACTIVE_CUSTOMER';
      }

      await authFetch(`/workspaces/crm/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      fetchDeals();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update stage.');
    }
  };
  const grouped: Record<string, Customer[]> = {};
  DEAL_STAGES.forEach(s => { grouped[s.key] = []; });
  deals.forEach(d => {
    const stage = d.custom_attributes?.deal_stage || 'QUALIFICATION';
    if (grouped[stage]) {
      grouped[stage].push(d);
    } else {
      grouped['QUALIFICATION'].push(d);
    }
  });

  // Calculate metrics
  const totalValue = deals.reduce((acc, d) => acc + (Number(d.custom_attributes?.deal_value) || 0), 0);
  const weightedValue = deals.reduce((acc, d) => {
    const val = Number(d.custom_attributes?.deal_value) || 0;
    const prob = Number(d.custom_attributes?.probability) || 50;
    return acc + (val * prob) / 100;
  }, 0);

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>Deals Pipeline</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Track negotiation stages, deal values, and win probabilities across active commercial opportunities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchDeals} disabled={loading} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)',
              height: '40px', padding: '0 0.85rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Top metrics summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Deals</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : deals.length}
            </h2>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Pipeline Value</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : `$${totalValue.toLocaleString()}`}
            </h2>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Weighted Pipeline Value</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
              {loading ? '...' : `$${Math.round(weightedValue).toLocaleString()}`}
            </h2>
          </div>
        </div>

        {/* Search + View Switcher */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search deals by company name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ 
                width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', height: '42px', 
                background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', height: '32px',
                  background: activeView === v.id ? 'var(--bg-card)' : 'transparent',
                  color: activeView === v.id ? '#059669' : 'var(--text-muted)',
                  border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem',
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeView === v.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <v.icon size={14} />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={15} />{errorMsg}
          </div>
        )}

        {/* View Layouts */}
        {activeView === 'KANBAN' && (
          <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '500px' }}>
            {DEAL_STAGES.map(stage => {
              const stageDeals = grouped[stage.key] || [];
              const stageValue = stageDeals.reduce((sum, d) => sum + (Number(d.custom_attributes?.deal_value) || 0), 0);

              return (
                <div key={stage.key} style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '0.5rem' }}>
                  {/* Column Header */}
                  <div style={{ padding: '0.75rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: stage.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px' }}>{stageDeals.length}</span>
                  </div>
                  <div style={{ height: '3px', background: stage.color, borderRadius: '3px', opacity: 0.3, margin: '0 0.5rem 0.5rem 0.5rem' }}></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem 0.5rem 0.5rem' }}>
                    Value: ${stageValue.toLocaleString()}
                  </div>

                  {/* Cards Container */}
                  <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {loading ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
                    ) : stageDeals.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.6, border: '1px dashed var(--border-color)', borderRadius: '8px' }}>No deals</div>
                    ) : (
                      stageDeals.map(d => {
                        const dealValue = Number(d.custom_attributes?.deal_value) || 0;
                        const prob = Number(d.custom_attributes?.probability) || 0;
                        const closeDate = d.custom_attributes?.close_date || '';

                        return (
                          <div key={d.id} style={{ 
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', 
                            padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>{d.company_name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                              <Users size={12} /> {d.contact_name}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                              <span style={{ fontWeight: 700, color: '#059669' }}>${dealValue.toLocaleString()}</span>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Prob: {prob}%</span>
                            </div>

                            {closeDate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                <Calendar size={12} /> Est. Close: {closeDate}
                              </div>
                            )}

                            {/* Advance button */}
                            {stage.key !== 'CLOSED_WON' && (
                              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIndex = DEAL_STAGES.findIndex(s => s.key === stage.key) + 1;
                                    const nextStage = DEAL_STAGES[nextIndex]?.key;
                                    if (nextStage) updateDealStage(d.id, d, nextStage);
                                  }}
                                  style={{
                                    width: '100%', fontSize: '0.75rem', padding: '6px 8px', background: 'var(--bg-main)', 
                                    border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', 
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    fontWeight: 600, transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = stage.color + '15'; e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.color = stage.color; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                                >
                                  Advance Stage <ArrowUpRight size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'LIST' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMPANY</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CONTACT</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>VALUE</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PROBABILITY</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>STAGE</th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>EST. CLOSE</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No deals found</td></tr>
                ) : (
                  deals.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{d.company_name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.contact_name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                        ${(Number(d.custom_attributes?.deal_value) || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {d.custom_attributes?.probability || 0}%
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <StatusPill status={d.custom_attributes?.deal_stage || 'QUALIFICATION'} />
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {d.custom_attributes?.close_date || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'DASHBOARD' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Deals by Stage</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {DEAL_STAGES.map(stage => {
                  const stageDeals = grouped[stage.key] || [];
                  const percent = deals.length > 0 ? (stageDeals.length / deals.length) * 100 : 0;
                  return (
                    <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                        <span style={{ color: stage.color }}>{stage.label}</span>
                        <span style={{ color: 'var(--text-main)' }}>{stageDeals.length} deals ({Math.round(percent)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: stage.color, borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Average Deal Value</h4>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#059669' }}>
                {deals.length > 0 ? `$${Math.round(totalValue / deals.length).toLocaleString()}` : '$0'}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Based on {deals.length} active opportunities</p>
            </div>
          </div>
        )}

        {activeView === 'REPORT' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Pipeline Value Projection</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Your currently tracked pipeline total value is <strong>${totalValue.toLocaleString()}</strong>.
              Factoring in probability estimates per stage, the weighted projection yields a realistic closing value of <strong>${Math.round(weightedValue).toLocaleString()}</strong>.
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
    </WorkspaceLayout>
  );
}
