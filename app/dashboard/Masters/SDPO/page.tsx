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

interface SDPORow {
  id: number;
  district_id: number;
  city_id?: number;
  district_name?: string;
  city_name?: string;
  name: string;
  status?: string;
  country_id?: number;
  state_id?: number;
  country_name?: string;
  state_name?: string;
}

interface Country {
  id: number;
  country_name: string;
}

interface State {
  id: number;
  state_name: string;
  state_name_en?: string;
  country_id: number;
}

interface District {
  id: number;
  district_name: string;
  state_id: number;
}

interface City {
  id: number;
  city_name: string;
  district_id: number;
}

export default function SDPOPage() {
  const [sdpos, setSdpos] = useState<SDPORow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSdpo, setEditingSdpo] = useState<SDPORow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editFormData, setEditFormData] = useState<any>(null);
  const [addStates, setAddStates] = useState<State[]>([]);
  const [addDistricts, setAddDistricts] = useState<District[]>([]);
  const [addCities, setAddCities] = useState<City[]>([]);

  // Loading states for add section
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [statesLoaded, setStatesLoaded] = useState(false);

  // Current IDs for add section
  const [currentCountryId, setCurrentCountryId] = useState<string>("");
  const [currentStateId, setCurrentStateId] = useState<string>("");
  const [currentDistrictId, setCurrentDistrictId] = useState<string>("");

  // Edit modal states
  const [editStates, setEditStates] = useState<State[]>([]);
  const [editDistricts, setEditDistricts] = useState<District[]>([]);
  const [editCities, setEditCities] = useState<City[]>([]);

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
  const { exportToPdf } = useExportPdf();

  // -----------------------------
  // Helper Functions
  // -----------------------------
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: "", type: "success" }), 3000);
  }, []);

  const extractData = useCallback((response: any, paths: string[]): any => {
    for (const path of paths) {
      const value = path.split('.').reduce((obj, key) => obj?.[key], response);
      if (value) return value;
    }
    return Array.isArray(response) ? response : [];
  }, []);

  // ============================================
  // TABLE COLUMNS DEFINITION
  // ============================================
  const columns: ColumnDef<SDPORow>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "SDPO Name",
      cell: ({ row }) => <span className="font-medium text-black">{row.original.name}</span>,
    },
    {
      accessorKey: "district_name",
      header: "District",
      cell: ({ row }) => <span className="text-black">{row.original.district_name || "N/A"}</span>,
    },
    {
      accessorKey: "city_name",
      header: "City",
      cell: ({ row }) => <span className="text-black">{row.original.city_name || "N/A"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEdit(row.original.id)}
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
            title="Are you sure you want to delete this SDPO?"
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
    },
  ], []);

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const response = await api.get("/states/getcountry");
      const countriesData = extractData(response, ['data.data', 'data', '']);
      setCountries(countriesData);
      setCountriesLoaded(true);
      return countriesData;
    } catch (error) {
      console.error("Error fetching countries:", error);
      showToast("Failed to fetch countries", "error");
      return [];
    } finally {
      setIsCountriesLoading(false);
    }
  }, [extractData, showToast]);

  const fetchStatesByCountry = useCallback(async (countryId: string) => {
    if (!countryId) return [];
    try {
      setIsStatesLoading(true);
      const response = await api.get(`/states/country/${countryId}`);
      return extractData(response, ['data.data', 'data', '']);
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    } finally {
      setIsStatesLoading(false);
    }
  }, [extractData]);

  const fetchDistrictsByState = useCallback(async (stateId: string) => {
    if (!stateId) return [];
    try {
      setIsDistrictsLoading(true);
      const response = await api.get(`/districts/state/${stateId}`);
      return extractData(response, ['data.data', 'data', '']);
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    } finally {
      setIsDistrictsLoading(false);
    }
  }, [extractData]);

  const fetchCitiesByDistrict = useCallback(async (districtId: string) => {
    if (!districtId) return [];
    try {
      setIsCitiesLoading(true);
      const response = await api.get(`/cities/district/${districtId}`);
      return extractData(response, ['data.data', 'data', '']);
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    } finally {
      setIsCitiesLoading(false);
    }
  }, [extractData]);

  const fetchSingleSDPO = useCallback(async (id: number): Promise<SDPORow | null> => {
    try {
      const response = await api.get(`/sdpo/${id}`);
      return extractData(response, ['data.data', 'data', '']);
    } catch (error) {
      console.error("Error fetching single SDPO:", error);
      showToast("Failed to fetch SDPO details", "error");
      return null;
    }
  }, [extractData, showToast]);

  // ============================================
  // MAIN DATA FETCHING
  // ============================================
  const fetchSDPOs = useCallback(async (pageIndex: number, pageSize: number, searchTerm: string = "") => {
    try {
      setLoading(true);
      
      let url = `/sdpo?page=${pageIndex + 1}&limit=${pageSize}`;
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await api.get(url);
      const sdpoData = extractData(response, ['data.data', 'data', '']);
      
      const basicSdpoData = sdpoData.map((sdpo: SDPORow) => ({
        ...sdpo,
        district_name: sdpo.district_name || `District ${sdpo.district_id}`,
        city_name: sdpo.city_name || (sdpo.city_id ? `City ${sdpo.city_id}` : "N/A")
      }));

      setSdpos(basicSdpoData);
      
      // Extract total count
      const totalRecords = response?.data?.totalRecords || response?.totalRecords || 
                          response?.data?.total || response?.total || 
                          response?.data?.count || basicSdpoData.length;
      setTotalCount(totalRecords);
      
    } catch (error) {
      console.error("Error fetching SDPOs:", error);
      showToast("Failed to fetch SDPOs", "error");
      setSdpos([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [extractData, showToast]);

  useEffect(() => {
    fetchSDPOs(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [fetchSDPOs, pagination.pageIndex, pagination.pageSize, searchQuery]);

  const pdfExportConfig: ExportPdfOptions = useMemo(() => ({
    filename: `sdpo-master-report-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`,

    title: "SDPO Master Report",
    orientation: "landscape",
    pageSize: "a4",

    columns: [
      { header: "SDPO Name", accessorKey: "name" },
      { header: "District", accessorKey: "district_name" },
      { header: "City", accessorKey: "city_name" },
      {
        header: "Status",
        accessorKey: "status",
        formatter: (value) => (value === "Active" ? "Active" : "Inactive"),
      },
    ],

    data: sdpos,

    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All SDPOs",
    userRole: "admin",
  }), [sdpos, searchQuery]);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // ADD SECTION DROPDOWN HANDLERS
  const handleCountryDropdownClick = useCallback(async () => {
    if (!isCountriesLoading && !countriesLoaded) await fetchCountries();
  }, [isCountriesLoading, countriesLoaded, fetchCountries]);

  const handleStateDropdownClick = useCallback(async () => {
    if (!currentCountryId || isStatesLoading) return;
    const statesData = await fetchStatesByCountry(currentCountryId);
    setAddStates(statesData);
  }, [currentCountryId, isStatesLoading, fetchStatesByCountry]);

  const handleDistrictDropdownClick = useCallback(async () => {
    if (!currentStateId || isDistrictsLoading) return;
    const districtsData = await fetchDistrictsByState(currentStateId);
    setAddDistricts(districtsData);
  }, [currentStateId, isDistrictsLoading, fetchDistrictsByState]);

  const handleCityDropdownClick = useCallback(async () => {
    if (!currentDistrictId || isCitiesLoading) return;
    const citiesData = await fetchCitiesByDistrict(currentDistrictId);
    setAddCities(citiesData);
  }, [currentDistrictId, isCitiesLoading, fetchCitiesByDistrict]);

  // EDIT MODAL HANDLERS
  const handleEditCountryClick = async () => {
    const countriesData = await fetchCountries();
    setCountries(countriesData);
  };

  const handleEditStateClick = async (countryId: string) => {
    if (!countryId) return;
    const states = await fetchStatesByCountry(countryId);
    setEditStates(states);
    setEditDistricts([]);
    setEditCities([]);
  };

  const handleEditDistrictClick = async (stateId: string) => {
    if (!stateId) return;
    const districts = await fetchDistrictsByState(stateId);
    setEditDistricts(districts);
    setEditCities([]);
  };

  const handleEditCityClick = async (districtId: string) => {
    if (!districtId) return;
    const cities = await fetchCitiesByDistrict(districtId);
    setEditCities(cities);
  };

  // ============================================
  // FIELD CONFIGURATIONS
  // ============================================
  const sdpoFields = useMemo((): FieldConfig[] => {
    const fieldClassName = "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

    return [
      {
        name: 'country_id',
        label: 'Country name :',
        type: 'select',
        required: true,
        options: countries.map(country => ({ 
          value: country.id.toString(), 
          label: country.country_name 
        })),
        placeholder: isCountriesLoading ? "Loading countries..." : "Select Country",
        customProps: {
          onMouseDown: handleCountryDropdownClick,
          onFocus: handleCountryDropdownClick,
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const countryId = e.target.value;
            setCurrentCountryId(countryId);
            setAddStates([]);
            setAddDistricts([]);
            setAddCities([]);
            if (countryId) {
              const statesData = await fetchStatesByCountry(countryId);
              setAddStates(statesData);
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
        options: addStates.map(state => ({ 
          value: state.id.toString(), 
          label: state.state_name_en || state.state_name 
        })),
        placeholder: isStatesLoading ? "Loading states..." : "Select State",
        customProps: {
          onMouseDown: handleStateDropdownClick,
          onFocus: handleStateDropdownClick,
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const stateId = e.target.value;
            setCurrentStateId(stateId);
            setAddDistricts([]);
            setAddCities([]);
            if (stateId) {
              const districtsData = await fetchDistrictsByState(stateId);
              setAddDistricts(districtsData);
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
        options: addDistricts.map(district => ({ 
          value: district.id.toString(), 
          label: district.district_name 
        })),
        placeholder: isDistrictsLoading ? "Loading districts..." : 
                   (currentStateId ? "Select District" : "Please select state first"),
        customProps: {
          onMouseDown: handleDistrictDropdownClick,
          onFocus: handleDistrictDropdownClick,
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const districtId = e.target.value;
            setCurrentDistrictId(districtId);
            setAddCities([]);
            if (districtId) {
              const citiesData = await fetchCitiesByDistrict(districtId);
              setAddCities(citiesData);
            }
          },
          className: fieldClassName
        }
      },
      {
        name: 'city_id',
        label: 'City name :',
        type: 'select',
        required: true,
        options: addCities.map(city => ({ 
          value: city.id.toString(), 
          label: city.city_name 
        })),
        placeholder: isCitiesLoading ? "Loading cities..." : 
                   (currentDistrictId ? "Select City" : "Please select district first"),
        customProps: {
          onMouseDown: handleCityDropdownClick,
          onFocus: handleCityDropdownClick,
          className: fieldClassName
        }
      },
      {
        name: 'name',
        label: 'SDPO Name :',
        type: 'text',
        placeholder: 'Enter SDPO name',
        required: true,
        customProps: {
          className: fieldClassName
        }
      },
    ];
  }, [
    countries, 
    addStates, 
    addDistricts, 
    addCities, 
    isCountriesLoading, 
    isStatesLoading, 
    isDistrictsLoading, 
    isCitiesLoading, 
    currentStateId, 
    currentDistrictId,
    handleCountryDropdownClick,
    handleStateDropdownClick,
    handleDistrictDropdownClick,
    handleCityDropdownClick,
    fetchStatesByCountry,
    fetchDistrictsByState,
    fetchCitiesByDistrict
  ]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const handleAddSDPO = useCallback(async (formData: Record<string, string>) => {
    try {
      if (!formData.country_id || !formData.state_id || !formData.district_id || !formData.city_id) {
        showToast("Please select country, state, district, and city", "error");
        return;
      }

      const payload = {
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        name: formData.name
      };

      await api.post("/sdpo", payload);
      fetchSDPOs(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("SDPO added successfully!", "success");
      
      // Reset form state
      setCurrentCountryId("");
      setCurrentStateId("");
      setCurrentDistrictId("");
      setAddStates([]);
      setAddDistricts([]);
      setAddCities([]);
    } catch (error) {
      console.error("Error adding SDPO:", error);
      showToast("Error adding SDPO. Please try again.", "error");
    }
  }, [fetchSDPOs, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleEdit = useCallback(async (id: number) => {
    try {
      // Fetch the single SDPO record
      const sdpoData = await fetchSingleSDPO(id);
      if (!sdpoData) {
        showToast("Failed to fetch SDPO details", "error");
        return;
      }

      setEditingSdpo(sdpoData);
      
      // Set form data with values from the single SDPO API response
      const formData = {
        name: sdpoData.name || "",
        status: sdpoData.status || "Active",
        country_id: sdpoData.country_id?.toString() || "",
        state_id: sdpoData.state_id?.toString() || "",
        district_id: sdpoData.district_id?.toString() || "",
        city_id: sdpoData.city_id?.toString() || ""
      };
      
      setEditFormData(formData);

      // Create single option arrays for each dropdown using the data from the SDPO response
      if (sdpoData.country_id && sdpoData.country_name) {
        setCountries([{ id: sdpoData.country_id, country_name: sdpoData.country_name }]);
      }
      
      if (sdpoData.state_id && sdpoData.state_name) {
        setEditStates([{ 
          id: sdpoData.state_id, 
          state_name: sdpoData.state_name,
          state_name_en: sdpoData.state_name,
          country_id: sdpoData.country_id || 0 
        }]);
      }
      
      if (sdpoData.district_id && sdpoData.district_name) {
        setEditDistricts([{ 
          id: sdpoData.district_id, 
          district_name: sdpoData.district_name,
          state_id: sdpoData.state_id || 0 
        }]);
      }
      
      if (sdpoData.city_id && sdpoData.city_name) {
        setEditCities([{ 
          id: sdpoData.city_id, 
          city_name: sdpoData.city_name,
          district_id: sdpoData.district_id || 0 
        }]);
      }

      console.log("✅ Edit modal ready - using data from single SDPO API only");
      setIsEditModalOpen(true);

    } catch (error) {
      console.error("Error in handleEdit:", error);
      showToast("Failed to load edit form", "error");
    }
  }, [fetchSingleSDPO, showToast]);

  const handleUpdateSDPO = useCallback(async (formData: any) => {
    if (!editingSdpo) return;

    try {
      const payload = {
        name: formData.name,
        status: formData.status,
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id)
      };

      await api.put(`/sdpo/${editingSdpo.id}`, payload);
      fetchSDPOs(pagination.pageIndex, pagination.pageSize, searchQuery);
      setIsEditModalOpen(false);
      setEditingSdpo(null);
      setEditFormData(null);
      showToast("SDPO updated successfully!", "success");
    } catch (error) {
      console.error("Error updating SDPO:", error);
      showToast("Error updating SDPO. Please try again.", "error");
    }
  }, [editingSdpo, fetchSDPOs, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    try {
      await api.delete(`/sdpo/${id}`);
      await fetchSDPOs(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("SDPO deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting SDPO:", error);
      showToast("Error deleting SDPO. Please try again.", "error");
      throw error;
    }
  }, [fetchSDPOs, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleEditFieldChange = useCallback(async (fieldName: string, value: string, formData: any) => {
    const updatedData = { ...formData, [fieldName]: value };
    setEditFormData(updatedData);

    // Handle dependent dropdown data fetching when user wants to change values
    if (fieldName === 'country_id' && value) {
      // Clear dependent dropdowns
      setEditStates([]);
      setEditDistricts([]);
      setEditCities([]);
      // Fetch states for the selected country
      await handleEditStateClick(value);
    } else if (fieldName === 'state_id' && value) {
      // Clear dependent dropdowns
      setEditDistricts([]);
      setEditCities([]);
      // Fetch districts for the selected state
      await handleEditDistrictClick(value);
    } else if (fieldName === 'district_id' && value) {
      // Clear dependent dropdowns
      setEditCities([]);
      // Fetch cities for the selected district
      await handleEditCityClick(value);
    }

    return updatedData;
  }, [handleEditStateClick, handleEditDistrictClick, handleEditCityClick]);

  // ============================================
  // EDIT MODAL FIELDS CONFIGURATION
  // ============================================
  const editModalFields = useMemo(() => {
    if (!editingSdpo) return [];
    
    const fieldClassName = "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

    return [
      {
        type: "select" as const,
        name: "country_id",
        label: "Country",
        options: countries.map(country => ({
          value: country.id.toString(),
          label: country.country_name
        })),
        required: true,
        defaultValue: editFormData?.country_id || "",
        customProps: {
          onMouseDown: () => handleEditCountryClick(),
          onFocus: () => handleEditCountryClick(),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const countryId = e.target.value;
            if (countryId) {
              const statesData = await fetchStatesByCountry(countryId);
              setEditStates(statesData);
              setEditDistricts([]);
              setEditCities([]);
            }
          },
          className: fieldClassName
        }
      },
      {
        type: "select" as const,
        name: "state_id",
        label: "State",
        options: editStates.map(state => ({
          value: state.id.toString(),
          label: state.state_name_en || state.state_name
        })),
        required: true,
        defaultValue: editFormData?.state_id || "",
        placeholder: editStates.length === 0 ? "Select country first" : "Select state",
        customProps: {
          onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
            const form = (e.target as HTMLSelectElement).form;
            const selectedCountryId = form?.country_id?.value || editFormData?.country_id;
            
            if (selectedCountryId) {
              const statesData = await fetchStatesByCountry(selectedCountryId);
              setEditStates(statesData);
            }
          },
          onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
            const form = (e.target as HTMLSelectElement).form;
            const selectedCountryId = form?.country_id?.value || editFormData?.country_id;
            
            if (selectedCountryId) {
              const statesData = await fetchStatesByCountry(selectedCountryId);
              setEditStates(statesData);
            }
          },
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const stateId = e.target.value;
            if (stateId) {
              const districtsData = await fetchDistrictsByState(stateId);
              setEditDistricts(districtsData);
              setEditCities([]);
            }
          },
          className: fieldClassName
        }
      },
      {
        type: "select" as const,
        name: "district_id",
        label: "District",
        options: editDistricts.map(district => ({
          value: district.id.toString(),
          label: district.district_name
        })),
        required: true,
        defaultValue: editFormData?.district_id || "",
        placeholder: editDistricts.length === 0 ? "Select state first" : "Select district",
        customProps: {
          onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
            const form = (e.target as HTMLSelectElement).form;
            const selectedStateId = form?.state_id?.value || editFormData?.state_id;
            
            if (selectedStateId) {
              const districtsData = await fetchDistrictsByState(selectedStateId);
              setEditDistricts(districtsData);
            }
          },
          onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
            const form = (e.target as HTMLSelectElement).form;
            const selectedStateId = form?.state_id?.value || editFormData?.state_id;
            
            if (selectedStateId) {
              const districtsData = await fetchDistrictsByState(selectedStateId);
              setEditDistricts(districtsData);
            }
          },
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const districtId = e.target.value;
            if (districtId) {
              const citiesData = await fetchCitiesByDistrict(districtId);
              setEditCities(citiesData);
            }
          },
          className: fieldClassName
        }
      },
      {
        type: "select" as const,
        name: "city_id",
        label: "City",
        options: editCities.map(city => ({
          value: city.id.toString(),
          label: city.city_name
        })),
        required: true,
        defaultValue: editFormData?.city_id || "",
        placeholder: editCities.length === 0 ? "Select district first" : "Select city",
        customProps: {
          onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
            const form = (e.target as HTMLSelectElement).form;
            const selectedDistrictId = form?.district_id?.value || editFormData?.district_id;
            
            if (selectedDistrictId) {
              const citiesData = await fetchCitiesByDistrict(selectedDistrictId);
              setEditCities(citiesData);
            }
          },
          onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
            const form = (e.target as HTMLSelectElement).form;
            const selectedDistrictId = form?.district_id?.value || editFormData?.district_id;
            
            if (selectedDistrictId) {
              const citiesData = await fetchCitiesByDistrict(selectedDistrictId);
              setEditCities(citiesData);
            }
          },
          className: fieldClassName
        }
      },
      {
        type: "text" as const,
        name: "name",
        label: "SDPO Name",
        required: true,
        defaultValue: editFormData?.name || "",
        customProps: {
          className: fieldClassName
        }
      },
      {
        type: "select" as const,
        name: "status",
        label: "Status",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
        defaultValue: editFormData?.status || "Active",
        customProps: {
          className: fieldClassName
        }
      },
    ];
  }, [
    editingSdpo, 
    countries, 
    editStates, 
    editDistricts, 
    editCities, 
    editFormData, 
    handleEditCountryClick,
    fetchStatesByCountry,
    fetchDistrictsByState,
    fetchCitiesByDistrict
  ]);

  const handleExportPdf = useCallback(() => {
  const result = exportToPdf(pdfExportConfig);
    if (result.success) showToast("PDF exported successfully!", "success");
    else showToast("Failed to export PDF", "error");
  }, [exportToPdf, pdfExportConfig, showToast]);


  const handleExportExcel = useCallback(() => {
    showToast("Excel export functionality - Coming soon!", "success");
  }, [showToast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ============================================
  // TABLE CONFIGURATION
  // ============================================
  const { tableElement, table } = CustomTable<SDPORow>({
    data: sdpos,
    columns,
    pagination,
    totalCount,
    loading,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    sorting,
    emptyMessage: "No SDPOs available",
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
      />

      <AddSection 
        title="Add SDPO"
        fields={sdpoFields}
        onSubmit={handleAddSDPO}
        submitButtonText="Add"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButtons
              pdfConfig={pdfExportConfig}
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
              placeholder="Search SDPOs..."
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
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSdpo(null);
          setEditFormData(null);
          // Reset hierarchy data when modal closes
          setEditStates([]);
          setEditDistricts([]);
          setEditCities([]);
        }}
        onSubmit={handleUpdateSDPO}
        title={`Edit SDPO ${editingSdpo ? `- ${editingSdpo.name}` : ''}`}
        fields={editModalFields}
        onFieldChange={handleEditFieldChange}
        initialData={editFormData}
      />
    </div>
  );
}