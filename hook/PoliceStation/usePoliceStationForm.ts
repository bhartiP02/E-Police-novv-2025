import { useState, useCallback, useMemo } from "react";
import { FieldConfig } from "@/component/ui/add-section/add-section";

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
  pc_id: string;
  status: string;
}

interface PoliceCategory {
  pc_id: number;
  pc_name: string;
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

interface UsePoliceStationFormProps {
  countries: Country[];
  states: State[];
  filteredStates: State[];
  filteredDistricts: District[];
  filteredCities: City[];
  filteredSdpos: SDPO[];
  policeCategories: PoliceCategory[];
  isCountriesLoading: boolean;
  isStatesLoading: boolean;
  isDistrictsLoading: boolean;
  isCitiesLoading: boolean;
  isSdposLoading: boolean;
  isCategoriesLoading: boolean;
  categoriesLoaded: boolean;
  isClient: boolean;
  fetchCountries: () => Promise<any[]>;
  fetchPoliceCategories: () => Promise<any[]>;
  fetchStatesByCountry: (countryId: string) => Promise<any[]>;
  fetchDistrictsByState: (stateId: string) => Promise<any[]>;
  fetchCitiesByDistrict: (districtId: string) => Promise<any[]>;
  fetchSDPOsByCity: (cityId: string) => Promise<any[]>;
  setFilteredStates: React.Dispatch<React.SetStateAction<State[]>>;
  setFilteredDistricts: React.Dispatch<React.SetStateAction<District[]>>;
  setFilteredCities: React.Dispatch<React.SetStateAction<City[]>>;
  setFilteredSdpos: React.Dispatch<React.SetStateAction<SDPO[]>>;
  handleCountryDropdownClick: () => Promise<void>;
  handleStateDropdownClick: () => Promise<void>;
  handleCategoryDropdownClick: () => Promise<void>;
}

export const usePoliceStationForm = (props: UsePoliceStationFormProps) => {
  const {
    countries, states, filteredStates, filteredDistricts, filteredCities, filteredSdpos,
    policeCategories, isCountriesLoading, isStatesLoading, isDistrictsLoading, 
    isCitiesLoading, isSdposLoading, isCategoriesLoading, categoriesLoaded, isClient,
    fetchCountries, fetchPoliceCategories, fetchStatesByCountry, fetchDistrictsByState, 
    fetchCitiesByDistrict, fetchSDPOsByCity, setFilteredStates, setFilteredDistricts, 
    setFilteredCities, setFilteredSdpos, handleCountryDropdownClick, handleStateDropdownClick, 
    handleCategoryDropdownClick
  } = props;

  // Current selected IDs for cascading dropdowns
  const [currentCountryId, setCurrentCountryId] = useState<string>("");
  const [currentStateId, setCurrentStateId] = useState<string>("");
  const [currentDistrictId, setCurrentDistrictId] = useState<string>("");
  const [currentCityId, setCurrentCityId] = useState<string>("");

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
    pc_id: "",
    status: "Active"
  });

  const createFieldProps = (customProps: any = {}) => ({
    className: "w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
    ...customProps
  });

  const getPoliceStationFields = useCallback((mode: 'add' | 'edit' = 'add'): FieldConfig[] => {
    const isEditMode = mode === 'edit';
    const currentFormData = isEditMode ? editFormData : null;

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
        name: "pc_id",
        label: "Category :",
        type: "select",
        required: false,
        options: policeCategories.map(cat => ({
          value: String(cat.pc_id),
          label: cat.pc_name
        })),
        placeholder: isCategoriesLoading ? "Loading categories..." : "Select Category",
        defaultValue: isEditMode && currentFormData?.pc_id
          ? currentFormData.pc_id.toString()
          : undefined,
        customProps: createFieldProps({
          ...(isClient && !isEditMode && {
            onMouseDown: handleCategoryDropdownClick,
            onFocus: handleCategoryDropdownClick,
          }),
          ...(isClient && isEditMode && {
            onMouseDown: async () => {
              const categoriesData = await fetchPoliceCategories();
              // Add more options if needed
            },
            onFocus: async () => {
              const categoriesData = await fetchPoliceCategories();
            },
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
          ...(isClient && !isEditMode && {
            onMouseDown: handleCountryDropdownClick,
            onFocus: handleCountryDropdownClick,
          }),
          ...(isClient && isEditMode && {
            onMouseDown: async () => {
              const countriesData = await fetchCountries();
              // Don't override - just add more options if needed
            },
            onFocus: async () => {
              const countriesData = await fetchCountries();
            },
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
                sdpo_id: '',
                pc_id: ''
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
        disabled: isEditMode ? !currentFormData?.country_id : !currentCountryId,
        options: (isEditMode
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
          ...(isClient && !isEditMode && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!currentCountryId) {
                e.preventDefault();
                return;
              }
              handleStateDropdownClick();
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!currentCountryId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
              handleStateDropdownClick();
            },
          }),
          ...(isClient && isEditMode && {
            onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedCountryId = form?.country_id?.value || currentFormData?.country_id;
              
              if (selectedCountryId) {
                const statesData = await fetchStatesByCountry(selectedCountryId);
                setFilteredStates(statesData);
              }
            },
            onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedCountryId = form?.country_id?.value || currentFormData?.country_id;
              
              if (selectedCountryId) {
                const statesData = await fetchStatesByCountry(selectedCountryId);
                setFilteredStates(statesData);
              }
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
        disabled: isEditMode ? !currentFormData?.state_id : !currentStateId,
        options: (isEditMode
          ? (currentFormData?.state_id ? filteredDistricts : [])
          : (currentStateId ? filteredDistricts : [])
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
          ...(isClient && !isEditMode && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!currentStateId) {
                e.preventDefault();
                return;
              }
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!currentStateId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
            },
          }),
          ...(isClient && isEditMode && {
            onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedStateId = form?.state_id?.value || currentFormData?.state_id;
              
              if (selectedStateId) {
                const districtsData = await fetchDistrictsByState(selectedStateId);
                setFilteredDistricts(districtsData);
              }
            },
            onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedStateId = form?.state_id?.value || currentFormData?.state_id;
              
              if (selectedStateId) {
                const districtsData = await fetchDistrictsByState(selectedStateId);
                setFilteredDistricts(districtsData);
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
        disabled: isEditMode ? !currentFormData?.district_id : !currentDistrictId,
        options: (isEditMode
          ? (currentFormData?.district_id ? filteredCities : [])
          : (currentDistrictId ? filteredCities : [])
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
          ...(isClient && !isEditMode && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!currentDistrictId) {
                e.preventDefault();
                return;
              }
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!currentDistrictId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
            },
          }),
          ...(isClient && isEditMode && {
            onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedDistrictId = form?.district_id?.value || currentFormData?.district_id;
              
              if (selectedDistrictId) {
                const citiesData = await fetchCitiesByDistrict(selectedDistrictId);
                setFilteredCities(citiesData);
              }
            },
            onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedDistrictId = form?.district_id?.value || currentFormData?.district_id;
              
              if (selectedDistrictId) {
                const citiesData = await fetchCitiesByDistrict(selectedDistrictId);
                setFilteredCities(citiesData);
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
              setCurrentCityId(cityId);
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
        disabled: isEditMode ? !currentFormData?.city_id : !currentCityId,
        options: (isEditMode
          ? (currentFormData?.city_id ? filteredSdpos : [])
          : (currentCityId ? filteredSdpos : [])
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
          ...(isClient && !isEditMode && {
            onMouseDown: (e: React.MouseEvent<HTMLSelectElement>) => {
              if (!currentCityId) {
                e.preventDefault();
                return;
              }
            },
            onFocus: (e: React.FocusEvent<HTMLSelectElement>) => {
              if (!currentCityId) {
                (e.target as HTMLSelectElement).blur();
                return;
              }
            },
          }),
          ...(isClient && isEditMode && {
            onMouseDown: async (e: React.MouseEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedCityId = form?.city_id?.value || currentFormData?.city_id;
              
              if (selectedCityId) {
                const sdposData = await fetchSDPOsByCity(selectedCityId);
                setFilteredSdpos(sdposData);
              }
            },
            onFocus: async (e: React.FocusEvent<HTMLSelectElement>) => {
              const form = (e.target as HTMLSelectElement).form;
              const selectedCityId = form?.city_id?.value || currentFormData?.city_id;
              
              if (selectedCityId) {
                const sdposData = await fetchSDPOsByCity(selectedCityId);
                setFilteredSdpos(sdposData);
              }
            },
          }),
        })
      },
      {
        name: 'email',
        label: 'Email :',
        type: 'text',
        placeholder: 'Enter Email',
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
    policeCategories, isCountriesLoading, isStatesLoading, isDistrictsLoading, 
    isCitiesLoading, isSdposLoading, isCategoriesLoading, categoriesLoaded, isClient,
    currentCountryId, currentStateId, currentDistrictId, currentCityId, editFormData,
    handleCountryDropdownClick, handleStateDropdownClick, handleCategoryDropdownClick,
    fetchStatesByCountry, fetchDistrictsByState, fetchCitiesByDistrict, fetchSDPOsByCity,
    setFilteredStates, setFilteredDistricts, setFilteredCities, setFilteredSdpos
  ]);

  const addPoliceStationFields = useMemo(() => getPoliceStationFields('add'), [getPoliceStationFields]);
  const editPoliceStationFields = useMemo(() => getPoliceStationFields('edit'), [getPoliceStationFields]);

  const resetCurrentIds = useCallback(() => {
    setCurrentCountryId("");
    setCurrentStateId("");
    setCurrentDistrictId("");
    setCurrentCityId("");
  }, []);

  return {
    editFormData,
    setEditFormData,
    currentCountryId,
    setCurrentCountryId,
    currentStateId,
    setCurrentStateId,
    currentDistrictId,
    setCurrentDistrictId,
    currentCityId,
    setCurrentCityId,
    addPoliceStationFields,
    editPoliceStationFields,
    resetCurrentIds
  };
};