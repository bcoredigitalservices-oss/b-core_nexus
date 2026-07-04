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
    <div className="flex flex-col gap-4 my-2">
      {schema.map((field) => {
        const label = field.name
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const fieldKey = `custom_attributes.${field.name}`;

        return (
          <div key={field.name}>
            <label className="block mb-1.5 text-[0.85rem] font-semibold text-text-main">
              {label} *
            </label>
            {field.type === 'select' ? (
              <select
                {...register(fieldKey, { required: `${label} is required` })}
                className="w-full py-3 px-4 bg-input border border-color rounded-lg text-text-main text-[0.9rem] outline-none transition-all duration-200 focus:ring-2 focus:ring-accent-primary/20"
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
                className="w-full py-3 px-4 bg-input border border-color rounded-lg text-text-main text-[0.9rem] outline-none transition-all duration-200 focus:ring-2 focus:ring-accent-primary/20"
              />
            )}
            {errors.custom_attributes && (errors.custom_attributes as any)[field.name] && (
              <p className="text-[#ff3366] text-[0.75rem] mt-1">
                {(errors.custom_attributes as any)[field.name].message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
