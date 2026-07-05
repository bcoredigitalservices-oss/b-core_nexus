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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[450px] bg-card border border-color rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center py-5 px-6 border-b border-color bg-gradient-to-r from-accent-primary/8 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="bg-accent-primary/10 p-2 rounded-lg text-accent-primary flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h2 className="m-0 text-[1.1rem] font-bold text-text-main">Create Item Group</h2>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-text-muted cursor-pointer hover:text-text-main">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-500/10 text-[#ef4444] p-2.5 rounded-lg mb-4 text-[0.85rem] border border-red-500/20">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-text-muted">Group Name *</label>
              <input 
                type="text" 
                className="input-field w-full p-2.5 bg-black/20 border border-color rounded-lg text-white outline-none focus:ring-2 focus:ring-accent-primary/20" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Raw Materials" 
                required 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-text-muted">Parent Group ID (Optional)</label>
              <input 
                type="text" 
                className="input-field w-full p-2.5 bg-black/20 border border-color rounded-lg text-white outline-none focus:ring-2 focus:ring-accent-primary/20" 
                value={parentGroupId} 
                onChange={(e) => setParentGroupId(e.target.value)} 
                placeholder="UUID for hierarchy..." 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-8">
            <button type="button" onClick={onClose} className="bg-transparent border border-color text-text-muted py-2 px-4 rounded-lg cursor-pointer hover:text-text-main">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-accent-primary text-white border-none py-2 px-4 rounded-lg cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
