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
import PoliceStationView from "@/component/ui/PoliceStationView/PoliceStationView";


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
  status: string;
  sdpo_id?: number;
  sdpo_name?: string;
  address?: string;
  pincode?: string;
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

interface SDPO {
  id: number;
  name: string;
  district_id: number;
}

interface PoliceCategory {
  police_pc_id: number;
  pc_name: string;
}

interface EditFormData {
  country_id: string;
  state_id: string;
  district_id: string;
  city_id: string;
  sdpo_id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  pincode: string;
  category: string; 
  category_id: string; 
  status: string;
}

export default function PoliceStationPage() {
  // Main state
  const [policeStations, setPoliceStations] = useState<PoliceStationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoliceStation, setEditingPoliceStation] = useState<PoliceStationRow | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [policeCategories, setPoliceCategories] = useState<PoliceCategory[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPoliceStationId, setViewingPoliceStationId] = useState<number | null>(null);

  // Dropdown data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [filteredSdpos, setFilteredSdpos] = useState<SDPO[]>([]);

  // Loading states
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isSdposLoading, setIsSdposLoading] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [statesLoaded, setStatesLoaded] = useState(false);

  // Current selected IDs for cascading dropdowns
  const [currentCountryId, setCurrentCountryId] = useState<string>("");
  const [currentStateId, setCurrentStateId] = useState<string>("");
  const [currentDistrictId, setCurrentDistrictId] = useState<string>("");
  const [currentCityId, setCurrentCityId] = useState<string>("");
  const { exportToPdf } = useExportPdf();



  // Toast notification state
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: "success" | "error" }>({
    isVisible: false,
    message: "",
    type: "success"
  });

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Pagination & Sorting State - SERVER-SIDE (KEPT AS IS)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Edit form data
  const [editFormData, setEditFormData] = useState<EditFormData>({
    country_id: "",
    state_id: "",
    district_id: "",
    city_id: "",
    sdpo_id: "",
    name: "",
    email: "",
    mobile: "",
    address: "",
    pincode: "",
    category: "",
    category_id: "",
    status: "Active"
  });

  // -----------------------------
  // Toast Helper Function
  // -----------------------------
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast({ isVisible: false, message: "", type: "success" });
    }, 3000);
  }, []);

  const handleView = (rowData: PoliceStationRow) => {
    setViewingPoliceStationId(rowData.id);
    setIsViewModalOpen(true);
  };

  // ============================================
  // DATA EXTRACTION FUNCTIONS (KEPT AS IS)
  // ============================================
  const extractData = useCallback((response: any, keys: string[] = ['data', 'data', 'result']) => {
    console.log("🔍 Extracting data from:", response);
    
    for (const key of keys) {
      if (Array.isArray(response?.[key])) {
        console.log("✅ Found data in response." + key);
        return response[key];
      }
    }
    if (Array.isArray(response)) {
      console.log("✅ Found data in root response");
      return response;
    }
    
    console.log("❌ No data found in response");
    return [];
  }, []);

  const extractSinglePoliceStation = useCallback((response: any) => {
    console.log("🔍 Extracting single police station from:", response);
    const candidates = [
      response?.data?.data,
      response?.data?.result,
      response?.data,
      response
    ];

    const found = candidates.find((c) => {
      if (!c) return false;
      if (Array.isArray(c)) return c.length > 0;
      return true;
    });

    if (Array.isArray(found)) {
      console.log("✅ Found police station in array, taking first element");
      return found[0];
    }

    console.log("✅ Found police station object");
    return found || null;
  }, []);

  // ============================================
  // API FUNCTIONS (OPTIMIZED BUT FULL FUNCTIONALITY KEPT)
  // ============================================
  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const response = await api.get("/states/getcountry");
      const countriesData = extractData(response);
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

  const fetchPoliceCategories = useCallback(async () => {
    try {
      setIsCategoriesLoading(true);
      const response = await api.get("/police-categories");
      const categoriesData = extractData(response);
      setPoliceCategories(categoriesData);
      setCategoriesLoaded(true);
      return categoriesData;
    } catch (error) {
      console.error("Error fetching police categories:", error);
      showToast("Failed to fetch police categories", "error");
      return [];
    } finally {
      setIsCategoriesLoading(false);
    }
  }, [extractData, showToast]);

  const fetchAllStates = useCallback(async () => {
    try {
      setIsStatesLoading(true);
      const response = await api.get("/states");
      const statesData = extractData(response);
      setStates(statesData);
      setStatesLoaded(true);
      return statesData;
    } catch (error) {
      console.error("Error fetching all states:", error);
      return [];
    } finally {
      setIsStatesLoading(false);
    }
  }, [extractData]);

  const fetchStatesByCountry = useCallback(async (countryId: string) => {
    if (!countryId) {
      setFilteredStates([]);
      return [];
    }
    try {
      setIsStatesLoading(true);
      const response = await api.get(`/states/country/${countryId}`);
      const statesData = extractData(response);
      setFilteredStates(statesData);
      return statesData;
    } catch (error) {
      console.error("Error fetching states:", error);
      setFilteredStates([]);
      return [];
    } finally {
      setIsStatesLoading(false);
    }
  }, [extractData]);

  const fetchDistrictsByState = useCallback(async (stateId: string) => {
    if (!stateId) {
      setFilteredDistricts([]);
      return [];
    }
    try {
      setIsDistrictsLoading(true);
      const response = await api.get(`/districts/state/${stateId}`);
      const districtsData = extractData(response);
      setFilteredDistricts(districtsData);
      return districtsData;
    } catch (error) {
      console.error("Error fetching districts:", error);
      setFilteredDistricts([]);
      return [];
    } finally {
      setIsDistrictsLoading(false);
    }
  }, [extractData]);

  const fetchCitiesByDistrict = useCallback(async (districtId: string) => {
    if (!districtId) {
      setFilteredCities([]);
      return [];
    }
    try {
      setIsCitiesLoading(true);
      const response = await api.get(`/cities/district/${districtId}`);
      const citiesData = extractData(response);
      setFilteredCities(citiesData);
      return citiesData;
    } catch (error) {
      console.error("Error fetching cities:", error);
      setFilteredCities([]);
      return [];
    } finally {
      setIsCitiesLoading(false);
    }
  }, [extractData]);

  const fetchSDPOsByCity = useCallback(async (cityId: string) => {
    if (!cityId) {
      setFilteredSdpos([]);
      return [];
    }
    try {
      setIsSdposLoading(true);
      const response = await api.get(`/sdpo/city/${cityId}`);
      const sdpoData = extractData(response);
      setFilteredSdpos(sdpoData);
      return sdpoData;
    } catch (error) {
      console.error("Error fetching SDPOs by city:", error);
      setFilteredSdpos([]);
      return [];
    } finally {
      setIsSdposLoading(false);
    }
  }, [extractData]);

  // ============================================
  // MAIN DATA FETCHING - SERVER-SIDE PAGINATION & SEARCH (KEPT AS IS)
  // ============================================
  const fetchPoliceStations = useCallback(async (pageIndex: number, pageSize: number, searchTerm: string = "") => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching Police Stations - Page: ${pageIndex + 1}, Size: ${pageSize}, Search: ${searchTerm}`);
      
      let url = `/police-stations?page=${pageIndex + 1}&limit=${pageSize}`;
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      console.log("📡 API URL:", url);
      
      const response = await api.get<any>(url);
      
      console.log("🏁 Police Stations API full response:", response);
      
      const policeStationData = extractData(response);
      console.log("📊 Extracted police station data:", policeStationData);

      const basicPoliceStationData: PoliceStationRow[] = policeStationData.map((station: any) => ({
        ...station,
        state_name: station.state_name || `State ${station.state_id}`,
        district_name: station.district_name || `District ${station.district_id}`,
        city_name: station.city_name || (station.city_id ? `City ${station.city_id}` : "N/A")
      }));

      setPoliceStations(basicPoliceStationData);
      
      let totalRecords = 0;

      const possibleTotals = [
        response?.data?.totalRecords,
        response?.totalRecords,
        response?.data?.total,
        response?.total,
        response?.data?.count
      ];

      for (const val of possibleTotals) {
        if (typeof val === "number") {
          totalRecords = val;
          break;
        }
      }

      if (totalRecords === 0) {
        totalRecords = basicPoliceStationData.length;
      }

      
      setTotalCount(totalRecords);
      
      console.log("🎯 Final state - Police Stations:", basicPoliceStationData.length, "Total Count:", totalRecords);
      
    } catch (error) {
      console.error("❌ Error fetching police stations:", error);
      setError("Failed to fetch police stations");
      setPoliceStations([]);
      setTotalCount(0);
      showToast("Failed to fetch police stations", "error");
    } finally {
      setLoading(false);
    }
  }, [extractData, showToast]);

  // ============================================
  // DATA FETCH EFFECT - PAGINATION + SEARCH (KEPT AS IS)
  // ============================================
  useEffect(() => {
    fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [fetchPoliceStations, pagination.pageIndex, pagination.pageSize, searchQuery]);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      { header: "Category", accessorKey: "category" },
      {
        header: "Status",
        accessorKey: "status",
        formatter: (value) => (value === "Active" ? "Active" : "Inactive"),
      },
    ],
    data: policeStations,
    showSerialNumber: true,
    serialNumberHeader: "S.NO.",
    projectName: "E-Police",
    exportDate: true,
    showTotalCount: true,
    searchQuery: searchQuery || "All Police Stations",
    userRole: "admin",
  }), [policeStations, searchQuery]);

  // ============================================
  // SEARCH FUNCTIONALITY - SERVER-SIDE (KEPT AS IS)
  // ============================================
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // ============================================
  // LAZY LOADING HANDLERS (UPDATED)
  // ============================================
  const handleCountryDropdownClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!isCountriesLoading && !countriesLoaded) {
      await fetchCountries();
    }
  }, [isCountriesLoading, countriesLoaded, fetchCountries]);

  const handleStateDropdownClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!isStatesLoading && !statesLoaded) {
      await fetchAllStates();
    }
  }, [isStatesLoading, statesLoaded, fetchAllStates]);

  const handleCategoryDropdownClick = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!isCategoriesLoading && !categoriesLoaded) {
      await fetchPoliceCategories();
    }
  }, [isCategoriesLoading, categoriesLoaded, fetchPoliceCategories]);

  // ============================================
  // TABLE COLUMNS DEFINITION (UPDATED)
  // ============================================
  const columns: ColumnDef<PoliceStationRow>[] = useMemo(() => [
    {
      id: "serial_number",
      header: "S.NO.",
      cell: ({ row }) => <span className="text-black">{row.index + 1}</span>,
      enableSorting: false,
      enableHiding: false,
    },
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
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span className="text-black">{row.original.category || "N/A"}</span>,
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
  ], []);

  // ============================================
  // SHARED FIELD CONFIGURATION - USED FOR BOTH ADD & EDIT
  // ============================================
  const createFieldProps = (customProps: any = {}) => ({
    className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
    ...customProps
  });

  // Main field configuration function that can be used for both Add and Edit
  const getPoliceStationFields = useCallback((mode: 'add' | 'edit' = 'add'): FieldConfig[] => {
    const isEditMode = mode === 'edit';
    const currentFormData = isEditMode ? editFormData : null;

    const categoryOptions = policeCategories.map(category => ({
      value: category.police_pc_id.toString(),
      label: category.pc_name
    }));


    return [
      {
        name: 'name',
        label: 'Police Station Name :',
        type: 'text',
        placeholder: 'Enter police station name',
        required: true,
        defaultValue: isEditMode ? currentFormData?.name : undefined,
        customProps: createFieldProps()
      },
      {
        name: 'category',
        label: 'Category :',
        type: 'select' as const,

        required: false,
        options: categoryOptions,
        placeholder: isCategoriesLoading ? "Loading categories..." : "Select Category",
        defaultValue: isEditMode ? currentFormData?.category_id?.toString() : undefined,
        customProps: createFieldProps({
          // Only add event handlers on client side
          ...(isClient && {
            onMouseDown: handleCategoryDropdownClick,
            onFocus: handleCategoryDropdownClick
          })
        })
      },
      {
        name: 'country_id',
        label: 'Country :',
        type: 'select' as const,

        required: true,
        options: countries.map(country => ({
          value: country.id.toString(),
          label: country.country_name
        })),
        placeholder: isCountriesLoading ? "Loading countries..." : "Select Country",
        defaultValue: isEditMode ? currentFormData?.country_id : undefined,
        customProps: createFieldProps({
          // Only add event handlers on client side
          ...(isClient && {
            onMouseDown: handleCountryDropdownClick,
            onFocus: handleCountryDropdownClick,
          }),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const countryId = e.target.value;
            
            if (isEditMode) {
              setEditFormData(prev => ({ 
                ...prev, 
                country_id: countryId,
                state_id: '',
                district_id: '',
                city_id: '',
                sdpo_id: ''
              }));
            } else {
              setCurrentCountryId(countryId);
              setCurrentStateId("");
              setCurrentDistrictId("");
            }
            
            setFilteredDistricts([]);
            setFilteredCities([]);
            setFilteredSdpos([]);
            
            if (countryId) {
              const statesData = await fetchStatesByCountry(countryId);
              setFilteredStates(statesData);
            } else {
              setFilteredStates([]);
            }
          }
        })
      },
      {
        name: 'state_id',
        label: 'State :',
        type: 'select' as const,

        required: true,
        disabled: isEditMode
          ? !currentFormData?.country_id
          : !currentCountryId, 

        // only show options when parent selected
        options: (
          isEditMode
            ? (filteredStates.length > 0 ? filteredStates : states)
            : (currentCountryId ? filteredStates : [])           
        ).map(state => ({
          value: state.id.toString(),
          label: state.state_name_en || state.state_name
        })),

        placeholder: isStatesLoading
          ? "Loading states..."
          : (isEditMode
              ? "Select State"
              : (currentCountryId ? "Select State" : "Please select country first")),

        defaultValue: isEditMode ? currentFormData?.state_id : undefined,

        customProps: createFieldProps({
          ...(isClient && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              // block open if country not selected in ADD mode
              if (!isEditMode && !currentCountryId) {
                e.preventDefault();
                return;
              }
              handleStateDropdownClick();
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentCountryId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
              handleStateDropdownClick();
            },
          }),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const stateId = e.target.value;

            if (isEditMode) {
              setEditFormData(prev => ({
                ...prev,
                state_id: stateId,
                district_id: '',
                city_id: '',
                sdpo_id: ''
              }));
            } else {
              setCurrentStateId(stateId);
              setCurrentDistrictId("");
              setCurrentCityId("");
            }

            setFilteredDistricts([]);
            setFilteredCities([]);
            setFilteredSdpos([]);

            if (stateId) {
              const districtsData = await fetchDistrictsByState(stateId);
              setFilteredDistricts(districtsData);
            }
          }
        })
      },
      {
        name: 'district_id',
        label: 'District :',
        type: 'select' as const,

        required: true,
        disabled: isEditMode
          ? !currentFormData?.state_id
          : !currentStateId,

        options: (
          isEditMode
            ? (currentFormData?.state_id ? filteredDistricts : [])
            : (currentStateId ? filteredDistricts : [])             // 👈 no state → no options
        ).map(district => ({
          value: district.id.toString(),
          label: district.district_name
        })),

        placeholder: isDistrictsLoading
          ? "Loading districts..."
          : (isEditMode
              ? (currentFormData?.state_id ? "Select District" : "Please select state first")
              : (currentStateId ? "Select District" : "Please select state first")),

        defaultValue: isEditMode ? currentFormData?.district_id : undefined,

        customProps: createFieldProps({
          ...(isClient && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentStateId) {
                e.preventDefault();
                return;
              }
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentStateId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
            },
          }),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const districtId = e.target.value;

            if (isEditMode) {
              setEditFormData(prev => ({
                ...prev,
                district_id: districtId,
                city_id: '',
              }));
            } else {
              setCurrentDistrictId(districtId);
              setCurrentCityId("");
            }

            setFilteredCities([]);
            setFilteredSdpos([]);

            if (districtId) {
              await fetchCitiesByDistrict(districtId);
            }
          }
        })
      },
      {
        name: 'city_id',
        label: 'City :',
        type: 'select' as const,

        required: true,
        disabled: isEditMode
          ? !currentFormData?.district_id
          : !currentDistrictId,

        options: (
          isEditMode
            ? (currentFormData?.district_id ? filteredCities : [])
            : (currentDistrictId ? filteredCities : [])           // 👈 no district → no options
        ).map(city => ({
          value: city.id.toString(),
          label: city.city_name
        })),

        placeholder: isCitiesLoading
          ? "Loading cities..."
          : (isEditMode
              ? (currentFormData?.district_id ? "Select City" : "Please select district first")
              : (currentDistrictId ? "Select City" : "Please select district first")),

        defaultValue: isEditMode ? currentFormData?.city_id : undefined,

        customProps: createFieldProps({
          ...(isClient && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentDistrictId) {
                e.preventDefault();
                return;
              }
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentDistrictId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
            },
          }),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const cityId = e.target.value;

            if (isEditMode) {
              setEditFormData(prev => ({
                ...prev,
                city_id: cityId,
                sdpo_id: ''
              }));
            } else {
              setCurrentCityId(cityId);           // 👈 track selected city in ADD mode
            }

            if (cityId) {
              await fetchSDPOsByCity(cityId);
            } else {
              setFilteredSdpos([]);
            }
          }
        })
      },
      {
        name: 'sdpo_id',
        label: 'SDPO :',
        type: 'select' as const,

        required: true,
        disabled: isEditMode
          ? !currentFormData?.city_id
          : !currentCityId,                           // 👈 only enabled when city is selected

        options: (
          isEditMode
            ? (currentFormData?.city_id ? filteredSdpos : [])
            : (currentCityId ? filteredSdpos : [])    // 👈 no city → no options
        ).map(sdpo => ({
          value: sdpo.id.toString(),
          label: sdpo.name
        })),

        placeholder: isSdposLoading
          ? "Loading SDPOs..."
          : (isEditMode
              ? (currentFormData?.city_id ? "Select SDPO" : "Please select city first")
              : (currentCityId ? "Select SDPO" : "Please select city first")),

        defaultValue: isEditMode ? currentFormData?.sdpo_id : undefined,

        customProps: createFieldProps({
          ...(isClient && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentCityId) {
                e.preventDefault();
                return;
              }
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!isEditMode && !currentCityId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
            },
          }),
        })
      },
      {
        name: 'email',
        label: 'Email :',
        type: 'text',
        placeholder: 'Enter Email number',
        required: true,
        defaultValue: isEditMode ? currentFormData?.email : undefined,
        customProps: createFieldProps()
      },
      {
        name: 'mobile',
        label: 'Mobile :',
        type: 'text',
        placeholder: 'Enter mobile number',
        required: true,
        defaultValue: isEditMode ? currentFormData?.mobile : undefined,
        customProps: createFieldProps()
      },
      {
        name: 'pincode',
        label: 'Pincode :',
        type: 'text',
        placeholder: 'Enter pincode',
        required: true,
        defaultValue: isEditMode ? currentFormData?.pincode : undefined,
        customProps: createFieldProps()
      },
      {
        name: 'address',
        label: 'Address :',
        type: 'textarea',
        placeholder: 'Enter address',
        required: true,
        defaultValue: isEditMode ? currentFormData?.address : undefined,
        customProps: createFieldProps({ rows: 3 })
      },
      ...(isEditMode ? [{
        name: 'status',
        label: 'Status :',
        type: 'select' as const,

        required: true,
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' }
        ],
        placeholder: "Select Status",
        defaultValue: currentFormData?.status || "Active",
        customProps: createFieldProps()
      }] : [])
    ];
  }, [
    countries, states, filteredStates, filteredDistricts, filteredCities, filteredSdpos,
    isCountriesLoading, isStatesLoading, isDistrictsLoading, isCitiesLoading, isSdposLoading,
    currentCountryId, currentStateId, currentDistrictId, editFormData,
    policeCategories, isCategoriesLoading, isClient,
    handleCountryDropdownClick, handleStateDropdownClick, handleCategoryDropdownClick,
    fetchStatesByCountry, fetchDistrictsByState, fetchCitiesByDistrict, fetchSDPOsByCity
  ]);

  // Memoized versions for Add and Edit
  const addPoliceStationFields = useMemo(() => getPoliceStationFields('add'), [getPoliceStationFields]);
  const editPoliceStationFields = useMemo(() => getPoliceStationFields('edit'), [getPoliceStationFields]);

  // ============================================
  // EXPORT HANDLERS (KEPT AS IS)
  // ============================================
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
  // CRUD OPERATIONS (UPDATED WITH STATE PRELOAD FIX)
  // ============================================
  const handleAddPoliceStation = useCallback(async (formData: Record<string, string>) => {
    try {
      const payload = {
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        sdpo_id: parseInt(formData.sdpo_id),
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        pincode: formData.pincode,
        police_pc_id: formData.category ? parseInt(formData.category) : null,
        status: "Active"
      };

      await api.post("/police-stations", payload);
      fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("Police Station added successfully!", "success");
    } catch (error) {
      console.error("Error adding Police Station:", error);
      showToast("Error adding Police Station. Please try again.", "error");
    }
  }, [fetchPoliceStations, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const preloadEditDropdowns = useCallback((data: any) => {
    console.log("🟣 Preloading dropdowns with data:", data);

    // Preload countries if available
    if (data.country_id && data.country_name) {
      const countryExists = countries.some(country => country.id === data.country_id);
      if (!countryExists) {
        setCountries(prev => [...prev, { id: data.country_id, country_name: data.country_name }]);
      }
    }

    // Preload states if available
    if (data.state_id && data.state_name) {
      const stateExists = filteredStates.some(state => state.id === data.state_id) || 
                        states.some(state => state.id === data.state_id);
      if (!stateExists) {
        const newState = { 
          id: data.state_id, 
          state_name: data.state_name,
          state_name_en: data.state_name,
          country_id: data.country_id || 0
        };
        setFilteredStates(prev => [...prev, newState]);
      }
    }

    // Preload districts if available
    if (data.district_id && data.district_name) {
      const districtExists = filteredDistricts.some(district => district.id === data.district_id);
      if (!districtExists) {
        setFilteredDistricts(prev => [...prev, { id: data.district_id, district_name: data.district_name, state_id: data.state_id }]);
      }
    }

    // Preload cities if available
    if (data.city_id && data.city_name) {
      const cityExists = filteredCities.some(city => city.id === data.city_id);
      if (!cityExists) {
        setFilteredCities(prev => [...prev, { id: data.city_id, city_name: data.city_name, district_id: data.district_id }]);
      }
    }

    // Preload SDPOs based on city if available
    if (data.city_id && data.sdpo_id && data.sdpo_name) {
      const sdpoExists = filteredSdpos.some(sdpo => sdpo.id === data.sdpo_id);
      if (!sdpoExists) {
        // Fetch SDPOs for this city to populate the dropdown
        fetchSDPOsByCity(data.city_id.toString()).then(sdposData => {
          const sdpoExistsInResponse = sdposData.some((sdpo: SDPO) => sdpo.id === data.sdpo_id);
          if (!sdpoExistsInResponse) {
            setFilteredSdpos(prev => [...prev, { id: data.sdpo_id, name: data.sdpo_name, district_id: data.district_id }]);
          }
        });
      }
    }

    if (data.category_id && data.category) {
      const categoryExists = policeCategories.some(cat => cat.police_pc_id === data.category_id);
      if (!categoryExists) {
        setPoliceCategories(prev => [
          ...prev,
          { police_pc_id: data.category_id, pc_name: data.category }
        ]);
      }
    }

  }, [countries, states, filteredStates, filteredDistricts, filteredCities, filteredSdpos, policeCategories, fetchSDPOsByCity]);

  const handleEdit = useCallback(async (policeStation: PoliceStationRow) => {
    try {
      setEditingPoliceStation(policeStation);

      const response = await api.get(`/police-stations/${policeStation.id}`);
      const fullData = extractSinglePoliceStation(response);

      if (!fullData) {
        showToast("Failed to load Police Station details.", "error");
        return;
      }

      console.log("🟡 Full data received for edit:", fullData);

      // Preload dropdowns using existing API response BEFORE setting form data
      preloadEditDropdowns(fullData);

      // Set form data
      setEditFormData({
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
        category: fullData.category || "",
        category_id: fullData.category_id?.toString() || "",
        status: fullData.status || "Active"
      });

      // Set current IDs for cascading dropdowns
      if (fullData.country_id) {
        setCurrentCountryId(fullData.country_id.toString());
      }
      if (fullData.state_id) {
        setCurrentStateId(fullData.state_id.toString());
      }
      if (fullData.district_id) {
        setCurrentDistrictId(fullData.district_id.toString());
      }

      // Fetch SDPOs based on the city
      if (fullData.city_id) {
        await fetchSDPOsByCity(fullData.city_id.toString());
      }

      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error loading Police Station details:", error);
      showToast("Failed to load Police Station details. Please try again.", "error");
    }
  }, [extractSinglePoliceStation, showToast, preloadEditDropdowns, fetchSDPOsByCity]);

  const handleUpdate = useCallback(async (formData: Record<string, string>) => {
    if (!editingPoliceStation) return;

    try {
      setSaveLoading(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        sdpo_id: parseInt(formData.sdpo_id),
        address: formData.address,
        pincode: formData.pincode,
        category_id: formData.category ? parseInt(formData.category) : null,
        status: formData.status
      };

      await api.put(`/police-stations/${editingPoliceStation.id}`, payload);
      fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
      setIsEditModalOpen(false);
      setEditingPoliceStation(null);
      showToast("Police Station updated successfully!", "success");
    } catch (error) {
      console.error("Error updating Police Station:", error);
      showToast("Error updating Police Station. Please try again.", "error");
    } finally {
      setSaveLoading(false);
    }
  }, [editingPoliceStation, fetchPoliceStations, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    try {
      await api.delete(`/police-stations/${id}`);
      await fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("Police Station deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Police Station:", error);
      showToast("Error deleting Police Station. Please try again.", "error");
      throw error;
    }
  }, [fetchPoliceStations, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPoliceStation(null);
    // Reset current IDs when modal closes
    setCurrentCountryId("");
    setCurrentStateId("");
    setCurrentDistrictId("");
  }, []);

  // ============================================
  // TABLE CONFIGURATION - SERVER-SIDE PAGINATION (UPDATED)
  // ============================================
  const { tableElement, table } = CustomTable<PoliceStationRow>({
    data: policeStations,
    columns,
    pagination,
    totalCount,
    loading,
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

  // ============================================
  // RENDER (UPDATED)
  // ============================================
  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
      />

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <AddSection 
        title="Add Police Station"
        fields={addPoliceStationFields}
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
            
            {/* Column Visibility Selector with SSR fix */}
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

      {/* EDIT MODAL */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdate}
        title={`Edit Police Station - ID: ${editingPoliceStation?.id || ''}`}
        fields={editPoliceStationFields}
        saveLoading={saveLoading}
      />

      {/* VIEW MODAL */}
      {viewingPoliceStationId && (
        <PoliceStationView
          policeStationId={viewingPoliceStationId}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingPoliceStationId(null);
          }}
          apiBaseUrl="/api"
        />
      )}
    </div>
  );
}