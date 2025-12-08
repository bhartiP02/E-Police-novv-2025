// ===================== COUNTRY =====================
export interface Country {
  id: number;
  country_name: string;
}

// ===================== STATE =====================
export interface State {
  id: number;
  country_id: number;
  country_name: string;
  state_name: string;
  state_name_en: string;
  state_name_marathi?: string;
  state_name_hindi?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetStatesResponse {
  success?: boolean;
  search?: string;
  totalRecords: number;
  currentPage?: number;
  limit: number;
  totalPages?: number;
  data: State[];
}

export interface StateFilters {
  search?: string;
}

// ===================== POLICE USER =====================
export interface PoliceUser extends Record<string, any> {
  id: number;
  police_name: string;
  email: string;
  mobile: string;
  designation_type: string;
  designation_id?: number;
  designation_name: string;
  gender: string;
  state_name?: string;
  state_id?: number;
  district_name?: string;
  district_id?: number;
  city_name?: string;
  city_id?: number;
  pincode: string;
  aadhar_number: string;
  pan_number: string;
  buckal_number: string;
  address: string;
  image_url?: string;
  image?: string | File;
  sdpo_name?: string;
  sdpo_id?: number;
  station_name?: string;
  station_id?: number;
  police_station_id?: number;
  status?: string;
  country_id?: number;
  country_name?: string;
  department_id?: number;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetPoliceUsersResponse {
  success: boolean;
  data: PoliceUser[];
  totalRecords: number;
  page?: number;
  limit?: number;
}

export interface PoliceUserFilters {
  search?: string;
}

// ===================== DROPDOWN ITEM =====================
export interface DropdownItem {
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

// ===================== FORM DATA =====================
export interface PoliceUserFormData {
  police_name: string;
  email: string;
  mobile: string;
  password?: string;
  designation_type: string;
  designation_id: string;
  gender: string;
  country_id: string;
  state_id: string;
  district_id: string;
  city_id: string;
  sdpo_id: string;
  police_station_id: string;
  pincode: string;
  aadhar_number: string;
  pan_number: string;
  buckal_number: string;
  address: string;
  status?: string;
  image?: File | null;
  department_id: string;
}