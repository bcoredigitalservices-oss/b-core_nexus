import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import DynamicFieldRenderer from '../../../components/forms/DynamicFieldRenderer';

interface ItemFormValues {
  sku: string;
  name: string;
  description: string;
  base_price: string;
  uom: string;
  item_group: string;
  custom_attributes?: Record<string, any>;
}

export default function ItemForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [itemSchema, setItemSchema] = useState<any[]>([]);
  const [itemGroups, setItemGroups] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<ItemFormValues>({
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      base_price: '0.00',
      uom: 'Piece',
      item_group: 'General',
    }
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;
  const token = () => localStorage.getItem('bcore_token') ?? '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token()}` };
        const [schemaRes, groupsRes, uomRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspace/config/item-schema`, { headers }),
          fetch(`${API_BASE}/item-groups`, { headers }),
          fetch(`${API_BASE}/uom`, { headers }).catch(() => null)
        ]);

        if (schemaRes.ok) setItemSchema(await schemaRes.json());
        if (groupsRes.ok) setItemGroups(await groupsRes.json());
        if (uomRes && uomRes.ok) setUoms(await uomRes.json());
      } catch (err) {
        console.error('Failed to load form data:', err);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (values: ItemFormValues) => {
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          ...values,
          base_price: parseFloat(values.base_price) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to create inventory item.';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      setFormSuccess('Item registered successfully!');
      setTimeout(() => navigate('/workspace/items/item'), 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating the item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/workspace/items/item')}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--text-main)' }}>
              New Item
            </h1>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
              <AlertCircle size={14} /> <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)', color: '#00f5a0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
              <CheckCircle2 size={14} /> <span>{formSuccess}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>SKU (Stock Keeping Unit) *</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} placeholder="e.g. SKU-RM-909" {...register('sku', { required: 'SKU is required' })} />
              {errors.sku && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.sku.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Base Price ($ USD) *</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="number" step="0.0001" min="0" placeholder="0.00" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} {...register('base_price', { required: 'Base price is required', min: { value: 0, message: 'Base price must be greater than or equal to 0' } })} />
              </div>
              {errors.base_price && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.base_price.message}</p>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Item Name *</label>
            <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} placeholder="e.g. Premium Aluminium Sheet A4" {...register('name', { required: 'Item Name is required' })} />
            {errors.name && <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>{errors.name.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Unit of Measure (UOM)</label>
              <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} {...register('uom')}>
                {uoms.length > 0 ? (
                  uoms.map(u => <option key={u.id} value={u.name}>{u.name}</option>)
                ) : (
                  <>
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Kg">Kilogram (Kg)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Meter">Meter (M)</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Item Group</label>
              <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} {...register('item_group')}>
                {itemGroups.length > 0 ? (
                  itemGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)
                ) : (
                  <>
                    <option value="General">General</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Consumables">Consumables</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {itemSchema.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <DynamicFieldRenderer schema={itemSchema} register={register} errors={errors} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Description</label>
            <textarea rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} placeholder="Optional details, supplier notes or specifications..." {...register('description')} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => navigate('/workspace/items/item')} style={{ padding: '0 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', height: '42px' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #ffb703, #f59e0b)', color: '#0b0f19', border: 'none', borderRadius: '8px', padding: '0 1.5rem', fontWeight: 700, cursor: 'pointer', height: '42px', boxShadow: '0 4px 12px rgba(255,183,3,0.2)' }}>
              <Save size={16} />
              {submitting ? 'Registering...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
