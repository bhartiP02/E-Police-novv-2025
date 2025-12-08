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
import { useExportExcel, ExportExcelOptions } from "@/hook/UseExportExcel/useExportExcel";

/* ============================================
   TYPES 
============================================ */
interface SensitiveAreaRow {
  id: number;
  sensitive_area_id?: number;
  sdpo_id: number;
  state_id: number;
  district_id: number;
  city_id: number;
  police_station_id: number;
  address: string;
  latitude: string;
  longitude: string;
  image: string;
  state_name?: string;
  district_name?: string;
  city_name?: string;
  police_station_name?: string;
  sdpo_name?: string;
}

interface Sdpo {
  id: number;
  sdpo_name: string;
}

interface State {
  id: number;
  state_name_en: string;
}

interface District {
  id: number;
  district_name: string;
}

interface City {
  id: number;
  city_name: string;
}

interface PoliceStation {
  id: number;
  police_station_name: string;
}

/* ============================================
   COMPONENT START
============================================ */
export default function SensitiveAreaPage() {
  const [sensitiveAreas, setSensitiveAreas] = useState<SensitiveAreaRow[]>([]);
  const [sdpos, setSdpos] = useState<Sdpo[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSensitiveArea, setEditingSensitiveArea] = useState<SensitiveAreaRow | null>(null);
  const [isSdposLoading, setIsSdposLoading] = useState(false);
  const [sdposLoaded, setSdposLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editStates, setEditStates] = useState<State[]>([]);
  const [editDistricts, setEditDistricts] = useState<District[]>([]);
  const [editCities, setEditCities] = useState<City[]>([]);
  const [editPoliceStations, setEditPoliceStations] = useState<PoliceStation[]>([]);
  const [editSdpos, setEditSdpos] = useState<Sdpo[]>([]);
  const [isLoadingAreaDetail, setIsLoadingAreaDetail] = useState(false);

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
  const { exportToExcel } = useExportExcel();

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
     FETCH SENSITIVE AREAS (SERVER SIDE PAGINATION)
  ============================================ */
  const fetchSensitiveAreas = useCallback(
    async (pageIndex: number, pageSize: number, search: string) => {
      try {
        setLoading(true);

        const response: any = await api.get("/sensitive-areas", {
          page: pageIndex + 1,
          limit: pageSize,
          search: search || "",
        });

        const rows = response?.data || response?.result || response || [];

        const validatedRows: SensitiveAreaRow[] = rows.map((area: any) => {
          const id = area.id ?? area.sensitive_area_id;
          return {
            id,
            sensitive_area_id: area.sensitive_area_id ?? id,
            sdpo_id: area.sdpo_id ?? 0,
            state_id: area.state_id ?? 0,
            district_id: area.district_id ?? 0,
            city_id: area.city_id ?? 0,
            police_station_id: area.police_station_id ?? 0,
            address: area.address ?? "",
            latitude: area.latitude ?? "",
            longitude: area.longitude ?? "",
            image: area.image ?? "",
            state_name: area.state_name,
            district_name: area.district_name,
            city_name: area.city_name,
            police_station_name: area.police_station_name,
            sdpo_name: area.sdpo_name,
          };
        });

        setSensitiveAreas(validatedRows);
        setTotalCount(
          response?.totalRecords ??
          response?.totalCount ??
          response?.total ??
          validatedRows.length
        );
      } catch (error) {
        console.error("❌ Error fetching sensitive areas:", error);
        showToast("Failed to fetch sensitive areas", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // ✅ AUTO-FETCH ON PAGINATION/SEARCH CHANGE
  useEffect(() => {
    fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, fetchSensitiveAreas]);

  /* ============================================
     PDF EXPORT CONFIG
  ============================================ */
  const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
    filename: `sensitive-areas-report-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`,
    title: "Sensitive Areas Report",
    orientation: "landscape",
    pageSize: "a4",
    columns: [
      { header: "Address", accessorKey: "address" },
      { header: "Police Station", accessorKey: "police_station_name" },
      { header: "City", accessorKey: "city_name" },
      { header: "District", accessorKey: "district_name" },
      { header: "State", accessorKey: "state_name" },
      { header: "Latitude", accessorKey: "latitude" },
      { header: "Longitude", accessorKey: "longitude" },
    ],
    data: sensitiveAreas,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All sensitive areas",
    userRole: "admin",
  }), [sensitiveAreas, searchQuery]);

  /* ============================================
     EXCEL EXPORT CONFIG
  ============================================ */
  const excelExportConfig: ExportExcelOptions = useMemo(() => ({
    filename: `sensitive-areas-report-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.xlsx`,
    sheetName: "Sensitive Areas",
    title: "Sensitive Areas Report",
    columns: [
      { header: "Address", accessorKey: "address" },
      { header: "Police Station", accessorKey: "police_station_name" },
      { header: "City", accessorKey: "city_name" },
      { header: "District", accessorKey: "district_name" },
      { header: "State", accessorKey: "state_name" },
      { header: "Latitude", accessorKey: "latitude" },
      { header: "Longitude", accessorKey: "longitude" },
    ],
    data: sensitiveAreas,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All sensitive areas",
    userRole: "admin",
  }), [sensitiveAreas, searchQuery]);

  /* ============================================
     SEARCH HANDLING
  ============================================ */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.trim());
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  /* ============================================
     FETCH SDPOS
  ============================================ */
  const fetchSdpos = useCallback(async () => {
    try {
      setIsSdposLoading(true);
      const resp = await api.get("/sdpos");
      const sdposData = extract(resp);
      setSdpos(sdposData);
      setSdposLoaded(true);
      return sdposData;
    } catch (error) {
      console.error("❌ Error fetching SDPOs:", error);
      showToast("Failed to fetch SDPOs", "error");
      return [];
    } finally {
      setIsSdposLoading(false);
    }
  }, [showToast]);

  /* ============================================
     FETCH STATES BY SDPO
  ============================================ */
  const fetchStatesBySdpo = useCallback(async (sdpoId: string) => {
    if (!sdpoId) return [];
    try {
      const resp = await api.get(`/states/sdpo/${sdpoId}`);
      return extract(resp);
    } catch {
      return [];
    }
  }, []);

  /* ============================================
     FETCH DISTRICTS BY STATE
  ============================================ */
  const fetchDistrictsByState = useCallback(async (stateId: string) => {
    if (!stateId) return [];
    try {
      const resp = await api.get(`/districts/state/${stateId}`);
      return extract(resp);
    } catch {
      return [];
    }
  }, []);

  /* ============================================
     FETCH CITIES BY DISTRICT
  ============================================ */
  const fetchCitiesByDistrict = useCallback(async (districtId: string) => {
    if (!districtId) return [];
    try {
      const resp = await api.get(`/cities/district/${districtId}`);
      return extract(resp);
    } catch {
      return [];
    }
  }, []);

  /* ============================================
     FETCH POLICE STATIONS BY CITY
  ============================================ */
  const fetchPoliceStationsByCity = useCallback(async (cityId: string) => {
    if (!cityId) return [];
    try {
      const resp = await api.get(`/police-stations/city/${cityId}`);
      return extract(resp);
    } catch {
      return [];
    }
  }, []);

  const handleSdpoDropdownClick = useCallback(async () => {
    if (!isSdposLoading && !sdposLoaded) {
      await fetchSdpos();
    }
  }, [isSdposLoading, sdposLoaded, fetchSdpos]);

  /* ============================================
    ADD SENSITIVE AREA
  ============================================ */
  const handleAddSensitiveArea = useCallback(
    async (form: Record<string, string>) => {
      try {
        if (!form.sdpo_id || !form.state_id || !form.district_id || !form.city_id || !form.police_station_id) {
          return showToast("Please fill all required fields", "error");
        }

        if (!form.address || !form.latitude || !form.longitude) {
          return showToast("Address, Latitude, and Longitude are required", "error");
        }

        const payload = {
          sdpo_id: Number(form.sdpo_id),
          state_id: Number(form.state_id),
          district_id: Number(form.district_id),
          city_id: Number(form.city_id),
          police_station_id: Number(form.police_station_id),
          address: form.address,
          latitude: form.latitude,
          longitude: form.longitude,
          image: form.image || "",
        };

        await api.post("/sensitive-areas", payload);
        fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("Sensitive area added successfully!", "success");
      } catch (error: any) {
        showToast(
          error.response?.data?.message || "Failed to add sensitive area",
          "error"
        );
      }
    },
    [fetchSensitiveAreas, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]
  );

  /* ============================================
     GET SENSITIVE AREA BY ID
  ============================================ */
  const fetchSensitiveAreaById = useCallback(
    async (id: number) => {
      try {
        const resp = await api.get(`/sensitive-areas/${id}`);
        const data = extract(resp);
        const area = Array.isArray(data) ? data[0] : data;

        if (!area) return null;

        const norm: SensitiveAreaRow = {
          id: area.id ?? area.sensitive_area_id ?? id,
          sensitive_area_id: area.sensitive_area_id ?? area.id ?? id,
          sdpo_id: area.sdpo_id ?? 0,
          state_id: area.state_id ?? 0,
          district_id: area.district_id ?? 0,
          city_id: area.city_id ?? 0,
          police_station_id: area.police_station_id ?? 0,
          address: area.address ?? "",
          latitude: area.latitude ?? "",
          longitude: area.longitude ?? "",
          image: area.image ?? "",
          state_name: area.state_name,
          district_name: area.district_name,
          city_name: area.city_name,
          police_station_name: area.police_station_name,
          sdpo_name: area.sdpo_name,
        };

        return norm;
      } catch (err) {
        console.error("❌ Error fetching sensitive area by id:", err);
        showToast("Failed to load sensitive area details", "error");
        return null;
      }
    },
    [showToast]
  );

  /* ============================================
    EDIT
  ============================================ */
  const handleEdit = useCallback(
    async (row: SensitiveAreaRow) => {
      try {
        setIsLoadingAreaDetail(true);

        const rowId = row.id ?? row.sensitive_area_id;
        if (!rowId) {
          showToast("Invalid sensitive area id", "error");
          return;
        }

        const freshArea = await fetchSensitiveAreaById(rowId);
        if (!freshArea) return;

        setEditingSensitiveArea(freshArea);

        setEditSdpos([
          {
            id: freshArea.sdpo_id,
            sdpo_name: freshArea.sdpo_name || "Selected SDPO",
          },
        ]);

        setEditStates([
          {
            id: freshArea.state_id,
            state_name_en: freshArea.state_name || "Selected State",
          },
        ]);

        setEditDistricts([
          {
            id: freshArea.district_id,
            district_name: freshArea.district_name || "Selected District",
          },
        ]);

        setEditCities([
          {
            id: freshArea.city_id,
            city_name: freshArea.city_name || "Selected City",
          },
        ]);

        setEditPoliceStations([
          {
            id: freshArea.police_station_id,
            police_station_name: freshArea.police_station_name || "Selected Police Station",
          },
        ]);

        setIsEditModalOpen(true);
        showToast("Sensitive area details loaded successfully!", "success");
      } catch (error) {
        console.error("Error in handleEdit:", error);
        showToast("Failed to load edit form", "error");
      } finally {
        setIsLoadingAreaDetail(false);
      }
    },
    [fetchSensitiveAreaById, showToast]
  );

  /* ============================================
     UPDATE SENSITIVE AREA
  ============================================ */
  const handleUpdateSensitiveArea = useCallback(
    async (formData: any) => {
      if (!editingSensitiveArea) return;

      const idForUpdate = editingSensitiveArea.id ?? editingSensitiveArea.sensitive_area_id;

      if (!idForUpdate) {
        showToast("Invalid sensitive area id", "error");
        return;
      }

      try {
        const payload = {
          sdpo_id: Number(formData.sdpo_id),
          state_id: Number(formData.state_id),
          district_id: Number(formData.district_id),
          city_id: Number(formData.city_id),
          police_station_id: Number(formData.police_station_id),
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          image: formData.image ?? editingSensitiveArea.image,
        };

        await api.put(`/sensitive-areas/${idForUpdate}`, payload);
        await fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);

        setIsEditModalOpen(false);
        setEditingSensitiveArea(null);
        setEditStates([]);
        setEditDistricts([]);
        setEditCities([]);
        setEditPoliceStations([]);
        setEditSdpos([]);

        showToast("Sensitive area updated successfully!", "success");
      } catch (error: any) {
        console.error("❌ Update error:", error?.response?.data || error);
        showToast(
          error.response?.data?.message || "Failed to update sensitive area",
          "error"
        );
      }
    },
    [
      editingSensitiveArea,
      fetchSensitiveAreas,
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
        await api.delete(`/sensitive-areas/${id}`);
        fetchSensitiveAreas(pagination.pageIndex, pagination.pageSize, searchQuery);
        showToast("Sensitive area deleted successfully!", "success");
      } catch (error: any) {
        showToast(
          error.response?.data?.message || "Failed to delete sensitive area",
          "error"
        );
      }
    },
    [fetchSensitiveAreas, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]
  );

  /* ============================================
     EDIT MODAL FIELDS
  ============================================ */
  const editModalFields = useMemo<FieldConfig[]>(() => {
    if (!editingSensitiveArea) return [];

    return [
      {
        type: "select",
        name: "sdpo_id",
        label: "SDPO",
        required: true,
        defaultValue: editingSensitiveArea.sdpo_id.toString(),
        options: editSdpos.map((s) => ({
          value: s.id.toString(),
          label: s.sdpo_name,
        })),
        customProps: {
          onMouseDown: async () => {
            const data = await fetchSdpos();
            setEditSdpos(data);
          },
          onChange: async (e: any) => {
            const sdpoId = e.target.value;
            const statesData = await fetchStatesBySdpo(sdpoId);
            setEditStates(statesData);
            setEditDistricts([]);
            setEditCities([]);
            setEditPoliceStations([]);
          },
        },
      },

      {
        type: "select",
        name: "state_id",
        label: "State",
        required: true,
        defaultValue: editingSensitiveArea.state_id.toString(),
        options: editStates.map((s) => ({
          value: s.id.toString(),
          label: s.state_name_en,
        })),
        customProps: {
          onChange: async (e: any) => {
            const stateId = e.target.value;
            const districtsData = await fetchDistrictsByState(stateId);
            setEditDistricts(districtsData);
            setEditCities([]);
            setEditPoliceStations([]);
          },
        },
      },

      {
        type: "select",
        name: "district_id",
        label: "District",
        required: true,
        defaultValue: editingSensitiveArea.district_id.toString(),
        options: editDistricts.map((d) => ({
          value: d.id.toString(),
          label: d.district_name,
        })),
        customProps: {
          onChange: async (e: any) => {
            const districtId = e.target.value;
            const citiesData = await fetchCitiesByDistrict(districtId);
            setEditCities(citiesData);
            setEditPoliceStations([]);
          },
        },
      },

      {
        type: "select",
        name: "city_id",
        label: "City",
        required: true,
        defaultValue: editingSensitiveArea.city_id.toString(),
        options: editCities.map((c) => ({
          value: c.id.toString(),
          label: c.city_name,
        })),
        customProps: {
          onChange: async (e: any) => {
            const cityId = e.target.value;
            const stationsData = await fetchPoliceStationsByCity(cityId);
            setEditPoliceStations(stationsData);
          },
        },
      },

      {
        type: "select",
        name: "police_station_id",
        label: "Police Station",
        required: true,
        defaultValue: editingSensitiveArea.police_station_id.toString(),
        options: editPoliceStations.map((ps) => ({
          value: ps.id.toString(),
          label: ps.police_station_name,
        })),
      },

      {
        type: "textarea",
        name: "address",
        label: "Address",
        required: true,
        defaultValue: editingSensitiveArea.address,
      },

      {
        type: "text",
        name: "latitude",
        label: "Latitude",
        required: true,
        defaultValue: editingSensitiveArea.latitude,
      },

      {
        type: "text",
        name: "longitude",
        label: "Longitude",
        required: true,
        defaultValue: editingSensitiveArea.longitude,
      },

      {
        type: "text",
        name: "image",
        label: "Image URL",
        defaultValue: editingSensitiveArea.image,
      },
    ];
  }, [editingSensitiveArea, editSdpos, editStates, editDistricts, editCities, editPoliceStations, fetchSdpos, fetchStatesBySdpo, fetchDistrictsByState, fetchCitiesByDistrict, fetchPoliceStationsByCity]);

  /* ============================================
     ADD SECTION FIELDS
  ============================================ */
  const sensitiveAreaFields: FieldConfig[] = useMemo(
    () => [
      {
        name: "sdpo_id",
        label: "SDPO :",
        type: "select",
        required: true,
        options: sdpos.map((s) => ({
          value: String(s.id),
          label: s.sdpo_name,
        })),
        customProps: {
          onMouseDown: handleSdpoDropdownClick,
          onChange: async (e: any) => {
            const sdpoId = e.target.value;
            const statesData = await fetchStatesBySdpo(sdpoId);
            setStates(statesData);
            setDistricts([]);
            setCities([]);
            setPoliceStations([]);
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
        placeholder: states.length === 0 ? "Select SDPO first" : "Select state",
        customProps: {
          onChange: async (e: any) => {
            const stateId = e.target.value;
            const districtsData = await fetchDistrictsByState(stateId);
            setDistricts(districtsData);
            setCities([]);
            setPoliceStations([]);
          },
        },
      },
      {
        name: "district_id",
        label: "District :",
        type: "select",
        required: true,
        options: districts.map((d) => ({
          value: String(d.id),
          label: d.district_name,
        })),
        placeholder: districts.length === 0 ? "Select state first" : "Select district",
        customProps: {
          onChange: async (e: any) => {
            const districtId = e.target.value;
            const citiesData = await fetchCitiesByDistrict(districtId);
            setCities(citiesData);
            setPoliceStations([]);
          },
        },
      },
      {
        name: "city_id",
        label: "City :",
        type: "select",
        required: true,
        options: cities.map((c) => ({
          value: String(c.id),
          label: c.city_name,
        })),
        placeholder: cities.length === 0 ? "Select district first" : "Select city",
        customProps: {
          onChange: async (e: any) => {
            const cityId = e.target.value;
            const stationsData = await fetchPoliceStationsByCity(cityId);
            setPoliceStations(stationsData);
          },
        },
      },
      {
        name: "police_station_id",
        label: "Police Station :",
        type: "select",
        required: true,
        options: policeStations.map((ps) => ({
          value: String(ps.id),
          label: ps.police_station_name,
        })),
        placeholder: policeStations.length === 0 ? "Select city first" : "Select police station",
      },
      {
        name: "address",
        label: "Address",
        type: "textarea",
        required: true,
      },
      {
        name: "latitude",
        label: "Latitude",
        type: "text",
        required: true,
      },
      {
        name: "longitude",
        label: "Longitude",
        type: "text",
        required: true,
      },
      {
        name: "image",
        label: "Image URL",
        type: "text",
      },
    ],
    [sdpos, states, districts, cities, policeStations, handleSdpoDropdownClick, fetchStatesBySdpo, fetchDistrictsByState, fetchCitiesByDistrict, fetchPoliceStationsByCity]
  );

  /* ============================================
     COLUMNS 
  ============================================ */
  const columns: ColumnDef<SensitiveAreaRow>[] = useMemo(
    () => [
      { accessorKey: "address", header: "Address" },

      {
        accessorKey: "police_station_name",
        header: "Police Station",
        cell: ({ row }) => <span>{row.original.police_station_name || "Not assigned"}</span>,
      },

      {
        accessorKey: "city_name",
        header: "City",
        cell: ({ row }) => <span>{row.original.city_name || "Not assigned"}</span>,
      },

      {
        accessorKey: "district_name",
        header: "District",
        cell: ({ row }) => <span>{row.original.district_name || "Not assigned"}</span>,
      },

      {
        accessorKey: "state_name",
        header: "State",
        cell: ({ row }) => <span>{row.original.state_name || "Not assigned"}</span>,
      },

      { accessorKey: "latitude", header: "Latitude" },

      { accessorKey: "longitude", header: "Longitude" },

      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleEdit(row.original)}
              className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              disabled={isLoadingAreaDetail}
            >
              {isLoadingAreaDetail ? "Loading..." : "Edit"}
            </button>

            <AlertPopover
              trigger={
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                  Delete
                </button>
              }
              title="Are you sure you want to delete this Sensitive Area?"
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDeleteConfirm(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [handleEdit, handleDeleteConfirm, isLoadingAreaDetail]
  );

  /* ============================================
     CUSTOM TABLE (SERVER PAGINATION)
  ============================================ */
  const { tableElement, table } = CustomTable<SensitiveAreaRow>({
    data: sensitiveAreas,
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
    emptyMessage: "No sensitive areas available",
    manualPagination: true,
    getRowId: (row) => row.id,
  });

  /* ============================================
     EDIT FIELD CHANGE HANDLER
  ============================================ */
  const handleEditFieldChange = useCallback(
    async (fieldName: string, value: string, formData: any) => {
      if (fieldName === "sdpo_id") {
        const statesData = await fetchStatesBySdpo(value);
        setEditStates(statesData);
        setEditDistricts([]);
        setEditCities([]);
        setEditPoliceStations([]);

        return {
          ...formData,
          sdpo_id: value,
          state_id: "",
          district_id: "",
          city_id: "",
          police_station_id: "",
        };
      }

      if (fieldName === "state_id") {
        const districtsData = await fetchDistrictsByState(value);
        setEditDistricts(districtsData);
        setEditCities([]);
        setEditPoliceStations([]);

        return {
          ...formData,
          state_id: value,
          district_id: "",
          city_id: "",
          police_station_id: "",
        };
      }

      if (fieldName === "district_id") {
        const citiesData = await fetchCitiesByDistrict(value);
        setEditCities(citiesData);
        setEditPoliceStations([]);

        return {
          ...formData,
          district_id: value,
          city_id: "",
          police_station_id: "",
        };
      }

      if (fieldName === "city_id") {
        const stationsData = await fetchPoliceStationsByCity(value);
        setEditPoliceStations(stationsData);

        return {
          ...formData,
          city_id: value,
          police_station_id: "",
        };
      }

      return {
        ...formData,
        [fieldName]: value,
      };
    },
    [fetchStatesBySdpo, fetchDistrictsByState, fetchCitiesByDistrict, fetchPoliceStationsByCity]
  );

  /* ============================================
     RENDER
  ============================================ */
  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />

      <AddSection
        title="Add Sensitive Area"
        fields={sensitiveAreaFields}
        onSubmit={handleAddSensitiveArea}
        submitButtonText="Add Sensitive Area"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ExportButtons
              pdfConfig={pdfExportConfig}
              excelConfig={excelExportConfig}
            />
            <ColumnVisibilitySelector columns={table.getAllColumns()} />
          </div>

          <div className="w-64">
            <SearchComponent
              placeholder="Search Sensitive Areas..."
              debounceDelay={400}
              serverSideSearch={true}
              onSearch={handleSearch}
            />
          </div>
        </div>

        {tableElement}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSensitiveArea(null);
          setEditStates([]);
          setEditDistricts([]);
          setEditCities([]);
          setEditPoliceStations([]);
          setEditSdpos([]);
        }}
        onSubmit={handleUpdateSensitiveArea}
        isLoading={isLoadingAreaDetail}
        loadingMessage={
          isLoadingAreaDetail ? "Loading sensitive area details..." : undefined
        }
        title={`Edit Sensitive Area ${editingSensitiveArea ? `- ${editingSensitiveArea.address}` : ""}`}
        fields={editModalFields}
        onFieldChange={handleEditFieldChange}
      />
    </div>
  );
}