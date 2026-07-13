import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Upload, Loader2, Bold, Italic, List, Link as LinkIcon, Mail, FileText, MessageSquare, Building, FileCheck2, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';

interface FormValues {
  company_name: string;
  trading_name: string;
  registration_date: string;
  primary_industry: string;
  cin_number: string;
  official_email: string;
  tax_id: string;
  phone_number: string;
  street_address: string;
  website_url: string; 
  city: string;
  state_province: string;
  country: string;
  base_currency: string;
  date_format: string;
  fiscal_year_start_month: string;
  fiscal_year_start_day: string;
  number_format: string;
  timezone: string;
  default_bank_account_id: string;
  default_dispatch_warehouse_id: string;
  default_receiving_warehouse_id: string;
  standard_terms: string;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
    {children}
  </label>
);
const COUNTRIES_DATA = [
  { name: 'United States', currency: 'USD' },
  { name: 'Canada', currency: 'CAD' },
  { name: 'Mexico', currency: 'MXN' },
  { name: 'Brazil', currency: 'BRL' },
  { name: 'Argentina', currency: 'ARS' },
  { name: 'Colombia', currency: 'COP' },
  { name: 'Chile', currency: 'CLP' },
  { name: 'United Kingdom', currency: 'GBP' },
  { name: 'Germany', currency: 'EUR' },
  { name: 'France', currency: 'EUR' },
  { name: 'Italy', currency: 'EUR' },
  { name: 'Spain', currency: 'EUR' },
  { name: 'Netherlands', currency: 'EUR' },
  { name: 'Switzerland', currency: 'CHF' },
  { name: 'Sweden', currency: 'SEK' },
  { name: 'India', currency: 'INR' },
  { name: 'China', currency: 'CNY' },
  { name: 'Japan', currency: 'JPY' },
  { name: 'Singapore', currency: 'SGD' },
  { name: 'United Arab Emirates', currency: 'AED' },
  { name: 'Saudi Arabia', currency: 'SAR' },
  { name: 'South Korea', currency: 'KRW' },
  { name: 'Indonesia', currency: 'IDR' },
  { name: 'South Africa', currency: 'ZAR' },
  { name: 'Nigeria', currency: 'NGN' },
  { name: 'Kenya', currency: 'KES' },
  { name: 'Egypt', currency: 'EGP' },
  { name: 'Ghana', currency: 'GHS' },
  { name: 'Morocco', currency: 'MAD' },
  { name: 'Ethiopia', currency: 'ETB' },
  { name: 'Tanzania', currency: 'TZS' },
  { name: 'Uganda', currency: 'UGX' },
  { name: 'Australia', currency: 'AUD' },
  { name: 'New Zealand', currency: 'NZD' }
].sort((a, b) => a.name.localeCompare(b.name));

const CURRENCIES = [
  'USD - United States Dollar',
  'EUR - Euro',
  'GBP - British Pound',
  'INR - Indian Rupee',
  'JPY - Japanese Yen',
  'CNY - Chinese Yuan',
  'CAD - Canadian Dollar',
  'AUD - Australian Dollar',
  'CHF - Swiss Franc',
  'SGD - Singapore Dollar',
  'AED - UAE Dirham',
  'SAR - Saudi Riyal',
  'ZAR - South African Rand',
  'NGN - Nigerian Naira',
  'KES - Kenyan Shilling',
  'EGP - Egyptian Pound',
  'GHS - Ghanaian Cedi',
  'MAD - Moroccan Dirham',
  'ETB - Ethiopian Birr',
  'TZS - Tanzanian Shilling',
  'UGX - Ugandan Shilling',
  'MXN - Mexican Peso',
  'BRL - Brazilian Real',
  'ARS - Argentine Peso',
  'COP - Colombian Peso',
  'CLP - Chilean Peso',
  'SEK - Swedish Krona',
  'KRW - South Korean Won',
  'IDR - Indonesian Rupiah',
  'NZD - New Zealand Dollar'
].sort();

