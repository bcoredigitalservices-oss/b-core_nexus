import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

export interface SchemaField {
  name: string;
  type: string;
  options?: string[];
}

interface DynamicFieldRendererProps {
  schema: SchemaField[];
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export default function DynamicFieldRenderer({ schema, register, errors }: DynamicFieldRendererProps) {
  if (!schema || schema.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
      {schema.map((field) => {
        const label = field.name
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const fieldKey = `custom_attributes.${field.name}`;

        return (
          <div key={field.name}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #ffffff)' }}>
              {label} *
            </label>
            {field.type === 'select' ? (
              <select
                {...register(fieldKey, { required: `${label} is required` })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-input, #1E293B)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  borderRadius: '8px',
                  color: 'var(--text-main, #ffffff)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">Select option...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder={`Enter ${label.toLowerCase()}...`}
                {...register(fieldKey, { required: `${label} is required` })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-input, #1E293B)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  borderRadius: '8px',
                  color: 'var(--text-main, #ffffff)',
                  fontSize: '0.9rem',
                }}
              />
            )}
            {errors.custom_attributes && (errors.custom_attributes as any)[field.name] && (
              <p style={{ color: '#ff3366', fontSize: '0.75rem', marginTop: '4px' }}>
                {(errors.custom_attributes as any)[field.name].message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
