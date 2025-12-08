"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CustomTable, ColumnDef, PaginationState, SortingState } from "@/component/ui/Table/CustomTable";
import AddSection, { FieldConfig } from "@/component/ui/add-section/add-section";
import SearchComponent from "@/component/ui/SearchBar/searchBar";
import { ExportButtons } from "@/component/ui/Export-Buttons/export-Buttons";
import { ColumnVisibilitySelector } from "@/component/ui/Column-Visibility/column-visibility";
import { AlertPopover, Toast } from "@/component/ui/AlertPopover";
import EditModal from "@/component/ui/EditModal/editModal";
import { useExportPdf, ExportPdfOptions } from "@/hook/UseExportPdf/useExportPdf";
import { usePoliceUsers } from "@/hook/PoliceUser/usePoliceUsers";
import { policeUserService } from "@/services/api-services/policeUserService";
import { PoliceUser, DropdownItem } from "@/interface/interface";

const compressImage = async (file: File, maxSizeKB = 10): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 300, MAX_HEIGHT = 300;
        let width = img.width, height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Canvas to Blob conversion failed")); return; }
          if (blob.size <= maxSizeKB * 1024) {
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          } else {
            canvas.toBlob((finalBlob) => {
              if (!finalBlob) { reject(new Error("Final compression failed")); return; }
              resolve(new File([finalBlob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            }, "image/jpeg", 0.5);
          }
        }, "image/jpeg", 0.7);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const createAddPoliceUserFormData = (formData: Record<string, string>, imageFile: File | null): FormData => {
  const formDataToSend = new FormData();
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
    longitude: "73.9850",
  };
  Object.entries(payload).forEach(([key, value]) => {
    formDataToSend.append(key, value.toString());
  });
  if (imageFile) formDataToSend.append("image", imageFile);
  return formDataToSend;
};

const createUpdatePoliceUserFormData = (formData: Record<string, string>, editFormData: Record<string, any>): FormData => {
  const formDataToSend = new FormData();
  const policeStationId = formData.police_station_id;
  if (!policeStationId || policeStationId.trim() === "") throw new Error("Police Station is required");
  
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
    department_id: parseInt(formData.department_id) || 2,
  };
  Object.entries(payload).forEach(([key, value]) => {
    formDataToSend.append(key, value.toString());
  });
  if (formData.password) formDataToSend.append("password", formData.password);
  if (editFormData.image instanceof File) formDataToSend.append("image", editFormData.image);
  return formDataToSend;
};

const createFieldProps = (customProps: any = {}) => ({
  className: "w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400",
  ...customProps,
});

