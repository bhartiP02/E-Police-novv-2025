// File: @/component/ui/ExcelUpload/ExcelUpload.tsx
"use client";

import { useState, useCallback } from "react";
import { X, Upload as UploadIcon, FileText } from "lucide-react";
import { api } from "@/services/api/apiServices";

interface ExcelUploadProps {
  onSuccess: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export default function ExcelUpload({
  onSuccess,
  showToast,
}: ExcelUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const downloadExcelTemplate = useCallback(async () => {
    try {
      const response = await api.get("/sensitive-areas/template/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "sensitive_areas_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("Template downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Error downloading template:", error);
      showToast("Failed to download template", "error");
    }
  }, [showToast]);

  const uploadExcelFile = useCallback(async () => {
    if (!selectedFile) {
      showToast("Please select a file first", "error");
      return;
    }
    try {
      setIsUploadingExcel(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await api.post("/sensitive-areas/upload-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      showToast(response?.data?.message || "Excel file uploaded successfully!", "success");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error uploading excel:", error);
      showToast(error.response?.data?.message || "Failed to upload excel file", "error");
    } finally {
      setIsUploadingExcel(false);
    }
  }, [selectedFile, showToast, onSuccess]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setFileInputKey((prev) => prev + 1);
    setIsOpen(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }, []);

  return (
    <>
      {/* Button with Tooltip */}
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 hover:border-blue-300"
          title="Upload Excel File"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Upload Excel File"
        >
          <UploadIcon size={20} />
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none">
            Upload Excel File
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UploadIcon size={18} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Upload Excel File</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {/* File Input Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Excel File
                </label>
                <div className="relative">
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="block w-full px-2 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-colors text-center"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {selectedFile.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <UploadIcon size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to select file
                        </span>
                        <span className="text-xs text-gray-500">
                          (.xlsx, .xls)
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-sm text-gray-700 mb-3">
                  Need a template? Download the sample format to see the required structure.
                </p>
                <button
                  onClick={downloadExcelTemplate}
                  className="w-full px-3 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Download Sample Format
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadExcelFile}
                  disabled={!selectedFile || isUploadingExcel}
                  className="flex-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isUploadingExcel ? (
                    <>
                      <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon size={16} />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}