const TIMEZONES = [
  '(GMT-12:00) International Date Line West',
  '(GMT-11:00) Midway Island, Samoa',
  '(GMT-10:00) Hawaii',
  '(GMT-09:00) Alaska',
  '(GMT-08:00) Pacific Time (US & Canada)',
  '(GMT-07:00) Mountain Time (US & Canada)',
  '(GMT-06:00) Central Time (US & Canada)',
  '(GMT-05:00) Eastern Time (US & Canada)',
  '(GMT-04:00) Atlantic Time (Canada)',
  '(GMT-03:00) Buenos Aires, Georgetown',
  '(GMT-02:00) Mid-Atlantic',
  '(GMT-01:00) Azores, Cape Verde Is.',
  '(GMT+00:00) Greenwich Mean Time, London',
  '(GMT+01:00) Amsterdam, Berlin, Rome, Paris, Lagos',
  '(GMT+02:00) Cairo, Johannesburg, Athens',
  '(GMT+03:00) Moscow, Nairobi, Riyadh',
  '(GMT+04:00) Abu Dhabi, Muscat',
  '(GMT+05:00) Islamabad, Karachi',
  '(GMT+05:30) Indian Standard Time, New Delhi',
  '(GMT+06:00) Almaty, Dhaka',
  '(GMT+07:00) Bangkok, Hanoi, Jakarta',
  '(GMT+08:00) Beijing, Singapore, Perth',
  '(GMT+09:00) Tokyo, Seoul',
  '(GMT+10:00) Sydney, Melbourne, Brisbane',
  '(GMT+11:00) Solomon Is., New Caledonia',
  '(GMT+12:00) Auckland, Wellington, Fiji'
];

