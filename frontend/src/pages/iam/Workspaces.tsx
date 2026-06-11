import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Truck, 
  Wrench, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface WorkspaceItem {
  id: string;
  name: string;
  identifier: string;
  status: string;
  organization_id: string;
}

export default function Workspaces() {
  const { token, authFetch, activeWorkspace } = useAppContext();
  
  const [dbWorkspaces, setDbWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const vertical = activeWorkspace?.industry_vertical || 'GENERAL_TRADING';

  // Fetch registered workspaces from database
  const fetchWorkspaces = async () => {
    try {
      const data = await authFetch('/iam/workspaces');
      if (data) {
        setDbWorkspaces(data);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setErrorMsg('Could not fetch registered workspace statuses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWorkspaces();
    }
  }, [token]);

  // Handle toggle switch action
  const handleToggleWorkspace = async (identifier: string, name: string, currentStatus: boolean) => {
    setUpdatingId(identifier);
    setSuccessMsg('');
    setErrorMsg('');

    const targetStatus = currentStatus ? 'Inactive' : 'Active';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/iam/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: name,
          identifier: identifier,
          status: targetStatus
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to update workspace status.');
      }

      setSuccessMsg(`Workspace "${name}" status updated to ${targetStatus}!`);
      await fetchWorkspaces();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving workspace state.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Define potential workspace applications
  const availableApps = [
    {
      identifier: 'spedex_hub',
      name: 'SpedEx Logistics Hub',
      description: 'Medical batch logistics, cold chain temperature logs, and delivery corridors.',
      icon: <Truck size={24} />,
      alignedVertical: 'HEALTHCARE_LOGISTICS',
      accentColor: '#00f5a0'
    },
    {
      identifier: 'fleet_motion',
      name: 'B-Core Motion Fleet Management',
      description: 'Heavy machinery tracking, vehicle service schedules, and equipment hour logging.',
      icon: <Wrench size={24} />,
      alignedVertical: 'HEAVY_MACHINERY',
      accentColor: '#ffb703'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)', gap: '1rem' }}>
        <Loader2 className="udg-spinner" size={32} />
        <span>Syncing workspace clusters...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 242, 254, 0.03) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building2 size={24} color="#00f2fe" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: 'var(--font-display)' }}>
              Corporate Workspace Registry
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Authorize active workspace applications to define access scopes for Tier 2, 3, and 4 users.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', backgroundColor: 'rgba(0, 245, 160, 0.1)', border: '1px solid rgba(0, 245, 160, 0.2)', borderRadius: '12px', color: '#00f5a0', fontSize: '0.88rem' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '12px', color: '#ff3366', fontSize: '0.88rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Workspaces */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
          Workspace Application Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {availableApps.map((app) => {
            const dbRecord = dbWorkspaces.find(w => w.identifier === app.identifier);
            const isActive = dbRecord?.status === 'Active';
            const isUpdating = updatingId === app.identifier;
            const isAligned = vertical === app.alignedVertical;

            return (
              <div 
                key={app.identifier}
                className="glass-panel"
                style={{
                  background: 'var(--bg-card)',
                  border: isAligned 
                    ? `1px solid ${app.accentColor}40` 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '230px',
                  position: 'relative'
                }}
              >
                {/* Aligned Badge */}
                {isAligned && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      backgroundColor: `${app.accentColor}20`,
                      color: app.accentColor,
                      border: `1px solid ${app.accentColor}30`,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Vertical Aligned
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div 
                      style={{
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-color)',
                        padding: '10px',
                        borderRadius: '10px',
                        color: app.accentColor
                      }}
                    >
                      {app.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {app.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ID: {app.identifier}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                    {app.description}
                  </p>
                </div>

                {/* Activation Control Footer */}
                <div 
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isActive ? '#00f5a0' : 'var(--text-muted)' }}>
                      {isActive ? 'Operational / Active' : 'Offline / Inactive'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {dbRecord ? 'Registered in DB' : 'Not Registered'}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleWorkspace(app.identifier, app.name, isActive)}
                    disabled={isUpdating}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      color: isActive ? '#00f5a0' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {isUpdating ? (
                      <Loader2 className="udg-spinner" size={28} />
                    ) : isActive ? (
                      <ToggleRight size={36} />
                    ) : (
                      <ToggleLeft size={36} style={{ opacity: 0.5 }} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Warning */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          background: 'rgba(255, 183, 3, 0.05)',
          border: '1px solid rgba(255, 183, 3, 0.15)',
          padding: '1rem 1.25rem',
          borderRadius: '12px'
        }}
      >
        <ShieldAlert size={18} color="#ffb703" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h5 style={{ fontSize: '0.85rem', color: '#ffb703', fontWeight: 700, margin: '0 0 4px 0' }}>
            System Administration Security Notice
          </h5>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Activating a workspace initiates dynamic routing pathways and allows local site managers to assign operator user clearance scopes. Ensure alignment with organization operations framework before toggling workspace states.
          </p>
        </div>
      </div>

    </div>
  );
}
