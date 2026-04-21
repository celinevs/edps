
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  results: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  summary?: SummaryDetails
}

export interface SummaryDetails {
  assessed: number;
  awaiting_validation: number;
  in_progress: number;
  validation_complete: number
}