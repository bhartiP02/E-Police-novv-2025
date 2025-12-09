// File: @/component/ui/SensitiveAreaView/SensitiveAreaTabs.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { MapPin, Image as ImageIcon, ChevronRight } from "lucide-react";
import { CustomTable, ColumnDef, PaginationState } from "@/component/ui/Table/CustomTable";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";

interface SensitiveAreaTabsProps {
  areaDetails: {
    id: number;
    address: string;
    latitude: string;
    longitude: string;
    police_station_name: string;
    state_name: string;
    district_name: string;
    city_name: string;
    sdpo_name?: string;
    image_url?: string;
  };
}

// Dummy data type for police details table
interface PoliceDetailRow {
  id: number;
  police_name: string;
  date_time: string;
  selfie_url?: string;
}

export default function SensitiveAreaTabs({ areaDetails }: SensitiveAreaTabsProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [searchQuery, setSearchQuery] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { exportToPdf } = useExportPdf();

  // Dummy data for police details table
  const policeDetails: PoliceDetailRow[] = useMemo(() => [
    { id: 1, police_name: "Police Name 1", date_time: "2024-12-08 10:30 AM", selfie_url: "" },
    { id: 2, police_name: "Police Name 2", date_time: "2024-12-08 11:45 AM", selfie_url: "" },
  ], []);

  const tabs = [
    {
      id: "details",
      label: "Details",
      icon: MapPin,
    },
    {
      id: "image",
      label: "Images",
      icon: ImageIcon,
    },
  ];

  // PDF Export Config
  const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
    filename: `sensitive-area-police-details-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`,
    title: `Police Details - ${areaDetails.address}`,
    orientation: "landscape",
    pageSize: "a4",
    columns: [
      { header: "Police Name", accessorKey: "police_name" },
      { header: "Date Time", accessorKey: "date_time" },
      { header: "Selfie", accessorKey: "selfie_url" },
    ],
    data: policeDetails,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All Police Details",
    userRole: "admin",
  }), [policeDetails, searchQuery, areaDetails.address]);

  // Handle Search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.trim());
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Handle Export PDF
  const handleExportPdf = useCallback(() => {
    exportToPdf(pdfExportConfig);
  }, [exportToPdf, pdfExportConfig]);

  // Handle Export Excel (placeholder)
  const handleExportExcel = useCallback(async () => {
    alert("Excel export coming soon!");
  }, []);

  // Handle Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Table Columns
  const columns: ColumnDef<PoliceDetailRow>[] = useMemo(() => [
    {
      accessorKey: "police_name",
      header: "Police Name",
      cell: ({ row }) => <span className="text-black">{row.original.police_name}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "date_time",
      header: "Date Time",
      cell: ({ row }) => <span className="text-black">{row.original.date_time}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "selfie_url",
      header: "Police Selfie",
      cell: ({ row }) => (
        <div className="text-black">
          {row.original.selfie_url ? (
            <img src={row.original.selfie_url} alt="Selfie" className="w-12 h-12 rounded" />
          ) : (
            <span className="text-gray-500">No image</span>
          )}
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
    },
  ], []);

  // Table Configuration
  const { tableElement, table } = CustomTable<PoliceDetailRow>({
    data: policeDetails,
    columns,
    pagination,
    totalCount: policeDetails.length,
    loading: false,
    onPaginationChange: setPagination,
    emptyMessage: "No police details available",
    pageSizeOptions: [5, 10, 20],
    enableSorting: true,
    manualPagination: false,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    maxHeight: "500px",
    headerBgColor: "#E7EDFD",
    headerTextColor: "#000000",
    getRowId: (row) => row.id,
    columnVisibility: columnVisibility,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:border print:border-gray-300 relative">
      {/* Navigation Button in Corner */}
      <div className="absolute top-6 right-6 print:hidden z-10">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Police Check-in Details Table Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Police Check-in Details</h3>
              
              <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ExportButtons
                    pdfConfig={pdfExportConfig}
                    onExportPdf={handleExportPdf}
                    onExportExcel={handleExportExcel}
                    onPrint={handlePrint}
                  />
                  
                  <ColumnVisibilitySelector
                    columns={table.getAllColumns()}
                    backgroundColor="#EACEFF"
                    textColor="#000000"
                  />
                </div>

                <div className="w-full max-w-xs">
                  <SearchComponent
                    placeholder="Search police details..."
                    debounceDelay={400}
                    onSearch={handleSearch}
                    serverSideSearch={false}
                  />
                </div>
              </div>

              {tableElement}
            </div>
          </div>
        )}

        {/* Image Tab */}
        {activeTab === "image" && (
          <div className="space-y-6">
            {areaDetails.image_url ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Area Image</h3>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={areaDetails.image_url}
                    alt="Sensitive Area"
                    className="w-full h-auto rounded-lg max-h-[500px] object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">No image available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}