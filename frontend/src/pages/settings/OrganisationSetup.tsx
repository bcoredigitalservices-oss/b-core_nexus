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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--text-muted)] gap-4">
        <Loader2 className="animate-spin text-[var(--accent-primary)]" size={32} />
        <span>Syncing corporate directory...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-8 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] mb-2 font-[var(--font-display)]">
          Organisation Setup
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Configure legal identifiers, operational currencies, branding media assets, and primary industry vertical configurations.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        
        {/* Status Messages */}
        {successMsg && (
          <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[#00f5a0] text-sm font-medium">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-medium">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Outer Grid for Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Group 1: Legal Identity */}
          <div className="glass-panel p-8 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl flex flex-col gap-5">
            <h3 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Building2 size={18} className="text-[#9d4edd]" />
              Legal Identity
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Company Legal Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  className="pl-[38px] w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-sm focus:outline-none focus:border-[#9d4edd]"
                  placeholder="e.g. Nexus Logistics Global Ltd"
                  {...register('legal_name', { required: 'Legal name is required' })} 
                />
              </div>
              {errors.legal_name && <p className="text-red-500 text-xs mt-1">{errors.legal_name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Tax Identification Number (TIN / EIN)</label>
              <div className="relative">
                <FileCheck2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  className="pl-[38px] w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-sm focus:outline-none focus:border-[#9d4edd]"
                  placeholder="e.g. US-8849204-TX"
                  {...register('tax_id')} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Base Operating Currency</label>
              <div className="relative">
                <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <select 
                  className="pl-[38px] pr-4 w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-sm focus:outline-none focus:border-[#9d4edd] appearance-none"
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
          <div className="glass-panel p-8 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl flex flex-col gap-5">
            <h3 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Globe2 size={18} className="text-[#00f2fe]" />
              Contact & Branding
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Primary Operational Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="email" 
                  className="pl-[38px] w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-sm focus:outline-none focus:border-[#00f2fe]"
                  placeholder="e.g. operations@bcore.local"
                  {...register('primary_email')} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Contact Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  className="pl-[38px] w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-sm focus:outline-none focus:border-[#00f2fe]"
                  placeholder="e.g. +1 (555) 019-2834"
                  {...register('contact_phone')} 
                />
              </div>
            </div>

            {/* Logo Upload Area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-main)]">Corporate Identity Logo</label>
              <div className="border border-dashed border-white/15 bg-[var(--bg-card-hover)] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 hover:border-[#9d4edd] gap-2">
                <Upload size={20} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--accent-primary)] font-semibold">Upload Logo File</span>
                <span className="text-xs text-[var(--text-muted)]">PNG, SVG, or JPG (max 2MB)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Group 3: Core Routing / Industry Vertical Selection */}
        <div className="glass-panel p-8 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl flex flex-col gap-4">
          <h3 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#ffb703]" />
            Core Routing & Vertical Alignment
          </h3>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-[var(--text-main)]">Target Industry Vertical</label>
            <select 
              className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-sm focus:outline-none focus:border-[#ffb703]"
              {...register('industry_vertical', { required: 'Vertical alignment is required' })}
            >
              <option value="GENERAL_TRADING">General Trading & Stock Management</option>
              <option value="HEALTHCARE_LOGISTICS">Healthcare Logistics (Cold Chain / Medical Batch Logs)</option>
              <option value="HEAVY_MACHINERY">Heavy Machinery Fleet Asset Operations</option>
            </select>
            
            <div className="flex items-start gap-2 mt-2.5 bg-[#ffb703]/10 border border-[#ffb703]/20 p-4 rounded-lg">
              <AlertTriangle size={16} className="text-[#ffb703] shrink-0 mt-0.5" />
              <p className="m-0 text-xs text-[#ffb703] Regal-leading-relaxed">
                <strong>Warning:</strong> Changing this vertical will alter the available workspace applications on your Home dashboard. Active product schemas, workflow matrices, and dynamic tracking structures will be updated instantly to support the new vertical profile.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button 
            type="submit" 
            className="btn btn-primary px-10 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
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