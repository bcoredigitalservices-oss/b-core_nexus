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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] p-6">
      <div className="glass-panel w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-card border border-color rounded-2xl p-8 shadow-xl flex flex-col gap-6 relative">
        {/* Modal Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 bg-card-hover border border-color text-text-muted cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-all duration-200 hover:text-text-main hover:border-accent-primary"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1.5 border-b border-color pb-4">
          <h3 className="text-[1.25rem] font-extrabold text-text-main flex items-center gap-2 font-display m-0">
            <Cpu size={20} className="text-accent-primary" />
            Add Catalog Item
          </h3>
          <p className="text-[0.8rem] text-text-muted m-0">
            Define stock code, tracking barcodes, names, and structural classification.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[0.85rem]">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 text-text-muted gap-4">
            <div className="w-6 h-6 border-3 border-color border-t-accent-primary rounded-full animate-spin"></div>
            <span className="text-[0.85rem]">Loading catalog classifications...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* SKU */}
            <div>
              <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">SKU Code *</label>
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
              <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Item Name *</label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Catalog Type *</label>
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
                <label className="block text-[0.75rem] text-text-muted font-semibold mb-1.5">Default UOM *</label>
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
              <label className="flex items-center gap-1.5 text-[0.75rem] text-text-muted font-semibold mb-1.5">
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
            <div className="flex gap-4 mt-4 border-t border-color pt-5">
              <button 
                type="button" 
                className="btn btn-secondary flex-1" 
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1" 
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
