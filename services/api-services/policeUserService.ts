import api from "@/lib/axios";
import { PoliceUser } from "@/interface/interface";

export interface GetPoliceUsersResponse {
  success: boolean;
  data: PoliceUser[];
  totalRecords: number;
  page?: number;
  limit?: number;
}

export interface DropdownResponse {
  success: boolean;
  data: Array<any>;
}

export const policeUserService = {
  // MAIN CRUD OPERATIONS
  getPoliceUsers: async (params: Record<string, any>): Promise<GetPoliceUsersResponse> => {
    const res = await api.get("/mst-policeall", { params });
    return res.data;
  },

  getPoliceUserById: async (id: number): Promise<PoliceUser> => {
    const res = await api.get(`/mst-police/${id}`);
    return res.data?.data ?? res.data;
  },

  createPoliceUser: async (payload: FormData) => {
    const res = await api.post("/mst-police", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updatePoliceUser: async (id: number, payload: FormData) => {
    const res = await api.put(`/mst-police/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deletePoliceUser: async (id: number) => {
    const res = await api.delete(`/mst-police/${id}`);
    return res.data;
  },

  // DROPDOWN DATA
  getCountries: async () => {
    const res = await api.get("/states/getcountry");
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  getStatesByCountry: async (countryId: string | number) => {
    const res = await api.get(`/states/country/${countryId}`);
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  getDistrictsByState: async (stateId: string | number) => {
    const res = await api.get(`/districts/state/${stateId}`);
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  getCitiesByDistrict: async (districtId: string | number) => {
    const res = await api.get(`/cities/district/${districtId}`);
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  getSdpoByCity: async (cityId: string | number) => {
    const res = await api.get(`/sdpo/city/${cityId}`);
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  getPoliceStationsBySdpo: async (sdpoId: string | number) => {
    const res = await api.get(`/police-stations/by-sdpo/${sdpoId}`);
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  getDesignations: async () => {
    const res = await api.get("/designations");
    return Array.isArray(res.data?.data) ? res.data.data : res.data?.data ?? [];
  },

  // EXPORT
  exportToExcel: async () => {
    const res = await api.getBlob("/mst-police/export/excel");
    return res;
  },
};