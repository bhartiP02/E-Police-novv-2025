import React, { useState, useEffect } from "react";
import type { FieldConfig } from "../add-section/add-section"; // adjust path if needed

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  title?: string;
  fields: FieldConfig[];   // ✅ FIX: properly type fields
  isLoading?: boolean;
  submitButtonText?: string;
  loadingMessage?: string;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Edit Details",
  fields,
  isLoading = false,
  submitButtonText = "Save Changes",
  loadingMessage,
}) => {
  const [formData, setFormData] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        initialData[field.name] = field.defaultValue?.toString() || "";
      });
      setFormData(initialData);
      setIsInitialized(true);
    }

    if (!isOpen && isInitialized) {
      setIsInitialized(false);
    }
  }, [isOpen, fields, isInitialized]);

  if (!isOpen) return null;

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const baseClass =
    "w-full px-3 py-2 border border-gray-300 rounded text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const renderField = (f: FieldConfig) => {
    const value = formData[f.name] || "";

    switch (f.type) {
      case "select":
        return (
          <select
            {...f.customProps}
            onChange={(e) => {
              f.customProps?.onChange?.(e);
              handleChange(f.name, e.target.value);
            }}
            onMouseDown={(e) => f.customProps?.onMouseDown?.(e)}
            value={value}
            className={baseClass}
            required={f.required}
          >
            <option value="">{f.placeholder || "Select"}</option>

            {f.options?.map((op, i) => (
              <option key={i} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={f.type}
            value={value}
            onChange={(e) => handleChange(f.name, e.target.value)}
            placeholder={f.placeholder}
            className={baseClass}
            required={f.required}
          />
        );
    }
  };

  const gridClass =
    fields.length >= 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
      : "space-y-4";

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto z-[10000] scale-95">

        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">{title}</h2>
        </div>

        <div className="px-4 py-3">
          <div className={gridClass}>
            {fields.map((f, i) => (
              <div key={i} className="flex flex-col">
                <label className="block text-sm font-medium text-black mb-1">
                  {f.label}
                  {f.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(f)}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black border border-gray-300 rounded hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
          >
            {isLoading ? loadingMessage || "Saving..." : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
