"use client";

import { useState, useEffect } from "react";
import { Column } from "@tanstack/react-table";
import { Eye, EyeOff, Check, Settings2 } from "lucide-react";

interface ColumnVisibilitySelectorProps<TData> {
  columns: Column<TData, unknown>[];
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
}

export function ColumnVisibilitySelector<TData>({
  columns,
  className = "",
  backgroundColor = "#EACEFF",
  textColor = "#000000",
  borderRadius = "0.5rem",
}: ColumnVisibilitySelectorProps<TData>) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter columns that can be toggled and have string headers
  const toggleableColumns = columns.filter(
    (column) =>
      column.getCanHide() &&
      column.columnDef.header &&
      typeof column.columnDef.header === "string" &&
      column.id !== "serial_number" && // Exclude serial number
      column.id !== "actions" // Exclude actions column
  );

  const handleToggleAll = () => {
    const allVisible = toggleableColumns.every((column) =>
      column.getIsVisible()
    );
    toggleableColumns.forEach((column) => {
      column.toggleVisibility(!allVisible);
    });
  };

  const visibleCount = toggleableColumns.filter((column) =>
    column.getIsVisible()
  ).length;
  const totalCount = toggleableColumns.length;

  // Don't render anything during SSR
  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative inline-block">
      {/* MAIN BUTTON */}
      <button
        style={{
          backgroundColor,
          color: textColor,
          borderRadius: borderRadius,
          border: "none",
          padding: "0.65rem 1.1rem",
          fontSize: "0.865rem",
          fontWeight: "500",
          cursor: "pointer",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
        }}
        className={`shadow-md hover:shadow-lg hover:scale-105 ${className}`}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <Settings2 className="h-4 w-4" style={{ color: textColor }} />
        <span style={{ fontWeight: "700" }}>Column Visibility</span>
      </button>

      {/* DROPDOWN CONTENT */}
      {open && (
        <div
          className="absolute right-0 mt-2 bg-white text-black min-w-[14rem] overflow-hidden rounded-md p-1 shadow-md z-50 border border-gray-300"
          onClick={(e) => e.stopPropagation()}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Header with Toggle-All */}
          <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-black">
            <span>Toggle Columns</span>
            
            <button
              onClick={handleToggleAll}
              style={{
                background: "transparent",
                border: "none",
                padding: "0.25rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.25rem",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {visibleCount === totalCount ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="-mx-1 my-1 h-px bg-gray-300" />

          {/* Column Items */}
          {toggleableColumns.map((column) => {
            const isVisible = column.getIsVisible();
            const columnHeader = column.columnDef.header as string;

            return (
              <button
                key={column.id}
                className="flex items-center space-x-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm text-black transition-colors w-full text-left hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  column.toggleVisibility();
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: "1rem",
                    height: "1rem",
                    border: "2px solid #d1d5db",
                    borderRadius: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isVisible ? backgroundColor : "transparent",
                    borderColor: isVisible ? backgroundColor : "#d1d5db",
                    pointerEvents: "none",
                  }}
                >
                  {isVisible && (
                    <Check className="h-3 w-3" style={{ color: textColor }} />
                  )}
                </div>

                {/* Label */}
                <span className="flex-1 text-left">{columnHeader}</span>

                {/* Eye icon */}
                {isVisible ? (
                  <Eye className="h-4 w-4 text-gray-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                )}
              </button>
            );
          })}

          {toggleableColumns.length === 0 && (
            <div className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm text-gray-500 w-full text-left opacity-50">
              No toggleable columns available
            </div>
          )}
        </div>
      )}
    </div>
  );
}