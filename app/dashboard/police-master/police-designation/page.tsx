"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CustomTable,
  ColumnDef,
  PaginationState,
  SortingState,
} from "@/component/ui/Table/CustomTable";
import AddSection from "@/component/ui/add-section/add-section";
import { api } from "@/services/api/apiServices";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import EditModal from "@/component/ui/EditModal/editModal";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";

interface PoliceDesignationRow {
  id: number;
  designation_name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export default function PoliceDesignationPage() {
  const [designations, setDesignations] = useState<PoliceDesignationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<PoliceDesignationRow | null>(null);

  const { exportToPdf } = useExportPdf();

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: "", type }), 3000);
  }, []);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDesignations = useCallback(
    async (pageIndex: number, pageSize: number, search: string) => {
      try {
        setIsLoading(true);
        const response = await api.get("/designations", {
          page: pageIndex + 1,
          limit: pageSize,
          search: search || "",
        });
        setDesignations(response.data || []);
        setTotalCount(response.totalRecords || 0);
      } catch (error) {
        console.error("Error fetching designations:", error);
        showToast("Failed to fetch designations", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchDesignations(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, fetchDesignations]);

  const pdfExportConfig: ExportPdfOptions = useMemo(
    () => ({
      filename: `designations-report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.pdf`,
      title: "Police Designation Report",
      orientation: "landscape",
      pageSize: "a4",
      columns: [
        {
          header: "Sr No.",
          accessorKey: "serialNumber",
          formatter: (value) => value || "--",
        },
        {
          header: "Designation Name",
          accessorKey: "designation_name",
          formatter: (value) => value || "--",
        },
        {
          header: "Status",
          accessorKey: "status",
          formatter: (value) => (value === "Yes" ? "Active" : "Inactive"),
        },
      ],
      data: designations.map((item, index) => ({
        ...item,
        serialNumber: index + 1,
      })),
      showSerialNumber: false,
      serialNumberHeader: "S.NO.",
      projectName: "E-Police",
      exportDate: true,
      showTotalCount: true,
      searchQuery: searchQuery || "All designations",
      userRole: "admin",
    }),
    [designations, searchQuery]
  );

  const handleServerSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim() !== "") {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
      return designations;
    },
    [designations]
  );

  const handleSearchResults = useCallback(() => {}, []);

  const handleAddDesignation = useCallback(
    async (formData: any) => {
      try {
        await api.post("/designations", {
          designation_name: formData.designation_name,
        });
        fetchDesignations(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("Designation added successfully!", "success");
      } catch (error) {
        console.error("Error adding designation:", error);
        showToast("Failed to add designation", "error");
      }
    },
    [fetchDesignations, pagination, searchQuery, showToast]
  );

  const fetchDesignationById = useCallback(
    async (id: number) => {
      try {
        console.log("Fetching designation with ID:", id);
        const res = await api.get(`/designations/${id}`);
        console.log("API response for designation:", res);
        
        // Handle different response structures
        const data = res.data || res;
        
        if (!data) {
          console.error("No data received from API");
          return null;
        }
        
        // Check different possible response structures
        let designationData;
        if (data.data) {
          // If response has nested data property
          designationData = data.data;
        } else if (data.designation) {
          // If response has nested designation property
          designationData = data.designation;
        } else {
          // If data is directly the designation
          designationData = data;
        }
        
        console.log("Processed designation data:", designationData);
        
        return {
          id: designationData.id,
          designation_name: designationData.designation_name || designationData.designationName || "",
          status: designationData.status || "Yes",
        };
      } catch (error: any) {
        console.error("Error fetching designation details:", error);
        console.error("Error response:", error.response?.data);
        return null;
      }
    },
    []
  );

  const handleEdit = useCallback(async (designation: PoliceDesignationRow) => {
    console.log("Edit clicked for designation:", designation);
    
    try {
      setIsEditLoading(true);
      
      // First, try to fetch fresh data from API
      const latest = await fetchDesignationById(designation.id);
      
      if (!latest) {
        console.log("No fresh data fetched, using existing row data");
        // If API fails, use the data from the row directly
        setEditingDesignation(designation);
        setIsEditModalOpen(true);
      } else {
        console.log("Fresh data fetched successfully:", latest);
        setEditingDesignation(latest);
        setIsEditModalOpen(true);
      }
      
    } catch (error) {
      console.error("Error in handleEdit:", error);
      // Fallback: use the existing row data
      setEditingDesignation(designation);
      setIsEditModalOpen(true);
      showToast("Using cached data, some details may be outdated", "error");
    } finally {
      setIsEditLoading(false);
    }
  }, [fetchDesignationById, showToast]);

  const handleUpdateDesignation = useCallback(
    async (formData: any) => {
      try {
        if (!editingDesignation) {
          showToast("No designation selected for update", "error");
          return;
        }

        console.log("Updating designation:", editingDesignation.id, "with data:", formData);
        
        const response = await api.put(`/designations/${editingDesignation.id}`, {
          designation_name: formData.designation_name,
          status: formData.status,
        });
        
        console.log("Update response:", response);
        
        fetchDesignations(pagination.pageIndex, pagination.pageSize, searchQuery);
        setIsEditModalOpen(false);
        setEditingDesignation(null);
        showToast("Designation updated successfully!", "success");
      } catch (error: any) {
        console.error("Error updating designation:", error);
        console.error("Error details:", error.response?.data);
        showToast(`Failed to update designation: ${error.response?.data?.message || error.message}`, "error");
      }
    },
    [editingDesignation, fetchDesignations, pagination, searchQuery, showToast]
  );

  const handleDeleteConfirm = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/designations/${id}`);
        fetchDesignations(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("Designation deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting designation:", error);
        showToast("Failed to delete designation", "error");
      }
    },
    [fetchDesignations, pagination, searchQuery, showToast]
  );

  const editModalFields = useMemo(() => {
    console.log("editModalFields updated with:", editingDesignation);
    
    return [
      {
        type: "text",
        name: "designation_name",
        label: "Designation Name",
        defaultValue: editingDesignation?.designation_name || "",
        required: true,
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        defaultValue: editingDesignation?.status || "Yes",
        options: [
          { value: "Yes", label: "Active" },
          { value: "No", label: "Inactive" },
        ],
      },
    ];
  }, [editingDesignation]);

  const columns: ColumnDef<PoliceDesignationRow>[] = useMemo(
    () => [
      { 
        accessorKey: "designation_name", 
        header: "Designation Name",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === "Yes"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {status === "Yes" ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isEditLoading}
            >
              Edit
            </button>
            <AlertPopover
              trigger={
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                  Delete
                </button>
              }
              title="Are you sure you want to delete this designation?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDeleteConfirm(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [handleEdit, handleDeleteConfirm, isEditLoading]
  );

  const { tableElement, table } = CustomTable<PoliceDesignationRow>({
    data: designations,
    columns,
    pagination,
    totalCount,
    loading: isLoading,
    onPaginationChange: setPagination,
    sorting,
    onSortingChange: setSorting,
    manualPagination: true,
    pageSizeOptions: [5,10, 20, 30, 50],
    emptyMessage: "No designations found",
    getRowId: (row) => row.id.toString(),
  });

  const handleModalClose = useCallback(() => {
    console.log("Closing edit modal");
    setIsEditModalOpen(false);
    setEditingDesignation(null);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white px-6 py-4">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />

      <AddSection
        title="Manage Police Designations"
        onSubmit={handleAddDesignation}
        fields={[
          {
            type: "text",
            name: "designation_name",
            label: "Designation Name",
            placeholder: "Enter designation name",
            required: true,
          },
          {
            type: "select",
            name: "status",
            label: "Status",
            placeholder: "Enter designation name",
            options: [
              { value: "Yes", label: "Active" },
              { value: "No", label: "Inactive" },
            ],
          },
        ]}
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ExportButtons pdfConfig={pdfExportConfig} />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-full max-w-xs">
            <SearchComponent
              placeholder="Search designation..."
              debounceDelay={400}
              onSearch={handleServerSearch}
              onResults={handleSearchResults}
            />
          </div>
        </div>

        {tableElement}
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSubmit={handleUpdateDesignation}
        title="Edit Police Designation"
        fields={editModalFields}
        isLoading={isEditLoading}
        initialData={editingDesignation || undefined}
        key={`edit-modal-${editingDesignation?.id || 'new'}`}
      />
    </div>
  );
}