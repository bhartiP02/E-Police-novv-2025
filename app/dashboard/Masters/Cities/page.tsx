"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CustomTable, ColumnDef, PaginationState, SortingState } from "@/component/ui/Table/CustomTable";
import AddSection, { FieldConfig } from "@/component/ui/add-section/add-section";
import { api } from "@/services/api/apiServices";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import EditModal from "@/component/ui/EditModal/editModal";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";
import { useExportExcel, ExportExcelOptions } from "@/hook/UseExportExcel/useExportExcel";


interface CityRow {
  id: number;
  country_name: string;
  state_name: string;
  district_name: string;
  city_name: string;
  status: string;
  [key: string]: any;
}

interface Country {
  id: number;
  country_name: string;
}

interface State {
  id: number;
  state_name: string;
  country_id: number;
  state_name_en?: string;
}

interface District {
  id: number;
  district_name: string;
  state_id: number;
}

interface CityDetail {
  id: number;
  country_id: number;
  state_id: number;
  district_id: number;
  city_name: string;
  city_name_marathi: string;
  city_name_hindi: string;
  status: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityRow | null>(null);
  const [cityDetail, setCityDetail] = useState<CityDetail | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [statesLoaded, setStatesLoaded] = useState(false);

  const [currentCountryId, setCurrentCountryId] = useState<string>("");
  const [currentStateId, setCurrentStateId] = useState<string>("");

