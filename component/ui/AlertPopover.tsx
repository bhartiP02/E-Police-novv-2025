"use client";

import { useState } from "react";

// ============================================
// TOAST NOTIFICATION COMPONENT
// ============================================
interface ToastProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
}

function Toast({ message, type, isVisible }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-in fade-in-0 slide-in-from-top-2">
      <div 
        className="px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]"
        style={{ 
          backgroundColor: type === "success" ? "#9A65C2" : "#DC2626"
        }}
      >
        {type === "success" ? (
          <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="text-white font-medium">{message}</span>
      </div>
    </div>
  );
}

// ============================================
// CONFIRMATION DIALOG COMPONENT
// ============================================
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  okButtonColor?: string;
  cancelButtonColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  okText = "OK",
  cancelText = "Cancel",
  okButtonColor = "#9A65C2",
  cancelButtonColor = "#6B7280",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop - Transparent with blur effect */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative z-[100000] animate-in fade-in-0 zoom-in-95">
        <div
          className="w-full max-w-md rounded-lg border bg-white p-6 shadow-2xl"
          style={{
            borderColor: "#E5E7EB",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div className="text-left">
            <h3 className="font-medium text-lg text-black mb-4 break-words">
              {title}
            </h3>
            {message && (
              <p className="text-sm text-gray-600 mb-6 break-words">
                {message}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onConfirm}
                className="px-6 py-2 rounded-md text-sm text-white hover:opacity-80 transition-opacity font-medium min-w-[80px]"
                style={{ backgroundColor: okButtonColor }}
              >
                {okText}
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-2 rounded-md text-sm text-white hover:opacity-80 transition-opacity font-medium min-w-[80px]"
                style={{ backgroundColor: cancelButtonColor }}
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ALERT POPOVER COMPONENT (CUSTOMIZABLE)
// ============================================
interface AlertPopoverProps {
  trigger: React.ReactNode;
  title: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  okButtonColor?: string;
  cancelButtonColor?: string;
  successMessage?: string;
  errorMessage?: string;
  successMessageColor?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

function AlertPopover({
  trigger,
  title,
  message,
  okText = "OK",
  cancelText = "Cancel",
  okButtonColor = "#9A65C2",
  cancelButtonColor = "#6B7280",
  successMessage = "Operation completed successfully",
  errorMessage = "An error occurred. Please try again.",
  successMessageColor = "#9A65C2",
  onConfirm,
  onCancel,
}: AlertPopoverProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: "success" | "error" }>({
    isVisible: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast({ isVisible: false, message: "", type: "success" });
    }, 3000);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setIsDialogOpen(false);
      showToast(successMessage, "success");
    } catch (error) {
      setIsDialogOpen(false);
      showToast(errorMessage, "error");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
      />

      {/* Trigger Button */}
      <div onClick={() => setIsDialogOpen(true)}>
        {trigger}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        title={title}
        message={message}
        okText={okText}
        cancelText={cancelText}
        okButtonColor={okButtonColor}
        cancelButtonColor={cancelButtonColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

export { AlertPopover, Toast };