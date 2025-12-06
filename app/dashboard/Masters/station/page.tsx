"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CustomTable, ColumnDef, PaginationState, SortingState } from "@/component/ui/Table/CustomTable";
import AddSection from "@/component/ui/add-section/add-section";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import EditModal from "@/component/ui/EditModal/editModal";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";
import { useRouter } from "next/navigation";
import { api } from "@/services/api/apiServices";


// Import custom hooks
import { usePoliceStationData } from "@/hook/PoliceStation/usePoliceStationData";
import { usePoliceStationCRUD } from "@/hook/PoliceStation/usePoliceStationCRUD";
import { usePoliceStationForm } from "@/hook/PoliceStation/usePoliceStationForm";

interface PoliceStationRow {
  id: number;
  name: string;
  email: string;
  mobile: string;
  country_id?: number;
  state_id?: number;
  district_id?: number;
  city_id?: number;
  state_name?: string;
  district_name?: string;
  city_name?: string;
  category?: string;
  category_id?: number;
  police_pc_id?: number;
  pc_id?: number;
  pc_name?: string;
  status: string;
  sdpo_id?: number;
  sdpo_name?: string;
  address?: string;
  pincode?: string;
}

export default function PoliceStationPage() {
  const router = useRouter();
  const { exportToPdf } = useExportPdf();

  // UI State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoliceStation, setEditingPoliceStation] = useState<PoliceStationRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ 
    isVisible: boolean; 
    message: string; 
    type: "success" | "error" 
  }>({
    isVisible: false,
    message: "",
    type: "success"
  });

  // Toast Helper Function
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast({ isVisible: false, message: "", type: "success" });
    }, 3000);
  }, []);

  // Custom Hooks
  const dataHook = usePoliceStationData();
  
  const crudHook = usePoliceStationCRUD({
    extractData: dataHook.extractData,
    extractSinglePoliceStation: dataHook.extractSinglePoliceStation,
    showToast
  });

  // Lazy loading handlers
  const handleCountryDropdownClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!dataHook.isCountriesLoading && !dataHook.countriesLoaded) {
      await dataHook.fetchCountries();
    }
  }, [dataHook]);

  const handleStateDropdownClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!dataHook.isStatesLoading && !dataHook.statesLoaded) {
      await dataHook.fetchAllStates();
    }
  }, [dataHook]);

  const handleCategoryDropdownClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!dataHook.isCategoriesLoading && !dataHook.categoriesLoaded) {
      await dataHook.fetchPoliceCategories();
    }
  }, [dataHook]);

  const formHook = usePoliceStationForm({
    ...dataHook,
    isClient,
    handleCountryDropdownClick,
    handleStateDropdownClick,
    handleCategoryDropdownClick
  });

  // Effects
  useEffect(() => {
    crudHook.fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // PDF Export Configuration
  const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
    filename: `police-station-master-report-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`,
    title: "Police Station Master Report",
    orientation: "landscape",
    pageSize: "a4",
    columns: [
      { header: "Police Station", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      { header: "Mobile", accessorKey: "mobile" },
      { header: "State", accessorKey: "state_name" },
      { header: "District", accessorKey: "district_name" },
      { header: "City", accessorKey: "city_name" },
      { header: "Category", accessorKey: "pc_name" },
      {
        header: "Status",
        accessorKey: "status",
        formatter: (value) => (value === "Active" ? "Active" : "Inactive"),
      },
    ],
    data: crudHook.policeStations,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All Police Stations",
    userRole: "admin",
  }), [crudHook.policeStations, searchQuery]);

  // Event Handlers
  const handleView = (rowData: PoliceStationRow) => {
    router.push(`/dashboard/Masters/station/view?id=${rowData.id}`);
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    return [];
  }, []);

  const handleExportPdf = useCallback(() => {
    const result = exportToPdf(pdfExportConfig);
    if (result.success) showToast("PDF exported successfully!", "success");
    else showToast("Failed to export PDF", "error");
  }, [exportToPdf, pdfExportConfig, showToast]);

  const handleExportExcel = useCallback(async () => {
    try {
      const response = await api.getBlob("/police-stations/download-excel");

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `police-stations-${Date.now()}.xlsx`;
      link.click();

      showToast("Excel downloaded successfully!", "success");
    } catch (error) {
      console.error("❌ Excel Download Error:", error);
      showToast("Failed to download excel", "error");
    }
  }, []);



  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleAddPoliceStation = useCallback(async (formData: Record<string, string>) => {
    await crudHook.addPoliceStation(formData, pagination, searchQuery);
  }, [crudHook, pagination, searchQuery]);

  const handleEdit = useCallback(async (policeStation: PoliceStationRow) => {
    try {
      console.log("🔵 Starting handleEdit for police station:", policeStation.id);
      
      setEditingPoliceStation(policeStation);

      const fullData = await crudHook.getPoliceStationDetails(policeStation.id);
      
      console.log("🔍 Full data received:", fullData);
      
      if (!fullData) {
        console.error("❌ No data received from API");
        return;
      }

      // Get category ID correctly
      const categoryId = fullData.police_pc_id || policeStation.pc_id || fullData.pc_id;
      const categoryName = fullData.pc_name || policeStation.pc_name;

      console.log("📋 Category ID:", categoryId, "Category Name:", categoryName);

      // Create single option arrays for each dropdown using data from API response
      if (fullData.country_id && fullData.country_name) {
        console.log("Setting country:", fullData.country_name);
        dataHook.setCountries([{ id: fullData.country_id, country_name: fullData.country_name }]);
      }
      
      if (fullData.state_id && fullData.state_name) {
        console.log("Setting state:", fullData.state_name);
        dataHook.setFilteredStates([{ 
          id: fullData.state_id, 
          state_name: fullData.state_name,
          state_name_en: fullData.state_name,
          country_id: fullData.country_id || 0 
        }]);
      }
      
      if (fullData.district_id && fullData.district_name) {
        console.log("Setting district:", fullData.district_name);
        dataHook.setFilteredDistricts([{ 
          id: fullData.district_id, 
          district_name: fullData.district_name,
          state_id: fullData.state_id || 0 
        }]);
      }
      
      if (fullData.city_id && fullData.city_name) {
        console.log("Setting city:", fullData.city_name);
        dataHook.setFilteredCities([{ 
          id: fullData.city_id, 
          city_name: fullData.city_name,
          district_id: fullData.district_id || 0 
        }]);
      }

      if (fullData.sdpo_id && fullData.sdpo_name) {
        console.log("Setting SDPO:", fullData.sdpo_name);
        dataHook.setFilteredSdpos([{ 
          id: fullData.sdpo_id, 
          name: fullData.sdpo_name,
          district_id: fullData.district_id || 0 
        }]);
      }

      // Set category as single option
      if (categoryId && categoryName) {
        console.log("Setting category:", categoryName);
        dataHook.setPoliceCategories([{ 
          pc_id: categoryId, 
          pc_name: categoryName 
        }]);
      }

      // Set form data AFTER setting dropdown options
      const formDataToSet = {
        country_id: fullData.country_id?.toString() || "",
        state_id: fullData.state_id?.toString() || "",
        district_id: fullData.district_id?.toString() || "",
        city_id: fullData.city_id?.toString() || "",
        sdpo_id: fullData.sdpo_id?.toString() || "",
        name: fullData.name || "",
        email: fullData.email || "",
        mobile: fullData.mobile || "",
        address: fullData.address || "",
        pincode: fullData.pincode || "",
        pc_id: categoryId?.toString() || "",
        category: categoryName || "",
        status: fullData.status || "Active"
      };

      console.log("📝 Setting form data:", formDataToSet);
      formHook.setEditFormData(formDataToSet);

      console.log("✅ Opening edit modal now");
      setIsEditModalOpen(true);
      
    } catch (error) {
      console.error("❌ Error in handleEdit:", error);
      showToast("Failed to load police station details", "error");
    }
  }, [crudHook, dataHook, formHook, showToast]);

  const handleUpdate = useCallback(async (formData: Record<string, string>) => {
    if (!editingPoliceStation) return;

    const success = await crudHook.updatePoliceStation(
      editingPoliceStation.id,
      formData,
      pagination,
      searchQuery
    );

    if (success) {
      setIsEditModalOpen(false);
      setEditingPoliceStation(null);
    }
  }, [editingPoliceStation, crudHook, pagination, searchQuery]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    await crudHook.deletePoliceStation(id, pagination, searchQuery);
  }, [crudHook, pagination, searchQuery]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPoliceStation(null);
    formHook.resetCurrentIds();
    // Reset all dropdown data when modal closes
    dataHook.setFilteredStates([]);
    dataHook.setFilteredDistricts([]);
    dataHook.setFilteredCities([]);
    dataHook.setFilteredSdpos([]);
  }, [formHook, dataHook]);

  // Table Columns
  const columns: ColumnDef<PoliceStationRow>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Police Station Name",
      cell: ({ row }) => <span className="font-medium text-black">{row.original.name}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-black">{row.original.email}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => <span className="text-black">{row.original.mobile}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "state_name",
      header: "State",
      cell: ({ row }) => <span className="text-black">{row.original.state_name || "N/A"}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "district_name",
      header: "District",
      cell: ({ row }) => <span className="text-black">{row.original.district_name || "N/A"}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "city_name",
      header: "City",
      cell: ({ row }) => <span className="text-black">{row.original.city_name || "N/A"}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "pc_name",
      header: "Category",
      cell: ({ row }) => <span className="text-black">{row.original.pc_name || "N/A"}</span>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.status}
        </span>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleView(row.original)}
            className="px-3 py-1 rounded-md text-sm"
            style={{ backgroundColor: "#EACEFF", color: "#000" }}
          >
            View
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="px-3 py-1 rounded-md text-sm bg-blue-100 text-black hover:bg-blue-200"
          >
            Edit
          </button>
          
          <AlertPopover
            trigger={
              <button className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200">
                Delete
              </button>
            }
            title="Are you sure you want to delete this Police Station?"
            okText="OK"
            cancelText="Cancel"
            okButtonColor="#9A65C2"
            cancelButtonColor="#6B7280"
            successMessage="Record deleted successfully"
            errorMessage="Failed to delete record. Please try again."
            onConfirm={() => handleDeleteConfirm(row.original.id)}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], [handleView, handleEdit, handleDeleteConfirm]);

  // Table Configuration
  const { tableElement, table } = CustomTable<PoliceStationRow>({
    data: crudHook.policeStations,
    columns,
    pagination,
    totalCount: crudHook.totalCount,
    loading: crudHook.loading,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    sorting,
    emptyMessage: "No Police Stations available",
    pageSizeOptions: [5, 10, 20, 30, 50],
    enableSorting: true,
    manualSorting: false,
    manualPagination: true,
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
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
      />

      {crudHook.error && <div className="text-red-600 mb-4">{crudHook.error}</div>}

      <AddSection 
        title="Add Police Station"
        fields={formHook.addPoliceStationFields}
        onSubmit={handleAddPoliceStation}
        submitButtonText="Add"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButtons
              pdfConfig={pdfExportConfig}
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
              onPrint={handlePrint}
            />
            
            <div className="relative" style={{ minHeight: "40px", minWidth: "180px" }}>
              {isClient && (
                <ColumnVisibilitySelector
                  columns={table.getAllColumns()}
                  backgroundColor="#EACEFF"
                  textColor="#000000"
                />
              )}
            </div>
          </div>

          <div className="w-full max-w-xs">
            <SearchComponent
              placeholder="Search Police Stations..."
              debounceDelay={400}
              onSearch={handleSearch}
              serverSideSearch={true}
            />
          </div>
        </div>

        {tableElement}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdate}
        title={`Edit Police Station - ID: ${editingPoliceStation?.id || ''}`}
        fields={formHook.editPoliceStationFields}
        isLoading={crudHook.saveLoading}
      />
    </div>
  );
}