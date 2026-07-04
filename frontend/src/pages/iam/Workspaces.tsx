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

  const getWorkspaceDetails = (identifier: string) => {
    // We can add a simple hash to generate deterministic colors or just use a default
    return {
      icon: <CheckCircle size={24} />,
      accentColor: '#00f2fe'
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
        <Loader2 className="animate-spin" size={32} />
        <span>Syncing workspace clusters...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto p-4">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#9d4edd]/8 to-[#00f2fe]/3 border border-color rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#00f2fe]/15 border border-[#00f2fe]/30 rounded-xl p-2.5 flex items-center justify-center">
            <Building2 size={24} className="text-[#00f2fe]" />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-extrabold text-text-main font-display mb-1">
              Corporate Workspace Registry
            </h1>
            <p className="text-text-muted text-[0.85rem]">
              Authorize active workspace applications to define access scopes for Tier 2, 3, and 4 users.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.88rem]">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[#ff3366] text-[0.88rem]">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Workspaces */}
      <div>
        <h2 className="text-[1.1rem] font-bold text-text-main mb-5">
          Workspace Application Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbWorkspaces.map((dbRecord) => {
            const isActive = dbRecord.status === 'Active';
            const isUpdating = updatingId === dbRecord.identifier;
            const details = getWorkspaceDetails(dbRecord.identifier);

            return (
              <div 
                key={dbRecord.identifier}
                className="glass-panel bg-card border border-white/8 rounded-2xl p-8 flex flex-col justify-between min-h-[230px] relative"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-card-hover border border-color p-2.5 rounded-lg" style={{ color: details.accentColor }}>
                      {details.icon}
                    </div>
                    <div>
                      <h4 className="text-[1.05rem] font-bold text-text-main">
                        {dbRecord.name}
                      </h4>
                      <span className="text-[0.72rem] text-text-muted">
                        ID: {dbRecord.identifier}
                      </span>
                    </div>
                  </div>

                  <p className="text-text-muted text-[0.85rem] leading-relaxed">
                    System application module ready for provisioning.
                  </p>
                </div>

                {/* Activation Control Footer */}
                <div className="border-t border-color pt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className={`text-[0.78rem] font-semibold ${isActive ? 'text-[#00f5a0]' : 'text-text-muted'}`}>
                      {isActive ? 'Operational / Active' : 'Offline / Inactive'}
                    </span>
                    <span className="text-[0.65rem] text-text-muted">
                      {dbRecord ? 'Registered in DB' : 'Not Registered'}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleWorkspace(dbRecord.identifier, dbRecord.name, isActive)}
                    disabled={isUpdating}
                    className={`bg-transparent border-none p-0 flex items-center ${
                      isActive ? 'text-[#00f5a0]' : 'text-text-muted'
                    } ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isUpdating ? (
                      <Loader2 className="animate-spin" size={28} />
                    ) : isActive ? (
                      <ToggleRight size={36} />
                    ) : (
                      <ToggleLeft size={36} className="opacity-50" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl">
        <ShieldAlert size={18} className="text-[#ffb703] flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-[0.85rem] text-[#ffb703] font-bold mb-1">
            System Administration Security Notice
          </h5>
          <p className="m-0 text-[0.75rem] text-text-muted leading-relaxed">
            Activating a workspace initiates dynamic routing pathways and allows local site managers to assign operator user clearance scopes. Ensure alignment with organization operations framework before toggling workspace states.
          </p>
        </div>
      </div>

    </div>
  );
}
