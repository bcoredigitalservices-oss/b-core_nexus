import React, { useState } from 'react';
import { Users, Lock, Unlock } from 'lucide-react';
// @ts-ignore: UniversalDataGrid is a JSX component
import UniversalDataGrid from '../../components/ui/UniversalDataGrid';
import { useAppContext } from '../../context/AppContext';
import ProvisionUserModal from '../../components/iam/ProvisionUserModal';
import EditUserAccessModal from '../../components/iam/EditUserAccessModal';

export default function UsersDashboard() {
  const { authFetch } = useAppContext();
  const [gridKey, setGridKey] = useState(0);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);

  // Modal and editing states
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const handleRevoke = async (userId: string) => {
    if (confirm("Are you sure you want to revoke this user's active session and disable access?")) {
      setRevokingUser(userId);
      try {
        await authFetch(`/auth/users/${userId}/revoke`, { method: 'POST' });
        setGridKey(prev => prev + 1);
      } catch (err: any) {
        alert(err.message || "Failed to revoke session");
      } finally {
        setRevokingUser(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#00f2fe]/5 to-[#9d4edd]/5 border border-color rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 z-10">
          <div className="bg-[#00f2fe]/10 border border-[#00f2fe]/20 rounded-xl p-3 flex items-center justify-center">
            <Users size={28} className="text-accent-blue" />
          </div>
          <div>
            <h1 className="text-[1.6rem] font-bold text-text-main font-display mb-1">
              User Administration
            </h1>
            <p className="text-text-muted text-[0.875rem]">
              Manage registered users and active network sessions.
            </p>
          </div>
        </div>

        {/* Provision button in header */}
        <button 
          className="btn btn-primary z-10" 
          onClick={() => setIsProvisionModalOpen(true)}
        >
          + Provision User
        </button>
      </div>

      <div className="glass-panel p-0 overflow-hidden">
        <div className="py-5 px-6 border-b border-color flex items-center gap-3">
          <Users size={20} className="text-accent-blue" />
          <h2 className="text-[1.1rem] font-semibold text-text-main">Identity & Access</h2>
        </div>
        <div className="p-5">
          <UniversalDataGrid
            key={gridKey}
            endpointUrl="/api/v1/auth/users"
            title="Registered Users"
            pageSize={10}
            emptyMessage="No active users registered on this node."
            columns={[
              { key: 'email', label: 'Email', sortable: true },
              {
                key: 'name',
                label: 'Name',
                render: (_: any, row: any) => {
                  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
                  return fullName || <em className="opacity-50">Unconfigured</em>;
                }
              },
              {
                key: 'role_tier',
                label: 'Tier',
                sortable: true,
                render: (value: any) => (
                  <span className={`badge badge-t${value}`}>
                    Tier {value}
                  </span>
                )
              },
              {
                key: 'clearance_level',
                label: 'Clearance',
                sortable: true,
                render: (value: any) => (
                  value !== undefined && value !== null ? (
                    <span className={`badge badge-t${value}`}>
                      Level {value}
                    </span>
                  ) : (
                    <em className="opacity-50">N/A</em>
                  )
                )
              },
              {
                key: 'mfa_enabled',
                label: 'MFA',
                sortable: true,
                render: (value: any) => (
                  <span className={`badge ${value ? 'badge-site' : 'badge-t4'}`}>
                    {value ? 'Enabled' : 'Disabled'}
                  </span>
                )
              },
              {
                key: 'is_active',
                label: 'Status',
                sortable: true,
                render: (value: any) => (
                  <span className={`badge ${value ? 'badge-site' : 'badge-t4'}`}>
                    {value ? 'Active' : 'Inactive'}
                  </span>
                )
              },
              {
                key: 'revoke_session',
                label: 'Control',
                render: (_: any, row: any) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary py-1.5 px-2.5 text-[0.75rem] h-7 inline-flex items-center"
                      onClick={() => setEditingUser(row)}
                    >
                      ✏️ Edit Access
                    </button>
                    {row.is_active ? (
                      <button
                        className="bg-red-500/10 border border-red-500/25 text-red-400 py-1 px-3 h-7 rounded-lg text-[0.75rem] cursor-pointer inline-flex items-center gap-1.5 transition-all duration-200 font-semibold hover:bg-red-500/20 hover:border-red-500/45 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleRevoke(row.id)}
                        disabled={revokingUser === row.id}
                      >
                        <Lock size={12} />
                        {revokingUser === row.id ? 'Revoking...' : 'Revoke Session'}
                      </button>
                    ) : (
                      <span className="text-text-muted text-[0.75rem] inline-flex items-center gap-1 font-semibold">
                        <Unlock size={12} className="opacity-50" />
                        Revoked
                      </span>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>

      {/* Conditionally Render Modals */}
      <ProvisionUserModal 
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSuccess={() => {
          setIsProvisionModalOpen(false);
          setGridKey(prev => prev + 1);
        }}
      />

      <EditUserAccessModal 
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          setEditingUser(null);
          setGridKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
