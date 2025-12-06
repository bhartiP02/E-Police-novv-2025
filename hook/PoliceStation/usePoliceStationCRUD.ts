import { useState, useCallback } from "react";
import { api } from "@/services/api/apiServices";
import { PaginationState } from "@/component/ui/Table/CustomTable";

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

interface UsePoliceStationCRUDProps {
  extractData: (response: any, keys?: string[]) => any[];
  extractSinglePoliceStation: (response: any) => any;
  showToast: (message: string, type: "success" | "error") => void;
}

export const usePoliceStationCRUD = ({
  extractData,
  extractSinglePoliceStation,
  showToast
}: UsePoliceStationCRUDProps) => {
  const [policeStations, setPoliceStations] = useState<PoliceStationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch police stations with pagination and search
  const fetchPoliceStations = useCallback(async (
    pageIndex: number, 
    pageSize: number, 
    searchTerm: string = ""
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/police-stations?page=${pageIndex + 1}&limit=${pageSize}`;
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await api.get<any>(url);
      const policeStationData = extractData(response);

      const basicPoliceStationData: PoliceStationRow[] = policeStationData.map((station: any) => ({
        ...station,
        state_name: station.state_name || `State ${station.state_id}`,
        district_name: station.district_name || `District ${station.district_id}`,
        city_name: station.city_name || (station.city_id ? `City ${station.city_id}` : "N/A"),
        pc_id: station.pc_id || station.police_pc_id,
        pc_name: station.pc_name || station.category
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

  // Add new police station
  const addPoliceStation = useCallback(async (
    formData: Record<string, string>,
    pagination: PaginationState,
    searchQuery: string
  ) => {
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
        pc_id: formData.pc_id ? parseInt(formData.pc_id) : null,
        status: "Active"
      };

      await api.post("/police-stations", payload);
      await fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("Police Station added successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error adding Police Station:", error);
      showToast("Error adding Police Station. Please try again.", "error");
      return false;
    }
  }, [fetchPoliceStations, showToast]);

  // Get single police station details
  const getPoliceStationDetails = useCallback(async (id: number) => {
    try {
      console.log("🔍 Fetching police station details for ID:", id);
      const response = await api.get(`/police-stations/${id}`);
      
      console.log("📦 Raw API response:", response);
      
      const fullData = extractSinglePoliceStation(response);
      
      console.log("✅ Extracted police station data:", fullData);
      
      if (!fullData) {
        console.error("❌ extractSinglePoliceStation returned null/undefined");
        showToast("Failed to load Police Station details.", "error");
        return null;
      }
      
      return fullData;
    } catch (error) {
      console.error("❌ Error loading Police Station details:", error);
      showToast("Failed to load Police Station details. Please try again.", "error");
      return null;
    }
  }, [extractSinglePoliceStation, showToast]);

  // Update police station
  const updatePoliceStation = useCallback(async (
    id: number,
    formData: Record<string, string>,
    pagination: PaginationState,
    searchQuery: string
  ) => {
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
        pc_id: formData.pc_id ? parseInt(formData.pc_id) : null,
        status: formData.status
      };

      await api.put(`/police-stations/${id}`, payload);
      await fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("Police Station updated successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error updating Police Station:", error);
      showToast("Error updating Police Station. Please try again.", "error");
      return false;
    } finally {
      setSaveLoading(false);
    }
  }, [fetchPoliceStations, showToast]);

  // Delete police station
  const deletePoliceStation = useCallback(async (
    id: number,
    pagination: PaginationState,
    searchQuery: string
  ) => {
    try {
      await api.delete(`/police-stations/${id}`);
      await fetchPoliceStations(pagination.pageIndex, pagination.pageSize, searchQuery);
      showToast("Police Station deleted successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error deleting Police Station:", error);
      showToast("Error deleting Police Station. Please try again.", "error");
      throw error;
    }
  }, [fetchPoliceStations, showToast]);

  return {
    policeStations,
    loading,
    error,
    totalCount,
    saveLoading,
    fetchPoliceStations,
    addPoliceStation,
    getPoliceStationDetails,
    updatePoliceStation,
    deletePoliceStation
  };
};