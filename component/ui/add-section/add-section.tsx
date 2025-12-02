'use client';

import { useState } from 'react';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'number' | 'email' | 'password';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  className?: string;
  rows?: number;
  disabled?: boolean;

  // Support pre-filled values (needed in EditModal)
  defaultValue?: string | number;

  // Support async handlers + custom className
  customProps?: {
    onMouseDown?: (e: React.MouseEvent) => void | Promise<void>;
    onFocus?: (e: React.FocusEvent) => void | Promise<void>;
    onClick?: (e: React.MouseEvent) => void | Promise<void>;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void | Promise<void>;
    className?: string;
  };
}

export interface AddSectionProps {
  title: string;
  fields: FieldConfig[];
  onSubmit: (data: Record<string, string>) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  collapsedView?: React.ReactNode;
  className?: string;
}

const AddSection: React.FC<AddSectionProps> = ({
  title,
  fields,
  onSubmit,
  onCancel,
  submitButtonText = 'Add',
  collapsedView,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);

    const resetData: Record<string, string> = {};
    fields.forEach(field => {
      resetData[field.name] = '';
    });
    setFormData(resetData);

    setIsExpanded(false);
  };

  const handleCancel = () => {
    const resetData: Record<string, string> = {};
    fields.forEach(field => {
      resetData[field.name] = '';
    });
    setFormData(resetData);

    setIsExpanded(false);
    onCancel?.();
  };

  const renderField = (field: FieldConfig) => {
    const commonProps = {
      value: formData[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        handleInputChange(field.name, e.target.value);

        if (field.customProps?.onChange && field.type === 'select') {
          field.customProps.onChange(e as React.ChangeEvent<HTMLSelectElement>);
        }
      },
      placeholder: field.placeholder,
      required: field.required,
      className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black text-black text-sm ${field.className || ''}`,
      onMouseDown: field.customProps?.onMouseDown,
      onFocus: field.customProps?.onFocus,
      onClick: field.customProps?.onClick,
    };

    switch (field.type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{field.placeholder || "Select"}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={3}
            className={`${commonProps.className} resize-vertical`}
          />
        );

      default:
        return <input type={field.type} {...commonProps} />;
    }
  };

  // 👇 NEW — Auto switch to 2 columns when more than 3 fields
  const gridClass =
    fields.length > 3
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
      : "space-y-4";

  return (
    <div className={`w-full max-w-[1200px] mx-auto ${className}`}>
      {!isExpanded ? (
        <div
          className="bg-[#E7EDFD] border border-gray-200 cursor-pointer w-full flex items-center justify-between px-4 py-3 hover:shadow-sm transition"
          style={{
            height: "52px",
            borderRadius: "14px",
          }}
          onClick={() => setIsExpanded(true)}
        >
          <h2 className="text-sm font-semibold text-black truncate pr-2">
            {title}
          </h2>

          {/* Bold + icon */}
          <div className="w-6 h-6 border-2 border-black rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-black font-bold"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      ) : (
        <div
          className="bg-white shadow-md border border-gray-200 w-full"
          style={{ borderRadius: '18px' }}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black truncate pr-4">
                {title}
              </h2>

              <button
                onClick={handleCancel}
                className="w-6 h-6 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                type="button"
              >
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Section with Auto Grid */}
            <form onSubmit={handleSubmit}>
              <div className={gridClass}>
                {fields.map(field => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-medium text-black">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <hr className="border-gray-300 my-4" />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
                >
                  {submitButtonText}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default AddSection;
