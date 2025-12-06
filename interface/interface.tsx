
export interface Country {
  id: number;
  country_name: string;
}

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