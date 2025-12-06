import api from "@/lib/axios";
import { State } from "@/interface/interface";

export interface GetStatesResponse {
  data: State[];
  totalRecords: number;
  page?: number;
  limit?: number;
}

export const stateService = {
  getStates: async (params: Record<string, any>): Promise<GetStatesResponse> => {
    const res = await api.get("/states", { params });
    return res.data;
  },

  getCountries: async () => {
    const res = await api.get("/states/getcountry");
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  },

  getStateById: async (id: number): Promise<State> => {
    const res = await api.get(`/states/${id}`);
    return res.data?.data ?? res.data;
  },

  createState: async (payload: any) => {
    const res = await api.post("/states", payload);
    return res.data;
  },

  updateState: async (id: number, payload: any) => {
    const res = await api.put(`/states/${id}`, payload);
    return res.data;
  },

  deleteState: async (id: number) => {
    const res = await api.delete(`/states/${id}`);
    return res.data;
  },
};
