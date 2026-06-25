import React, { useState } from 'react';
import { Layers, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface CreateItemGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateItemGroupModal({ isOpen, onClose, onSuccess }: CreateItemGroupModalProps) {
  const { authFetch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [parentGroupId, setParentGroupId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        parent_group_id: parentGroupId || null
      };

      const res = await authFetch('/catalog/groups', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res) throw new Error('Failed to create Item Group');
      onSuccess();
      setName('');
      setParentGroupId('');
    } catch (err: any) {
      setError(err.message || 'Error creating group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '450px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(90deg, rgba(99,91,255,0.08), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99,91,255,0.1)', padding: '8px', borderRadius: '8px', color: '#635bff' }}>
              <Layers size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Create Item Group</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Group Name *</label>
              <input 
                type="text" 
                className="input-field" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Raw Materials" 
                required 
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parent Group ID (Optional)</label>
              <input 
                type="text" 
                className="input-field" 
                value={parentGroupId} 
                onChange={(e) => setParentGroupId(e.target.value)} 
                placeholder="UUID for hierarchy..." 
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