  const [editStates, setEditStates] = useState<State[]>([]);
  const [editDistricts, setEditDistricts] = useState<District[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { exportToPdf } = useExportPdf();
  const { exportToExcel } = useExportExcel();


  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: "success" | "error" }>({
    isVisible: false,
    message: "",
    type: "success"
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: "", type: "success" }), 3000);
  }, []);

  const columns: ColumnDef<CityRow>[] = useMemo(() => [
    {
      accessorKey: "city_name",
      header: "City Name",
      cell: ({ row }) => <span className="font-medium text-black">{row.original.city_name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "district_name",
      header: "District",
      cell: ({ row }) => <span className="text-black">{row.original.district_name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "state_name",
      header: "State",
      cell: ({ row }) => <span className="text-black">{row.original.state_name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "country_name",
      header: "Country",
      cell: ({ row }) => <span className="text-black">{row.original.country_name}</span>,
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEdit(row.original)}
            className="px-3 py-1 rounded-md text-sm"
            style={{ backgroundColor: "#E7EDFD", color: "#000" }}
          >
            Edit
          </button>
          <AlertPopover
            trigger={
              <button className="px-3 py-1 rounded-md text-sm" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>
                Delete
              </button>
            }
            title="Are you sure you want to delete this city?"
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
    },
  ], []);

  const extractData = useCallback((response: any, paths: string[]): any[] => {
    for (const path of paths) {
      if (path === "root" && Array.isArray(response)) return response;
      const keys = path.split('.');
      let data = response;
      for (const key of keys) {
        if (data?.[key]) data = data[key];
        else break;
      }
      if (Array.isArray(data)) return data;
    }
    return [];
  }, []);

  const extractCityData = useCallback((response: any): CityRow[] => 
    extractData(response, ["data.data", "data", "data.result", "root"]), [extractData]);

  const extractCountryData = useCallback((response: any): Country[] => 
    extractData(response, ["data", "data.data", "root"]), [extractData]);

  const extractStateData = useCallback((response: any): State[] => 
    extractData(response, ["data", "data.data", "root"]), [extractData]);

  const extractDistrictData = useCallback((response: any): District[] => 
    extractData(response, ["data", "data.data", "root"]), [extractData]);

  const extractCityDetail = useCallback((response: any): CityDetail | null => 
    response?.data?.data || response?.data || response || null, []);

  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const response: any = await api.get("/states/getcountry");
      const countriesData = extractCountryData(response);
      setCountries(countriesData);
      setCountriesLoaded(true);
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsCountriesLoading(false);
    }
  }, [extractCountryData]);

  const fetchAllStates = useCallback(async () => {
    try {
      setIsStatesLoading(true);
      const response: any = await api.get("/states");
      const statesData = extractStateData(response);
      setStates(statesData);
      setStatesLoaded(true);
    } catch (error) {
      console.error("Error fetching all states:", error);
    } finally {
      setIsStatesLoading(false);
    }
  }, [extractStateData]);

  const fetchStatesByCountry = useCallback(async (countryId: string) => {
    if (!countryId) return [];
    try {
      setIsStatesLoading(true);
      const response: any = await api.get(`/states/country/${countryId}`);
      return extractStateData(response);
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    } finally {
      setIsStatesLoading(false);
    }
  }, [extractStateData]);

  const fetchDistrictsByState = useCallback(async (stateId: string) => {
    if (!stateId) return [];
    try {
      setIsDistrictsLoading(true);
      const response: any = await api.get(`/districts/state/${stateId}`);
      return extractDistrictData(response);
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    } finally {
      setIsDistrictsLoading(false);
    }
  }, [extractDistrictData]);

  const fetchCityDetail = useCallback(async (cityId: number) => {
    try {
      setDetailLoading(true);
      const response: any = await api.get(`/cities/${cityId}`);
      const cityDetailData = extractCityDetail(response);
      setCityDetail(cityDetailData);
      return cityDetailData;
    } catch (error) {
      console.error("Error fetching city detail:", error);
      showToast("Error fetching city details. Please try again.", "error");
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, [extractCityDetail, showToast]);

  const fetchCities = useCallback(async (pageIndex: number, pageSize: number, searchTerm: string = ""): Promise<CityRow[]> => {
    try {
      setLoading(true);
      setError(null);

      let url = `/cities?page=${pageIndex + 1}&limit=${pageSize}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response: any = await api.get(url);
      const cityData = extractCityData(response);
      setCities(cityData);

      const totalRecords = response?.data?.totalRecords || response?.totalRecords ||
                          response?.data?.total || response?.total || cityData.length;
      setTotalCount(totalRecords);

      return cityData;
    } catch (error) {
      console.error("Error fetching cities:", error);
      setError("Failed to fetch cities");
      setCities([]);
      setTotalCount(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, [extractCityData]);


  const handleSearch = useCallback(async (query: string): Promise<Record<string, any>[]> => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));

    const pageSize = pagination.pageSize ?? 10;
    const result = await fetchCities(0, pageSize, query);

    return result as unknown as Record<string, any>[];
  }, [fetchCities, pagination.pageSize]);



  useEffect(() => {
      fetchCities(pagination.pageIndex, pagination.pageSize, searchQuery);
    }, [fetchCities, pagination.pageIndex, pagination.pageSize, searchQuery]);

    const handleCountryDropdownClick = useCallback(async () => {
      if (!isCountriesLoading && !countriesLoaded) await fetchCountries();
    }, [isCountriesLoading, countriesLoaded, fetchCountries]);

    const handleStateDropdownClick = useCallback(async () => {
      if (!isStatesLoading && !statesLoaded) await fetchAllStates();
    }, [isStatesLoading, statesLoaded, fetchAllStates]);

    const handleDistrictDropdownClick = useCallback(async () => {
      if (!currentStateId || isDistrictsLoading) return;
      const districtsData = await fetchDistrictsByState(currentStateId);
      setFilteredDistricts(districtsData);
    }, [currentStateId, isDistrictsLoading, fetchDistrictsByState]);

    /* ============================================
       PDF EXPORT CONFIG
    ============================================ */
    const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
      filename: `cities-master-report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.pdf`,

      title: "Cities Master Report",
      orientation: "landscape",
      pageSize: "a4",

      columns: [
        { header: "City Name", accessorKey: "city_name" },
        { header: "District", accessorKey: "district_name" },
        { header: "State", accessorKey: "state_name" },
        { header: "Country", accessorKey: "country_name" },
        {
          header: "Status",
          accessorKey: "status",
          formatter: (value) => (value === "Active" ? "Active" : "Inactive"),
        },
      ],

      data: cities,

      showSerialNumber: true,
      serialNumberHeader: "S.NO.",
      projectName: "E-Police",
      exportDate: true,
      showTotalCount: true,
      searchQuery: searchQuery || "All cities",
      userRole: "admin",
    }), [cities, searchQuery]);

    /* ============================================
       EXCEL EXPORT CONFIG
    ============================================ */
    const excelExportConfig: ExportExcelOptions = useMemo(() => ({
      filename: `cities-master-report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.xlsx`,

      sheetName: "Cities",
      title: "Cities Master Report",

      columns: [
        { header: "City Name", accessorKey: "city_name" },
        { header: "District", accessorKey: "district_name" },
        { header: "State", accessorKey: "state_name" },
        { header: "Country", accessorKey: "country_name" },
        {
          header: "Status",
          accessorKey: "status",
          formatter: (value) => (value === "Active" ? "Active" : "Inactive"),
        },
      ],

      data: cities,

      showSerialNumber: true,
      serialNumberHeader: "S.NO.",
      projectName: "E-Police",
      exportDate: true,
      showTotalCount: true,
      searchQuery: searchQuery || "All cities",
      userRole: "admin",
    }), [cities, searchQuery]);


  const fieldClassName = "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  const cityFields = useMemo((): FieldConfig[] => [
    {
      name: 'country_id',
      label: 'Country name :',
      type: 'select',
      required: true,
      options: countries.map(country => ({ value: country.id.toString(), label: country.country_name })),
      placeholder: isCountriesLoading ? "Loading countries..." : "Select Country",
      customProps: {
        onMouseDown: handleCountryDropdownClick,
        onFocus: handleCountryDropdownClick,
        onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
          const countryId = e.target.value;
          setCurrentCountryId(countryId);
          setFilteredStates([]);
          setFilteredDistricts([]);
          if (countryId) {
            const statesData = await fetchStatesByCountry(countryId);
            setFilteredStates(statesData);
          }
        },
        className: fieldClassName
      }
    },
    {
      name: 'state_id',
      label: 'State name :',
      type: 'select',
      required: true,
      options: filteredStates.map(state => ({ value: state.id.toString(), label: state.state_name_en || state.state_name })),
      placeholder: isStatesLoading ? "Loading states..." : "Select State",
      customProps: {
        onMouseDown: handleStateDropdownClick,
        onFocus: handleStateDropdownClick,
        onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
          const stateId = e.target.value;
          setCurrentStateId(stateId);
          setFilteredDistricts([]);
          if (stateId) {
            const districtsData = await fetchDistrictsByState(stateId);
            setFilteredDistricts(districtsData);
          }
        },
        className: fieldClassName
      }
    },
    {
      name: 'district_id',
      label: 'District name :',
      type: 'select',
      required: true,
      options: filteredDistricts.map((district) => ({ value: district.id.toString(), label: district.district_name })),
      placeholder: isDistrictsLoading ? "Loading districts..." : (currentStateId ? "Select District" : "Please select state first"),
      customProps: {
        onMouseDown: handleDistrictDropdownClick,
        onFocus: handleDistrictDropdownClick,
        className: fieldClassName
      }
    },
    {
      name: 'city_name_marathi',
      label: 'City name (Marathi) :',
      type: 'text',
      placeholder: 'Enter city name in Marathi',
      required: true,
      customProps: { className: fieldClassName }
    },
    {
      name: 'city_name',
      label: 'City :',
      type: 'text',
      placeholder: 'Enter city name',
      required: true,
      customProps: { className: fieldClassName }
    },
    {
      name: 'city_name_hindi',
      label: 'City name (Hindi) :',
      type: 'text',
      placeholder: 'Enter city name in Hindi',
      required: true,
      customProps: { className: fieldClassName }
    }
  ], [countries, filteredStates, filteredDistricts, isCountriesLoading, isStatesLoading, isDistrictsLoading, currentStateId, handleCountryDropdownClick, handleStateDropdownClick, handleDistrictDropdownClick, fetchStatesByCountry, fetchDistrictsByState, fieldClassName]);

  const editModalFields = useMemo<FieldConfig[]>(() => {
    if (!cityDetail) return [];
    return [
        {
            type: "select",
            name: "country_id",
            label: "Country Name",
            options: countries.map((country) => ({
                value: country.id.toString(),
                label: country.country_name,
            })),
            required: true,
            defaultValue: cityDetail.country_id?.toString() || "",
            customProps: {
                className: fieldClassName,
                onMouseDown: async () => {
                    const res = await api.get("/states/getcountry");
                    const data = extractCountryData(res);
                    setCountries(data);
                },
                onChange: async (e) => {
                    const countryId = e.target.value;
                    if (countryId) {
                        const statesData = await fetchStatesByCountry(countryId);
                        setEditStates(statesData);
                        setEditDistricts([]);
                    }
                },
            },
        },
        {
            type: "select",
            name: "state_id",
            label: "State Name",
            options: editStates.map((state) => ({
                value: state.id.toString(),
                label: state.state_name_en || state.state_name,
            })),
            required: true,
            defaultValue: cityDetail.state_id?.toString() || "",
            customProps: {
                className: fieldClassName,
                onMouseDown: async (e) => {
                    const form = (e.target as HTMLSelectElement).form;
                    const selectedCountryId =
                        form?.country_id?.value || cityDetail.country_id?.toString();
                    if (selectedCountryId) {
                        const statesData = await fetchStatesByCountry(selectedCountryId);
                        setEditStates(statesData);
                    }
                },
                onChange: async (e) => {
                    const stateId = e.target.value;
                    if (stateId) {
                        const districtsData = await fetchDistrictsByState(stateId);
                        setEditDistricts(districtsData);
                    }
                },
            },
        },
        {
            type: "select",
            name: "district_id",
            label: "District Name",
            options: editDistricts.map((district) => ({
                value: district.id.toString(),
                label: district.district_name,
            })),
            required: true,
            defaultValue: cityDetail.district_id?.toString() || "",
            customProps: {
                className: fieldClassName,
                onMouseDown: async (e) => {
                    const form = (e.target as HTMLSelectElement).form;
                    const selectedStateId =
                        form?.state_id?.value || cityDetail.state_id?.toString();
                    if (selectedStateId) {
                        const districtsData = await fetchDistrictsByState(selectedStateId);
                        setEditDistricts(districtsData);
                    }
                },
            },
        },
        {
            type: "text",
            name: "city_name",
            label: "City Name (English)",
            required: true,
            defaultValue: cityDetail.city_name,
            customProps: { className: fieldClassName },
        },
        {
            type: "text",
            name: "city_name_marathi",
            label: "City Name (Marathi)",
            required: true,
            defaultValue: cityDetail.city_name_marathi,
            customProps: { className: fieldClassName },
        },
        {
            type: "text",
            name: "city_name_hindi",
            label: "City Name (Hindi)",
            required: true,
            defaultValue: cityDetail.city_name_hindi,
            customProps: { className: fieldClassName },
        },
    ];
}, [
    cityDetail,
    countries,
    editStates,
    editDistricts,
    extractCountryData,
    fetchStatesByCountry,
    fetchDistrictsByState,
    fieldClassName,
]);



  const handleAddCity = useCallback(async (formData: Record<string, string>) => {
    try {
      if (!formData.country_id || !formData.state_id || !formData.district_id) {
        showToast("Please select country, state, and district", "error");
        return;
      }

      const payload = {
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_name: formData.city_name,
        city_name_marathi: formData.city_name_marathi,
        city_name_hindi: formData.city_name_hindi,
      };

      await api.post("/cities", payload);
      fetchCities(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("City added successfully!", "success");
    } catch (error) {
      console.error("Error adding city:", error);
      showToast("Error adding city. Please try again.", "error");
    }
  }, [fetchCities, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleEdit = useCallback(
    async (city: CityRow) => {
      if (!city) return;

      try {
        const detail = await fetchCityDetail(city.id);
        if (!detail) {
          showToast("Failed to load city details", "error");
          return;
        }

        setEditingCity(city);
        setCityDetail(detail);

        setCountries([
          {
            id: detail.country_id,
            country_name: city.country_name || "Selected Country",
          },
        ]);

        setEditStates([
          {
            id: detail.state_id,
            state_name: city.state_name || "Selected State",
            state_name_en: city.state_name || "Selected State",
            country_id: detail.country_id,
          },
        ]);

        setEditDistricts([
          {
            id: detail.district_id,
            district_name: city.district_name || "Selected District",
            state_id: detail.state_id,
          },
        ]);

        setIsEditModalOpen(true);
      } catch (error) {
        console.error("Error in edit preparation:", error);
        showToast("Error preparing edit form. Please try again.", "error");
      }
    },
    [fetchCityDetail, showToast]
  );

  const handleUpdateCity = useCallback(async (formData: any) => {
    if (!editingCity) return;
    try {
      setSaveLoading(true);
      const payload = {
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_name: formData.city_name,
        city_name_marathi: formData.city_name_marathi,
        city_name_hindi: formData.city_name_hindi,
        status: formData.status
      };

      await api.put(`/cities/${editingCity.id}`, payload);
      fetchCities(pagination.pageIndex, pagination.pageSize, searchQuery);
      setIsEditModalOpen(false);
      setEditingCity(null);
      setCityDetail(null);
      setEditStates([]);
      setEditDistricts([]);
      showToast("City updated successfully!", "success");
    } catch (error) {
      console.error("Error updating city:", error);
      showToast("Error updating city. Please try again.", "error");
    } finally {
      setSaveLoading(false);
    }
  }, [editingCity, fetchCities, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    try {
      await api.delete(`/cities/${id}`);
      await fetchCities(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("City deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting city:", error);
      showToast("Error deleting city. Please try again.", "error");
      throw error;
    }
  }, [fetchCities, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingCity(null);
    setCityDetail(null);
    setEditStates([]);
    setEditDistricts([]);
  }, []);

  const { tableElement, table } = CustomTable<CityRow>({
    data: cities,
    columns,
    pagination,
    totalCount,
    loading,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    sorting,
    emptyMessage: "No cities available",
    pageSizeOptions: [10, 20, 30, 50],
    enableSorting: true,
    manualSorting: false,
    manualPagination: true,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    maxHeight: "500px",
    headerBgColor: "#E7EDFD",
    headerTextColor: "#000000",
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <AddSection 
        title="Add City"
        fields={cityFields}
        onSubmit={handleAddCity}
        submitButtonText="Add"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButtons 
              pdfConfig={pdfExportConfig}
              excelConfig={excelExportConfig}
            />
            <ColumnVisibilitySelector columns={table.getAllColumns()} backgroundColor="#EACEFF" textColor="#000000" />
          </div>
          <div className="w-full max-w-xs">
            <SearchComponent placeholder="Search cities..." debounceDelay={400} onSearch={handleSearch} serverSideSearch={true} />
          </div>
        </div>
        {tableElement}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSubmit={handleUpdateCity}
        title={`Edit City - ID: ${editingCity?.id || ''}`}
        fields={editModalFields}
        isLoading={saveLoading || detailLoading}
        submitButtonText={saveLoading ? "Saving..." : "Save Changes"}
        loadingMessage={detailLoading ? "Loading city details..." : undefined}
      />
    </div>
  );
}