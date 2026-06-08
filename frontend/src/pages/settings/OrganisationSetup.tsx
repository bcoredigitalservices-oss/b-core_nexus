import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe2, 
  Coins, 
  FileCheck2, 
  AlertTriangle, 
  Upload, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface FormValues {
  legal_name: string;
  tax_id: string;
  primary_email: string;
  contact_phone: string;
  base_currency: string;
  industry_vertical: 'HEALTHCARE_LOGISTICS' | 'HEAVY_MACHINERY' | 'GENERAL' | 'GENERAL_TRADING';
}

export default function OrganisationSetup() {
  const { token, authFetch, setActiveWorkspace } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      legal_name: '',
      tax_id: '',
      primary_email: '',
      contact_phone: '',
      base_currency: 'USD',
      industry_vertical: 'GENERAL_TRADING'
    }
  });

  // Load existing organization profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authFetch('/organization/profile');
        if (data) {
          setValue('legal_name', data.legal_name || '');
          setValue('tax_id', data.tax_id || '');
          setValue('primary_email', data.primary_email || '');
          setValue('contact_phone', data.contact_phone || '');
          setValue('base_currency', data.base_currency || 'USD');
          setValue('industry_vertical', data.industry_vertical || 'GENERAL_TRADING');
        }
      } catch (err: any) {
        console.error('Failed to load organisation profile:', err);
        setErrorMsg('Could not fetch existing organization setup details.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token, authFetch, setValue]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Save organization profile updates
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/organization/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Failed to update organization profile.');
      }

      setSuccessMsg('Organisation profile updated successfully!');

      // 2. Fetch updated workspace configuration to dynamically reload layout
      const configRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspace/config`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (configRes.ok) {
        const wsConfig = await configRes.json();
        setActiveWorkspace(wsConfig);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px', 
          color: 'var(--text-muted)',
          gap: '1rem'
        }}
      >
        <Loader2 className="udg-spinner" size={32} />
        <span>Syncing corporate directory...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
          Organisation Setup
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure legal identifiers, operational currencies, branding media assets, and primary industry vertical configurations.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Status Messages */}
        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', backgroundColor: 'rgba(0, 245, 160, 0.1)', border: '1px solid rgba(0, 245, 160, 0.3)', borderRadius: '12px', color: '#00f5a0', fontSize: '0.9rem', fontWeight: 500 }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#EF4444', fontSize: '0.9rem', fontWeight: 500 }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Outer Grid for Groups */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Group 1: Legal Identity */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: '2rem', 
              backgroundColor: '#1E293B', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#9d4edd" />
              Legal Identity
            </h3>

            <div>
              <label>Company Legal Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. Nexus Logistics Global Ltd"
                  {...register('legal_name', { required: 'Legal name is required' })} 
                />
              </div>
              {errors.legal_name && <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.legal_name.message}</p>}
            </div>

            <div>
              <label>Tax Identification Number (TIN / EIN)</label>
              <div style={{ position: 'relative' }}>
                <FileCheck2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. US-8849204-TX"
                  {...register('tax_id')} 
                />
              </div>
            </div>

            <div>
              <label>Base Operating Currency</label>
              <div style={{ position: 'relative' }}>
                <Coins size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select 
                  style={{ 
                    paddingLeft: '38px', 
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingLeft: '38px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                  {...register('base_currency', { required: 'Currency selection is required' })}
                >
                  <option value="USD">USD - United States Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Contact & Branding */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: '2rem', 
              backgroundColor: '#1E293B', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe2 size={18} color="#00f2fe" />
              Contact & Branding
            </h3>

            <div>
              <label>Primary Operational Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. operations@bcore.local"
                  {...register('primary_email')} 
                />
              </div>
            </div>

            <div>
              <label>Contact Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. +1 (555) 019-2834"
                  {...register('contact_phone')} 
                />
              </div>
            </div>

            {/* Logo Upload Placeholder Area */}
            <div>
              <label>Corporate Identity Logo</label>
              <div 
                style={{
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#9d4edd'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
              >
                <Upload size={20} color="var(--text-muted)" />
                <span style={{ fontSize: '0.8rem', color: '#c8b6ff', fontWeight: 600 }}>Upload Logo File</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PNG, SVG, or JPG (max 2MB)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Group 3: Core Routing / Industry Vertical Selection */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '2rem', 
            backgroundColor: '#1E293B', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#ffb703" />
            Core Routing & Vertical Alignment
          </h3>

          <div>
            <label style={{ marginBottom: '6px' }}>Target Industry Vertical</label>
            <select 
              style={{ 
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
              {...register('industry_vertical', { required: 'Vertical alignment is required' })}
            >
              <option value="GENERAL_TRADING">General Trading & Stock Management</option>
              <option value="HEALTHCARE_LOGISTICS">Healthcare Logistics (Cold Chain / Medical Batch Logs)</option>
              <option value="HEAVY_MACHINERY">Heavy Machinery Fleet Asset Operations</option>
            </select>
            
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '8px', 
                marginTop: '10px', 
                backgroundColor: 'rgba(255, 183, 3, 0.08)', 
                border: '1px solid rgba(255, 183, 3, 0.2)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px' 
              }}
            >
              <AlertTriangle size={16} color="#ffb703" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#ffb703', lineHeight: '1.4' }}>
                <strong>Warning:</strong> Changing this vertical will alter the available workspace applications on your Home dashboard. Active product schemas, workflow matrices, and dynamic tracking structures will be updated instantly to support the new vertical profile.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
            style={{ 
              padding: '0.8rem 2.5rem', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="udg-spinner" />
                Commiting Changes...
              </>
            ) : (
              'Save Organisation Configuration'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
