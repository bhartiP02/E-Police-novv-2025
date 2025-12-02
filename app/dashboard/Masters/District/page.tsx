"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CustomTable,
  ColumnDef,
  PaginationState,
  SortingState,
} from "@/component/ui/Table/CustomTable";
import AddSection, { FieldConfig } from "@/component/ui/add-section/add-section";
import { api } from "@/services/api/apiServices";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import EditModal from "@/component/ui/EditModal/editModal";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";


/* ============================================
   TYPES 
============================================ */
interface DistrictRow {
  id: number;              
  district_id?: number;    
  country_id: number;
  state_id: number;
  district_name: string;
  district_name_marathi: string;
  district_name_hindi: string;
  min_distance: number;
  status: string;
  country_name?: string;
  state_name?: string;
}

interface Country {
  id: number;
  country_name: string;
}

interface State {
  id: number;
  state_name_en: string;
  country_id: number;
}

/* ============================================
   COMPONENT START
============================================ */
export default function DistrictPage() {
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  // const [filteredDistricts, setFilteredDistricts] = useState<DistrictRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<DistrictRow | null>(null);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editStates, setEditStates] = useState<State[]>([]);

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Table pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { exportToPdf } = useExportPdf();

  /* ============================================
     TOAST
  ============================================ */
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast({ isVisible: false, message: "", type: "success" });
    }, 3000);
  }, []);

  const extract = (r: any) =>
    r?.data?.data || r?.data?.result || r?.data || r || [];

  /* ============================================
     FETCH DISTRICTS (SERVER SIDE PAGINATION)
  ============================================ */
  const fetchDistricts = useCallback(
    async (pageIndex: number, pageSize: number, search: string) => {
      try {
        setLoading(true);

        const response: any = await api.get("/districts", {
          page: pageIndex + 1,
          limit: pageSize,
          search: search || "",
        });

        const rows = response?.data || response?.result || response || [];

        const validatedRows: DistrictRow[] = rows.map((district: any) => {
          const id = district.id ?? district.district_id;
          return {
            id, // normalized
            district_id: district.district_id ?? id,
            country_id: district.country_id ?? 0,
            state_id: district.state_id ?? 0,
            district_name: district.district_name ?? "",
            district_name_marathi: district.district_name_marathi ?? "",
            district_name_hindi: district.district_name_hindi ?? "",
            min_distance: district.min_distance ?? district.distance ?? 0,
            status: district.status ?? "Active",
            country_name: district.country_name,
            state_name: district.state_name,
          };
        });

        setDistricts(validatedRows);
        // setFilteredDistricts(validatedRows);

        setTotalCount(
          response?.totalRecords ??
          response?.totalCount ??
          response?.total ??
          validatedRows.length
        );
      } catch (error) {
        console.error("❌ Error fetching districts:", error);
        showToast("Failed to fetch districts", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
    filename: `districts-master-report-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`,

    title: "Districts Master Report",
    orientation: "landscape",
    pageSize: "a4",

    columns: [
      { header: "District Name", accessorKey: "district_name" },
      { header: "Country", accessorKey: "country_name" },
      { header: "State", accessorKey: "state_name" },
      { header: "Distance (km)", accessorKey: "min_distance" },
      {
        header: "Status",
        accessorKey: "status",
        formatter: (value) => (value === "Active" ? "Active" : "Inactive"),
      }
    ],

    data: districts,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All districts",
    userRole: "admin"
  }), [districts, searchQuery]);


  useEffect(() => {
    fetchDistricts(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, fetchDistricts]);

  /* ============================================
     SEARCH HANDLING
  ============================================ */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // const handleClientSearch = useCallback(
  //   (query: string) => {
  //     if (!query.trim()) {
  //       setFilteredDistricts(districts);
  //     } else {
  //       const lower = query.toLowerCase();
  //       setFilteredDistricts(
  //         districts.filter(
  //           (district) =>
  //             district.district_name.toLowerCase().includes(lower) ||
  //             district.country_name?.toLowerCase().includes(lower) ||
  //             district.state_name?.toLowerCase().includes(lower) ||
  //             district.district_name_marathi?.toLowerCase().includes(lower) ||
  //             district.district_name_hindi?.toLowerCase().includes(lower) ||
  //             district.distance.toString().includes(query)
  //         )
  //       );
  //     }

  //     setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  //   },
  //   [districts]
  // );

  /* ============================================
     FETCH COUNTRIES & STATES
  ============================================ */
  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const resp = await api.get("/states/getcountry");
      const countriesData = extract(resp);
      setCountries(countriesData);
      setCountriesLoaded(true);
      return countriesData;
    } catch (error) {
      console.error("❌ Error fetching countries:", error);
      showToast("Failed to fetch countries", "error");
      return [];
    } finally {
      setIsCountriesLoading(false);
    }
  }, [showToast]);

  const fetchStatesByCountry = useCallback(async (countryId: string) => {
    if (!countryId) return [];
    try {
      const resp = await api.get(`/states/country/${countryId}`);
      return extract(resp);
    } catch {
      return [];
    }
  }, []);

  const handleCountryDropdownClick = useCallback(async () => {
    if (!isCountriesLoading && !countriesLoaded) {
      await fetchCountries();
    }
  }, [isCountriesLoading, countriesLoaded, fetchCountries]);

  /* ============================================
    ADD DISTRICT
  ============================================ */
  const handleAddDistrict = useCallback(
    async (form: Record<string, string>) => {
      try {
        if (!form.country_id || !form.state_id) {
          return showToast("Select country & state", "error");
        }

        const payload = {
          country_id: Number(form.country_id),
          state_id: Number(form.state_id),
          district_name: form.district_name,
          district_name_marathi: form.district_name_marathi,
          district_name_hindi: form.district_name_hindi,
          min_distance: Number(form.min_distance),
          // status: "Active",
        };

        await api.post("/districts", payload);

        fetchDistricts(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("District added successfully!", "success");
      } catch (error: any) {
        showToast(
          error.response?.data?.message || "Failed to add district",
          "error"
        );
      }
    },
    [fetchDistricts, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]
  );

  /* ============================================
     GET DISTRICT BY ID
  ============================================ */
  const fetchDistrictById = useCallback(
    async (id: number) => {
      try {
        const resp = await api.get(`/districts/${id}`);
        const data = extract(resp);
        const district = Array.isArray(data) ? data[0] : data;

        if (!district) return null;

        const norm: DistrictRow = {
          id: district.id ?? district.district_id ?? id,
          district_id: district.district_id ?? district.id ?? id,
          country_id: district.country_id ?? 0,
          state_id: district.state_id ?? 0,
          district_name: district.district_name ?? "",
          district_name_marathi: district.district_name_marathi ?? "",
          district_name_hindi: district.district_name_hindi ?? "",
          min_distance: district.min_distance ?? district.distance ?? 0,
          status: district.status ?? "Active",
          country_name: district.country_name,
          state_name: district.state_name,
        };

        return norm;
      } catch (err) {
        console.error("❌ Error fetching district by id:", err);
        showToast("Failed to load district details", "error");
        return null;
      }
    },
    [showToast]
  );

  /* ============================================
    EDIT 
  ============================================ */
  const handleEdit = useCallback(
    async (row: DistrictRow) => {
      try {
        const rowId = row.id ?? row.district_id;
        if (!rowId) {
          showToast("Invalid district id", "error");
          return;
        }

        const freshDistrict = await fetchDistrictById(rowId);
        if (!freshDistrict) return;

        setEditingDistrict(freshDistrict);

        setCountries([
          {
            id: freshDistrict.country_id,
            country_name: freshDistrict.country_name || "Selected Country",
          },
        ]);

        // Inject only selected state (so dropdown shows current value)
        setEditStates([
          {
            id: freshDistrict.state_id,
            state_name_en: freshDistrict.state_name || "Selected State",
            country_id: freshDistrict.country_id,
          },
        ]);

        // Open modal
        setIsEditModalOpen(true);
      } catch {
        showToast("Failed to load edit form", "error");
      }
    },
    [fetchDistrictById, showToast]
  );


  /* ============================================
     UPDATE DISTRICT  ✅ ID & district_id fixed
  ============================================ */
  const handleUpdateDistrict = useCallback(
    async (formData: any) => {
      if (!editingDistrict) return;

      // pick id from either `id` or `district_id`
      const idForUpdate = editingDistrict.id ?? editingDistrict.district_id;

      if (!idForUpdate) {
        showToast("Invalid district id", "error");
        return;
      }

      try {
        const payload = {
          district_id: idForUpdate, // in body (if backend needs it)
          country_id: Number(formData.country_id),
          state_id: Number(formData.state_id),
          district_name: formData.district_name,
          district_name_marathi: formData.district_name_marathi,
          district_name_hindi: formData.district_name_hindi,
          min_distance: Number(formData.min_distance),
          status: formData.status ?? editingDistrict.status ?? "Active",
        };

        console.log(" Update payload:", payload);

        await api.put(`/districts/${idForUpdate}`, payload);

        // Wait for the fetch to complete before closing modal
        await fetchDistricts(pagination.pageIndex, pagination.pageSize, searchQuery);

        setIsEditModalOpen(false);
        setEditingDistrict(null);
        setEditStates([]);

        showToast("District updated successfully!", "success");
      } catch (error: any) {
        console.error("❌ Update error:", error?.response?.data || error);
        showToast(
          error.response?.data?.message || "Failed to update district",
          "error"
        );
      }
    },
    [
      editingDistrict,
      fetchDistricts,
      pagination.pageIndex,
      pagination.pageSize,
      searchQuery,
      showToast,
    ]
  );

  /* ============================================
     DELETE
  ============================================ */
  const handleDeleteConfirm = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/districts/${id}`);
        fetchDistricts(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("District deleted successfully!", "success");
      } catch (error: any) {
        showToast(
          error.response?.data?.message || "Failed to delete district",
          "error"
        );
      }
    },
    [fetchDistricts, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]
  );

  /* ============================================
     EDIT MODAL FIELDS
  ============================================ */
  const editModalFields = useMemo(() => {
    if (!editingDistrict) return [];

    return [
      {
        type: "select",
        name: "country_id",
        label: "Country",
        required: true,
        defaultValue: editingDistrict.country_id.toString(),
        options: countries.map((c) => ({
          value: c.id.toString(),
          label: c.country_name,
        })),
        customProps: {
          onMouseDown: async () => {
            const data = await fetchCountries();
            setCountries(data);
          },
          onChange: async (e: any) => {
            const countryId = e.target.value;
            const states = await fetchStatesByCountry(countryId);
            setEditStates(states);
          }
        }
      },

      {
        type: "select",
        name: "state_id",
        label: "State",
        required: true,
        defaultValue: editingDistrict.state_id.toString(),
        options: editStates.map((s) => ({
          value: s.id.toString(),
          label: s.state_name_en,
        })),
        customProps: {
          onMouseDown: async (e: any) => {
            const countryId =
              e?.target?.form?.country_id?.value ||
              editingDistrict.country_id.toString();

            const states = await fetchStatesByCountry(countryId);
            setEditStates(states);
          }
        }
      },
      {
        type: "text",
        name: "district_name",
        label: "District Name (English)",
        required: true,
        defaultValue: editingDistrict.district_name,
      },
      {
        type: "text",
        name: "district_name_marathi",
        label: "District Name (Marathi)",
        defaultValue: editingDistrict.district_name_marathi,
      },
      {
        type: "text",
        name: "district_name_hindi",
        label: "District Name (Hindi)",
        defaultValue: editingDistrict.district_name_hindi,
      },
      {
        type: "number",
        name: "min_distance", 
        label: "Distance (km)",
        required: true,
        defaultValue: editingDistrict.min_distance.toString(),
      },
    ];
  }, [editingDistrict, countries, editStates]);

  /* ============================================
     ADD SECTION FIELDS
  ============================================ */
  const districtFields: FieldConfig[] = useMemo(
    () => [
      {
        name: "country_id",
        label: "Country :",
        type: "select",
        required: true,
        options: countries.map((c) => ({
          value: String(c.id),
          label: c.country_name,
        })),
        customProps: {
          onMouseDown: handleCountryDropdownClick,
          onChange: async (e: any) => {
            const countryId = e.target.value;
            const statesData = await fetchStatesByCountry(countryId);
            setStates(statesData);
          },
        },
      },
      {
        name: "state_id",
        label: "State :",
        type: "select",
        required: true,
        options: states.map((s) => ({
          value: String(s.id),
          label: s.state_name_en,
        })),
        placeholder:
          states.length === 0 ? "Select country first" : "Select state",
      },
      { name: "district_name", label: "District (English)", type: "text", required: true },
      { name: "district_name_marathi", label: "District (Marathi)", type: "text" },
      { name: "district_name_hindi", label: "District (Hindi)", type: "text" },
      { name: "min_distance", label: "Distance (km)", type: "number", required: true },
    ],
    [countries, states, handleCountryDropdownClick, fetchStatesByCountry]
  );

  /* ============================================
     COLUMNS 
  ============================================ */
  const columns: ColumnDef<DistrictRow>[] = useMemo(
    () => [
      { accessorKey: "district_name", header: "District Name" },

      {
        accessorKey: "country_name",
        header: "Country Name",
        cell: ({ row }) => <span>{row.original.country_name || "Not assigned"}</span>,
      },

      {
        accessorKey: "state_name",
        header: "State Name",
        cell: ({ row }) => <span>{row.original.state_name || "Not assigned"}</span>,
      },

      { accessorKey: "min_distance", header: "Distance (km)" },

      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleEdit(row.original)}
              className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>

            <AlertPopover
              trigger={
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                  Delete
                </button>
              }
              title="Are you sure you want to delete this District?"
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDeleteConfirm(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [handleEdit, handleDeleteConfirm]
  );

  /* ============================================
     CUSTOM TABLE (SERVER PAGINATION)
  ============================================ */
  const { tableElement, table } = CustomTable<DistrictRow>({
    data: districts,
    columns,
    pagination,
    totalCount,
    loading,
    sorting,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    maxHeight: "500px",
    emptyMessage: "No districts available",
    getRowId: (row) => row.id,
  });

  /* ============================================
     EDIT FIELD CHANGE HANDLER
  ============================================ */
  const handleEditFieldChange = useCallback(
    async (fieldName: string, value: string, formData: any) => {
      if (fieldName === "country_id") {
        const statesData = await fetchStatesByCountry(value);
        setEditStates(statesData);
        return { ...formData, state_id: "" };
      }
      return formData;
    },
    [fetchStatesByCountry]
  );

  /* ============================================
     RENDER
  ============================================ */
  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />

      <AddSection
        title="Add District"
        fields={districtFields}
        onSubmit={handleAddDistrict}
        submitButtonText="Add District"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ExportButtons pdfConfig={pdfExportConfig} />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-full max-w-xs">
            <SearchComponent
              placeholder="Search districts..."
              debounceDelay={400}
              onSearch={async (query: string) => {
                handleSearch(query);
                return []; // return an empty array because serverSideSearch=false
              }}
              // onClientSearch={handleClientSearch}
              serverSideSearch={false}
            />
          </div>
        </div>

        {tableElement}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDistrict(null);
          setEditStates([]);
        }}
        onSubmit={handleUpdateDistrict}
        title={`Edit District ${editingDistrict ? `- ${editingDistrict.district_name}` : ""}`}
        fields={editModalFields}
        onFieldChange={handleEditFieldChange}
      />
    </div>
  );
}