const renderImageUploadField = (
  mode: "add" | "edit",
  imagePreview: string,
  imageFile: File | null,
  editingPoliceUser: PoliceUser | null,
  editFormData: Record<string, any>,
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>, mode: "add" | "edit") => Promise<void>,
  onRemoveImage: (mode: "add" | "edit") => void
) => {
  const currentImage = mode === "edit" && editingPoliceUser?.image_url ? editingPoliceUser.image_url : imagePreview;
  const hasImage = Boolean(currentImage);
  const currentFile = mode === "add" ? imageFile : editFormData.image instanceof File ? editFormData.image : null;

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <div className="relative">
          <div className={`h-17 w-17 rounded-md border ${hasImage ? "border-gray-300" : "border-dashed border-gray-300"} overflow-hidden bg-gray-50 flex items-center justify-center`}>
            {hasImage ? (
              <img src={currentImage} className="h-full w-full object-cover" alt="Preview" />
            ) : (
              <span className="text-[10px] text-gray-400 text-center px-1">Upload Image</span>
            )}
          </div>
          <label className="block text-xs mt-1 cursor-pointer text-blue-600 text-center hover:underline">
            <input type="file" accept=".jpg,.png,.jpeg" onChange={(e) => onImageChange(e, mode)} className="hidden" />
            {hasImage ? "Change" : "Upload"}
          </label>
          {hasImage && (
            <button
              type="button"
              onClick={() => onRemoveImage(mode)}
              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex-1">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-2">
            <p className="text-xs font-semibold text-blue-800 mb-1">Image Requirements</p>
            <ul className="text-[10px] text-gray-600 space-y-0.5">
              <li>• JPG / PNG / JPEG</li>
              <li>• Max Size: 10KB (auto-compressed)</li>
            </ul>
            {currentFile && (
              <div className="mt-2 border-t pt-1 border-blue-100">
                <p className="text-[10px] text-gray-700 font-medium">Selected File:</p>
                <p className="text-[10px] text-gray-600 truncate">{currentFile.name}</p>
                <p className="text-[10px] text-green-600">Size: {(currentFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PoliceUserPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  const {
    policeUsers,
    total,
    isLoading,
    isFetching,
    createPoliceUser,
    updatePoliceUser,
    deletePoliceUser,
    isCreateLoading,
    isUpdateLoading,
    countries,
    designations,
    fetchCountries,
    fetchStatesByCountry,
    fetchDistrictsByState,
    fetchCitiesByDistrict,
    fetchSdpoByCity,
    fetchPoliceStationsBySdpo,
    fetchDesignations,
  } = usePoliceUsers({ pagination, sorting, filters: { search: searchQuery } });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoliceUser, setEditingPoliceUser] = useState<PoliceUser | null>(null);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" as "success" | "error" });
  const [cascadeData, setCascadeData] = useState({
    states: [] as DropdownItem[],
    districts: [] as DropdownItem[],
    cities: [] as DropdownItem[],
    sdpo: [] as DropdownItem[],
    policeStations: [] as DropdownItem[],
  });
  const [selectedIds, setSelectedIds] = useState({ country: "", state: "", district: "", city: "", sdpo: "" });
  const [editFormData, setEditFormData] = useState<Record<string, any>>({
    police_name: "", email: "", mobile: "", password: "", designation_type: "", designation_id: "",
    gender: "Male", country_id: "", state_id: "", district_id: "", city_id: "", sdpo_id: "",
    police_station_id: "", pincode: "", aadhar_number: "", pan_number: "", buckal_number: "",
    address: "", status: "Active", image: "", department_id: "2",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { exportToPdf } = useExportPdf();

  // Track which dropdowns have been loaded
  const [loadedDropdowns, setLoadedDropdowns] = useState({
    states: false,
    districts: false,
    cities: false,
    sdpo: false,
    policeStations: false,
  });

  useEffect(() => { setIsClient(true); }, []);

  // Close modal only when update is successful (not on open)
  useEffect(() => {
    if (!isUpdateLoading && editingPoliceUser && isEditModalOpen && editingPoliceUser.id) {
      // Only close if we were previously updating
      if (isEditModalOpen && !editFormData.police_name) {
        return; // Don't close if form just loaded
      }
    }
  }, [isUpdateLoading]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: "", type: "success" }), 3000);
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, mode: "add" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) { showToast("Please select an image file", "error"); return; }
      if (file.size > 2 * 1024 * 1024) { showToast("Image size should be less than 2MB", "error"); return; }
      showToast("Compressing image...", "success");
      const compressedFile = await compressImage(file, 10);
      if (compressedFile.size > 15 * 1024) { showToast("Failed to compress image to required size", "error"); return; }
      if (mode === "add") { setImageFile(compressedFile); } else { setEditFormData((prev) => ({ ...prev, image: compressedFile })); }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (mode === "add") setImagePreview(reader.result as string);
        showToast(`Image compressed to ${(compressedFile.size / 1024).toFixed(1)}KB`, "success");
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      showToast("Failed to process image", "error");
    }
  }, [showToast]);

  const handleRemoveImage = useCallback((mode: "add" | "edit") => {
    if (mode === "add") { setImageFile(null); setImagePreview(""); } else { setEditFormData((prev) => ({ ...prev, image: null, image_url: "" })); }
  }, []);

  const handleCountryChange = useCallback(async (countryId: string, isEditMode: boolean = false) => {
    setSelectedIds((prev) => ({ ...prev, country: countryId, state: "", district: "", city: "", sdpo: "" }));
    setCascadeData((prev) => ({ ...prev, states: [], districts: [], cities: [], sdpo: [], policeStations: [] }));
    setLoadedDropdowns((prev) => ({ ...prev, states: false, districts: false, cities: false, sdpo: false, policeStations: false }));
    
    if (isEditMode) {
      setEditFormData((prev) => ({ ...prev, country_id: countryId, state_id: "", district_id: "", city_id: "", sdpo_id: "", police_station_id: "" }));
    }
    
    // Don't fetch states automatically - wait for user click
    setCascadeData((prev) => ({ ...prev, states: [], districts: [], cities: [], sdpo: [], policeStations: [] }));
  }, []);

  const handleStateChange = useCallback(async (stateId: string, isEditMode: boolean = false) => {
    setSelectedIds((prev) => ({ ...prev, state: stateId, district: "", city: "", sdpo: "" }));
    setCascadeData((prev) => ({ ...prev, districts: [], cities: [], sdpo: [], policeStations: [] }));
    setLoadedDropdowns((prev) => ({ ...prev, districts: false, cities: false, sdpo: false, policeStations: false }));
    
    if (isEditMode) {
      setEditFormData((prev) => ({ ...prev, state_id: stateId, district_id: "", city_id: "", sdpo_id: "", police_station_id: "" }));
    }
    
    // Don't fetch districts automatically - wait for user click
    setCascadeData((prev) => ({ ...prev, districts: [], cities: [], sdpo: [], policeStations: [] }));
  }, []);

  const handleDistrictChange = useCallback(async (districtId: string, isEditMode: boolean = false) => {
    setSelectedIds((prev) => ({ ...prev, district: districtId, city: "", sdpo: "" }));
    setCascadeData((prev) => ({ ...prev, cities: [], sdpo: [], policeStations: [] }));
    setLoadedDropdowns((prev) => ({ ...prev, cities: false, sdpo: false, policeStations: false }));
    
    if (isEditMode) {
      setEditFormData((prev) => ({ ...prev, district_id: districtId, city_id: "", sdpo_id: "", police_station_id: "" }));
    }
    
    // Don't fetch cities automatically - wait for user click
    setCascadeData((prev) => ({ ...prev, cities: [], sdpo: [], policeStations: [] }));
  }, []);

  const handleCityChange = useCallback(async (cityId: string, isEditMode: boolean = false) => {
    setSelectedIds((prev) => ({ ...prev, city: cityId, sdpo: "" }));
    setCascadeData((prev) => ({ ...prev, sdpo: [], policeStations: [] }));
    setLoadedDropdowns((prev) => ({ ...prev, sdpo: false, policeStations: false }));
    
    if (isEditMode) {
      setEditFormData((prev) => ({ ...prev, city_id: cityId, sdpo_id: "", police_station_id: "" }));
    }
    
    // Don't fetch SDPO automatically - wait for user click
    setCascadeData((prev) => ({ ...prev, sdpo: [], policeStations: [] }));
  }, []);

  const handleSdpoChange = useCallback(async (sdpoId: string, isEditMode: boolean = false) => {
    setSelectedIds((prev) => ({ ...prev, sdpo: sdpoId }));
    setCascadeData((prev) => ({ ...prev, policeStations: [] }));
    setLoadedDropdowns((prev) => ({ ...prev, policeStations: false }));
    
    if (isEditMode) {
      setEditFormData((prev) => ({ ...prev, sdpo_id: sdpoId, police_station_id: "" }));
    }
    
    // Don't fetch police stations automatically - wait for user click
    setCascadeData((prev) => ({ ...prev, policeStations: [] }));
  }, []);

  // Functions to fetch data on dropdown click
  const handleStatesDropdownClick = useCallback(async (countryId: string) => {
    if (loadedDropdowns.states && cascadeData.states.length > 0) return;
    
    try {
      const states = await fetchStatesByCountry(countryId);
      setCascadeData((prev) => ({ ...prev, states }));
      setLoadedDropdowns((prev) => ({ ...prev, states: true }));
    } catch (error) {
      showToast("Failed to load states", "error");
    }
  }, [fetchStatesByCountry, loadedDropdowns.states, cascadeData.states.length, showToast]);

  const handleDistrictsDropdownClick = useCallback(async (stateId: string) => {
    if (loadedDropdowns.districts && cascadeData.districts.length > 0) return;
    
    try {
      const districts = await fetchDistrictsByState(stateId);
      setCascadeData((prev) => ({ ...prev, districts }));
      setLoadedDropdowns((prev) => ({ ...prev, districts: true }));
    } catch (error) {
      showToast("Failed to load districts", "error");
    }
  }, [fetchDistrictsByState, loadedDropdowns.districts, cascadeData.districts.length, showToast]);

  const handleCitiesDropdownClick = useCallback(async (districtId: string) => {
    if (loadedDropdowns.cities && cascadeData.cities.length > 0) return;
    
    try {
      const cities = await fetchCitiesByDistrict(districtId);
      setCascadeData((prev) => ({ ...prev, cities }));
      setLoadedDropdowns((prev) => ({ ...prev, cities: true }));
    } catch (error) {
      showToast("Failed to load cities", "error");
    }
  }, [fetchCitiesByDistrict, loadedDropdowns.cities, cascadeData.cities.length, showToast]);

  const handleSdpoDropdownClick = useCallback(async (cityId: string) => {
    if (loadedDropdowns.sdpo && cascadeData.sdpo.length > 0) return;
    
    try {
      const sdpo = await fetchSdpoByCity(cityId);
      setCascadeData((prev) => ({ ...prev, sdpo }));
      setLoadedDropdowns((prev) => ({ ...prev, sdpo: true }));
    } catch (error) {
      showToast("Failed to load SDPO", "error");
    }
  }, [fetchSdpoByCity, loadedDropdowns.sdpo, cascadeData.sdpo.length, showToast]);

  const handlePoliceStationsDropdownClick = useCallback(async (sdpoId: string) => {
    if (loadedDropdowns.policeStations && cascadeData.policeStations.length > 0) return;
    
    try {
      const policeStations = await fetchPoliceStationsBySdpo(sdpoId);
      setCascadeData((prev) => ({ ...prev, policeStations }));
      setLoadedDropdowns((prev) => ({ ...prev, policeStations: true }));
    } catch (error) {
      showToast("Failed to load police stations", "error");
    }
  }, [fetchPoliceStationsBySdpo, loadedDropdowns.policeStations, cascadeData.policeStations.length, showToast]);

  const getPoliceUserFields = useCallback((mode: "add" | "edit" = "add"): FieldConfig[] => {
    const isEditMode = mode === "edit";
    const currentFormData = isEditMode ? editFormData : null;
    
    // Get current values for edit mode
    const currentCountryId = isEditMode ? editFormData.country_id?.toString() || selectedIds.country : selectedIds.country;
    const currentStateId = isEditMode ? editFormData.state_id?.toString() || selectedIds.state : selectedIds.state;
    const currentDistrictId = isEditMode ? editFormData.district_id?.toString() || selectedIds.district : selectedIds.district;
    const currentCityId = isEditMode ? editFormData.city_id?.toString() || selectedIds.city : selectedIds.city;
    const currentSdpoId = isEditMode ? editFormData.sdpo_id?.toString() || selectedIds.sdpo : selectedIds.sdpo;
    
    // Prepare options with current values if they exist
    const stateOptions = [
      ...(currentStateId && !cascadeData.states.find(s => s.id.toString() === currentStateId) 
        ? [{ id: parseInt(currentStateId), state_name: editingPoliceUser?.state_name || "Current State", name: editingPoliceUser?.state_name || "Current State" }] 
        : []),
      ...cascadeData.states
    ];

    const districtOptions = [
      ...(currentDistrictId && !cascadeData.districts.find(d => d.id.toString() === currentDistrictId)
        ? [{ id: parseInt(currentDistrictId), district_name: editingPoliceUser?.district_name || "Current District", name: editingPoliceUser?.district_name || "Current District" }]
        : []),
      ...cascadeData.districts
    ];

    const cityOptions = [
      ...(currentCityId && !cascadeData.cities.find(c => c.id.toString() === currentCityId)
        ? [{ id: parseInt(currentCityId), city_name: editingPoliceUser?.city_name || "Current City", name: editingPoliceUser?.city_name || "Current City" }]
        : []),
      ...cascadeData.cities
    ];

    const sdpoOptions = [
      ...(currentSdpoId && !cascadeData.sdpo.find(s => s.id.toString() === currentSdpoId)
        ? [{ id: parseInt(currentSdpoId), name: editingPoliceUser?.sdpo_name || "Current SDPO" }]
        : []),
      ...cascadeData.sdpo
    ];

    const policeStationOptions = [
      ...(editFormData.police_station_id && !cascadeData.policeStations.find(p => p.id.toString() === editFormData.police_station_id)
        ? [{ id: parseInt(editFormData.police_station_id), station_name: editingPoliceUser?.station_name || "Current Station", name: editingPoliceUser?.station_name || "Current Station" }]
        : []),
      ...cascadeData.policeStations
    ];

    return [
      { name: "police_name", label: "Name*", type: "text", placeholder: "Enter Name", required: true, defaultValue: currentFormData?.police_name || "", customProps: createFieldProps() },
      ...(isEditMode ? [] : [{ name: "password", label: "Password*", type: "password", placeholder: "Enter password", required: true, customProps: createFieldProps() }]),
      { name: "mobile", label: "Mobile*", type: "text", placeholder: "Enter mobile no", required: true, defaultValue: currentFormData?.mobile || "", customProps: createFieldProps() },
      { name: "email", label: "Email*", type: "email", placeholder: "Enter email", required: true, defaultValue: currentFormData?.email || "", customProps: createFieldProps() },
      { name: "designation_type", label: "Designation Type*", type: "select", required: true, options: [{ value: "SDPO", label: "SDPO" }, { value: "Head_Person", label: "Head Person" }, { value: "Station_Head", label: "Station Head" }, { value: "Police", label: "Police" }, { value: "Admin", label: "Admin" }], defaultValue: currentFormData?.designation_type || "Police", customProps: createFieldProps() },
      { name: "designation_id", label: "Designation*", type: "select", required: true, options: designations.map((item) => ({ value: item.id.toString(), label: item.name || item.police_name || item.designation_name || "" })), placeholder: "Select Designation", defaultValue: currentFormData?.designation_id || "", customProps: createFieldProps({ onMouseDown: () => fetchDesignations(), onFocus: () => fetchDesignations() }) },
      { name: "department_id", label: "Department ID*", type: "text", placeholder: "Enter Department ID", required: true, defaultValue: "2", customProps: createFieldProps() },
      { name: "gender", label: "Gender*", type: "select", required: true, defaultValue: currentFormData?.gender || "Male", options: [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Others", label: "Others" }], customProps: createFieldProps() },
      { name: "country_id", label: "Country name :*", type: "select", required: true, options: [...(currentCountryId && !countries.find(c => c.id.toString() === currentCountryId) ? [{ id: parseInt(currentCountryId), country_name: editingPoliceUser?.country_name || "Current Country" }] : []), ...countries].map((country) => ({ value: country.id.toString(), label: country.country_name || "" })), placeholder: "Click to load countries", defaultValue: currentCountryId, customProps: { ...createFieldProps(), onMouseDown: fetchCountries, onFocus: fetchCountries, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleCountryChange(e.target.value, isEditMode) } },
      { name: "state_id", label: "State*", type: "select", required: true, disabled: !currentCountryId, options: stateOptions.map((item) => ({ value: item.id.toString(), label: item.state_name || item.name || "" })), placeholder: currentCountryId ? "Select State" : "Please select country first", defaultValue: currentStateId, customProps: createFieldProps({ 
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleStateChange(e.target.value, isEditMode),
        onMouseDown: currentCountryId ? () => handleStatesDropdownClick(currentCountryId) : undefined,
        onFocus: currentCountryId ? () => handleStatesDropdownClick(currentCountryId) : undefined
      }) },
      { name: "district_id", label: "District*", type: "select", required: true, disabled: !currentStateId, options: districtOptions.map((item) => ({ value: item.id.toString(), label: item.district_name || item.name || "" })), placeholder: currentStateId ? "Select District" : "Please select state first", defaultValue: currentDistrictId, customProps: createFieldProps({ 
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleDistrictChange(e.target.value, isEditMode),
        onMouseDown: currentStateId ? () => handleDistrictsDropdownClick(currentStateId) : undefined,
        onFocus: currentStateId ? () => handleDistrictsDropdownClick(currentStateId) : undefined
      }) },
      { name: "city_id", label: "City*", type: "select", required: true, disabled: !currentDistrictId, options: cityOptions.map((item) => ({ value: item.id.toString(), label: item.city_name || item.name || "" })), placeholder: currentDistrictId ? "Select City" : "Please select district first", defaultValue: currentCityId, customProps: createFieldProps({ 
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleCityChange(e.target.value, isEditMode),
        onMouseDown: currentDistrictId ? () => handleCitiesDropdownClick(currentDistrictId) : undefined,
        onFocus: currentDistrictId ? () => handleCitiesDropdownClick(currentDistrictId) : undefined
      }) },
      { name: "sdpo_id", label: "SDPO*", type: "select", required: true, disabled: !currentCityId, options: sdpoOptions.map((item) => ({ value: item.id.toString(), label: item.name || "" })), placeholder: currentCityId ? "Select SDPO" : "Please select city first", defaultValue: currentSdpoId, customProps: createFieldProps({ 
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleSdpoChange(e.target.value, isEditMode),
        onMouseDown: currentCityId ? () => handleSdpoDropdownClick(currentCityId) : undefined,
        onFocus: currentCityId ? () => handleSdpoDropdownClick(currentCityId) : undefined
      }) },
      { name: "police_station_id", label: "Police Station*", type: "select", required: true, disabled: !currentSdpoId, options: policeStationOptions.map((item) => ({ value: item.id.toString(), label: item.station_name || item.name || "" })), placeholder: currentSdpoId ? "Select Police Station" : "Please select SDPO first", defaultValue: editFormData?.police_station_id || "", customProps: createFieldProps({ 
        onMouseDown: currentSdpoId ? () => handlePoliceStationsDropdownClick(currentSdpoId) : undefined,
        onFocus: currentSdpoId ? () => handlePoliceStationsDropdownClick(currentSdpoId) : undefined
      }) },
      { name: "pincode", label: "Pincode*", type: "text", placeholder: "Enter pincode", required: true, defaultValue: currentFormData?.pincode || "", customProps: createFieldProps() },
      { name: "aadhar_number", label: "Aadhar Number*", type: "text", placeholder: "Enter Aadhar Number", required: true, defaultValue: currentFormData?.aadhar_number || "", customProps: createFieldProps() },
      { name: "pan_number", label: "Pan Number*", type: "text", placeholder: "Enter Pan Number", required: true, defaultValue: currentFormData?.pan_number || "", customProps: createFieldProps() },
      { name: "buckal_number", label: "Buckal Number*", type: "text", placeholder: "Enter Buckal Number", required: true, defaultValue: currentFormData?.buckal_number || "", customProps: createFieldProps() },
      { name: "address", label: "Address*", type: "textarea", placeholder: "Enter address", required: true, defaultValue: currentFormData?.address || "", customProps: createFieldProps({ rows: 3 }) },
      { name: "image_upload", label: "Profile Image", type: "custom" as const, customElement: renderImageUploadField(mode, imagePreview, imageFile, editingPoliceUser, editFormData, handleImageChange, handleRemoveImage) },
      ...(isEditMode ? [{ name: "status", label: "Status*", type: "select", required: true, options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }], defaultValue: currentFormData?.status || "Active", customProps: createFieldProps() }] : []),
    ];
  }, [countries, designations, cascadeData, selectedIds, editFormData, imagePreview, imageFile, editingPoliceUser, fetchCountries, fetchDesignations, handleCountryChange, handleStateChange, handleDistrictChange, handleCityChange, handleSdpoChange, handleImageChange, handleRemoveImage, handleStatesDropdownClick, handleDistrictsDropdownClick, handleCitiesDropdownClick, handleSdpoDropdownClick, handlePoliceStationsDropdownClick]);

  const addPoliceUserFields = useMemo(() => getPoliceUserFields("add"), [getPoliceUserFields]);
  const editPoliceUserFields = useMemo(() => getPoliceUserFields("edit"), [getPoliceUserFields]);

  const handleAddPoliceUser = useCallback(async (formData: Record<string, string>) => {
    try {
      const formDataToSend = createAddPoliceUserFormData(formData, imageFile);
      createPoliceUser(formDataToSend);
      setImageFile(null);
      setImagePreview("");
    } catch (error: any) {
      showToast(error.message || "Error adding police user. Please try again.", "error");
    }
  }, [imageFile, createPoliceUser, showToast]);

  const handleEdit = useCallback(async (user: PoliceUser) => {
    try {
      setEditingPoliceUser(user);
      const fullData = await policeUserService.getPoliceUserById(user.id);
      
      // Reset loaded dropdowns when opening edit modal
      setLoadedDropdowns({
        states: false,
        districts: false,
        cities: false,
        sdpo: false,
        policeStations: false,
      });
      
      const formData = {
        police_name: fullData.police_name || "", 
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
        image: fullData.image || fullData.image_url || "",
      };

      setEditFormData(formData);
      
      // Set selected IDs - NO prefetch here, dropdowns load on click
      setSelectedIds({
        country: fullData.country_id?.toString() || "",
        state: fullData.state_id?.toString() || "",
        district: fullData.district_id?.toString() || "",
        city: fullData.city_id?.toString() || "",
        sdpo: fullData.sdpo_id?.toString() || "",
      });

      // Clear cascade data - will be fetched on dropdown click
      setCascadeData({
        states: [],
        districts: [],
        cities: [],
        sdpo: [],
        policeStations: [],
      });

      setIsEditModalOpen(true);
      showToast("Police User details loaded successfully!", "success");
    } catch (error) {
      showToast("Failed to load Police User details. Please try again.", "error");
    }
  }, [showToast]);

  const handleUpdate = useCallback(async (formData: Record<string, string>) => {
    if (!editingPoliceUser) return;
    try {
      const formDataToSend = createUpdatePoliceUserFormData(formData, editFormData);
      updatePoliceUser({ id: editingPoliceUser.id, payload: formDataToSend });
      // Close modal after successful update
      setTimeout(() => {
        closeEditModal();
      }, 800);
    } catch (error: any) {
      showToast(error.message || "Error updating police user.", "error");
    }
  }, [editingPoliceUser, editFormData, updatePoliceUser, showToast]);

  const handleDeleteConfirm = useCallback((id: number) => { deletePoliceUser(id); }, [deletePoliceUser]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPoliceUser(null);
    setSelectedIds({ country: "", state: "", district: "", city: "", sdpo: "" });
    setEditFormData({ police_name: "", email: "", mobile: "", password: "", designation_type: "", designation_id: "", gender: "Male", country_id: "", state_id: "", district_id: "", city_id: "", sdpo_id: "", police_station_id: "", pincode: "", aadhar_number: "", pan_number: "", buckal_number: "", address: "", status: "Active", image: "", department_id: "2" });
    setCascadeData({ states: [], districts: [], cities: [], sdpo: [], policeStations: [] });
    setLoadedDropdowns({ states: false, districts: false, cities: false, sdpo: false, policeStations: false });
  }, []);

  const columns: ColumnDef<PoliceUser>[] = useMemo(() => [
    { accessorKey: "police_name", header: "Name", cell: ({ row }) => <span className="font-medium text-black">{row.original.police_name}</span>, enableSorting: true },
    { accessorKey: "email", header: "Email", cell: ({ row }) => <span className="text-black">{row.original.email}</span>, enableSorting: true },
    { accessorKey: "mobile", header: "Mobile", cell: ({ row }) => <span className="text-black">{row.original.mobile}</span>, enableSorting: true },
    { accessorKey: "designation_type", header: "Designation Type", cell: ({ row }) => <span className="text-black">{row.original.designation_type}</span>, enableSorting: true },
    // Since API doesn't return designation_name, we'll use designation_type as fallback
    { accessorKey: "designation_name", header: "Designation Name", cell: ({ row }) => <span className="text-black">{row.original.designation_name || row.original.designation_type || "N/A"}</span>, enableSorting: true },
    { accessorKey: "state_name", header: "State", cell: ({ row }) => <span className="text-black">{row.original.state_name || "N/A"}</span>, enableSorting: true },
    { accessorKey: "district_name", header: "District", cell: ({ row }) => <span className="text-black">{row.original.district_name || "N/A"}</span>, enableSorting: true },
    { accessorKey: "sdpo_name", header: "SDPO Name", cell: ({ row }) => <span className="text-black">{row.original.sdpo_name || "N/A"}</span>, enableSorting: true },
    { accessorKey: "station_name", header: "Station Name", cell: ({ row }) => <span className="text-black">{row.original.station_name || "N/A"}</span>, enableSorting: true },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{row.original.status || "Active"}</span>, enableSorting: true },
    { id: "actions", header: "Actions", cell: ({ row }) => (
      <div className="flex gap-2 justify-center">
        <button onClick={() => handleEdit(row.original)} className="px-3 py-1 rounded-md text-sm bg-blue-100 text-black hover:bg-blue-200">Edit</button>
        <AlertPopover trigger={<button className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200">Delete</button>} title="Are you sure you want to delete this Police User?" okText="OK" cancelText="Cancel" okButtonColor="#9A65C2" cancelButtonColor="#6B7280" onConfirm={() => handleDeleteConfirm(row.original.id)} />
      </div>
    ), enableSorting: false },
  ], [handleEdit, handleDeleteConfirm]);

  const { tableElement, table } = CustomTable<PoliceUser>({ data: policeUsers, columns, pagination, totalCount: total, loading: isLoading || isFetching, onPaginationChange: setPagination, onSortingChange: setSorting, sorting, emptyMessage: "No Police Users available", pageSizeOptions: [5, 10, 20, 30, 50], enableSorting: true, manualSorting: false, manualPagination: true, showSerialNumber: true, serialNumberHeader: "S.NO.", maxHeight: "500px", headerBgColor: "#E7EDFD", headerTextColor: "#000000", getRowId: (row) => row.id });

  const handleSearch = useCallback((query: string) => { setSearchQuery(query); setPagination((prev) => ({ ...prev, pageIndex: 0 })); }, []);

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
        { header: "Designation Name", accessorKey: "designation_name", formatter: (value) => value || "N/A" }, 
        { header: "State", accessorKey: "state_name", formatter: (value) => value || "N/A" }, 
        { header: "District", accessorKey: "district_name", formatter: (value) => value || "N/A" }, 
        { header: "SDPO Name", accessorKey: "sdpo_name", formatter: (value) => value || "N/A" }, 
        { header: "Station Name", accessorKey: "station_name", formatter: (value) => value || "N/A" }, 
        { header: "Status", accessorKey: "status", formatter: (value) => (value === "Active" ? "Active" : "Inactive") }
      ], 
      data: policeUsers, 
      showSerialNumber: true, 
      serialNumberHeader: "S.NO.", 
      projectName: "E-Police", 
      exportDate: true, 
      showTotalCount: true, 
      searchQuery: searchQuery || "All Police Users", 
      userRole: "admin" 
    };
    const result = exportToPdf(pdfConfig);
    showToast(result.success ? "PDF exported successfully!" : "Failed to export PDF", result.success ? "success" : "error");
  }, [exportToPdf, policeUsers, searchQuery, showToast]);

  const handleExportExcel = useCallback(async () => {
    try {
      const response = await policeUserService.exportToExcel();
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `police-users-${Date.now()}.xlsx`;
      link.click();
      showToast("Police User Excel downloaded successfully!", "success");
    } catch (error) {
      showToast("Failed to download police user excel", "error");
    }
  }, [showToast]);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-8">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
      <AddSection title="Add Police User" fields={addPoliceUserFields} onSubmit={handleAddPoliceUser} submitButtonText="Add Police User" isLoading={isCreateLoading} />
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <ExportButtons pdfConfig={{}} onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} onPrint={handlePrint} />
            {isClient && <ColumnVisibilitySelector columns={table.getAllColumns()} backgroundColor="#EACEFF" textColor="#000000" />}
          </div>
          <div className="w-full max-w-xs">
            <SearchComponent placeholder="Search Police Users..." debounceDelay={400} onSearch={handleSearch} serverSideSearch={true} />
          </div>
        </div>
        {tableElement}
      </div>
      <EditModal isOpen={isEditModalOpen} onClose={closeEditModal} onSubmit={handleUpdate} title={`Edit Police User - ID: ${editingPoliceUser?.id || ""}`} fields={editPoliceUserFields} isLoading={isUpdateLoading} />
    </div>
  );
}