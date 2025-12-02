"use client";

import * as React from "react";
import { FileText, FileSpreadsheet, Printer } from "lucide-react";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";

interface ExportButtonsProps {
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  pdfConfig?: ExportPdfOptions; // Configuration for PDF export
  className?: string;
}

export function ExportButtons({
  onExportPdf,
  onExportExcel,
  onPrint,
  pdfConfig,
  className = "",
}: ExportButtonsProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  // ✅ Initialize the hook at component level
  const { exportToPdf } = useExportPdf();

  const handlePdfExport = () => {
    if (onExportPdf) {
      // Use custom handler if provided
      onExportPdf();
    } else if (pdfConfig) {
      // Use the hook to export PDF
      console.log("🎯 Exporting PDF with config:", pdfConfig);
      const result = exportToPdf(pdfConfig);
      
      if (result.success) {
        console.log("✅ PDF exported successfully");
      } else {
        console.error("❌ PDF export failed:", result.message, result.error);
      }
    } else {
      console.warn("⚠️ No PDF export configuration provided");
    }
  };

  const exportItems = [
    {
      icon: FileText,
      action: handlePdfExport,
      label: "PDF",
    },
    {
      icon: FileSpreadsheet,
      action: onExportExcel,
      label: "Excel",
    },
    {
      icon: Printer,
      action: onPrint,
      label: "Print",
    },
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {exportItems.map((item, index) => (
        <div
          key={index}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative"
        >
          <button
            className="h-10 px-4 rounded-md shadow-md hover:shadow-lg transition-all border-0 flex items-center justify-center cursor-pointer hover:scale-105"
            style={{
              backgroundColor: "#EACEFF",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onClick={() => {
              console.log(`🔘 ${item.label} button clicked`);
              item.action?.();
            }}
          >
            <item.icon className="h-4 w-4 text-gray-800 mr-2" />
            <span className="text-xs font-semibold text-gray-800">
              {item.label}
            </span>
          </button>
          {hoveredIndex === index && (
            <div
              className="absolute bottom-full mb-2 left-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded whitespace-nowrap pointer-events-none z-50"
              style={{
                transform: "translateX(-50%)",
                opacity: 1,
                transition: "opacity 0.2s ease",
              }}
            >
              Export as {item.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}