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

// Helper function to compress image
const compressImage = async (file: File, maxSizeKB = 10): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 300px while maintaining aspect ratio)
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            // Check if compressed size is within limits
            if (blob.size <= maxSizeKB * 1024) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // If still too large, reduce quality further
              canvas.toBlob(
                (finalBlob) => {
                  if (!finalBlob) {
                    reject(new Error('Final compression failed'));
                    return;
                  }
                  const finalFile = new File([finalBlob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(finalFile);
                },
                'image/jpeg',
                0.5 // Further reduce quality to 50%
              );
            }
          },
          'image/jpeg',
          0.7 // Initial quality 70%
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Interfaces
interface DropdownItem {
  id: number;
  name?: string;
  police_name?: string;
  state_name?: string;
  district_name?: string;
  city_name?: string;
  station_name?: string;
  country_name?: string;
  [key: string]: any;
}

interface PoliceUserRow extends Record<string, any> {
  id: number;
  police_name: string;
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
  image?: string;
  sdpo_name?: string;
  station_name?: string;
  status?: string;
  district_id?: number;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  country_name?: string;
  sdpo_id?: number;
  station_id?: number;
}

// Helper function to extract data from API responses
const extractData = (response: any, keys: string[] = ['data', 'data', 'result']) => {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }
  return Array.isArray(response) ? response : [];
};

