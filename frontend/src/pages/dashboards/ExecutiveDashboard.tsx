import React, { useState } from 'react';
import { 
  Building, 
  Package, 
  Coins, 
  Globe, 
  Percent, 
  FileText, 
  Download, 
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

// ── Business KPI Definitions ────────────────────────────────────────────────
interface KpiItem {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const BUSINESS_KPIS: KpiItem[] = [
  {
    label: 'Total Entities',
    value: '8 Registered',
    subtext: 'Subsidiaries, branches & warehouses',
    icon: <Building size={24} />,
    color: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.15)',
  },
  {
    label: 'Active Catalog Items',
    value: '1,420 SKUs',
    subtext: 'Across all active listings',
    icon: <Package size={24} />,
    color: '#00f5a0',
    glowColor: 'rgba(0, 245, 160, 0.15)',
  },
  {
    label: 'Base Currency',
    value: 'USD / EUR',
    subtext: 'Primary reporting currencies',
    icon: <Coins size={24} />,
    color: '#ffb703',
    glowColor: 'rgba(255, 183, 3, 0.15)',
  },
];

// Mock Business Entities
const REGISTERED_ENTITIES = [
  { id: '1', name: 'Nexus Logistics Global Ltd', type: 'Subsidiary', country: 'United Kingdom', status: 'Active', code: 'NEX-UK-01' },
  { id: '2', name: 'Aether Parts Americas LLC', type: 'Branch', country: 'United States', status: 'Active', code: 'AETH-US-03' },
  { id: '3', name: 'Main Terminal B Warehouse', type: 'Warehouse', country: 'Netherlands', status: 'Active', code: 'TERM-NL-02' },
  { id: '4', name: 'B-Core Asia Operations', type: 'Subsidiary', country: 'Singapore', status: 'Active', code: 'BCOR-SG-09' },
];

// Mock Tax Ledger
const TAX_REGULATIONS = [
  { region: 'European Union', category: 'Standard Goods', rate: '20%', status: 'Compliant' },
  { region: 'United Kingdom', category: 'Digital Services', rate: '20%', status: 'Compliant' },
  { region: 'North America (NY)', category: 'Warehousing', rate: '8.875%', status: 'Compliant' },
];

export default function ExecutiveDashboard() {
  const { activeWorkspace, token } = useAppContext();
  const [activeReportTab, setActiveReportTab] = useState<'financials' | 'operations' | 'compliance'>('financials');
  
  // Product Creator State
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form fields state
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [uom, setUom] = useState('');
  
  // Dynamic fields state
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tempControlled, setTempControlled] = useState(false);
  const [vin, setVin] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [description, setDescription] = useState('');

  const vertical = activeWorkspace?.industry_vertical || 'GENERAL_TRADING';
  const features = activeWorkspace?.features || {};

  // Extract UOM choices and schema fields based on vertical
  let uomChoices: string[] = [];
  if (vertical === 'HEALTHCARE_LOGISTICS') {
    uomChoices = features?.medicines?.uom_options || ['vials', 'mg', 'batches'];
  } else if (vertical === 'HEAVY_MACHINERY') {
    uomChoices = features?.vehicles?.uom_options || ['hours', 'km'];
  } else {
    uomChoices = features?.general?.uom_options || ['units', 'kg', 'boxes'];
  }

  // Handle opening of Product Creator Form
  const openProductCreator = () => {
    // Reset form fields
    setTitle('');
    setSku('');
    setUom(uomChoices[0] || '');
    setBatchNumber('');
    setExpiryDate('');
    setTempControlled(false);
    setVin('');
    setEngineHours('');
    setLastServiceDate('');
    setDescription('');
    setSuccessMsg('');
    setErrorMsg('');
    setCreatorOpen(true);
  };

  // Submit dynamic form
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    // Construct custom attributes based on Industry Vertical definition
    const customAttributes: Record<string, any> = {
      uom: uom,
      vertical: vertical
    };

    if (vertical === 'HEALTHCARE_LOGISTICS') {
      customAttributes.batch_number = batchNumber;
      customAttributes.expiry_date = expiryDate;
      customAttributes.temperature_controlled = tempControlled;
    } else if (vertical === 'HEAVY_MACHINERY') {
      customAttributes.vin = vin;
      customAttributes.engine_hours = parseFloat(engineHours) || 0;
      customAttributes.last_service_date = lastServiceDate;
    } else {
      customAttributes.description = description;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/catalog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          sku: sku.trim().toUpperCase(),
          custom_attributes: customAttributes
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Catalog item creation failed.');
      }

      setSuccessMsg(`Catalog Item ${sku.toUpperCase()} created successfully!`);
      // Close after delay
      setTimeout(() => {
        setCreatorOpen(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {/* Welcome & Overview Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 242, 254, 0.03) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(157, 78, 221, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(157, 78, 221, 0.15)',
              border: '1px solid rgba(157, 78, 221, 0.3)',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(157, 78, 221, 0.2)'
            }}
          >
            <Package size={32} color="#9d4edd" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '0.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Business Overview & Reports
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: '1.5' }}>
              Consolidated enterprise summaries, operating entity directories, multi-jurisdictional tax registries, and core organizational settings.
            </p>
          </div>
        </div>
        
        {/* Dynamic Vertical Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.6rem 1.2rem',
            borderRadius: '24px',
            border: '1px solid rgba(157, 78, 221, 0.3)',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Globe size={16} color="#ffb703" />
          <span>Active Vertical: {vertical.replace('_', ' ')}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {BUSINESS_KPIS.map((kpi) => (
          <div 
            key={kpi.label} 
            className="glass-panel" 
            style={{ 
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '140px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: kpi.glowColor,
                filter: 'blur(35px)',
                pointerEvents: 'none'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                {kpi.label}
              </span>
              <span style={{ color: kpi.color, background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {kpi.icon}
              </span>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#FFFFFF', lineHeight: 1.1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {kpi.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Horizontal Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Directory and Reports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Global Business Entities Directory */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', backgroundColor: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px' }}>
            <div 
              style={{ 
                padding: '1.25rem 1.75rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building size={20} color="#00f2fe" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Global Business Entities</h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                Ledger Verified
              </span>
            </div>
            
            <div style={{ padding: '1.25rem 1.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity Legal Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jurisdiction</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Code</th>
                  </tr>
                </thead>
                <tbody>
                  {REGISTERED_ENTITIES.map((ent) => (
                    <tr key={ent.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: '#F8FAFC' }}>{ent.name}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            background: ent.type === 'Subsidiary' ? 'rgba(157, 78, 221, 0.15)' : 'rgba(0, 242, 254, 0.15)', 
                            color: ent.type === 'Subsidiary' ? '#c8b6ff' : '#00f2fe',
                            fontWeight: 600
                          }}
                        >
                          {ent.type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: '#94A3B8' }}>{ent.country}</td>
                      <td style={{ padding: '1rem 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ent.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Reports Hub */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', backgroundColor: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px' }}>
            <div 
              style={{ 
                padding: '1.25rem 1.75rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <FileText size={20} color="#9d4edd" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Executive Reports Hub</h2>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0,0,0,0.1)' }}>
              <button 
                onClick={() => setActiveReportTab('financials')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeReportTab === 'financials' ? '2px solid #9d4edd' : '2px solid transparent',
                  color: activeReportTab === 'financials' ? '#ffffff' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Financial Summaries
              </button>
              <button 
                onClick={() => setActiveReportTab('operations')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeReportTab === 'operations' ? '2px solid #9d4edd' : '2px solid transparent',
                  color: activeReportTab === 'operations' ? '#ffffff' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Operations Reports
              </button>
              <button 
                onClick={() => setActiveReportTab('compliance')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeReportTab === 'compliance' ? '2px solid #9d4edd' : '2px solid transparent',
                  color: activeReportTab === 'compliance' ? '#ffffff' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Tax & Compliance
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.75rem' }}>
              {activeReportTab === 'financials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>Q2 Consolidated Profit & Loss</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Generated: June 2026 • Format: PDF</p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={14} /> Download
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>Global Ledger Balance Statement</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Generated: May 2026 • Format: XLSX</p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              )}

              {activeReportTab === 'operations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>Terminal Warehouse Capacity Report</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Weekly log • Stock movements and locks</p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink size={14} /> View
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>Catalog SKU Integrity Log</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Validation scan across all active catalog listings</p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink size={14} /> View
                    </button>
                  </div>
                </div>
              )}

              {activeReportTab === 'compliance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>Multi-Jurisdiction Tax Compliance Checklist</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Ledger audit status • Standard EU & US codes</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#00f5a0', background: 'rgba(0, 245, 160, 0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(0, 245, 160, 0.2)' }}>
                      Passed
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>System Access Governance Log</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Audit log of Tier 2, 3, 4 privilege checks</p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={14} /> Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Quick Stats and Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Tax Regulation Overview */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', backgroundColor: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px' }}>
            <div 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Percent size={18} color="#ffb703" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Regional Tax Rules</h3>
            </div>
            
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {TAX_REGULATIONS.map((tax, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i < TAX_REGULATIONS.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{tax.region}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{tax.category}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffb703' }}>{tax.rate}</span>
                      <CheckCircle size={14} color="#00f5a0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel" style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="#00f2fe" />
              Quick Operations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={openProductCreator}
                className="btn btn-primary" 
                style={{ 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '0.8rem 1rem', 
                  fontSize: '0.85rem',
                  textAlign: 'left' 
                }}
              >
                <span>Launch Product Creator</span>
                <Plus size={16} />
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '0.8rem 1rem', 
                  fontSize: '0.85rem',
                  textAlign: 'left' 
                }}
              >
                <span>Audit Department Access</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  padding: '0.8rem 1rem', 
                  fontSize: '0.85rem',
                  textAlign: 'left' 
                }}
              >
                <span>Configure Formats & Logo</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Product Creator Overlay/Modal ── */}
      {creatorOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 13, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1.5rem'
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              backgroundColor: '#1E293B', 
              border: '1px solid rgba(157, 78, 221, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {vertical === 'HEALTHCARE_LOGISTICS' ? 'Register Pharmaceutical Item' : 
                   vertical === 'HEAVY_MACHINERY' ? 'Register Fleet Asset' : 'Register Product & Item'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Vertical: {vertical.replace('_', ' ')}
                </p>
              </div>
              <button 
                onClick={() => setCreatorOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error / Success Banners */}
            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(0, 245, 160, 0.1)', border: '1px solid rgba(0, 245, 160, 0.2)', borderRadius: '8px', color: '#00f5a0', fontSize: '0.85rem' }}>
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', color: '#ff3366', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Product Title */}
              <div>
                <label>Item Name / Title</label>
                <input 
                  type="text" 
                  required
                  placeholder={vertical === 'HEALTHCARE_LOGISTICS' ? 'e.g. Paracetamol 500mg' : 
                               vertical === 'HEAVY_MACHINERY' ? 'e.g. Caterpillar Excavator 320' : 'e.g. Steel Pipe'} 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* SKU */}
              <div>
                <label>Unique SKU Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. SKU-100-AB" 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              {/* Locked UOM Dropdown */}
              <div>
                <label>Unit of Measure (UOM)</label>
                <select 
                  value={uom} 
                  onChange={(e) => setUom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                >
                  {uomChoices.map((choice) => (
                    <option key={choice} value={choice}>{choice}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.7rem', color: '#9d4edd', marginTop: '4px', fontWeight: 600 }}>
                  Locked to active industry vertical: {vertical.replace('_', ' ')}
                </p>
              </div>

              {/* ── Dynamic Fields ── */}
              
              {vertical === 'HEALTHCARE_LOGISTICS' && (
                <>
                  <div>
                    <label>Batch Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. BATCH-994" 
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Expiry Date</label>
                    <input 
                      type="date" 
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="tempControlled" 
                      checked={tempControlled}
                      onChange={(e) => setTempControlled(e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <label htmlFor="tempControlled" style={{ margin: 0, textTransform: 'none', cursor: 'pointer' }}>
                      Requires Cold Chain / Temperature Controlled
                    </label>
                  </div>
                </>
              )}

              {vertical === 'HEAVY_MACHINERY' && (
                <>
                  <div>
                    <label>VIN (Vehicle Identification Number)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 17-digit VIN code" 
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Current Engine Hours</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 450" 
                      value={engineHours}
                      onChange={(e) => setEngineHours(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Last Service Date</label>
                    <input 
                      type="date" 
                      value={lastServiceDate}
                      onChange={(e) => setLastServiceDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {vertical === 'GENERAL_TRADING' && (
                <div>
                  <label>Item Description</label>
                  <textarea 
                    placeholder="Enter description..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setCreatorOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="udg-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Create Item'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