export default function OrganisationSetup() {
  const { token, authFetch, setActiveWorkspace } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    "General Company Profile",
    "Legal & Contact",
    "System & Financial",
    "Operational Defaults"
  ];

  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      company_name: '',
      trading_name: '',
      registration_date: '',
      primary_industry: 'Information Technology',
      cin_number: '',
      official_email: '',
      tax_id: '',
      phone_number: '',
      street_address: '',
      website_url: '',
      city: '',
      state_province: '',
      country: 'United States',
      base_currency: 'USD - United States Dollar',
      date_format: 'DD-MM-YYYY',
      fiscal_year_start_month: 'January',
      fiscal_year_start_day: '1st',
      number_format: '1,234,567.89',
      timezone: '(GMT-05:00) Eastern Time',
      default_bank_account_id: '',
      default_dispatch_warehouse_id: '',
      default_receiving_warehouse_id: '',
      standard_terms: ''
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authFetch('/organization/profile');
        if (data) {
          // Map backend data to frontend
          setValue('company_name', data.company_name || data.legal_name || '');
          setValue('trading_name', data.trading_name || '');
          setValue('registration_date', data.registration_date || '');
          setValue('primary_industry', data.primary_industry || data.industry_vertical || 'Information Technology');
          setValue('cin_number', data.cin_number || '');
          setValue('official_email', data.official_email || data.primary_email || '');
          setValue('tax_id', data.tax_id || '');
          setValue('phone_number', data.phone_number || data.contact_phone || '');
          setValue('street_address', data.street_address || '');
          setValue('city', data.city || '');
          setValue('state_province', data.state_province || '');
          setValue('country', data.country || 'United States');
          setValue('base_currency', data.base_currency || 'USD - United States Dollar');
          setValue('date_format', data.date_format || 'DD-MM-YYYY');
          
          if (data.fiscal_year_start) {
            const parts = data.fiscal_year_start.split(' ');
            if (parts.length >= 2) {
              setValue('fiscal_year_start_month', parts[0]);
              setValue('fiscal_year_start_day', parts[1]);
            }
          }
          
          setValue('number_format', data.number_format || '1,234,567.89');
          setValue('timezone', data.timezone || '(GMT-05:00) Eastern Time');
          setValue('default_bank_account_id', data.default_bank_account_id || '');
          setValue('default_dispatch_warehouse_id', data.default_dispatch_warehouse_id || '');
          setValue('default_receiving_warehouse_id', data.default_receiving_warehouse_id || '');
          setValue('standard_terms', data.standard_terms || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) loadProfile();
  }, [token, authFetch, setValue]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'country') {
        const selectedCountry = COUNTRIES_DATA.find(c => c.name === value.country);
        if (selectedCountry) {
          const matchingCurrency = CURRENCIES.find(curr => curr.startsWith(selectedCountry.currency));
          if (matchingCurrency) {
            setValue('base_currency', matchingCurrency, { shouldDirty: true });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);


  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload: any = {
        ...values,
        fiscal_year_start: `${values.fiscal_year_start_month} ${values.fiscal_year_start_day}`
      };

      // Clean up empty UUIDs and Dates so FastAPI doesn't throw 422 Unprocessable Entity
      if (!payload.default_bank_account_id) delete payload.default_bank_account_id;
      if (!payload.default_dispatch_warehouse_id) delete payload.default_dispatch_warehouse_id;
      if (!payload.default_receiving_warehouse_id) delete payload.default_receiving_warehouse_id;
      if (!payload.registration_date) delete payload.registration_date;

      await authFetch('/organization/profile', {
        method: 'PUT',
        body: payload
      });
      
      alert('Organization profile updated successfully!');
      
    } catch (err) {
      console.error(err);
      alert('Failed to update organization profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const inputClass = "w-full p-2.5 bg-white border border-gray-400 hover:border-gray-500 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto pt-6 pb-12 flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex items-start justify-between px-6">
          <div>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Organization Setup</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Configure your corporate identity and system-wide default settings.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/org')} className="px-5 py-2 text-[13px] font-bold text-gray-800 bg-white border border-dashed border-blue-300 rounded-sm hover:bg-gray-50">Dashboard</button>
            <button className="px-5 py-2 text-[13px] font-bold text-gray-800 bg-white border border-dashed border-blue-300 rounded-sm hover:bg-gray-50">Discard</button>
            <button onClick={handleSubmit(onSubmit)} className="px-5 py-2 text-[13px] font-bold text-white bg-[#1d4ed8] rounded-sm hover:bg-blue-800 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="mx-6 border border-gray-200 rounded-sm overflow-hidden">
          
          {/* TABS */}
          <div className="bg-[#f8f9fc] flex items-center border-b border-gray-200 px-2 pt-2">
            {TABS.map((t, i) => (
              <button 
                key={t}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-3.5 text-[13px] font-bold transition-colors ${
                  activeTab === i 
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white rounded-t-sm' 
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="p-8 bg-white min-h-[350px]">
            
            {/* TAB 1: General Company Profile */}
            {activeTab === 0 && (
              <div className="grid grid-cols-3 gap-12">
                <div className="col-span-2 flex flex-col gap-6">
                  <div>
                    <FieldLabel>COMPANY NAME</FieldLabel>
                    <input type="text" className={inputClass} placeholder="Nexus Global Technologies Ltd." {...register('company_name')} />
                  </div>
                  <div>
                    <FieldLabel>TRADING NAME</FieldLabel>
                    <input type="text" className={inputClass} placeholder="e.g. Nexus Tech" {...register('trading_name')} />
                  </div>
                  <div>
                    <FieldLabel>REGISTRATION DATE</FieldLabel>
                    <input type="date" className={inputClass} {...register('registration_date')} />
                  </div>
                  <div>
                    <FieldLabel>PRIMARY INDUSTRY / SECTOR</FieldLabel>
                    <select className={inputClass} {...register('primary_industry')}>
                      <option>Information Technology</option>
                      <option>Healthcare Logistics</option>
                      <option>Heavy Machinery</option>
                      <option>General Trading</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-1 flex flex-col gap-6">
                  <div>
                    <FieldLabel>COMPANY LOGO</FieldLabel>
                    <div className="border border-dashed border-gray-300 bg-gray-50 rounded p-6 flex flex-col items-center justify-center text-center gap-2 h-[140px]">
                       <span className="text-sm font-bold text-blue-700 hover:underline cursor-pointer">Upload New</span>
                       <span className="text-[11px] text-gray-500">Recommended size: 512x512px. PNG or SVG.</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>FAVICON</FieldLabel>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                        <Upload size={16} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-blue-700 hover:underline cursor-pointer">Change</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Legal & Contact */}
            {activeTab === 1 && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <FieldLabel>CIN / REGISTRATION NO.</FieldLabel>
                    <input type="text" className={inputClass} placeholder="L12345DL2023PLC123456" {...register('cin_number')} />
                  </div>
                  <div>
                    <FieldLabel>OFFICIAL EMAIL</FieldLabel>
                    <input type="email" className={inputClass} placeholder="contact@nexusglobal.com" {...register('official_email')} />
                  </div>
                  <div>
                    <FieldLabel>TAX ID (GSTIN/VAT)</FieldLabel>
                    <input type="text" className={inputClass} placeholder="07AAAA0000A1Z5" {...register('tax_id')} />
                  </div>
                  <div>
                    <FieldLabel>PHONE NUMBER</FieldLabel>
                    <input type="text" className={inputClass} placeholder="+1 (555) 000-0000" {...register('phone_number')} />
                  </div>
                  <div>
                    <FieldLabel>REGISTERED STREET ADDRESS</FieldLabel>
                    <input type="text" className={inputClass} placeholder="123 Innovation Drive, Sector 5" {...register('street_address')} />
                  </div>
                  <div>
                    <FieldLabel>WEBSITE URL</FieldLabel>
                    <input type="text" className={inputClass} placeholder="https://www.nexusglobal.com" {...register('website_url')} />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-1">
                    <FieldLabel>CITY</FieldLabel>
                    <input type="text" className={inputClass} placeholder="e.g. New York" {...register('city')} />
                  </div>
                  <div className="col-span-1">
                    <FieldLabel>STATE/PROVINCE</FieldLabel>
                    <input type="text" className={inputClass} placeholder="e.g. NY" {...register('state_province')} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>COUNTRY</FieldLabel>
                    <select className={inputClass} {...register('country')}>
                      {COUNTRIES_DATA.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: System & Financial */}
            {activeTab === 2 && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <FieldLabel>BASE CURRENCY</FieldLabel>
                  <select className={inputClass} {...register('base_currency')}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>DATE FORMAT</FieldLabel>
                  <select className={inputClass} {...register('date_format')}>
                    <option>DD-MM-YYYY</option>
                    <option>MM-DD-YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>FISCAL YEAR START DATE</FieldLabel>
                  <div className="flex gap-4">
                    <select className={inputClass} {...register('fiscal_year_start_month')}>
                      <option>January</option>
                      <option>April</option>
                      <option>July</option>
                    </select>
                    <select className={inputClass} {...register('fiscal_year_start_day')}>
                      <option>1st</option>
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel>NUMBER FORMAT</FieldLabel>
                  <select className={inputClass} {...register('number_format')}>
                    <option>1,234,567.89</option>
                    <option>1.234.567,89</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>TIMEZONE</FieldLabel>
                  <select className={inputClass} {...register('timezone')}>
                    {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: Operational Defaults */}
            {activeTab === 3 && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <FieldLabel>DEFAULT BANK ACCOUNT</FieldLabel>
                    <select className={inputClass} {...register('default_bank_account_id')}>
                      <option value="">Select Bank Account</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>DEFAULT DISPATCH WAREHOUSE</FieldLabel>
                    <select className={inputClass} {...register('default_dispatch_warehouse_id')}>
                      <option value="">Select Warehouse</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>DEFAULT RECEIVING WAREHOUSE</FieldLabel>
                    <select className={inputClass} {...register('default_receiving_warehouse_id')}>
                      <option value="">Select Warehouse</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <FieldLabel>STANDARD TERMS & CONDITIONS</FieldLabel>
                  <div className="border border-gray-300 rounded bg-[#f8f9fc] overflow-hidden">
                    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-300">
                      <Bold size={16} className="text-gray-800 cursor-pointer" />
                      <Italic size={16} className="text-gray-800 cursor-pointer" />
                      <List size={16} className="text-gray-800 cursor-pointer" />
                      <div className="w-px h-4 bg-gray-300"></div>
                      <LinkIcon size={16} className="text-gray-800 cursor-pointer" />
                    </div>
                    <textarea 
                      className="w-full h-[120px] p-4 text-sm text-gray-700 bg-white focus:outline-none resize-none" 
                      placeholder="Enter standard legal terms to be printed on all documents..."
                      {...register('standard_terms')}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* FOOTER */}
        <div className="px-6 pt-6 mt-4 border-t border-gray-200 flex items-center justify-between text-[11px] font-semibold text-gray-500">
           <span>Nexus ERP v2.4.0 • Enterprise Edition</span>
           <div className="flex gap-6">
              <span className="cursor-pointer hover:text-gray-700">Privacy Policy</span>
              <span className="cursor-pointer hover:text-gray-700">Security Protocols</span>
           </div>
        </div>

      </div>
    </div>
  );
}