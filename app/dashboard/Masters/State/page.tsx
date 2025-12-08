"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CustomTable,
  ColumnDef,
  PaginationState,
  SortingState,
} from "@/component/ui/Table/CustomTable";
import AddSection from "@/component/ui/add-section/add-section";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import EditModal from "@/component/ui/EditModal/editModal";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";
import { useExportExcel, ExportExcelOptions } from "@/hook/UseExportExcel/useExportExcel";
import type { FieldConfig } from "@/component/ui/add-section/add-section";
import type { State, Country } from "@/interface/interface";
import { stateService } from "@/services/api-services/stateService";

// React Query Hook
import { useStates } from "@/hook/state/useState";

export default function StatePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [isLoadingStateDetail, setIsLoadingStateDetail] = useState(false);

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const { exportToPdf } = useExportPdf();
  const { exportToExcel } = useExportExcel();

  // Pagination / Sorting / Search
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ⭐ USE STATES HOOK
  const {
    states,
    total,
    isLoading,
    isFetching,
    isPlaceholderData,
    createState,
    updateState,
    deleteState,
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
  } = useStates({
    pagination,
    sorting,
    filters: { search: searchQuery },
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: "", type: "success" }), 3000);
  }, []);

  // FETCH COUNTRIES
  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch("/api/states/getcountry").then((r) => r.json());
      setCountries(res);
    } catch (error) {
      console.error("Error fetching countries:", error);
      showToast("Failed to fetch countries", "error");
    }
  }, [showToast]);

  const handleCountryDropdownClick = useCallback(async () => {
    if (countries.length === 0) await fetchCountries();
  }, [countries.length, fetchCountries]);

  // ADD STATE
  const handleAddState = useCallback(
    (formData: any) => {
      createState({
        country_id: Number(formData.country_id),
        state_name_en: formData.state_name_en,
        state_name_marathi: formData.state_name_marathi,
        state_name_hindi: formData.state_name_hindi,
        status: "Yes",
      });
    },
    [createState]
  );

  // ✅ FETCH STATE BY ID AND OPEN EDIT MODAL
  const handleEdit = useCallback(async (state: State) => {
    try {
      setIsLoadingStateDetail(true);

      // ✅ FETCH THE INDIVIDUAL STATE DETAILS FROM API
      const stateDetail = await stateService.getStateById(state.id);

      // Set the fresh data from API
      setEditingState(stateDetail);

      // Set country for dropdown
      setCountries([
        { id: stateDetail.country_id, country_name: stateDetail.country_name },
      ]);

      // Open modal
      setIsEditModalOpen(true);
      showToast("State details loaded successfully!", "success");
    } catch (error) {
      console.error("Error fetching state details:", error);
      showToast("Failed to load state details. Please try again.", "error");
    } finally {
      setIsLoadingStateDetail(false);
    }
  }, [showToast]);

  // UPDATE STATE
  const handleUpdateState = useCallback(
    (formData: any) => {
      updateState({
        id: editingState?.id,
        payload: {
          country_id: Number(formData.country_id),
          state_name_en: formData.state_name_en,
          state_name_marathi: formData.state_name_marathi,
          state_name_hindi: formData.state_name_hindi,
          status: formData.status,
        },
      });

      setIsEditModalOpen(false);
      setEditingState(null);
    },
    [updateState, editingState]
  );

  // DELETE STATE
  const handleDeleteConfirm = useCallback(
    (id: number) => {
      deleteState(id);
    },
    [deleteState]
  );

  // ✅ FIXED SEARCH - Reset pagination when searching
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.trim());
    // Reset to first page on search
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  /* ============================================
     PDF EXPORT CONFIG
  ============================================ */
  const pdfExportConfig: ExportPdfOptions = useMemo(
    () => ({
      filename: `states-master-report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.pdf`,
      title: "States Master Report",
      orientation: "landscape",
      pageSize: "a4",
      columns: [
        { header: "Country Name", accessorKey: "country_name" },
        { header: "State Name", accessorKey: "state_name" },
        {
          header: "Status",
          accessorKey: "status",
          formatter: (value) => (value === "Yes" ? "Active" : "Inactive"),
        },
      ],
      data: states,
      showSerialNumber: true,
      serialNumberHeader: "S.NO.",
      projectName: "E-Police",
      exportDate: true,
      showTotalCount: true,
      searchQuery: searchQuery || "All states",
      userRole: "admin",
    }),
    [states, searchQuery]
  );

  /* ============================================
     EXCEL EXPORT CONFIG
  ============================================ */
  const excelExportConfig: ExportExcelOptions = useMemo(
    () => ({
      filename: `states-master-report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.xlsx`,
      sheetName: "States",
      title: "States Master Report",
      columns: [
        { header: "Country Name", accessorKey: "country_name" },
        { header: "State Name", accessorKey: "state_name" },
        {
          header: "Status",
          accessorKey: "status",
          formatter: (value) => (value === "Yes" ? "Active" : "Inactive"),
        },
      ],
      data: states,
      showSerialNumber: true,
      serialNumberHeader: "S.NO.",
      projectName: "E-Police",
      exportDate: true,
      showTotalCount: true,
      searchQuery: searchQuery || "All states",
      userRole: "admin",
    }),
    [states, searchQuery]
  );

  // TABLE COLUMNS
  const columns: ColumnDef<State>[] = useMemo(
    () => [
      { accessorKey: "country_name", header: "Country Name" },
      { accessorKey: "state_name", header: "State Name" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="px-3 py-1 bg-blue-200 rounded"
              disabled={isLoadingStateDetail || isUpdateLoading}
            >
              {isLoadingStateDetail ? "Loading..." : "Edit"}
            </button>

            <AlertPopover
              trigger={
                <button
                  className="px-3 py-1 bg-red-200 text-red-700 rounded"
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? "Removing..." : "Delete"}
                </button>
              }
              title="Are you sure you want to delete this State?"
              okText="OK"
              cancelText="Cancel"
              onConfirm={() => handleDeleteConfirm(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [
      handleEdit,
      handleDeleteConfirm,
      isDeleteLoading,
      isUpdateLoading,
      isLoadingStateDetail,
    ]
  );

  // TABLE RENDERER
  const { tableElement, table } = CustomTable<State>({
    data: states,
    columns,
    pagination,
    totalCount: total,
    loading: isLoading || isFetching || isPlaceholderData,
    onPaginationChange: setPagination,
    sorting,
    onSortingChange: setSorting,
    manualPagination: true,
    pageSizeOptions: [10, 20, 30, 50],
    emptyMessage: "No states found",
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full min-h-screen bg-white px-6">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />

      {/* Add Section */}
      <AddSection
        title="Manage States"
        onSubmit={handleAddState}
        isLoading={isCreateLoading}
        fields={[
          {
            type: "select",
            name: "country_id",
            label: "Country",
            required: true,
            options: countries.map((c) => ({
              value: c.id?.toString(),
              label: c.country_name,
            })),
            customProps: { onMouseDown: handleCountryDropdownClick },
          },
          {
            type: "text",
            name: "state_name_en",
            label: "State Name (English)",
            required: true,
          },
          {
            type: "text",
            name: "state_name_marathi",
            label: "State Name (Marathi)",
          },
          {
            type: "text",
            name: "state_name_hindi",
            label: "State Name (Hindi)",
          },
        ]}
      />

      {/* Table + Filters */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <ExportButtons
              pdfConfig={pdfExportConfig}
              excelConfig={excelExportConfig}
            />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-full max-w-xs">
            <SearchComponent
              placeholder="Search State..."
              debounceDelay={400}
              serverSideSearch={true}
              onSearch={handleSearch}
            />
          </div>
        </div>

        {tableElement}
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingState(null);
        }}
        onSubmit={handleUpdateState}
        isLoading={isUpdateLoading || isLoadingStateDetail}
        loadingMessage={
          isLoadingStateDetail ? "Loading state details..." : undefined
        }
        title="Edit State"
        fields={[
          {
            type: "select",
            name: "country_id",
            label: "Country Name",
            required: true,
            defaultValue: editingState?.country_id?.toString(),
            options: countries.map((c) => ({
              value: c.id?.toString(),
              label: c.country_name,
            })),
            customProps: { onMouseDown: handleCountryDropdownClick },
          },
          {
            type: "text",
            name: "state_name_en",
            label: "State Name (English)",
            defaultValue: editingState?.state_name_en,
          },
          {
            type: "text",
            name: "state_name_marathi",
            label: "State Name (Marathi)",
            defaultValue: editingState?.state_name_marathi,
          },
          {
            type: "text",
            name: "state_name_hindi",
            label: "State Name (Hindi)",
            defaultValue: editingState?.state_name_hindi,
          },
          {
            type: "select",
            name: "status",
            label: "Status",
            defaultValue: editingState?.status || "Yes",
            options: [
              { value: "Yes", label: "Active" },
              { value: "No", label: "Inactive" },
            ],
          },
        ]}
      />
    </div>
  );
}