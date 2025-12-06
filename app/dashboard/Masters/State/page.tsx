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
import { AlertPopover } from "@/component/ui/AlertPopover";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";
import { useExportExcel, ExportExcelOptions } from "@/hook/UseExportExcel/useExportExcel";
import type { FieldConfig } from "@/component/ui/add-section/add-section";
import type { State, Country } from "@/interface/interface";

// React Query Hook
import { useStates } from "@/hook/state/useState";

export default function StatePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);

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

  // ➤ DEBUG: Check search request URL
  useEffect(() => {
    console.log(
      "SEARCH TRIGGERED:",
      `/states?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchQuery}`
    );
  }, [searchQuery, pagination.pageIndex, pagination.pageSize]);

  // FETCH COUNTRIES
  const fetchCountries = useCallback(async () => {
    const res = await fetch("/api/states/getcountry").then((r) => r.json());
    setCountries(res);
  }, []);

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

  // EDIT STATE (open modal)
  const handleEdit = useCallback((state: State) => {
    setEditingState(state);
    setCountries([{ id: state.country_id, country_name: state.country_name }]);
    setIsEditModalOpen(true);
  }, []);

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

  // SEARCH STATES
  const handleServerSearch = useCallback((query: string) => {
    setSearchQuery(query.trim());
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    return Promise.resolve([]);
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
            >
              {isUpdateLoading ? "Loading..." : "Edit"}
            </button>

            <AlertPopover
              trigger={
                <button className="px-3 py-1 bg-red-200 text-red-700 rounded">
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
    [handleEdit, handleDeleteConfirm, isDeleteLoading, isUpdateLoading]
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
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full min-h-screen bg-white px-6">
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
              value: c.id.toString(),
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
          { type: "text", name: "state_name_marathi", label: "State Name (Marathi)" },
          { type: "text", name: "state_name_hindi", label: "State Name (Hindi)" },
        ]}
      />

      {/* Table + Filters */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ExportButtons 
              pdfConfig={pdfExportConfig}
              excelConfig={excelExportConfig}
            />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-64">
            <SearchComponent
              placeholder="Search State..."
              debounceDelay={400}
              serverSideSearch={true}
              onSearch={async (query: string) => {
                setSearchQuery(query.trim());
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                return [];
              }}
            />
          </div>
        </div>

        {tableElement}
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateState}
        isLoading={isUpdateLoading}
        title="Edit State"
        fields={[
          {
            type: "select",
            name: "country_id",
            label: "Country Name",
            required: true,
            defaultValue: editingState?.country_id?.toString(),
            options: countries.map((c) => ({
              value: c.id.toString(),
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