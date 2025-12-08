"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { PaginationState, SortingState } from "@/component/ui/Table/CustomTable";
import { toast } from "sonner";
import { policeUserService, GetPoliceUsersResponse } from "@/services/api-services/policeUserService";
import { PoliceUser, PoliceUserFilters } from "@/interface/interface";

export interface UsePoliceUsersParams {
  pagination: PaginationState;
  sorting: SortingState;
  filters?: PoliceUserFilters;
}

const fetchPoliceUsersApi = async ({
  pagination,
  sorting,
  filters,
}: UsePoliceUsersParams): Promise<GetPoliceUsersResponse> => {
  const params: Record<string, any> = {
    page: (pagination.pageIndex + 1).toString(),
    limit: pagination.pageSize.toString(),
  };

  if (filters?.search?.trim()) {
    params.search = filters.search.trim();
  }

  if (sorting.length > 0) {
    params.sortBy = sorting[0].id;
    params.sortOrder = sorting[0].desc ? "desc" : "asc";
  }

  return await policeUserService.getPoliceUsers(params);
};

export const usePoliceUsers = ({
  pagination,
  sorting,
  filters = {},
}: UsePoliceUsersParams) => {
  const queryClient = useQueryClient();

  const getPoliceUsersQuery = useQuery({
    queryKey: [
      "policeUsers",
      pagination.pageIndex,
      pagination.pageSize,
      sorting[0]?.id || "",
      sorting[0]?.desc || false,
      filters.search || "",
    ],
    queryFn: () =>
      fetchPoliceUsersApi({
        pagination,
        sorting,
        filters,
      }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const createPoliceUserMutation = useMutation({
    mutationFn: (payload: FormData) =>
      policeUserService.createPoliceUser(payload),
    onSuccess: () => {
      toast.success("Police User created successfully!");
      queryClient.invalidateQueries({ queryKey: ["policeUsers"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Create failed"),
  });

  const updatePoliceUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) =>
      policeUserService.updatePoliceUser(id, payload),
    onSuccess: () => {
      toast.success("Police User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["policeUsers"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Update failed"),
  });

  const deletePoliceUserMutation = useMutation({
    mutationFn: (id: number) => policeUserService.deletePoliceUser(id),
    onSuccess: () => {
      toast.success("Police User deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["policeUsers"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Delete failed"),
  });

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: () => policeUserService.getCountries(),
    staleTime: 1000 * 60 * 60,
  });

  const designationsQuery = useQuery({
    queryKey: ["designations"],
    queryFn: () => policeUserService.getDesignations(),
    staleTime: 1000 * 60 * 60,
  });

  const fetchCountries = async () => {
    return await policeUserService.getCountries();
  };

  const fetchStatesByCountry = async (countryId: string | number) => {
    if (!countryId) return [];
    return await policeUserService.getStatesByCountry(countryId);
  };

  const fetchDistrictsByState = async (stateId: string | number) => {
    if (!stateId) return [];
    return await policeUserService.getDistrictsByState(stateId);
  };

  const fetchCitiesByDistrict = async (districtId: string | number) => {
    if (!districtId) return [];
    return await policeUserService.getCitiesByDistrict(districtId);
  };

  const fetchSdpoByCity = async (cityId: string | number) => {
    if (!cityId) return [];
    return await policeUserService.getSdpoByCity(cityId);
  };

  const fetchPoliceStationsBySdpo = async (sdpoId: string | number) => {
    if (!sdpoId) return [];
    return await policeUserService.getPoliceStationsBySdpo(sdpoId);
  };

  const fetchDesignations = async () => {
    return await policeUserService.getDesignations();
  };



  return {
    policeUsers: getPoliceUsersQuery.data?.data || [],
    total: getPoliceUsersQuery.data?.totalRecords || 0,
    isLoading: getPoliceUsersQuery.isLoading,
    isFetching: getPoliceUsersQuery.isFetching,
    isPlaceholderData: getPoliceUsersQuery.isPlaceholderData,

    createPoliceUser: createPoliceUserMutation.mutate,
    updatePoliceUser: updatePoliceUserMutation.mutate,
    deletePoliceUser: deletePoliceUserMutation.mutate,

    isCreateLoading: createPoliceUserMutation.isPending,
    isUpdateLoading: updatePoliceUserMutation.isPending,
    isDeleteLoading: deletePoliceUserMutation.isPending,

    countries: countriesQuery.data || [],
    designations: designationsQuery.data || [],

    fetchCountries,
    fetchStatesByCountry,
    fetchDistrictsByState,
    fetchCitiesByDistrict,
    fetchSdpoByCity,
    fetchPoliceStationsBySdpo,
    fetchDesignations,

    isCountriesLoading: countriesQuery.isLoading,
    isDesignationsLoading: designationsQuery.isLoading,
  };
};