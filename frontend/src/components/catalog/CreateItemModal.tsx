import React, { useEffect, useState } from 'react';
import { 
  X, 
  Cpu, 
  AlertCircle,
  Briefcase,
  Layers,
  Barcode
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemGroup {
  id: string;
  name: string;
  parent_id: string | null;
}

export default function CreateItemModal({ isOpen, onClose, onSuccess }: CreateItemModalProps) {
  const { token, authFetch } = useAppContext();

  // Item Groups metadata
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [catalogType, setCatalogType] = useState('stock');
  const [defaultUom, setDefaultUom] = useState('Nos');
  const [itemGroupId, setItemGroupId] = useState('');

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Item Groups on mount / open
  useEffect(() => {
    if (!isOpen || !token) return;

    const loadItemGroups = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const groups = await authFetch('/catalog/groups');
        if (groups) setItemGroups(groups);
      } catch (err: any) {
        console.error('Failed to load item groups:', err);
        setErrorMsg('Error loading item groups.');
      } finally {
        setLoading(false);
      }
    };

    loadItemGroups();
  }, [isOpen, token, authFetch]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !catalogType.trim() || !defaultUom.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await authFetch('/catalog/items', {
        method: 'POST',
        body: JSON.stringify({
          sku: sku.trim(),
          barcode: barcode.trim() || null,
          name: name.trim(),
          catalog_type: catalogType.trim(),
          default_uom: defaultUom.trim(),
          item_group_id: itemGroupId || null
        })
      });

      onSuccess();
      onClose();

      // Reset form states
      setSku('');
      setBarcode('');
      setName('');
      setCatalogType('stock');
      setDefaultUom('Nos');
      setItemGroupId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create catalog item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          maxWidth: '560px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
      >
        {/* Modal Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', margin: 0 }}>
            <Cpu size={20} color="var(--accent-primary)" />
            Add Catalog Item
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Define stock code, tracking barcodes, names, and structural classification.
          </p>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'var(--text-muted)', gap: '1rem' }}>
            <div className="udg-spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '0.85rem' }}>Loading catalog classifications...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* SKU */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>SKU Code *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. ITEM-0001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Item Name *</label>
              <input 
                type="text" 
                required
                placeholder="Product title or service name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Catalog Type & Default UOM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Catalog Type *</label>
                <select 
                  value={catalogType} 
                  onChange={(e) => setCatalogType(e.target.value)}
                  disabled={submitting}
                >
                  <option value="stock">Stock Item</option>
                  <option value="service">Service Module</option>
                  <option value="raw_material">Raw Material</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Default UOM *</label>
                <select 
                  value={defaultUom} 
                  onChange={(e) => setDefaultUom(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Nos">Nos</option>
                  <option value="Kg">Kg</option>
                  <option value="L">L</option>
                  <option value="Box">Box</option>
                  <option value="Hr">Hr</option>
                </select>
              </div>
            </div>

            {/* Item Group */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                <Layers size={14} />
                Item Group
              </label>
              <select 
                value={itemGroupId} 
                onChange={(e) => setItemGroupId(e.target.value)}
                disabled={submitting}
              >
                <option value="">-- No Classification (General Ledger) --</option>
                {itemGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={onClose}
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
                {submitting ? 'Creating...' : 'Create Item'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
