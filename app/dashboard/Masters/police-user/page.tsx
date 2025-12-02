"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CustomTable, ColumnDef, PaginationState, SortingState } from "@/component/ui/Table/CustomTable";
import AddSection, { FieldConfig } from "@/component/ui/add-section/add-section";
import { api } from "@/services/api/apiServices";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";

interface PoliceUserRow {
  id: number;
  name: string;
  email: string;
  mobile: string;
  designation_type: string;
  designation_name: string;
  gender: string;
  state_name?: string;
  district_name?: string;
  city_name?: string;
  pincode: string;
  aadhar_number: string;
  pan_number: string;
  buckal_number: string;
  address: string;
  image_url?: string;
  status?: string;
  district_id?: number;
  city_id?: number;
}

interface Country {
  id: number;
  country_name: string;
}

interface State {
  id: number;
  state_name: string;
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

interface Designation {
  id: number;
  name: string;
  type: string;
}

interface EditFormData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  designation_type: string;
  designation_name: string;
  gender: string;
  country_id: string;
  state_id: string;
  district_id: string;
  city_id: string;
  pincode: string;
  aadhar_number: string;
  pan_number: string;
  buckal_number: string;
  address: string;
  status: string;
}

export default function PoliceUserPage() {
  const [policeUsers, setPoliceUsers] = useState<PoliceUserRow[]>([]);
  const [filteredPoliceUsers, setFilteredPoliceUsers] = useState<PoliceUserRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoliceUser, setEditingPoliceUser] = useState<PoliceUserRow | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Loading states for lazy loading
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isDesignationsLoading, setIsDesignationsLoading] = useState(false);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [statesLoaded, setStatesLoaded] = useState(false);
  const [designationsLoaded, setDesignationsLoaded] = useState(false);

  // Current selected IDs for cascading dropdowns
  const [currentCountryId, setCurrentCountryId] = useState<string>("");
  const [currentStateId, setCurrentStateId] = useState<string>("");
  const [currentDistrictId, setCurrentDistrictId] = useState<string>("");
  const [currentDesignationType, setCurrentDesignationType] = useState<string>("");

  // Toast notification state
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: "success" | "error" }>({
    isVisible: false,
    message: "",
    type: "success"
  });

  // Pagination & Sorting State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Initialize edit form data
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    email: "",
    mobile: "",
    password: "",
    designation_type: "",
    designation_name: "",
    gender: "Male",
    country_id: "",
    state_id: "",
    district_id: "",
    city_id: "",
    pincode: "",
    aadhar_number: "",
    pan_number: "",
    buckal_number: "",
    address: "",
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

  // ============================================
  // TABLE COLUMNS DEFINITION
  // ============================================
  const columns: ColumnDef<PoliceUserRow>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium text-black">{row.original.name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-black">{row.original.email}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => <span className="text-black">{row.original.mobile}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "designation_type",
      header: "Designation Type",
      cell: ({ row }) => <span className="text-black">{row.original.designation_type}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "designation_name",
      header: "Designation Name",
      cell: ({ row }) => <span className="text-black">{row.original.designation_name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: "district_name",
      header: "District",
      cell: ({ row }) => <span className="text-black">{row.original.district_name || "N/A"}</span>,
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEdit(row.original)}
            className="px-3 py-1 rounded-md text-sm bg-blue-100 text-black hover:bg-blue-200"
          >
            Edit
          </button>
          
          {/* Delete Button with AlertPopover */}
          <AlertPopover
            trigger={
              <button
                className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200"
              >
                Delete
              </button>
            }
            title="Are you sure you want to delete this Police User?"
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

  // ============================================
  // DATA EXTRACTION FUNCTIONS
  // ============================================
  const extractPoliceUserData = useCallback((response: any): PoliceUserRow[] => {
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.result)) return response.data.result;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  }, []);

  const extractCountryData = useCallback((response: any): Country[] => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  }, []);

  const extractStateData = useCallback((response: any): State[] => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  }, []);

  const extractDistrictData = useCallback((response: any): District[] => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  }, []);

  const extractCityData = useCallback((response: any): City[] => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  }, []);

  const extractDesignationData = useCallback((response: any): Designation[] => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  }, []);

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const response = await api.get("/states/getcountry");
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
      const response = await api.get("/states");
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
    if (!countryId) {
      setFilteredStates([]);
      return [];
    }
    try {
      setIsStatesLoading(true);
      const response = await api.get(`/states/country/${countryId}`);
      const statesData = extractStateData(response);
      setFilteredStates(statesData);
      return statesData;
    } catch (error) {
      console.error("Error fetching states:", error);
      setFilteredStates([]);
      return [];
    } finally {
      setIsStatesLoading(false);
    }
  }, [extractStateData]);

  const fetchDistrictsByState = useCallback(async (stateId: string) => {
    if (!stateId) {
      setFilteredDistricts([]);
      return [];
    }
    try {
      setIsDistrictsLoading(true);
      const response = await api.get(`/districts/state/${stateId}`);
      const districtData = extractDistrictData(response);
      setFilteredDistricts(districtData);
      return districtData;
    } catch (error) {
      console.error("Error fetching districts:", error);
      setFilteredDistricts([]);
      return [];
    } finally {
      setIsDistrictsLoading(false);
    }
  }, [extractDistrictData]);

  const fetchCitiesByDistrict = useCallback(async (districtId: string) => {
    if (!districtId) {
      setFilteredCities([]);
      return [];
    }
    try {
      setIsCitiesLoading(true);
      const response = await api.get(`/cities/district/${districtId}`);
      const citiesData = extractCityData(response);
      setFilteredCities(citiesData);
      return citiesData;
    } catch (error) {
      console.error("Error fetching cities:", error);
      setFilteredCities([]);
      return [];
    } finally {
      setIsCitiesLoading(false);
    }
  }, [extractCityData]);

  const fetchDesignations = useCallback(async () => {
    try {
      setIsDesignationsLoading(true);
      const response = await api.get("/designations");
      const designationsData = extractDesignationData(response);
      setDesignations(designationsData);
      setDesignationsLoaded(true);
    } catch (error) {
      console.error("Error fetching designations:", error);
    } finally {
      setIsDesignationsLoading(false);
    }
  }, [extractDesignationData]);

  const fetchDesignationsByType = useCallback(async (type: string) => {
    if (!type) {
      setFilteredDesignations([]);
      return [];
    }
    try {
      setIsDesignationsLoading(true);
      const response = await api.get(`/designations/type/${type}`);
      const designationsData = extractDesignationData(response);
      setFilteredDesignations(designationsData);
      return designationsData;
    } catch (error) {
      console.error("Error fetching designations by type:", error);
      setFilteredDesignations([]);
      return [];
    } finally {
      setIsDesignationsLoading(false);
    }
  }, [extractDesignationData]);

  // ============================================
  // LAZY LOADING HANDLERS
  // ============================================
  const handleCountryDropdownClick = useCallback(async () => {
    if (!isCountriesLoading && !countriesLoaded) {
      await fetchCountries();
    }
  }, [isCountriesLoading, countriesLoaded, fetchCountries]);

  const handleStateDropdownClick = useCallback(async () => {
    if (!isStatesLoading && !statesLoaded) {
      await fetchAllStates();
    }
  }, [isStatesLoading, statesLoaded, fetchAllStates]);

  const handleDistrictDropdownClick = useCallback(async () => {
    if (!currentStateId || isDistrictsLoading) return;
    await fetchDistrictsByState(currentStateId);
  }, [currentStateId, isDistrictsLoading, fetchDistrictsByState]);

  const handleCityDropdownClick = useCallback(async () => {
    if (!currentDistrictId || isCitiesLoading) return;
    await fetchCitiesByDistrict(currentDistrictId);
  }, [currentDistrictId, isCitiesLoading, fetchCitiesByDistrict]);

  const handleDesignationDropdownClick = useCallback(async () => {
    if (!isDesignationsLoading && !designationsLoaded) {
      await fetchDesignations();
    }
  }, [isDesignationsLoading, designationsLoaded, fetchDesignations]);

  const handleDesignationTypeChange = useCallback(async (type: string) => {
    setCurrentDesignationType(type);
    if (type) {
      await fetchDesignationsByType(type);
    } else {
      setFilteredDesignations([]);
    }
  }, [fetchDesignationsByType]);

  // ============================================
  // FIELD CONFIGURATION
  // ============================================
  const policeUserFields = useMemo((): FieldConfig[] => [
    {
      name: 'name',
      label: 'Name*',
      type: 'text',
      placeholder: 'Enter Name',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'password',
      label: 'Password*',
      type: 'password',
      placeholder: 'Enter password',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'mobile',
      label: 'Mobile*',
      type: 'text',
      placeholder: 'Enter mobile no',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'email',
      label: 'Email*',
      type: 'email',
      placeholder: 'Enter email',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'designation_type',
      label: 'Designation Type',
      type: 'select',
      required: true,
      options: [
        { value: 'Head Person', label: 'Head Person' },
        { value: 'Station Head', label: 'Station Head' },
        { value: 'Police', label: 'Police' }
      ],
      placeholder: "Select Designation Type",
      customProps: {
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const type = e.target.value;
          handleDesignationTypeChange(type);
        },
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'designation_name',
      label: 'Designation Name*',
      type: 'select',
      required: true,
      options: filteredDesignations.map(designation => ({
        value: designation.id.toString(),
        label: designation.name
      })),
      placeholder: isDesignationsLoading ? "Loading designations..." : 
                 currentDesignationType ? "Select Designation" : "Please select designation type first",
      customProps: {
        onMouseDown: handleDesignationDropdownClick,
        onFocus: handleDesignationDropdownClick,
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Others', label: 'Others' }
      ],
      placeholder: "Select Gender",
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'country_id',
      label: 'Country*',
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
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const countryId = e.target.value;
          setCurrentCountryId(countryId);
          setCurrentStateId("");
          setCurrentDistrictId("");
          setFilteredStates([]);
          setFilteredDistricts([]);
          setFilteredCities([]);
          if (countryId) fetchStatesByCountry(countryId);
        },
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'state_id',
      label: 'State*',
      type: 'select',
      required: true,
      options: filteredStates.map(state => ({
        value: state.id.toString(),
        label: state.state_name
      })),
      placeholder: isStatesLoading ? "Loading states..." : 
                 currentCountryId ? "Select State" : "Please select country first",
      customProps: {
        onMouseDown: handleStateDropdownClick,
        onFocus: handleStateDropdownClick,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const stateId = e.target.value;
          setCurrentStateId(stateId);
          setCurrentDistrictId("");
          setFilteredDistricts([]);
          setFilteredCities([]);
          if (stateId) fetchDistrictsByState(stateId);
        },
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'district_id',
      label: 'District*',
      type: 'select',
      required: true,
      options: filteredDistricts.map(district => ({
        value: district.id.toString(),
        label: district.district_name
      })),
      placeholder: isDistrictsLoading ? "Loading districts..." : 
                 currentStateId ? "Select District" : "Please select state first",
      customProps: {
        onMouseDown: handleDistrictDropdownClick,
        onFocus: handleDistrictDropdownClick,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const districtId = e.target.value;
          setCurrentDistrictId(districtId);
          setFilteredCities([]);
          if (districtId) fetchCitiesByDistrict(districtId);
        },
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'city_id',
      label: 'City*',
      type: 'select',
      required: true,
      options: filteredCities.map(city => ({
        value: city.id.toString(),
        label: city.city_name
      })),
      placeholder: isCitiesLoading ? "Loading cities..." : 
                 currentDistrictId ? "Select City" : "Please select district first",
      customProps: {
        onMouseDown: handleCityDropdownClick,
        onFocus: handleCityDropdownClick,
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'pincode',
      label: 'Pincode*',
      type: 'text',
      placeholder: 'Enter pincode',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'aadhar_number',
      label: 'Aadhar Number*',
      type: 'text',
      placeholder: 'Enter Aadhar Number',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'pan_number',
      label: 'Pan Number*',
      type: 'text',
      placeholder: 'Enter Pan Number',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'buckal_number',
      label: 'Buckal Number*',
      type: 'text',
      placeholder: 'Enter Buckal Number',
      required: true,
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    },
    {
      name: 'address',
      label: 'Address*',
      type: 'textarea',
      placeholder: 'Enter address',
      required: true,
      rows: 3,   // ✔ moved here
      customProps: {
        className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    }
  ], [
    countries, filteredStates, filteredDistricts, filteredCities, filteredDesignations,
    isCountriesLoading, isStatesLoading, isDistrictsLoading, isCitiesLoading, isDesignationsLoading,
    currentCountryId, currentStateId, currentDistrictId, currentDesignationType,
    handleCountryDropdownClick, handleStateDropdownClick, handleDistrictDropdownClick, 
    handleCityDropdownClick, handleDesignationDropdownClick, handleDesignationTypeChange,
    fetchStatesByCountry, fetchDistrictsByState, fetchCitiesByDistrict
  ]);

  // ============================================
  // MAIN DATA FETCHING
  // ============================================
  const fetchPoliceUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/police-users");
      const policeUserData = extractPoliceUserData(res);

      const basicPoliceUserData = policeUserData.map(user => ({
        ...user,
        district_name: user.district_name || `District ${user.district_id}`,
        city_name: user.city_name || (user.city_id ? `City ${user.city_id}` : "N/A")
      }));

      setPoliceUsers(basicPoliceUserData);
      setFilteredPoliceUsers(basicPoliceUserData);
      setTotalCount(basicPoliceUserData.length);
    } catch (error) {
      console.error("Error fetching police users:", error);
      setError("Failed to fetch police users");
    } finally {
      setLoading(false);
    }
  }, [extractPoliceUserData]);

  useEffect(() => {
    fetchPoliceUsers();
  }, [fetchPoliceUsers]);

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const handleSearchResults = useCallback((results: Record<string, any>[]) => {
    const sanitized = results as PoliceUserRow[];
    setFilteredPoliceUsers(sanitized);
    setTotalCount(sanitized.length);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);


  // ============================================
  // EXPORT HANDLERS
  // ============================================
  const handleExportPdf = useCallback(() => {
    showToast("PDF export functionality - Coming soon!", "success");
  }, [showToast]);

  const handleExportExcel = useCallback(() => {
    showToast("Excel export functionality - Coming soon!", "success");
  }, [showToast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const handleAddPoliceUser = useCallback(async (formData: Record<string, string>) => {
    try {
      // Validate required fields
      const requiredFields = ['name', 'email', 'mobile', 'password', 'designation_type', 'designation_name', 
                             'country_id', 'state_id', 'district_id', 'city_id', 'pincode', 'aadhar_number', 
                             'pan_number', 'buckal_number', 'address'];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        showToast(`Please fill all required fields: ${missingFields.join(', ')}`, "error");
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        designation_type: formData.designation_type,
        designation_name: formData.designation_name,
        gender: formData.gender,
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        pincode: formData.pincode,
        aadhar_number: formData.aadhar_number,
        pan_number: formData.pan_number,
        buckal_number: formData.buckal_number,
        address: formData.address,
        status: "Active"
      };

      await api.post("/police-users", payload);
      fetchPoliceUsers();
      showToast("Police User added successfully!", "success");
    } catch (error) {
      console.error("Error adding police user:", error);
      showToast("Error adding police user. Please try again.", "error");
    }
  }, [fetchPoliceUsers, showToast]);

  const handleEdit = useCallback(async (user: PoliceUserRow) => {
    setEditingPoliceUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: "", // Password is not shown for security
      designation_type: user.designation_type,
      designation_name: user.designation_name,
      gender: user.gender,
      country_id: "",
      state_id: "",
      district_id: "",
      city_id: "",
      pincode: user.pincode,
      aadhar_number: user.aadhar_number,
      pan_number: user.pan_number,
      buckal_number: user.buckal_number,
      address: user.address,
      status: user.status || "Active"
    });

    // Load countries, states and designations if not already loaded
    if (!countriesLoaded) await fetchCountries();
    if (!statesLoaded) await fetchAllStates();
    if (!designationsLoaded) await fetchDesignations();

    setIsEditModalOpen(true);
  }, [countriesLoaded, statesLoaded, designationsLoaded, fetchCountries, fetchAllStates, fetchDesignations]);

  const handleUpdate = useCallback(async () => {
    if (!editingPoliceUser) return;

    try {
      setSaveLoading(true);
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        mobile: editFormData.mobile,
        designation_type: editFormData.designation_type,
        designation_name: editFormData.designation_name,
        gender: editFormData.gender,
        pincode: editFormData.pincode,
        aadhar_number: editFormData.aadhar_number,
        pan_number: editFormData.pan_number,
        buckal_number: editFormData.buckal_number,
        address: editFormData.address,
        status: editFormData.status
      };

      // Only include password if it's provided
      if (editFormData.password) {
        Object.assign(payload, { password: editFormData.password });
      }

      await api.put(`/police-users/${editingPoliceUser.id}`, payload);
      fetchPoliceUsers();
      setIsEditModalOpen(false);
      setEditingPoliceUser(null);
      showToast("Police User updated successfully!", "success");
    } catch (error) {
      console.error("Error updating police user:", error);
      showToast("Error updating police user. Please try again.", "error");
    } finally {
      setSaveLoading(false);
    }
  }, [editingPoliceUser, editFormData, fetchPoliceUsers, showToast]);

  // -----------------------------------
  // ❌ DELETE Handler (Called from AlertPopover)
  // -----------------------------------
  const handleDeleteConfirm = useCallback(async (id: number) => {
    try {
      await api.delete(`/police-users/${id}`);
      await fetchPoliceUsers();
      showToast("Police User deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting police user:", error);
      showToast("Error deleting police user. Please try again.", "error");
      throw error;
    }
  }, [fetchPoliceUsers, showToast]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPoliceUser(null);
  }, []);

  // ============================================
  // EDIT FORM HANDLERS
  // ============================================
  const handleEditFormChange = useCallback((field: keyof EditFormData, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCountrySelectChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryId = e.target.value;
    handleEditFormChange('country_id', countryId);
    handleEditFormChange('state_id', '');
    handleEditFormChange('district_id', '');
    handleEditFormChange('city_id', '');
    setFilteredStates([]);
    setFilteredDistricts([]);
    setFilteredCities([]);
    if (countryId) await fetchStatesByCountry(countryId);
  }, [handleEditFormChange, fetchStatesByCountry]);

  const handleStateSelectChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    handleEditFormChange('state_id', stateId);
    handleEditFormChange('district_id', '');
    handleEditFormChange('city_id', '');
    setFilteredDistricts([]);
    setFilteredCities([]);
    if (stateId) await fetchDistrictsByState(stateId);
  }, [handleEditFormChange, fetchDistrictsByState]);

  const handleDistrictSelectChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    handleEditFormChange('district_id', districtId);
    handleEditFormChange('city_id', '');
    setFilteredCities([]);
    if (districtId) await fetchCitiesByDistrict(districtId);
  }, [handleEditFormChange, fetchCitiesByDistrict]);

  const handleDesignationTypeSelectChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    handleEditFormChange('designation_type', type);
    handleEditFormChange('designation_name', '');
    if (type) {
      await fetchDesignationsByType(type);
    } else {
      setFilteredDesignations([]);
    }
  }, [handleEditFormChange, fetchDesignationsByType]);

  // ============================================
  // EDIT MODAL DROPDOWN HANDLERS
  // ============================================
  const handleEditCountryDropdownClick = useCallback(async () => {
    if (!isCountriesLoading && !countriesLoaded) {
      await fetchCountries();
    }
  }, [isCountriesLoading, countriesLoaded, fetchCountries]);

  const handleEditStateDropdownClick = useCallback(async () => {
    if (!isStatesLoading && !statesLoaded) {
      await fetchAllStates();
    }
  }, [isStatesLoading, statesLoaded, fetchAllStates]);

  const handleEditDistrictDropdownClick = useCallback(async () => {
    if (!editFormData.state_id || isDistrictsLoading) return;
    await fetchDistrictsByState(editFormData.state_id);
  }, [editFormData.state_id, isDistrictsLoading, fetchDistrictsByState]);

  const handleEditCityDropdownClick = useCallback(async () => {
    if (!editFormData.district_id || isCitiesLoading) return;
    await fetchCitiesByDistrict(editFormData.district_id);
  }, [editFormData.district_id, isCitiesLoading, fetchCitiesByDistrict]);

  const handleEditDesignationDropdownClick = useCallback(async () => {
    if (!isDesignationsLoading && !designationsLoaded) {
      await fetchDesignations();
    }
  }, [isDesignationsLoading, designationsLoaded, fetchDesignations]);

  // ============================================
  // TABLE CONFIGURATION
  // ============================================
  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredPoliceUsers.slice(start, end);
  }, [filteredPoliceUsers, pagination.pageIndex, pagination.pageSize]);

  const { tableElement, table } = CustomTable<PoliceUserRow>({
    data: paginatedData,
    columns,
    pagination,
    totalCount,
    loading,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    sorting,
    emptyMessage: "No Police Users available",
    pageSizeOptions: [10, 20, 30, 50],
    enableSorting: true,
    manualSorting: false,
    manualPagination: false,
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
      {/* Toast Notification - Top Center */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
      />

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <AddSection 
        title="Add Police User"
        fields={policeUserFields}
        onSubmit={handleAddPoliceUser}
        submitButtonText="Add Police User"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButtons
              onExportPdf={handleExportPdf}
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
              data={policeUsers}
              placeholder="Search Police Users..."
              displayKey={["name", "email", "mobile", "designation_type", "designation_name", "district_name"]}
              onResults={handleSearchResults}
              debounceDelay={300}
            />
          </div>
        </div>

        {tableElement}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingPoliceUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Edit Police User - ID: {editingPoliceUser.id}</h2>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700 text-2xl transition-colors duration-200">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BASIC INFORMATION */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Basic Information</h3>
                </div>

                {/* NAME */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Name* :</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    placeholder="Enter Name"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Email* :</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    placeholder="Enter email"
                  />
                </div>

                {/* MOBILE */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Mobile* :</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.mobile}
                    onChange={(e) => handleEditFormChange('mobile', e.target.value)}
                    placeholder="Enter mobile no"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Password :</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.password}
                    onChange={(e) => handleEditFormChange('password', e.target.value)}
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                </div>

                {/* DESIGNATION INFORMATION */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Designation Information</h3>
                </div>

                {/* DESIGNATION TYPE */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Designation Type :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.designation_type}
                    onChange={handleDesignationTypeSelectChange}
                  >
                    <option value="" className="text-gray-500">Select Designation Type</option>
                    <option value="Head Person" className="text-gray-900">Head Person</option>
                    <option value="Station Head" className="text-gray-900">Station Head</option>
                    <option value="Police" className="text-gray-900">Police</option>
                  </select>
                </div>

                {/* DESIGNATION NAME */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Designation Name* :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                    value={editFormData.designation_name}
                    onChange={(e) => handleEditFormChange('designation_name', e.target.value)}
                    onMouseDown={handleEditDesignationDropdownClick}
                    onFocus={handleEditDesignationDropdownClick}
                    disabled={!editFormData.designation_type}
                  >
                    <option value="" className="text-gray-500">
                      {isDesignationsLoading ? "Loading designations..." : 
                       !editFormData.designation_type ? "Please select designation type first" : "Select Designation"}
                    </option>
                    {filteredDesignations.map((designation) => (
                      <option key={designation.id} value={designation.name} className="text-gray-900">
                        {designation.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GENDER */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Gender :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.gender}
                    onChange={(e) => handleEditFormChange('gender', e.target.value)}
                  >
                    <option value="Male" className="text-gray-900">Male</option>
                    <option value="Female" className="text-gray-900">Female</option>
                    <option value="Others" className="text-gray-900">Others</option>
                  </select>
                </div>

                {/* STATUS */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Status :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                  >
                    <option value="Active" className="text-gray-900">Active</option>
                    <option value="Inactive" className="text-gray-900">Inactive</option>
                  </select>
                </div>

                {/* LOCATION INFORMATION */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Location Information</h3>
                </div>

                {/* COUNTRY */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Country* :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.country_id}
                    onChange={handleCountrySelectChange}
                    onMouseDown={handleEditCountryDropdownClick}
                    onFocus={handleEditCountryDropdownClick}
                  >
                    <option value="" className="text-gray-500">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id} className="text-gray-900">
                        {country.country_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* STATE */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">State* :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.state_id}
                    onChange={handleStateSelectChange}
                    onMouseDown={handleEditStateDropdownClick}
                    onFocus={handleEditStateDropdownClick}
                  >
                    <option value="" className="text-gray-500">
                      {isStatesLoading ? "Loading states..." : "Select State"}
                    </option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id} className="text-gray-900">
                        {state.state_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DISTRICT */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">District* :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                    value={editFormData.district_id}
                    onChange={handleDistrictSelectChange}
                    onMouseDown={handleEditDistrictDropdownClick}
                    onFocus={handleEditDistrictDropdownClick}
                    disabled={!editFormData.state_id}
                  >
                    <option value="" className="text-gray-500">
                      {isDistrictsLoading ? "Loading districts..." : 
                       !editFormData.state_id ? "Please select state first" : "Select District"}
                    </option>
                    {filteredDistricts.map((district) => (
                      <option key={district.id} value={district.id} className="text-gray-900">
                        {district.district_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CITY */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">City* :</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                    value={editFormData.city_id}
                    onChange={(e) => handleEditFormChange('city_id', e.target.value)}
                    onMouseDown={handleEditCityDropdownClick}
                    onFocus={handleEditCityDropdownClick}
                    disabled={!editFormData.district_id}
                  >
                    <option value="" className="text-gray-500">
                      {isCitiesLoading ? "Loading cities..." : 
                       !editFormData.district_id ? "Please select district first" : "Select City"}
                    </option>
                    {filteredCities.map((city) => (
                      <option key={city.id} value={city.id} className="text-gray-900">
                        {city.city_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PINCODE */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Pincode* :</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.pincode}
                    onChange={(e) => handleEditFormChange('pincode', e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>

                {/* DOCUMENT INFORMATION */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Document Information</h3>
                </div>

                {/* AADHAR NUMBER */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Aadhar Number* :</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.aadhar_number}
                    onChange={(e) => handleEditFormChange('aadhar_number', e.target.value)}
                    placeholder="Enter Aadhar Number"
                  />
                </div>

                {/* PAN NUMBER */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Pan Number* :</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.pan_number}
                    onChange={(e) => handleEditFormChange('pan_number', e.target.value)}
                    placeholder="Enter Pan Number"
                  />
                </div>

                {/* BUCKAL NUMBER */}
                <div>
                  <label className="font-medium block mb-2 text-gray-700">Buckal Number* :</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.buckal_number}
                    onChange={(e) => handleEditFormChange('buckal_number', e.target.value)}
                    placeholder="Enter Buckal Number"
                  />
                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2">
                  <label className="font-medium block mb-2 text-gray-700">Address* :</label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={editFormData.address}
                    onChange={(e) => handleEditFormChange('address', e.target.value)}
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button onClick={closeEditModal} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saveLoading}
                  className="px-6 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{ backgroundColor: "#9A65C2" }}
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}