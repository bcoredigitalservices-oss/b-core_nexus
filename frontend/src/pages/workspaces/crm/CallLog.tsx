import React, { useEffect, useState } from 'react';
import {
  Phone, Plus, X, AlertCircle, CheckCircle2, RefreshCw,
  Search, Users, MessageSquare, Calendar, Trash2, User,
  Clock, Shield, Award, Clipboard, ChevronRight, FileText, CheckSquare
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Interaction {
  id: string;
  customer_id: string;
  interaction_type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  summary: string;
  logged_by_user_id: string;
  timestamp: string;
  custom_attributes?: {
    caller_name?: string;
    client_type?: string;
    client_name?: string;
    contact_person?: string;
    call_status?: string;
    duration_minutes?: number;
    call_purpose?: string;
    follow_up_ref_type?: string;
    follow_up_ref?: string;
    lead_generated?: boolean;
    quotation_sent?: boolean;
    remarks?: string;
  };
}

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
}

export default function CallLog() {
  const { currentUser, authFetch } = useAppContext();
  const [calls, setCalls] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Interaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ERPNext-Style Call Log Form State
  const [callerName, setCallerName] = useState('');
  const [clientType, setClientType] = useState('Customer');
  const [customerId, setCustomerId] = useState('');
  const [clientNameInput, setClientNameInput] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [callStatus, setCallStatus] = useState('Answered');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [callPurpose, setCallPurpose] = useState('Follow-Up');
  const [followUpRefType, setFollowUpRefType] = useState('Lead');
  const [followUpRef, setFollowUpRef] = useState('');
  const [leadGenerated, setLeadGenerated] = useState(false);
  const [quotationSent, setQuotationSent] = useState(false);
  const [remarks, setRemarks] = useState('');

  const fetchCalls = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [intData, custData] = await Promise.all([
        authFetch('/workspaces/crm/interactions?limit=200'),
        authFetch('/workspaces/crm/customers?limit=500')
      ]);

      const allInteractions = Array.isArray(intData) ? intData : [];
      setCalls(allInteractions.filter((i: Interaction) => i.interaction_type === 'CALL'));
      setCustomers(custData.customers || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load call logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const custMap = Object.fromEntries(customers.map(c => [c.id, c.company_name]));
  const custContactMap = Object.fromEntries(customers.map(c => [c.id, c.contact_name]));

  // Auto-populate target name and contact person when customer dropdown changes
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const selected = customers.find(c => c.id === id);
    if (selected) {
      setClientNameInput(selected.company_name);
      setContactPerson(selected.contact_name);
    } else {
      setClientNameInput('');
      setContactPerson('');
    }
  };

  const openLogForm = () => {
    setCallerName(currentUser?.email || 'Administrator');
    setClientType('Customer');
    setCustomerId('');
    setClientNameInput('');
    setContactPerson('');
    setCallStatus('Answered');
    setDurationMinutes(5);
    setCallPurpose('Follow-Up');
    setFollowUpRefType('Lead');
    setFollowUpRef('');
    setLeadGenerated(false);
    setQuotationSent(false);
    setRemarks('');
    
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    if (!clientNameInput.trim() || !remarks.trim()) {
      setFormError('Please fill in the Client Name and Remarks fields.');
      setSubmitting(false);
      return;
    }

    try {
      // For fallback/compatibility, we build a summary text block and attach the attributes
      const fullSummary = `[${callPurpose} - ${callStatus}] (${durationMinutes} mins) - ${remarks.substring(0, 150)}${remarks.length > 150 ? '...' : ''}`;

      // If customer is selected from dropdown, use it. Otherwise default to a generic fallback/first customer
      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId && customers.length > 0) {
        resolvedCustomerId = customers[0].id; // Fallback to satisfy DB constraint
      }

      if (!resolvedCustomerId) {
        throw new Error('Please select or register a valid target customer in the CRM database first.');
      }

      const payload = {
        customer_id: resolvedCustomerId,
        interaction_type: 'CALL',
        summary: fullSummary,
        logged_by_user_id: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        custom_attributes: {
          caller_name: callerName.trim(),
          client_type: clientType,
          client_name: clientNameInput.trim(),
          contact_person: contactPerson.trim(),
          call_status: callStatus,
          duration_minutes: Number(durationMinutes),
          call_purpose: callPurpose,
          follow_up_ref_type: followUpRefType,
          follow_up_ref: followUpRef.trim(),
          lead_generated: leadGenerated,
          quotation_sent: quotationSent,
          remarks: remarks.trim()
        }
      };

      await authFetch('/workspaces/crm/interactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setFormSuccess('Call log registered successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchCalls();
      }, 900);
    } catch (e: any) {
      setFormError(e.message || 'Failed to submit call log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCall = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this call log?")) return;
    try {
      await authFetch(`/workspaces/crm/interactions/${id}`, {
        method: 'DELETE'
      });
      setIsDetailOpen(false);
      setSelectedCall(null);
      fetchCalls();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete call log.');
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filter call log based on search query
  const filteredCalls = calls.filter(c => {
    const targetName = c.custom_attributes?.client_name || custMap[c.customer_id] || '';
    const caller = c.custom_attributes?.caller_name || '';
    const purpose = c.custom_attributes?.call_purpose || '';
    const notesContent = c.custom_attributes?.remarks || c.summary || '';
    
    return targetName.toLowerCase().includes(search.toLowerCase()) ||
           caller.toLowerCase().includes(search.toLowerCase()) ||
           purpose.toLowerCase().includes(search.toLowerCase()) ||
           notesContent.toLowerCase().includes(search.toLowerCase());
  });

  // Helper colors for Call Status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Answered': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
      case 'Missed Call': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
      case 'Busy': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
      default: return { bg: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)' };
    }
  };

  // Helper colors for Call Purpose
  const getPurposeStyle = (purpose: string) => {
    switch (purpose) {
      case 'Sales': return { bg: 'rgba(99,91,255,0.08)', color: '#635bff', border: 'rgba(99,91,255,0.2)' };
      case 'Follow-Up': return { bg: 'rgba(139,92,246,0.08)', color: '#8b5cf6', border: 'rgba(139,92,246,0.2)' };
      case 'Marketing': return { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
      case 'Support': return { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: 'rgba(16,185,129,0.2)' };
      default: return { bg: 'var(--bg-main)', color: 'var(--text-muted)', border: 'var(--border-color)' };
    }
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      {/* Visual stylesheet injection for CallLog layout */}
      <style>{`
        .crm-section-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.4rem;
          margin: 1.25rem 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .crm-grid-cols-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem 1.75rem;
        }
        .crm-grid-cols-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.25rem 1.75rem;
        }
        .crm-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .crm-purpose-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid transparent;
        }
        .crm-input-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .crm-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-main);
          font-size: 0.85rem;
          cursor: pointer;
        }
        .crm-checkbox-label input {
          width: 15px;
          height: 15px;
          cursor: pointer;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Call Log
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Track telephonic outreach, customer touchpoints, and call summaries.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchCalls} disabled={loading} className="crm-btn-secondary" style={{ width: '40px', padding: 0, justifyContent: 'center' }}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
            <button onClick={openLogForm} className="crm-btn-primary">
              <Plus size={16} /> Log Call
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search call logs by client, caller, purpose, or notes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="crm-input-element"
              style={{ paddingLeft: '2.5rem', height: '40px' }}
            />
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.06)', border: '1px solid rgba(255,51,102,0.15)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={15} />{errorMsg}
          </div>
        )}

        {/* Table of Call Logs */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem', width: '180px' }}>TIME</th>
                  <th style={{ width: '180px' }}>CALLER</th>
                  <th>TARGET & CONTACT</th>
                  <th style={{ width: '220px' }}>METRICS & PURPOSE</th>
                  <th>REMARKS</th>
                  <th style={{ paddingRight: '1.25rem', width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={22} className="spin" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.75rem' }} /><br />Loading call log...
                    </td>
                  </tr>
                ) : filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No calls logged.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map(call => {
                    const attrs = call.custom_attributes || {};
                    const client = attrs.client_name || custMap[call.customer_id] || 'Unknown Client';
                    const clientT = attrs.client_type || 'Customer';
                    const contactP = attrs.contact_person || custContactMap[call.customer_id] || '-';
                    const caller = attrs.caller_name || 'System';
                    const status = attrs.call_status || 'Answered';
                    const purpose = attrs.call_purpose || 'Follow-Up';
                    const duration = attrs.duration_minutes || 5;
                    const notesSummary = attrs.remarks || call.summary;

                    const statusColor = getStatusStyle(status);
                    const purposeColor = getPurposeStyle(purpose);

                    return (
                      <tr 
                        key={call.id} 
                        onClick={() => { setSelectedCall(call); setIsDetailOpen(true); }}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {formatTime(call.timestamp)}
                        </td>
                        <td style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={12} style={{ color: 'var(--text-muted)' }} />
                            <span>{caller}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-main)' }}>
                          <div style={{ fontWeight: 700 }}>{client}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <span>{clientT}</span> • <span>Contact: {contactP}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="crm-status-badge" style={{ background: statusColor.bg, color: statusColor.color }}>
                              {status}
                            </span>
                            <span className="crm-purpose-badge" style={{ background: purposeColor.bg, color: purposeColor.color, borderColor: purposeColor.border }}>
                              {purpose}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {duration} mins
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-main)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                          {notesSummary}
                        </td>
                        <td style={{ paddingRight: '1.25rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={(e) => handleDeleteCall(call.id, e)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '6px' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ff5c75'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* ── ERPNext-Style Call Log Creator Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '680px', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(16, 185, 129, 0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <div>
                <h3 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={18} color="#10b981" /> Log Phone Call Touchpoint
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Register call details, client outcomes, follow-up parameters and remarks.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '6px' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={onSubmit} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formError && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.06)', border: '1px solid rgba(255,51,102,0.15)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <CheckCircle2 size={15} />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Section 1: Contact Info */}
                <div>
                  <div className="crm-section-title">
                    <User size={13} /> Contact Info
                  </div>
                  <div className="crm-input-row">
                    <label className="crm-label">Caller Name *</label>
                    <input 
                      type="text" 
                      required
                      value={callerName} 
                      onChange={e => setCallerName(e.target.value)} 
                      placeholder="e.g. Administrator"
                      className="crm-input-element"
                    />
                  </div>
                </div>

                {/* Section 2: The Target */}
                <div>
                  <div className="crm-section-title">
                    <Users size={13} /> The Target
                  </div>
                  <div className="crm-grid-cols-2">
                    <div className="crm-input-row">
                      <label className="crm-label">Client Type *</label>
                      <select 
                        value={clientType} 
                        onChange={e => setClientType(e.target.value)}
                        className="crm-input-element"
                      >
                        <option value="Customer">Customer</option>
                        <option value="Lead">Lead</option>
                        <option value="Opportunity">Opportunity</option>
                      </select>
                    </div>

                    <div className="crm-input-row">
                      <label className="crm-label">Select CRM Record (Fills Details)</label>
                      <select 
                        value={customerId} 
                        onChange={e => handleCustomerChange(e.target.value)}
                        className="crm-input-element"
                      >
                        <option value="">-- Choose Account --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    </div>

                    <div className="crm-input-row">
                      <label className="crm-label">Client Name *</label>
                      <input 
                        type="text" 
                        required
                        value={clientNameInput} 
                        onChange={e => setClientNameInput(e.target.value)} 
                        placeholder="Company or individual client name"
                        className="crm-input-element"
                      />
                    </div>

                    <div className="crm-input-row">
                      <label className="crm-label">Contact Person</label>
                      <input 
                        type="text" 
                        value={contactPerson} 
                        onChange={e => setContactPerson(e.target.value)} 
                        placeholder="Name of contact person"
                        className="crm-input-element"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Call Metrics */}
                <div>
                  <div className="crm-section-title">
                    <Clock size={13} /> Call Metrics
                  </div>
                  <div className="crm-grid-cols-3">
                    <div className="crm-input-row">
                      <label className="crm-label">Call Status *</label>
                      <select 
                        value={callStatus} 
                        onChange={e => setCallStatus(e.target.value)}
                        className="crm-input-element"
                      >
                        <option value="Answered">Answered</option>
                        <option value="Missed Call">Missed Call</option>
                        <option value="Busy">Busy</option>
                        <option value="No Answer">No Answer</option>
                      </select>
                    </div>

                    <div className="crm-input-row">
                      <label className="crm-label">Duration (Minutes)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={durationMinutes} 
                        onChange={e => setDurationMinutes(Number(e.target.value))} 
                        placeholder="Duration in mins"
                        className="crm-input-element"
                      />
                    </div>

                    <div className="crm-input-row">
                      <label className="crm-label">Call Purpose *</label>
                      <select 
                        value={callPurpose} 
                        onChange={e => setCallPurpose(e.target.value)}
                        className="crm-input-element"
                      >
                        <option value="Follow-Up">Follow-Up</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Support">Support</option>
                        <option value="Cold Call">Cold Call</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Outcomes */}
                <div>
                  <div className="crm-section-title">
                    <Award size={13} /> Outcomes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="crm-grid-cols-2">
                      <div className="crm-input-row">
                        <label className="crm-label">Follow-Up Reference Type</label>
                        <select 
                          value={followUpRefType} 
                          onChange={e => setFollowUpRefType(e.target.value)}
                          className="crm-input-element"
                        >
                          <option value="Lead">Lead</option>
                          <option value="Opportunity">Opportunity</option>
                          <option value="Quotation">Quotation</option>
                          <option value="Sales Order">Sales Order</option>
                        </select>
                      </div>

                      <div className="crm-input-row">
                        <label className="crm-label">Follow-Up Reference (Doc ID/Code)</label>
                        <input 
                          type="text" 
                          value={followUpRef} 
                          onChange={e => setFollowUpRef(e.target.value)} 
                          placeholder="e.g. QT-2026-0004"
                          className="crm-input-element"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '0.2rem' }}>
                      <label className="crm-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={leadGenerated} 
                          onChange={e => setLeadGenerated(e.target.checked)} 
                        />
                        Lead Generated
                      </label>
                      <label className="crm-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={quotationSent} 
                          onChange={e => setQuotationSent(e.target.checked)} 
                        />
                        Quotation Sent
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 5: Remarks */}
                <div>
                  <div className="crm-section-title">
                    <Clipboard size={13} /> Remarks
                  </div>
                  <div className="crm-input-row">
                    <label className="crm-label">Call Summary / Conversation Notes *</label>
                    <textarea 
                      rows={4} 
                      value={remarks} 
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Describe the discussion outcome, client requirements, or schedule follow-up notes..." 
                      className="crm-input-element"
                      style={{ resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'auto' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="crm-btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="crm-btn-primary" style={{ height: '40px', padding: '0 1.5rem' }}>
                  {submitting ? 'Logging...' : 'Save Call Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ERPNext-Style Call Log Detail Drawer/Viewer ───────────────────────────────── */}
      {isDetailOpen && selectedCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: '1.5rem' }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '600px', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={18} color="#10b981" />
                  <h3 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.15rem', margin: 0 }}>
                    Call Summary Details
                  </h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Registered on {formatTime(selectedCall.timestamp)}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  onClick={(e) => handleDeleteCall(selectedCall.id, e)}
                  className="crm-btn-secondary"
                  style={{ height: '30px', padding: '0 8px', fontSize: '0.75rem', color: '#ff5c75', borderColor: 'rgba(255, 92, 117, 0.2)' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button 
                  onClick={() => setIsDetailOpen(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '6px' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Read-Only Body */}
            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Caller & Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Caller Name</span>
                  <p style={{ margin: '0.3rem 0 0 0', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {selectedCall.custom_attributes?.caller_name || 'System Operator'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Client Name</span>
                  <p style={{ margin: '0.3rem 0 0 0', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {selectedCall.custom_attributes?.client_name || custMap[selectedCall.customer_id] || 'Unknown Target'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Client Type</span>
                  <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    {selectedCall.custom_attributes?.client_type || 'Customer'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Contact Person</span>
                  <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    {selectedCall.custom_attributes?.contact_person || custContactMap[selectedCall.customer_id] || '-'}
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

              {/* Call Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Call Status</span>
                  <div style={{ marginTop: '0.3rem' }}>
                    <span className="crm-status-badge" style={{ 
                      background: getStatusStyle(selectedCall.custom_attributes?.call_status || 'Answered').bg, 
                      color: getStatusStyle(selectedCall.custom_attributes?.call_status || 'Answered').color 
                    }}>
                      {selectedCall.custom_attributes?.call_status || 'Answered'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Call Purpose</span>
                  <div style={{ marginTop: '0.3rem' }}>
                    <span className="crm-purpose-badge" style={{ 
                      background: getPurposeStyle(selectedCall.custom_attributes?.call_purpose || 'Follow-Up').bg, 
                      color: getPurposeStyle(selectedCall.custom_attributes?.call_purpose || 'Follow-Up').color,
                      borderColor: getPurposeStyle(selectedCall.custom_attributes?.call_purpose || 'Follow-Up').border
                    }}>
                      {selectedCall.custom_attributes?.call_purpose || 'Follow-Up'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Duration</span>
                  <p style={{ margin: '0.3rem 0 0 0', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {selectedCall.custom_attributes?.duration_minutes || 5} minutes
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

              {/* Outcomes & Follow-up */}
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Outcomes & Action Items</span>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: selectedCall.custom_attributes?.lead_generated ? '#10b981' : 'var(--text-muted)' }}>
                    <CheckSquare size={14} color={selectedCall.custom_attributes?.lead_generated ? '#10b981' : 'var(--text-muted)'} /> Lead Generated
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: selectedCall.custom_attributes?.quotation_sent ? '#10b981' : 'var(--text-muted)' }}>
                    <CheckSquare size={14} color={selectedCall.custom_attributes?.quotation_sent ? '#10b981' : 'var(--text-muted)'} /> Quotation Sent
                  </div>
                </div>

                {(selectedCall.custom_attributes?.follow_up_ref || selectedCall.custom_attributes?.follow_up_ref_type) && (
                  <div style={{ marginTop: '1rem', background: 'var(--bg-main)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={15} color="#10b981" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      Follow-up reference: <strong>{selectedCall.custom_attributes.follow_up_ref_type}</strong> • <code>{selectedCall.custom_attributes.follow_up_ref || 'unassigned'}</code>
                    </span>
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

              {/* Remarks */}
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Remarks & Conversation Notes</span>
                <div style={{ 
                  marginTop: '0.5rem', 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  fontSize: '0.88rem', 
                  color: 'var(--text-main)', 
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedCall.custom_attributes?.remarks || selectedCall.summary}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsDetailOpen(false)} className="crm-btn-secondary">Close File</button>
            </div>
          </div>
        </div>
      )}

    </WorkspaceLayout>
  );
}
