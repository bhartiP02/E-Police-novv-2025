import { useState, useCallback } from "react";
import { api } from "@/services/api/apiServices";

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
  pc_id: number;
  pc_name: string;
}

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
  police_pc_id?: number;
  pc_id?: number;
  pc_name?: string;
  status: string;
  sdpo_id?: number;
  sdpo_name?: string;
  address?: string;
  pincode?: string;
}

export const usePoliceStationData = () => {
  // Dropdown data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [filteredSdpos, setFilteredSdpos] = useState<SDPO[]>([]);
  const [policeCategories, setPoliceCategories] = useState<PoliceCategory[]>([]);

  // Loading states
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isSdposLoading, setIsSdposLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // Loaded flags
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [statesLoaded, setStatesLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Data extraction helper
  const extractData = useCallback((response: any, keys: string[] = ['data', 'data', 'result']) => {
    for (const key of keys) {
      if (Array.isArray(response?.[key])) {
        return response[key];
      }
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }, []);

  const extractSinglePoliceStation = useCallback((response: any) => {
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
      return found[0];
    }

    return found || null;
  }, []);

  // Fetch functions
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
      return [];
    } finally {
      setIsCountriesLoading(false);
    }
  }, [extractData]);

  const fetchPoliceCategories = useCallback(async () => {
    try {
      setIsCategoriesLoading(true);
      const response = await api.get("/police-categories");
      const rawData = extractData(response);
      const normalized = rawData.map((cat: any) => ({
        pc_id: cat.police_pc_id,
        pc_name: cat.pc_name
      }));
      setPoliceCategories(normalized);
      setCategoriesLoaded(true);
      return normalized;
    } catch (error) {
      console.error("Error fetching police categories:", error);
      return [];
    } finally {
      setIsCategoriesLoading(false);
    }
  }, [extractData]);

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

  const preloadEditDropdowns = useCallback((data: any) => {
    // Preload countries
    if (data.country_id && data.country_name) {
      const countryExists = countries.some(country => country.id === data.country_id);
      if (!countryExists) {
        setCountries(prev => [...prev, { id: data.country_id, country_name: data.country_name }]);
      }
    }

    // Preload states
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

    // Preload districts
    if (data.district_id && data.district_name) {
      const districtExists = filteredDistricts.some(district => district.id === data.district_id);
      if (!districtExists) {
        setFilteredDistricts(prev => [...prev, { 
          id: data.district_id, 
          district_name: data.district_name, 
          state_id: data.state_id 
        }]);
      }
    }

    // Preload cities
    if (data.city_id && data.city_name) {
      const cityExists = filteredCities.some(city => city.id === data.city_id);
      if (!cityExists) {
        setFilteredCities(prev => [...prev, { 
          id: data.city_id, 
          city_name: data.city_name, 
          district_id: data.district_id 
        }]);
      }
    }

    // Preload categories
    const categoryId = data.police_pc_id || data.pc_id;
    const categoryName = data.pc_name || data.category;
    
    if (categoryId && categoryName) {
      const categoryExists = policeCategories.some(cat => cat.pc_id === categoryId);
      if (!categoryExists) {
        setPoliceCategories(prev => [
          ...prev,
          { pc_id: categoryId, pc_name: categoryName }
        ]);
      }
    }
  }, [countries, states, filteredStates, filteredDistricts, filteredCities, policeCategories]);

  return {
    // State
    countries,
    states,
    filteredStates,
    filteredDistricts,
    filteredCities,
    filteredSdpos,
    policeCategories,
    
    // Loading states
    isCountriesLoading,
    isStatesLoading,
    isDistrictsLoading,
    isCitiesLoading,
    isSdposLoading,
    isCategoriesLoading,
    
    // Loaded flags
    countriesLoaded,
    statesLoaded,
    categoriesLoaded,
    
    // Setters - exposed for edit modal
    setCountries,
    setStates,
    setFilteredStates,
    setFilteredDistricts,
    setFilteredCities,
    setFilteredSdpos,
    setPoliceCategories,
    
    // Functions
    fetchCountries,
    fetchPoliceCategories,
    fetchAllStates,
    fetchStatesByCountry,
    fetchDistrictsByState,
    fetchCitiesByDistrict,
    fetchSDPOsByCity,
    extractData,
    extractSinglePoliceStation,
    preloadEditDropdowns
  };
};