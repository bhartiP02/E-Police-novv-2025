"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import { api } from "@/services/api/apiServices";
import type { GetStatesResponse } from "@/interface/interface";
import { PaginationState, SortingState } from "@/component/ui/Table/CustomTable";
import { toast } from "sonner";

export interface StateFilters {
  search?: string;
}

export interface UseStatesParams {
  pagination: PaginationState;
  sorting: SortingState;
  filters?: StateFilters;
}

// ---------------- API CALL ----------------
const fetchStatesApi = async ({
  pagination,
  sorting,
  filters,
}: UseStatesParams): Promise<GetStatesResponse> => {
  const params = new URLSearchParams({
    page: (pagination.pageIndex + 1).toString(),
    limit: pagination.pageSize.toString(),
  });

  // ⭐ CORRECT SEARCH PARAM
  if (filters?.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  // Sorting
  if (sorting.length > 0) {
    params.append("sortBy", sorting[0].id);
    params.append("sortOrder", sorting[0].desc ? "desc" : "asc");
  }

  return await api.get<GetStatesResponse>(`/states?${params.toString()}`);
};

// ---------------- MAIN HOOK ----------------
export const useStates = ({
  pagination,
  sorting,
  filters = {},
}: UseStatesParams) => {
  const queryClient = useQueryClient();

  // --- GET STATES ---
  const getStatesQuery = useQuery({
    queryKey: [
      "states",
      pagination.pageIndex,
      pagination.pageSize,
      JSON.stringify(sorting),
      filters.search || "",
    ],
    queryFn: () =>
      fetchStatesApi({
        pagination,
        sorting,
        filters,
      }),
    placeholderData: keepPreviousData,
  });

  // --- CREATE STATE ---
  const createStateMutation = useMutation({
    mutationFn: (payload: any) => api.post("/states", payload),
    onSuccess: () => {
      toast.success("State created successfully!");
      queryClient.invalidateQueries({ queryKey: ["states"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Create failed"),
  });

  // --- UPDATE STATE ---
  const updateStateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/states/${id}`, payload),
    onSuccess: () => {
      toast.success("State updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["states"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Update failed"),
  });

  // --- DELETE STATE ---
  const deleteStateMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/states/${id}`),
    onSuccess: () => {
      toast.success("State deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["states"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Delete failed"),
  });

  return {
    states: getStatesQuery.data?.data || [],
    total: getStatesQuery.data?.totalRecords || 0,

    isLoading: getStatesQuery.isLoading,
    isFetching: getStatesQuery.isFetching,
    isPlaceholderData: getStatesQuery.isPlaceholderData,

    createState: createStateMutation.mutate,
    updateState: updateStateMutation.mutate,
    deleteState: deleteStateMutation.mutate,

    isCreateLoading: createStateMutation.isPending,
    isUpdateLoading: updateStateMutation.isPending,
    isDeleteLoading: deleteStateMutation.isPending,
  };
};