export default function PoliceUserPage() {
  // Main state
  const [policeUsers, setPoliceUsers] = useState<PoliceUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoliceUser, setEditingPoliceUser] = useState<PoliceUserRow | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Country state (separate from other dropdowns)
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);

  // Dropdown data state
  const [dropdownData, setDropdownData] = useState({
    states: [] as DropdownItem[],
    districts: [] as DropdownItem[],
    cities: [] as DropdownItem[],
    designations: [] as DropdownItem[],
    sdpo: [] as DropdownItem[],
    policeStations: [] as DropdownItem[],
  });

  // Filtered dropdown data for cascading - initialized with empty arrays
  const [filteredData, setFilteredData] = useState({
    states: [] as DropdownItem[],
    districts: [] as DropdownItem[],
    cities: [] as DropdownItem[],
    designations: [] as DropdownItem[],
    sdpo: [] as DropdownItem[],
    policeStations: [] as DropdownItem[],
  });

  // Loading states
  const [isLoading, setIsLoading] = useState({
    states: false,
    districts: false,
    cities: false,
    designations: false,
    sdpo: false,
    policeStations: false,
  });

  const [loaded, setLoaded] = useState({
    states: false,
    designations: false,
    sdpo: false,
    policeStations: false,
  });

  // Current selected IDs for cascading dropdowns
  const [selectedIds, setSelectedIds] = useState({
    country: "",
    state: "",
    district: "",
    sdpo: "",
    designationType: "",
  });

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Toast state
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" as "success" | "error" });

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Pagination & Sorting
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Edit form data
  const [editFormData, setEditFormData] = useState<Record<string, any>>({
    police_name: "", email: "", mobile: "", password: "", designation_type: "", designation_id: "",
    gender: "Male", country_id: "", state_id: "", district_id: "", city_id: "", sdpo_id: "",
    police_station_id: "", pincode: "", aadhar_number: "", pan_number: "", buckal_number: "",
    address: "", status: "Active", image: "", department_id: "2"
  });

  // Export PDF hook
  const { exportToPdf } = useExportPdf();

  // Helper functions
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: "", type: "success" }), 3000);
  }, []);

  const createFieldProps = (customProps: any = {}) => ({
    className: "w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400",
    ...customProps
  });

  // Generic API fetch function for other dropdowns
  const fetchDropdownData = useCallback(async (endpoint: string, key: keyof typeof dropdownData) => {
    try {
      setIsLoading(prev => ({ ...prev, [key]: true }));
      const response = await api.get(endpoint);
      const data = extractData(response);
      setDropdownData(prev => ({ ...prev, [key]: data }));
      setLoaded(prev => ({ ...prev, [key]: true }));
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      showToast(`Failed to load ${key}`, "error");
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [showToast]);

  // Fetch by parent ID
  const fetchByParentId = useCallback(async (endpoint: string, parentId: string, filterKey: keyof typeof filteredData) => {
    if (!parentId) {
      setFilteredData(prev => ({ ...prev, [filterKey]: [] }));
      return [];
    }
    try {
      setIsLoading(prev => ({ ...prev, [filterKey]: true }));
      const response = await api.get(endpoint);
      const data = extractData(response);
      setFilteredData(prev => ({ ...prev, [filterKey]: data }));
      return data;
    } catch (error) {
      console.error(`Error fetching ${filterKey}:`, error);
      setFilteredData(prev => ({ ...prev, [filterKey]: [] }));
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, [filterKey]: false }));
    }
  }, []);

  // Country fetch function - called only on click
  const fetchCountries = useCallback(async () => {
    try {
      setIsCountriesLoading(true);
      const response = await api.get('/states/getcountry');
      const data = extractData(response);
      setCountries(data);
    } catch (error) {
      console.error("Error fetching countries:", error);
      showToast("Failed to load countries", "error");
    } finally {
      setIsCountriesLoading(false);
    }
  }, [showToast]);

  // Handler for country dropdown click
  const handleCountryDropdownClick = useCallback(async () => {
    if (!isClient || isCountriesLoading || countries.length > 0) return;
    await fetchCountries();
  }, [isClient, isCountriesLoading, countries.length, fetchCountries]);

  // Main data fetching
  const fetchPoliceUsers = useCallback(async (pageIndex: number, pageSize: number, searchTerm: string = "") => {
    try {
      setLoading(true);
      const currentPage = pageIndex + 1;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm.trim() && { search: searchTerm }),
        ...(sorting.length > 0 && {
          sortBy: sorting[0].id,
          sortOrder: sorting[0].desc ? 'desc' : 'asc'
        })
      });

      const response = await api.get(`/mst-policeall?${params}`);
      
      if (response.success) {
        const policeUserData = response.data || [];
        const transformedData = policeUserData.map((user: any) => ({
          id: user.id,
          police_name: user.police_name || "",
          email: user.email || "",
          mobile: user.mobile?.toString() || "",
          designation_type: user.designation_type || "Police",
          designation_name: user.designation_name || "Police Officer",
          gender: user.gender || "Male",
          state_name: user.state_name || "",
          district_name: user.district_name || "",
          city_name: user.city_name || "",
          pincode: user.pincode || "",
          aadhar_number: user.aadhar_number || "",
          pan_number: user.pan_number || "",
          buckal_number: user.buckal_number || "",
          address: user.address || "",
          image: user.image,
          image_url: user.image_url,
          sdpo_name: user.sdpo_name,
          station_name: user.station_name,
          status: user.status || "Active",
          district_id: user.district_id,
          city_id: user.city_id,
          state_id: user.state_id,
          country_id: user.country_id,
          country_name: user.country_name,
          sdpo_id: user.sdpo_id,
          station_id: user.station_id
        }));

        setPoliceUsers(transformedData);
        setTotalCount(response.totalRecords || 0);
      }
    } catch (error) {
      console.error("Error fetching police users:", error);
      showToast("Failed to fetch police users", "error");
      setPoliceUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [showToast, sorting]);

  // Effects
  useEffect(() => {
    fetchPoliceUsers(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [fetchPoliceUsers, pagination.pageIndex, pagination.pageSize, searchQuery]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dropdown click handlers
  const handleDropdownClick = useCallback(async (key: keyof typeof loaded, fetchFunction: () => Promise<any>) => {
    if (!isClient || isLoading[key as keyof typeof isLoading] || loaded[key]) return;
    await fetchFunction();
  }, [isClient, isLoading, loaded]);

  // Image handler with compression
  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Check file size and type before compression
      if (!file.type.startsWith('image/')) {
        showToast("Please select an image file", "error");
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB limit before compression
        showToast("Image size should be less than 2MB", "error");
        return;
      }

      // Show loading state
      showToast("Compressing image...", "success");

      // Compress image to max 10KB
      const compressedFile = await compressImage(file, 10);
      
      // Verify compression
      if (compressedFile.size > 15 * 1024) { // Allow slight buffer
        showToast("Failed to compress image to required size", "error");
        return;
      }

      // Update state based on mode
      if (mode === 'add') {
        setImageFile(compressedFile);
      } else {
        setEditFormData(prev => ({ ...prev, image: compressedFile }));
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (mode === 'add') {
          setImagePreview(reader.result as string);
        }
        showToast(`Image compressed to ${(compressedFile.size / 1024).toFixed(1)}KB`, "success");
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error("Error processing image:", error);
      showToast("Failed to process image", "error");
    }
  }, [showToast]);

  // Render image upload field
  const renderImageUploadField = (mode: 'add' | 'edit') => {
    const currentImage = mode === 'edit' && editingPoliceUser?.image_url
      ? editingPoliceUser.image_url
      : imagePreview;

    const hasImage = Boolean(currentImage);
    const currentFile =
      mode === 'add'
        ? imageFile
        : editFormData.image instanceof File
        ? editFormData.image
        : null;

    return (
      <div className="space-y-2">
        <div className="flex gap-4">
          {/* Image Box (Reduced size: 90x90 → 64x64) */}
          <div className="relative">
            <div
              className={`h-17 w-17 rounded-md border ${
                hasImage ? "border-gray-300" : "border-dashed border-gray-300"
              } overflow-hidden bg-gray-50 flex items-center justify-center`}
            >
              {hasImage ? (
                <img
                  src={currentImage}
                  className="h-full w-full object-cover"
                  alt="Preview"
                />
              ) : (
                <span className="text-[10px] text-gray-400 text-center px-1">
                  Upload Image
                </span>
              )}
            </div>

            {/* Upload button (reduced size) */}
            <label className="block text-xs mt-1 cursor-pointer text-blue-600 text-center hover:underline">
              <input
                type="file"
                accept=".jpg,.png,.jpeg"
                onChange={(e) => handleImageChange(e, mode)}
                className="hidden"
              />
              {hasImage ? "Change" : "Upload"}
            </label>

            {/* Remove button (smaller) */}
            {hasImage && (
              <button
                type="button"
                onClick={() => {
                  if (mode === "add") {
                    setImageFile(null);
                    setImagePreview("");
                  } else {
                    setEditFormData((prev) => ({
                      ...prev,
                      image: null,
                      image_url: "",
                    }));
                  }
                }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Info Panel (reduced height, smaller text) */}
          <div className="flex-1">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-2">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                Image Requirements
              </p>
              <ul className="text-[10px] text-gray-600 space-y-0.5">
                <li>• JPG / PNG / JPEG</li>
                <li>• Max Size: 10KB (auto-compressed)</li>
              </ul>

              {/* Selected File Info (smaller) */}
              {currentFile && (
                <div className="mt-2 border-t pt-1 border-blue-100">
                  <p className="text-[10px] text-gray-700 font-medium">
                    Selected File:
                  </p>
                  <p className="text-[10px] text-gray-600 truncate">
                    {currentFile.name}
                  </p>
                  <p className="text-[10px] text-green-600">
                    Size: {(currentFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              {/* Edit mode existing image info */}
              {mode === "edit" && editingPoliceUser?.image_url && !currentFile && (
                <div className="mt-2 border-t pt-1 border-blue-100">
                  <p className="text-[10px] text-gray-700 font-medium">
                    Current Image:
                  </p>
                  <a
                    href={editingPoliceUser.image_url}
                    target="_blank"
                    className="text-[10px] text-blue-600 underline"
                  >
                    View full image
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dropdown click handlers for edit mode
  const handleStateDropdownClick = useCallback(async (countryId: string | number, editMode: boolean = false) => {
    if (!countryId) {
      if (!editMode) showToast("Please select a country first", "error");
      return;
    }
    const states = await fetchByParentId(`/states/country/${countryId}`, countryId.toString(), "states");
    return states;
  }, [fetchByParentId, showToast]);

  const handleDistrictDropdownClick = useCallback(async (stateId: string | number, editMode: boolean = false) => {
    if (!stateId) {
      if (!editMode) showToast("Please select a state first", "error");
      return;
    }
    const districts = await fetchByParentId(`/districts/state/${stateId}`, stateId.toString(), "districts");
    return districts;
  }, [fetchByParentId, showToast]);

  const handleCityDropdownClick = useCallback(async (districtId: string | number, editMode: boolean = false) => {
    if (!districtId) {
      if (!editMode) showToast("Please select a district first", "error");
      return;
    }
    const cities = await fetchByParentId(`/cities/district/${districtId}`, districtId.toString(), "cities");
    return cities;
  }, [fetchByParentId, showToast]);

  const handleSDPODropdownClick = useCallback(async (cityId: string | number, editMode: boolean = false) => {
    if (!cityId) {
      if (!editMode) showToast("Please select a city first", "error");
      return;
    }
    const sdpos = await fetchByParentId(`/sdpo/city/${cityId}`, cityId.toString(), "sdpo");
    return sdpos;
  }, [fetchByParentId, showToast]);

  const handlePoliceStationDropdownClick = useCallback(async (sdpoId: string | number, editMode: boolean = false) => {
    if (!sdpoId) {
      if (!editMode) showToast("Please select an SDPO first", "error");
      return;
    }
    const policeStations = await fetchByParentId(`/police-stations/by-sdpo/${sdpoId}`, sdpoId.toString(), "policeStations");
    return policeStations;
  }, [fetchByParentId, showToast]);

  // Helper function to find item by id in an array
  const findItemById = (items: DropdownItem[], id: string | number) => {
    return items.find(item => item.id.toString() === id.toString());
  };

  // Function to pre-fetch and pre-populate dropdown data for edit mode
  const preFetchEditDropdownData = useCallback(async (formData: Record<string, any>) => {
    try {
      const newFilteredData = { ...filteredData };
      
      // Only fetch countries if not already loaded
      if (countries.length === 0) {
        await fetchCountries();
      }
      
      // Fetch states if country_id exists
      if (formData.country_id) {
        const states = await handleStateDropdownClick(formData.country_id, true);
        if (states.length > 0) {
          newFilteredData.states = states;
        }
      }
      
      // Fetch districts if state_id exists
      if (formData.state_id) {
        const districts = await handleDistrictDropdownClick(formData.state_id, true);
        if (districts.length > 0) {
          newFilteredData.districts = districts;
        }
      }
      
      // Fetch cities if district_id exists
      if (formData.district_id) {
        const cities = await handleCityDropdownClick(formData.district_id, true);
        if (cities.length > 0) {
          newFilteredData.cities = cities;
        }
      }
      
      // Fetch SDPOs if city_id exists
      if (formData.city_id) {
        const sdpos = await handleSDPODropdownClick(formData.city_id, true);
        if (sdpos.length > 0) {
          newFilteredData.sdpo = sdpos;
        }
      }
      
      // Fetch police stations if sdpo_id exists
      if (formData.sdpo_id) {
        const policeStations = await handlePoliceStationDropdownClick(formData.sdpo_id, true);
        if (policeStations.length > 0) {
          newFilteredData.policeStations = policeStations;
        }
      }
      
      // Fetch designations if not loaded
      if (dropdownData.designations.length === 0) {
        await fetchDropdownData('/designations', 'designations');
      } else {
        newFilteredData.designations = dropdownData.designations;
      }
      
      setFilteredData(newFilteredData);
      
      // Add current values as options if they don't exist in the fetched data
      // This ensures the current value is always selectable
      const addCurrentValueIfMissing = (data: DropdownItem[], currentId: string, currentName: string) => {
        if (!currentId) return data;
        
        const exists = data.some(item => item.id.toString() === currentId);
        if (!exists && currentName) {
          return [
            ...data,
            {
              id: parseInt(currentId),
              name: currentName,
              [currentName.toLowerCase().includes('state') ? 'state_name' : 
               currentName.toLowerCase().includes('district') ? 'district_name' :
               currentName.toLowerCase().includes('city') ? 'city_name' :
               currentName.toLowerCase().includes('station') ? 'station_name' : 'name']: currentName
            }
          ];
        }
        return data;
      };
      
      // Add current values to filtered data
      setFilteredData(prev => ({
        ...prev,
        states: addCurrentValueIfMissing(prev.states, formData.state_id, editingPoliceUser?.state_name || ""),
        districts: addCurrentValueIfMissing(prev.districts, formData.district_id, editingPoliceUser?.district_name || ""),
        cities: addCurrentValueIfMissing(prev.cities, formData.city_id, editingPoliceUser?.city_name || ""),
        sdpo: addCurrentValueIfMissing(prev.sdpo, formData.sdpo_id, editingPoliceUser?.sdpo_name || ""),
        policeStations: addCurrentValueIfMissing(prev.policeStations, formData.police_station_id, editingPoliceUser?.station_name || "")
      }));
      
    } catch (error) {
      console.error("Error pre-fetching dropdown data:", error);
    }
  }, [
    filteredData, 
    countries, 
    fetchCountries, 
    handleStateDropdownClick, 
    handleDistrictDropdownClick, 
    handleCityDropdownClick, 
    handleSDPODropdownClick, 
    handlePoliceStationDropdownClick, 
    fetchDropdownData, 
    dropdownData.designations,
    editingPoliceUser
  ]);

  // Field configuration
  const getPoliceUserFields = useCallback((mode: 'add' | 'edit' = 'add'): FieldConfig[] => {
    const isEditMode = mode === 'edit';
    const currentFormData = isEditMode ? editFormData : null;

    const baseFields: FieldConfig[] = [
      { 
        name: 'police_name', 
        label: 'Name*', 
        type: 'text', 
        placeholder: 'Enter Name', 
        required: true, 
        defaultValue: currentFormData?.police_name || "", 
        customProps: createFieldProps() 
      },
      
      ...(isEditMode ? [] : [
        { 
          name: 'password', 
          label: 'Password*', 
          type: 'password', 
          placeholder: 'Enter password', 
          required: true, 
          customProps: createFieldProps() 
        }
      ]),
      
      { 
        name: 'mobile', 
        label: 'Mobile*', 
        type: 'text', 
        placeholder: 'Enter mobile no', 
        required: true, 
        defaultValue: currentFormData?.mobile || "", 
        customProps: createFieldProps() 
      },
      
      { 
        name: 'email', 
        label: 'Email*', 
        type: 'email', 
        placeholder: 'Enter email', 
        required: true, 
        defaultValue: currentFormData?.email || "", 
        customProps: createFieldProps() 
      },
      
      // Designation Type
      {
        name: 'designation_type', 
        label: 'Designation Type*', 
        type: 'select' as const, 
        required: true,
        options: [
          { value: 'SDPO', label: 'SDPO' },
          { value: 'Head_Person', label: 'Head Person' },
          { value: 'Station_Head', label: 'Station Head' },
          { value: 'Police', label: 'Police' },
          { value: 'Admin', label: 'Admin' }
        ],
        defaultValue: currentFormData?.designation_type || "Police",
        customProps: createFieldProps({
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
            const type = e.target.value;
            if (isEditMode) {
              setEditFormData(prev => ({ 
                ...prev, 
                designation_type: type, 
                designation_id: '',
              }));
            } else {
              setSelectedIds(prev => ({ ...prev, designationType: type }));
            }
          }
        })
      },

      // Designation ID
      {
        name: 'designation_id', 
        label: 'Designation*', 
        type: 'select' as const, 
        required: true,
        options: (isEditMode ? filteredData.designations : dropdownData.designations).map(item => ({ 
          value: item.id.toString(),
          label: item.name || item.police_name || ""
        })),
        placeholder: isLoading.designations ? "Loading..." : 
          (isEditMode && filteredData.designations.length === 0) 
            ? "Designation loaded" 
            : "Select Designation",
        defaultValue: currentFormData?.designation_id || "",
        customProps: createFieldProps({
          ...(isClient && isEditMode && filteredData.designations.length === 0 && {
            onMouseDown: () => fetchDropdownData('/designations', 'designations'),
            onFocus: () => fetchDropdownData('/designations', 'designations')
          }),
          ...(!isEditMode && isClient && {
            onMouseDown: () => handleDropdownClick('designations', () => fetchDropdownData('/designations', 'designations')),
            onFocus: () => handleDropdownClick('designations', () => fetchDropdownData('/designations', 'designations'))
          })
        })
      },

      // Department ID (hardcoded as per your payload)
      { 
        name: 'department_id', 
        label: 'Department ID*', 
        type: 'text', 
        placeholder: 'Enter Department ID', 
        required: true, 
        defaultValue: '2',
        customProps: createFieldProps() 
      },  
      
      { 
        name: 'gender', 
        label: 'Gender*', 
        type: 'select' as const, 
        required: true, 
        defaultValue: currentFormData?.gender || "Male",
        options: [
          { value: 'Male', label: 'Male' }, 
          { value: 'Female', label: 'Female' }, 
          { value: 'Others', label: 'Others' }
        ],
        customProps: createFieldProps()
      },
      
      // Country field
      {
        name: 'country_id',
        label: 'Country name :',
        type: 'select',
        required: true,
        options: countries.map(country => ({ 
          value: country.id.toString(), 
          label: country.country_name || country.name || ""
        })),
        placeholder: isCountriesLoading ? "Loading countries..." : 
                    (countries.length === 0 ? "Click to load countries" : "Select Country"),
        defaultValue: isEditMode ? currentFormData?.country_id : selectedIds.country,
        customProps: {
          ...createFieldProps(),
          onMouseDown: handleCountryDropdownClick,
          onFocus: handleCountryDropdownClick,
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => { 
            const countryId = e.target.value;
            
            // Reset dependent fields
            const resetData = {
              state_id: '',
              district_id: '',
              city_id: '',
              sdpo_id: '',
              police_station_id: ''
            };

            if (isEditMode) {
              setEditFormData(prev => ({ 
                ...prev, 
                country_id: countryId,
                ...resetData
              }));
              setFilteredData(prev => ({
                ...prev,
                states: [],
                districts: [],
                cities: [],
                sdpo: [],
                policeStations: []
              }));
            } else {
              setSelectedIds(prev => ({
                ...prev,
                country: countryId,
                state: "",
                district: "",
                sdpo: ""
              }));
            }

            // Clear lower dropdowns
            setFilteredData(prev => ({
              ...prev,
              states: [],
              districts: [],
              cities: [],
              sdpo: [],
              policeStations: []
            }));

            // Fetch states by country
            if (countryId) {
              await fetchByParentId(`/states/country/${countryId}`, countryId, "states");
            }
          },
        }
      },    
      
      // State (dependent on country)
      {
        name: 'state_id', 
        label: 'State*', 
        type: 'select' as const, 
        required: true,
        disabled: isEditMode ? !currentFormData?.country_id : !selectedIds.country,
        options: filteredData.states.map(item => ({
          value: item.id.toString(), 
          label: item.state_name || item.name || ""
        })),
        placeholder: isLoading.states ? "Loading..." : 
          (isEditMode && currentFormData?.country_id && filteredData.states.length === 0) 
            ? "Click to load states" 
            : (selectedIds.country ? "Select State" : "Please select country first"),
        defaultValue: currentFormData?.state_id || "",
        customProps: createFieldProps({
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const stateId = e.target.value;
            const resetData = { district_id: '', city_id: '', sdpo_id: '', police_station_id: '' };
            
            if (isEditMode) {
              setEditFormData(prev => ({ ...prev, state_id: stateId, ...resetData }));
              setFilteredData(prev => ({ ...prev, districts: [], cities: [], sdpo: [], policeStations: [] }));
            } else {
              setSelectedIds(prev => ({ ...prev, state: stateId, district: "", sdpo: "" }));
            }
            
            await fetchByParentId(`/districts/state/${stateId}`, stateId, 'districts');
            setFilteredData(prev => ({ ...prev, cities: [], sdpo: [], policeStations: [] }));
          },
          // Add click handler for edit mode
          ...(isEditMode && currentFormData?.country_id && {
            onMouseDown: () => handleStateDropdownClick(currentFormData.country_id, true),
            onFocus: () => handleStateDropdownClick(currentFormData.country_id, true)
          })
        })
      },
      
      // District
      {
        name: 'district_id', 
        label: 'District*', 
        type: 'select' as const, 
        required: true,
        disabled: isEditMode ? !currentFormData?.state_id : !selectedIds.state,
        options: filteredData.districts.map(item => ({
          value: item.id.toString(), 
          label: item.district_name || item.name || ""
        })),
        placeholder: isLoading.districts ? "Loading..." : 
          (isEditMode && currentFormData?.state_id && filteredData.districts.length === 0) 
            ? "Click to load districts" 
            : (selectedIds.state ? "Select District" : "Please select state first"),
        defaultValue: currentFormData?.district_id || "",
        customProps: createFieldProps({
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const districtId = e.target.value;
            const resetData = { city_id: '', sdpo_id: '', police_station_id: '' };
            
            if (isEditMode) {
              setEditFormData(prev => ({ ...prev, district_id: districtId, ...resetData }));
              setFilteredData(prev => ({ ...prev, cities: [], sdpo: [], policeStations: [] }));
            } else {
              setSelectedIds(prev => ({ ...prev, district: districtId, sdpo: "" }));
            }
            
            await Promise.all([
              fetchByParentId(`/cities/district/${districtId}`, districtId, 'cities'),
            ]);
          },
          // Add click handler for edit mode
          ...(isEditMode && currentFormData?.state_id && {
            onMouseDown: () => handleDistrictDropdownClick(currentFormData.state_id, true),
            onFocus: () => handleDistrictDropdownClick(currentFormData.state_id, true)
          })
        })
      },
      
      // City
      {
        name: "city_id",
        label: "City*",
        type: "select",
        required: true,
        disabled: isEditMode ? !currentFormData?.district_id : !selectedIds.district,
        options: filteredData.cities.map(item => ({
          value: item.id.toString(),
          label: item.city_name || item.name || ""
        })),
        placeholder: isLoading.cities ? "Loading..." : 
          (isEditMode && currentFormData?.district_id && filteredData.cities.length === 0) 
            ? "Click to load cities" 
            : "Select City",
        defaultValue: currentFormData?.city_id || "",
        customProps: {
          ...createFieldProps(),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const cityId = e.target.value;

            // Reset children dropdowns
            if (isEditMode) {
              setEditFormData(prev => ({
                ...prev,
                city_id: cityId,
                sdpo_id: "",
                police_station_id: ""
              }));
              setFilteredData(prev => ({ ...prev, sdpo: [], policeStations: [] }));
            } else {
              setSelectedIds(prev => ({
                ...prev,
                city: cityId,
                sdpo: ""
              }));
            }

            // Fetch SDPO by CITY
            await fetchByParentId(`/sdpo/city/${cityId}`, cityId, "sdpo");

            // Reset stations list
            setFilteredData(prev => ({
              ...prev,
              policeStations: []
            }));
          },
          // Add click handler for edit mode
          ...(isEditMode && currentFormData?.district_id && {
            onMouseDown: () => handleCityDropdownClick(currentFormData.district_id, true),
            onFocus: () => handleCityDropdownClick(currentFormData.district_id, true)
          })
        }
      },
      
      // SDPO
      {
        name: "sdpo_id",
        label: "SDPO*",
        type: "select",
        required: true,
        disabled: isEditMode ? !currentFormData?.city_id : !selectedIds.city,
        options: filteredData.sdpo.map(item => ({
          value: item.id.toString(),
          label: item.name || ""
        })),
        placeholder: isLoading.sdpo ? "Loading..." : 
          (isEditMode && currentFormData?.city_id && filteredData.sdpo.length === 0) 
            ? "Click to load SDPOs" 
            : "Select SDPO",
        defaultValue: currentFormData?.sdpo_id || "",
        customProps: {
          ...createFieldProps(),
          onChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const sdpoId = e.target.value;

            if (isEditMode) {
              setEditFormData(prev => ({
                ...prev,
                sdpo_id: sdpoId,
                police_station_id: ""
              }));
              setFilteredData(prev => ({ ...prev, policeStations: [] }));
            } else {
              setSelectedIds(prev => ({
                ...prev,
                sdpo: sdpoId
              }));
            }

            // Fetch Police Stations by SDPO
            await fetchByParentId(`/police-stations/by-sdpo/${sdpoId}`, sdpoId, "policeStations");
          },
          // Add click handler for edit mode
          ...(isEditMode && currentFormData?.city_id && {
            onMouseDown: () => handleSDPODropdownClick(currentFormData.city_id, true),
            onFocus: () => handleSDPODropdownClick(currentFormData.city_id, true)
          })
        }
      },
      
      // Police Station
      {
        name: 'police_station_id', 
        label: 'Police Station*', 
        type: 'select' as const, 
        required: true,
        disabled: isEditMode ? !currentFormData?.sdpo_id : !selectedIds.sdpo,
        options: filteredData.policeStations.map(item => ({
          value: item.id.toString(), 
          label: item.station_name || item.name || ""
        })),
        placeholder: isLoading.policeStations ? "Loading..." : 
          (isEditMode && currentFormData?.sdpo_id && filteredData.policeStations.length === 0) 
            ? "Click to load police stations" 
            : (selectedIds.sdpo ? "Select Police Station" : "Please select SDPO first"),
        defaultValue: currentFormData?.police_station_id || "",
        customProps: {
          ...createFieldProps(),
          // Add click handler for edit mode
          ...(isEditMode && currentFormData?.sdpo_id && {
            onMouseDown: () => handlePoliceStationDropdownClick(currentFormData.sdpo_id, true),
            onFocus: () => handlePoliceStationDropdownClick(currentFormData.sdpo_id, true)
          })
        }
      },
            
      // Other fields
      { 
        name: 'pincode', 
        label: 'Pincode*', 
        type: 'text', 
        placeholder: 'Enter pincode', 
        required: true, 
        defaultValue: currentFormData?.pincode || "", 
        customProps: createFieldProps() 
      },
      
      { 
        name: 'aadhar_number', 
        label: 'Aadhar Number*', 
        type: 'text', 
        placeholder: 'Enter Aadhar Number', 
        required: true, 
        defaultValue: currentFormData?.aadhar_number || "", 
        customProps: createFieldProps() 
      },
      
      { 
        name: 'pan_number', 
        label: 'Pan Number*', 
        type: 'text', 
        placeholder: 'Enter Pan Number', 
        required: true, 
        defaultValue: currentFormData?.pan_number || "", 
        customProps: createFieldProps() 
      },
      
      { 
        name: 'buckal_number', 
        label: 'Buckal Number*', 
        type: 'text', 
        placeholder: 'Enter Buckal Number', 
        required: true, 
        defaultValue: currentFormData?.buckal_number || "", 
        customProps: createFieldProps() 
      },
      
      { 
        name: 'address', 
        label: 'Address*', 
        type: 'textarea', 
        placeholder: 'Enter address', 
        required: true, 
        defaultValue: currentFormData?.address || "", 
        customProps: createFieldProps({ rows: 3 }) 
      },
      
      // Image upload
      {
        name: 'image_upload', 
        label: 'Profile Image', 
        type: 'custom' as const,
        customElement: renderImageUploadField(mode),
      },
    ];

    // Add status field for edit mode
    if (isEditMode) {
      baseFields.push({
        name: 'status', 
        label: 'Status*', 
        type: 'select' as const, 
        required: true,
        options: [
          { value: 'Active', label: 'Active' }, 
          { value: 'Inactive', label: 'Inactive' }
        ],
        defaultValue: currentFormData?.status || "Active",
        customProps: createFieldProps()
      });
    }

    return baseFields;
  }, [
    countries, isCountriesLoading, dropdownData, filteredData, isLoading, selectedIds, 
    editFormData, editingPoliceUser, imagePreview, isClient, handleCountryDropdownClick,
    fetchByParentId, fetchDropdownData, handleDropdownClick,
    handleStateDropdownClick, handleDistrictDropdownClick, handleCityDropdownClick,
    handleSDPODropdownClick, handlePoliceStationDropdownClick, showToast
  ]);

  // Memoized field configurations
  const addPoliceUserFields = useMemo(() => getPoliceUserFields('add'), [getPoliceUserFields]);
  const editPoliceUserFields = useMemo(() => getPoliceUserFields('edit'), [getPoliceUserFields]);

  // CRUD Operations
  const handleAddPoliceUser = useCallback(async (formData: Record<string, string>) => {
    try {
      console.log("Form Data Received:", formData);
      
      const formDataToSend = new FormData();
      
      // Create payload matching your API expectations
      const payload = {
        police_name: formData.police_name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        designation_type: formData.designation_type,
        designation_id: formData.designation_id,
        gender: formData.gender,
        country_id: parseInt(formData.country_id) || 1,
        state_id: parseInt(formData.state_id) || 1,
        district_id: parseInt(formData.district_id) || 2,
        city_id: parseInt(formData.city_id) || 3,
        sdpo_id: parseInt(formData.sdpo_id) || 5,
        police_station_id: parseInt(formData.police_station_id) || 2,
        pincode: formData.pincode,
        aadhar_number: formData.aadhar_number,
        pan_number: formData.pan_number,
        buckal_number: formData.buckal_number,
        address: formData.address,
        department_id: parseInt(formData.department_id) || 2,
        otp: "1234",
        latitude: "17.6800",
        longitude: "73.9850"
      };

      // Append all fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      // Append compressed image file if exists
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      // Log the payload for debugging
      console.log('Sending payload:', Object.fromEntries(formDataToSend));

      // Send the request
      const response = await api.post("/mst-police", formDataToSend, { 
        headers: { 
          'Content-Type': 'multipart/form-data' 
        } 
      });
      
      console.log("API Response:", response);
      
      if (response.success) {
        // Refresh data
        fetchPoliceUsers(pagination.pageIndex, pagination.pageSize, searchQuery);
        
        // Reset form
        setImageFile(null);
        setImagePreview("");
        setSelectedIds({ country: "", state: "", district: "", sdpo: "", designationType: "" });
        setFilteredData({
          states: [],
          districts: [],
          cities: [],
          designations: [],
          sdpo: [],
          policeStations: [],
        });
        showToast("Police User added successfully!", "success");
      } else {
        throw new Error(response.message || "Failed to add police user");
      }
      
    } catch (error: any) {
      console.error("Error adding police user:", error);
      showToast(error.message || "Error adding police user. Please try again.", "error");
    }
  }, [fetchPoliceUsers, pagination.pageIndex, pagination.pageSize, searchQuery, showToast, imageFile]);

  const handleEdit = useCallback(async (user: PoliceUserRow) => {
    try {
      setEditingPoliceUser(user);
      
      // Hit the API to get full user data
      const response = await api.get(`/mst-police/${user.id}`);
      const fullData = response?.data?.data || response?.data || response;
      
      console.log("Edit API Response:", fullData);
      
      if (!fullData) {
        showToast("Failed to load Police User details.", "error");
        return;
      }

      // Map form data
      const formData = {
        police_name: fullData.police_name || fullData.name || "",
        email: fullData.email || "",
        mobile: fullData.mobile?.toString() || "",
        password: "",
        designation_type: fullData.designation_type || "",
        designation_id: fullData.designation_id?.toString() || "",
        gender: fullData.gender || "Male",
        country_id: fullData.country_id?.toString() || "",
        state_id: fullData.state_id?.toString() || "",
        district_id: fullData.district_id?.toString() || "",
        city_id: fullData.city_id?.toString() || "",
        pincode: fullData.pincode?.toString() || "",
        aadhar_number: fullData.aadhar_number || "",
        pan_number: fullData.pan_number || "",
        buckal_number: fullData.buckal_number?.toString() || "",
        address: fullData.address || "",
        status: fullData.status || "Active",
        sdpo_id: fullData.sdpo_id?.toString() || "",
        police_station_id: fullData.police_station_id?.toString() || fullData.station_id?.toString() || "",
        department_id: fullData.department_id?.toString() || "2",
        image: fullData.image || fullData.image_url || ""
      };

      console.log("Form Data after mapping:", formData);
      
      setEditFormData(formData);
      
      // Set selected IDs for cascading dropdowns
      setSelectedIds({
        country: fullData.country_id?.toString() || "",
        state: fullData.state_id?.toString() || "",
        district: fullData.district_id?.toString() || "",
        sdpo: fullData.sdpo_id?.toString() || "",
        designationType: fullData.designation_type || "",
      });

      // Pre-fetch and pre-populate dropdown data
      await preFetchEditDropdownData(formData);

      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error loading Police User details:", error);
      showToast("Failed to load Police User details. Please try again.", "error");
    }
  }, [showToast, preFetchEditDropdownData]);

  const handleUpdate = useCallback(async (formData: Record<string, string>) => {
    if (!editingPoliceUser) return;

    try {
      setSaveLoading(true);
      const formDataToSend = new FormData();
      
      // Validate police_station_id before parsing
      const policeStationId = formData.police_station_id;
      if (!policeStationId || policeStationId.trim() === "") {
        showToast("Police Station is required", "error");
        setSaveLoading(false);
        return;
      }

      // Create payload matching API expectations - using correct field names
      const payload = {
        police_name: formData.police_name,
        email: formData.email,
        mobile: formData.mobile,
        designation_type: formData.designation_type,
        designation_id: formData.designation_id,
        gender: formData.gender,
        country_id: parseInt(formData.country_id),
        state_id: parseInt(formData.state_id),
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        sdpo_id: parseInt(formData.sdpo_id),
        police_station_id: parseInt(policeStationId),
        pincode: formData.pincode,
        aadhar_number: formData.aadhar_number,
        pan_number: formData.pan_number,
        buckal_number: formData.buckal_number,
        address: formData.address,
        status: formData.status,
        department_id: parseInt(formData.department_id) || 2
      };

      // Validate all required numeric fields
      const numericFields = [
        'country_id', 'state_id', 'district_id', 'city_id', 
        'sdpo_id', 'police_station_id', 'designation_id', 'department_id'
      ];
      
      for (const field of numericFields) {
        if (isNaN(payload[field as keyof typeof payload] as number)) {
          showToast(`Invalid value for ${field.replace('_', ' ')}`, "error");
          setSaveLoading(false);
          return;
        }
      }

      // Append all fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      // Append password only if provided
      if (formData.password) {
        formDataToSend.append('password', formData.password);
      }

      // Append image if it's a File (compressed)
      if (editFormData.image instanceof File) {
        formDataToSend.append('image', editFormData.image);
      }

      console.log("Update payload:", Object.fromEntries(formDataToSend));
      
      const response = await api.put(`/mst-police/${editingPoliceUser.id}`, formDataToSend, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      console.log("Update response:", response);
      
      fetchPoliceUsers(pagination.pageIndex, pagination.pageSize, searchQuery);
      setIsEditModalOpen(false);
      setEditingPoliceUser(null);
      setEditFormData({ police_name: "", email: "", mobile: "", password: "", designation_type: "", designation_id: "",
        gender: "Male", country_id: "", state_id: "", district_id: "", city_id: "", sdpo_id: "",
        police_station_id: "", pincode: "", aadhar_number: "", pan_number: "", buckal_number: "",
        address: "", status: "Active", image: "", department_id: "2" });
      showToast("Police User updated successfully!", "success");
    } catch (error) {
      console.error("Error updating police user:", error);
      showToast("Error updating police user. Please try again.", "error");
    } finally {
      setSaveLoading(false);
    }
  }, [editingPoliceUser, fetchPoliceUsers, pagination.pageIndex, pagination.pageSize, searchQuery, showToast, editFormData]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    try {
      await api.delete(`/mst-police/${id}`);
      await fetchPoliceUsers(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("Police User deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting police user:", error);
      showToast("Error deleting police user. Please try again.", "error");
      throw error;
    }
  }, [fetchPoliceUsers, pagination.pageIndex, pagination.pageSize, searchQuery, showToast]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPoliceUser(null);
    setSelectedIds({ country: "", state: "", district: "", sdpo: "", designationType: "" });
    setEditFormData({ police_name: "", email: "", mobile: "", password: "", designation_type: "", designation_id: "",
      gender: "Male", country_id: "", state_id: "", district_id: "", city_id: "", sdpo_id: "",
      police_station_id: "", pincode: "", aadhar_number: "", pan_number: "", buckal_number: "",
      address: "", status: "Active", image: "", department_id: "2" });
    setFilteredData({
      states: [],
      districts: [],
      cities: [],
      designations: [],
      sdpo: [],
      policeStations: [],
    });
  }, []);

  // Table columns
  const columns: ColumnDef<PoliceUserRow>[] = useMemo(() => [
    { 
      accessorKey: "police_name", 
      header: "Name", 
      cell: ({ row }) => <span className="font-medium text-black">{row.original.police_name}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "email", 
      header: "Email", 
      cell: ({ row }) => <span className="text-black">{row.original.email}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "mobile", 
      header: "Mobile", 
      cell: ({ row }) => <span className="text-black">{row.original.mobile}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "designation_type", 
      header: "Designation Type", 
      cell: ({ row }) => <span className="text-black">{row.original.designation_type}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "designation_name", 
      header: "Designation Name", 
      cell: ({ row }) => <span className="text-black">{row.original.designation_name}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "state_name", 
      header: "State", 
      cell: ({ row }) => <span className="text-black">{row.original.state_name || "N/A"}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "district_name", 
      header: "District", 
      cell: ({ row }) => <span className="text-black">{row.original.district_name || "N/A"}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "sdpo_name", 
      header: "SDPO Name", 
      cell: ({ row }) => <span className="text-black">{row.original.sdpo_name || "N/A"}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "station_name", 
      header: "Station Name", 
      cell: ({ row }) => <span className="text-black">{row.original.station_name || "N/A"}</span>, 
      enableSorting: true 
    },
    { 
      accessorKey: "status", 
      header: "Status", 
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {row.original.status || "Active"}
        </span>
      ), 
      enableSorting: true 
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
          <AlertPopover
            trigger={
              <button className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200">
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
      enableSorting: false 
    },
  ], [handleEdit, handleDeleteConfirm]);

  // Table configuration
  const { tableElement, table } = CustomTable<PoliceUserRow>({
    data: policeUsers, 
    columns, 
    pagination, 
    totalCount, 
    loading,
    onPaginationChange: setPagination, 
    onSortingChange: setSorting, 
    sorting,
    emptyMessage: "No Police Users available", 
    pageSizeOptions: [5,10, 20, 30, 50],
    enableSorting: true, 
    manualSorting: false, 
    manualPagination: true,
    showSerialNumber: true, 
    serialNumberHeader: "S.NO.", 
    maxHeight: "500px",
    headerBgColor: "#E7EDFD", 
    headerTextColor: "#000000", 
    getRowId: (row) => row.id,
    columnVisibility, 
    onColumnVisibilityChange: setColumnVisibility,
  });

  // Export handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    return [];
  }, []);

  const handleExportPdf = useCallback(() => {
    const pdfConfig: ExportPdfOptions = {
      filename: `police-user-master-report-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`,
      title: "Police User Master Report", 
      orientation: "landscape", 
      pageSize: "a4",
      columns: [
        { header: "Name", accessorKey: "police_name" }, 
        { header: "Email", accessorKey: "email" },
        { header: "Mobile", accessorKey: "mobile" }, 
        { header: "Designation Type", accessorKey: "designation_type" },
        { header: "Designation Name", accessorKey: "designation_name" }, 
        { header: "State", accessorKey: "state_name" },
        { header: "District", accessorKey: "district_name" }, 
        { header: "SDPO Name", accessorKey: "sdpo_name" },
        { header: "Station Name", accessorKey: "station_name" },
        { 
          header: "Status", 
          accessorKey: "status", 
          formatter: (value) => value === "Active" ? "Active" : "Inactive" 
        },
      ],
      data: policeUsers, 
      showSerialNumber: true, 
      serialNumberHeader: "S.NO.",
      projectName: "E-Police", 
      exportDate: true, 
      showTotalCount: true,
      searchQuery: searchQuery || "All Police Users", 
      userRole: "admin",
    };
    
    const result = exportToPdf(pdfConfig);
    showToast(result.success ? "PDF exported successfully!" : "Failed to export PDF", result.success ? "success" : "error");
  }, [exportToPdf, policeUsers, searchQuery, showToast]);

  const handleExportExcel = useCallback(async () => {
  try {
    const response = await api.getBlob("/mst-police/export/excel");

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `police-users-${Date.now()}.xlsx`;
    link.click();

    showToast("Police User Excel downloaded successfully!", "success");
  } catch (error) {
    console.error("❌ Excel Download Error:", error);
    showToast("Failed to download police user excel", "error");
  }
}, [showToast]);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
      
      <AddSection 
        title="Add Police User"
        fields={addPoliceUserFields}
        onSubmit={handleAddPoliceUser}
        submitButtonText="Add Police User"
      />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButtons pdfConfig={{}} onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} onPrint={handlePrint} />
            <div className="relative" style={{ minHeight: "40px", minWidth: "180px" }}>
              {isClient && <ColumnVisibilitySelector columns={table.getAllColumns()} backgroundColor="#EACEFF" textColor="#000000" />}
            </div>
          </div>
          <div className="w-full max-w-xs">
            <SearchComponent 
              placeholder="Search Police Users..." 
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
        onClose={closeEditModal} 
        onSubmit={handleUpdate} 
        title={`Edit Police User - ID: ${editingPoliceUser?.id || ''}`} 
        fields={editPoliceUserFields} 
        isLoading={saveLoading} 
      />
    </div>
  );
}