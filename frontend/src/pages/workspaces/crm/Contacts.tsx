import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import {
  Users, Plus, RefreshCw, X, AlertCircle, CheckCircle2,
  Trash2, Mail, Phone, Link as LinkIcon, User, Briefcase, Star, LayoutList
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Customer {
  id: string;
  company_name: string;
}

interface ContactEmail {
  email: string;
  is_primary: boolean;
}

interface ContactPhone {
  phone: string;
  is_primary: boolean;
}

interface ContactLink {
  title: string;
  url: string;
}

interface ContactFormValues {
  first_name: string;
  last_name: string;
  job_title: string;
  customer_id: string | null;
  status: 'Passive' | 'Open' | 'Replied';
  is_primary: boolean;
  custom_attributes: {
    emails?: ContactEmail[];
    phones?: ContactPhone[];
    links?: ContactLink[];
    salutation?: string;
    department?: string;
    organization_name?: string;
    lead_source?: string;
    is_customer_contact?: boolean;
  };
}

export default function Contacts() {
  const { authFetch, user } = useAppContext();
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<'Details' | 'Links'>('Details');
  
  // Data State
  const [contacts, setContacts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, control, handleSubmit, reset, formState: { errors }, setValue } = useForm<ContactFormValues>({
    defaultValues: {
      first_name: '',
      last_name: '',
      job_title: '',
      customer_id: null,
      status: 'Passive',
      is_primary: false,
      custom_attributes: {
        emails: [],
        phones: [],
        links: [],
        salutation: 'Mr.',
        department: '',
        organization_name: '',
        lead_source: '',
        is_customer_contact: true
      }
    }
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control, name: 'custom_attributes.emails' });
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control, name: 'custom_attributes.phones' });
  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({ control, name: 'custom_attributes.links' });

  const watchCustomerId = useWatch({ control, name: 'customer_id' });
  const watchIsCustomerContact = useWatch({ control, name: 'custom_attributes.is_customer_contact' });

  const fetchAll = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const [ctRes, custRes] = await Promise.all([
        authFetch('/api/v1/workspaces/crm/contacts?limit=500'),
        authFetch('/api/v1/workspaces/crm/customers?limit=500'),
      ]);
      const ctData = await ctRes.json();
      const custData = await custRes.json();
      
      setContacts(ctData.contacts || []);
      setCustomers(custData.customers || []);
      
      const cMap: Record<string, string> = {};
      (custData.customers || []).forEach((c: any) => cMap[c.id] = c.company_name);
      setCustomerMap(cMap);
    } catch {
      setErrorMsg('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openForm = (contact?: any) => {
    setErrorMsg(''); setFormSuccess('');
    if (contact) {
      setEditingId(contact.id);
      reset({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        job_title: contact.job_title || '',
        customer_id: contact.customer_id || null,
        status: contact.status || 'Passive',
        is_primary: contact.is_primary || false,
        custom_attributes: {
          emails: contact.custom_attributes?.emails || [],
          phones: contact.custom_attributes?.phones || [],
          links: contact.custom_attributes?.links || [],
          salutation: contact.custom_attributes?.salutation || 'Mr.',
          department: contact.custom_attributes?.department || '',
          organization_name: contact.custom_attributes?.organization_name || '',
          lead_source: contact.custom_attributes?.lead_source || '',
          is_customer_contact: contact.custom_attributes?.is_customer_contact ?? (contact.customer_id ? true : false)
        }
      });
    } else {
      setEditingId(null);
      reset({
        first_name: '', last_name: '', job_title: '', customer_id: null,
        status: 'Passive', is_primary: false,
        custom_attributes: { emails: [], phones: [], links: [], salutation: 'Mr.', department: '', organization_name: '', lead_source: '', is_customer_contact: true }
      });
    }
    setViewMode('form');
    setActiveTab('Details');
  };

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitting(true); setErrorMsg(''); setFormSuccess('');
    try {
      // Set top-level email/phone based on primary in arrays
      const primaryEmailObj = values.custom_attributes.emails?.find(e => e.is_primary) || values.custom_attributes.emails?.[0];
      const primaryPhoneObj = values.custom_attributes.phones?.find(p => p.is_primary) || values.custom_attributes.phones?.[0];
      
      const payload: any = {
        ...values,
        customer_id: values.custom_attributes.is_customer_contact ? (values.customer_id || null) : null,
        email: primaryEmailObj?.email || null,
        phone: primaryPhoneObj?.phone || null,
      };

      const url = editingId ? `/api/v1/workspaces/crm/contacts/${editingId}` : '/api/v1/workspaces/crm/contacts';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save contact.');
      }
      
      setFormSuccess(`Contact ${editingId ? 'updated' : 'created'} successfully!`);
      setTimeout(() => {
        setViewMode('list');
        fetchAll();
      }, 1000);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteContact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this contact?')) return;
    try {
      await authFetch(`/api/v1/workspaces/crm/contacts/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (e: any) {
      alert('Failed to delete contact.');
    }
  };

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(59, 130, 246, 0.03) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        borderRadius: '14px', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '12px', padding: '0.75rem' }}>
            <Users size={28} color="#00f2fe" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Contacts</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.3rem 0 0 0' }}>{contacts.length} Contacts Directory</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchAll} disabled={loading} className="btn btn-secondary" style={{ height: '40px', padding: '0 0.75rem' }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => openForm()} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700, height: '40px', padding: '0 1rem' }}>
            <Plus size={15} style={{ marginRight: '6px' }} /> New Contact
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Customer</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Phone</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><RefreshCw size={24} className="spin" style={{ margin: '0 auto' }} /></td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No contacts found.</td></tr>
            ) : (
              contacts.map(c => (
                <tr key={c.id} onClick={() => openForm(c)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f2fe', fontWeight: 700 }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.first_name} {c.last_name}</div>
                      {c.is_primary && <span style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>Primary</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                      background: c.status === 'Open' ? 'rgba(59,130,246,0.15)' : c.status === 'Replied' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                      color: c.status === 'Open' ? '#3b82f6' : c.status === 'Replied' ? '#10b981' : '#9ca3af'
                    }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.customer_id ? customerMap[c.customer_id] : '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.phone || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={(e) => deleteContact(c.id, e)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Form Header */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setViewMode('list')} className="btn btn-secondary" style={{ padding: '8px' }}><LayoutList size={18} /></button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {editingId ? 'Edit Contact' : 'New Contact'}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setViewMode('list')} className="btn btn-secondary">Discard</button>
          <button onClick={handleSubmit(onSubmit)} disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#00f2fe,#0080c6)', color: '#fff', fontWeight: 700 }}>
            {submitting ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>

      {errorMsg && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}><AlertCircle size={16} />{errorMsg}</div>}
      {formSuccess && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} />{formSuccess}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#00f2fe" /> Basic Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Salutation</label>
                <select {...register('custom_attributes.salutation')} className="form-input" style={{ width: '100%', height: '42px' }}>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>First Name <span style={{color: '#ff3366'}}>*</span></label>
                <input type="text" {...register('first_name', { required: 'Required' })} className="form-input" style={{ width: '100%', height: '42px' }} placeholder="John" />
                {errors.first_name && <span style={{ color: '#ff3366', fontSize: '0.75rem' }}>{errors.first_name.message}</span>}
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Last Name <span style={{color: '#ff3366'}}>*</span></label>
                <input type="text" {...register('last_name', { required: 'Required' })} className="form-input" style={{ width: '100%', height: '42px' }} placeholder="Doe" />
                {errors.last_name && <span style={{ color: '#ff3366', fontSize: '0.75rem' }}>{errors.last_name.message}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Job Title</label>
                <input type="text" {...register('job_title')} className="form-input" style={{ width: '100%', height: '42px' }} placeholder="e.g. Sales Manager" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                <input type="text" {...register('custom_attributes.department')} className="form-input" style={{ width: '100%', height: '42px' }} placeholder="e.g. Marketing" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Status</label>
                <select {...register('status')} className="form-input" style={{ width: '100%', height: '42px' }}>
                  <option value="Passive">Passive</option>
                  <option value="Open">Open</option>
                  <option value="Replied">Replied</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs section */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              {['Details', 'Links'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  style={{
                    flex: 1, padding: '1rem', background: 'none', border: 'none',
                    color: activeTab === tab ? '#00f2fe' : 'var(--text-muted)',
                    fontWeight: activeTab === tab ? 700 : 500,
                    borderBottom: activeTab === tab ? '2px solid #00f2fe' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {activeTab === 'Details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Emails */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={16} /> Email Addresses
                      </h4>
                      <button type="button" onClick={() => appendEmail({ email: '', is_primary: emailFields.length === 0 })} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Email
                      </button>
                    </div>
                    {emailFields.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>No emails added.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.5rem 0', fontWeight: 600 }}>Email Address</th>
                            <th style={{ padding: '0.5rem 0', fontWeight: 600, width: '100px', textAlign: 'center' }}>Primary</th>
                            <th style={{ padding: '0.5rem 0', width: '50px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailFields.map((field, index) => (
                            <tr key={field.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.5rem 0' }}>
                                <input type="email" {...register(`custom_attributes.emails.${index}.email` as const, { required: true })} className="form-input" style={{ width: '100%', height: '34px', padding: '0 8px' }} placeholder="contact@example.com" />
                              </td>
                              <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                                <input type="radio" {...register(`custom_attributes.emails.${index}.is_primary` as const)} value="true" checked={field.is_primary} onChange={() => {
                                  // Reset others
                                  emailFields.forEach((_, i) => setValue(`custom_attributes.emails.${i}.is_primary`, i === index));
                                }} />
                              </td>
                              <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                                <button type="button" onClick={() => removeEmail(index)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}><X size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Phones */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} /> Phone Numbers
                      </h4>
                      <button type="button" onClick={() => appendPhone({ phone: '', is_primary: phoneFields.length === 0 })} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Phone
                      </button>
                    </div>
                    {phoneFields.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>No phones added.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.5rem 0', fontWeight: 600 }}>Phone Number</th>
                            <th style={{ padding: '0.5rem 0', fontWeight: 600, width: '100px', textAlign: 'center' }}>Primary</th>
                            <th style={{ padding: '0.5rem 0', width: '50px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {phoneFields.map((field, index) => (
                            <tr key={field.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.5rem 0' }}>
                                <input type="text" {...register(`custom_attributes.phones.${index}.phone` as const, { required: true })} className="form-input" style={{ width: '100%', height: '34px', padding: '0 8px' }} placeholder="+1 234 567 890" />
                              </td>
                              <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                                <input type="radio" {...register(`custom_attributes.phones.${index}.is_primary` as const)} value="true" checked={field.is_primary} onChange={() => {
                                  phoneFields.forEach((_, i) => setValue(`custom_attributes.phones.${i}.is_primary`, i === index));
                                }} />
                              </td>
                              <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                                <button type="button" onClick={() => removePhone(index)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}><X size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'Links' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LinkIcon size={16} /> Associated Links
                    </h4>
                    <button type="button" onClick={() => appendLink({ title: '', url: '' })} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                      <Plus size={14} /> Add Link
                    </button>
                  </div>
                  {linkFields.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>No links added.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.5rem 0', fontWeight: 600, width: '40%' }}>Title</th>
                          <th style={{ padding: '0.5rem 0', fontWeight: 600 }}>URL</th>
                          <th style={{ padding: '0.5rem 0', width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkFields.map((field, index) => (
                          <tr key={field.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem 0', paddingRight: '1rem' }}>
                              <input type="text" {...register(`custom_attributes.links.${index}.title` as const)} className="form-input" style={{ width: '100%', height: '34px', padding: '0 8px' }} placeholder="LinkedIn, Twitter, etc." />
                            </td>
                            <td style={{ padding: '0.5rem 0' }}>
                              <input type="url" {...register(`custom_attributes.links.${index}.url` as const)} className="form-input" style={{ width: '100%', height: '34px', padding: '0 8px' }} placeholder="https://..." />
                            </td>
                            <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                              <button type="button" onClick={() => removeLink(index)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}><X size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} color="#00f2fe" /> Organization
            </h3>

            <div style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <input type="checkbox" {...register('custom_attributes.is_customer_contact')} style={{ accentColor: '#00f2fe', width: '16px', height: '16px' }} />
                Link to Existing Customer?
              </label>
            </div>

            {watchIsCustomerContact ? (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Customer</label>
                  <select {...register('customer_id')} className="form-input" style={{ width: '100%', height: '42px' }}>
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                
                {watchCustomerId && watchCustomerId !== '' && (
                  <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      <input type="checkbox" {...register('is_primary')} style={{ accentColor: '#f59e0b' }} />
                      Set as Primary Contact for Customer
                    </label>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1.25rem', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#00f2fe' }}>Standalone Initialization</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Organization Name</label>
                    <input type="text" {...register('custom_attributes.organization_name')} className="form-input" style={{ width: '100%', height: '38px' }} placeholder="e.g. Acme Corp" />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Lead Source</label>
                    <select {...register('custom_attributes.lead_source')} className="form-input" style={{ width: '100%', height: '38px' }}>
                      <option value="">-- Select --</option>
                      <option value="By Call">By Call</option>
                      <option value="By Visit">By Visit</option>
                      <option value="By Email">By Email</option>
                      <option value="By Flyer">By Flyer</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        {viewMode === 'list' ? renderList() : renderForm()}
        <style>{`
          .hover-row:hover { background: var(--bg-card-hover); }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    </WorkspaceLayout>
  );
}
