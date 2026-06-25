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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .udg-th--actions, .udg-td--actions {
          display: none !important;
        }
        .btn-revoke {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-weight: 600;
        }
        .btn-revoke:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.22);
          border-color: rgba(239, 68, 68, 0.45);
          transform: translateY(-1px);
        }
        .btn-revoke:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      {/* Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(157, 78, 221, 0.05) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={28} color="var(--accent-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700 }}>
              User Administration
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage registered users and active network sessions.
            </p>
          </div>
        </div>

        {/* Provision button in header */}
        <button 
          className="btn btn-primary" 
          onClick={() => setIsProvisionModalOpen(true)}
          style={{ zIndex: 1 }}
        >
          + Provision User
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div 
          style={{ 
            padding: '1.25rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Users size={20} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Identity & Access</h2>
        </div>
        <div style={{ padding: '1.25rem' }}>
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
                  return fullName || <em style={{ opacity: 0.5 }}>Unconfigured</em>;
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
                    <em style={{ opacity: 0.5 }}>N/A</em>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center' }}
                      onClick={() => setEditingUser(row)}
                    >
                      ✏️ Edit Access
                    </button>
                    {row.is_active ? (
                      <button
                        className="btn-revoke"
                        style={{ height: '28px', display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => handleRevoke(row.id)}
                        disabled={revokingUser === row.id}
                      >
                        <Lock size={12} />
                        {revokingUser === row.id ? 'Revoking...' : 'Revoke Session'}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Unlock size={12} style={{ opacity: 0.5 }} />
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
