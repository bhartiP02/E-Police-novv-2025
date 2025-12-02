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

interface StateRow {
  id: number;
  country_id: number;
  country_name: string;
  state_name_en: string;
  state_name_marathi?: string;
  state_name_hindi?: string;
  status: string;
}

interface Country {
  id: number;
  country_name: string;
}

export default function StatePage() {
  const [states, setStates] = useState<StateRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateRow | null>(null);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);

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

  const fetchStates = useCallback(
    async (pageIndex: number, pageSize: number, search: string) => {
      try {
        setIsLoading(true);

        const response: {
          data: any[];
          totalRecords: number;
        } = await api.get("/states", {
          page: pageIndex + 1,
          limit: pageSize,
          search: search || "",
        });

        setStates(response.data);
        setTotalCount(response.totalRecords);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStates(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, fetchStates]);

  const pdfExportConfig: ExportPdfOptions = useMemo(
    () => ({
      filename: `states-master-report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.pdf`,
      title: "States Master Report",
      orientation: "landscape",
      pageSize: "a4",
      columns: [
        {
          header: "Country Name",
          accessorKey: "country_name",
          formatter: (value) => value || "--",
        },
        {
          header: "State Name",
          accessorKey: "state_name",
          formatter: (value) => value || "--",
        },
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

  const handleServerSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    return []; // important: satisfy SearchComponent return type
  }, []);


  const handleSearchResults = useCallback(() => {}, []);

  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const response = await api.get("/states/getcountry");
      const data = Array.isArray(response) ? response : response?.data || [];
      setCountries(data);
      setCountriesLoaded(true);
    } finally {
      setIsCountriesLoading(false);
    }
  }, []);

  const handleCountryDropdownClick = useCallback(async () => {
    if (!isCountriesLoading && !countriesLoaded) {
      await fetchCountries();
    }
  }, [isCountriesLoading, countriesLoaded, fetchCountries]);

  const handleAddState = useCallback(
    async (formData: any) => {
      try {
        await api.post("/states", {
          country_id: parseInt(formData.country_id),
          state_name_en: formData.state_name_en,
          state_name_marathi: formData.state_name_marathi,
          state_name_hindi: formData.state_name_hindi,
          status: "Yes",
        });
        fetchStates(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("State added successfully!", "success");
      } catch {
        showToast("Failed to add state", "error");
      }
    },
    [fetchStates, pagination, searchQuery, showToast]
  );

  const fetchStateById = useCallback(
    async (id: number) => {
      try {
        const res = await api.get(`/states/${id}`);
        const data = res.data;
        return {
          id: data.id,
          country_id: data.country_id,
          country_name: data.country_name,
          state_name_en: data.state_name_en,
          state_name_marathi: data.state_name_marathi || "",
          state_name_hindi: data.state_name_hindi || "",
          status: data.status,
        };
      } catch {
        showToast("Failed to load state details", "error");
        return null;
      }
    },
    [showToast]
  );

  const handleEdit = useCallback(
    async (state: StateRow) => {
      const latest = await fetchStateById(state.id);
      if (!latest) return;

      setEditingState(latest);
      setCountries([
        { id: latest.country_id, country_name: latest.country_name || "Unknown" },
      ]);
      setCountriesLoaded(false);
      setIsEditModalOpen(true);
    },
    [fetchStateById]
  );

  const handleUpdateState = useCallback(
    async (formData: any) => {
      try {
        await api.put(`/states/${editingState?.id}`, {
          country_id: parseInt(formData.country_id),
          state_name_en: formData.state_name_en,
          state_name_marathi: formData.state_name_marathi,
          state_name_hindi: formData.state_name_hindi,
          status: formData.status,
        });
        fetchStates(pagination.pageIndex, pagination.pageSize, searchQuery);
        setIsEditModalOpen(false);
        showToast("Updated successfully!", "success");
      } catch {
        showToast("Failed to update", "error");
      }
    },
    [editingState, fetchStates, pagination, searchQuery, showToast]
  );

  const handleDeleteConfirm = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/states/${id}`);
        fetchStates(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("State deleted!", "success");
      } catch {
        showToast("Delete failed", "error");
      }
    },
    [fetchStates, pagination, searchQuery, showToast]
  );

  const editModalFields = useMemo(
    () => [
      {
        type: "select",
        name: "country_id",
        label: "Country Name",
        required: true,
        defaultValue: editingState?.country_id?.toString() || "",
        options: countries.map((c) => ({
          value: c.id.toString(),
          label: c.country_name,
        })),
        customProps: {
          onMouseDown: async () => {
            const res = await api.get("/states/getcountry");
            const data = Array.isArray(res) ? res : res.data || [];
            setCountries(data);
          },
        },
      },
      {
        type: "text",
        name: "state_name_en",
        label: "State Name (English)",
        defaultValue: editingState?.state_name_en || editingState?.state_name || "",
        required: true,
      },
      {
        type: "text",
        name: "state_name_marathi",
        label: "State Name (Marathi)",
        defaultValue: editingState?.state_name_marathi || "",
      },
      {
        type: "text",
        name: "state_name_hindi",
        label: "State Name (Hindi)",
        defaultValue: editingState?.state_name_hindi || "",
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
    ],
    [countries, editingState]
  );

  const columns: ColumnDef<StateRow>[] = useMemo(
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
              Edit
            </button>
            <AlertPopover
              trigger={
                <button className="px-3 py-1 bg-red-200 text-red-700 rounded">
                  Delete
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
    [handleEdit, handleDeleteConfirm]
  );

  const { tableElement, table } = CustomTable<StateRow>({
    data: states,
    columns,
    pagination,
    totalCount,
    loading: isLoading,
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
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />

      <AddSection
        title="Manage States"
        onSubmit={handleAddState}
        fields={[
          {
            type: "select",
            name: "country_id",
            label: "Country",
            placeholder: "Select Country",
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

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ExportButtons pdfConfig={pdfExportConfig} />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-full max-w-xs">
            <SearchComponent
              placeholder="Search State"
              debounceDelay={400}
              onSearch={handleServerSearch}
            />
          </div>
        </div>

        {tableElement}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateState}
        title="Edit State"
        fields={editModalFields}
      />
    </div>
  );
}
