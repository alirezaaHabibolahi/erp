export interface RateLimiterOptions {
  points: number;
  duration: number;
  blockDuration: number;
}

export interface RateLimiterGuardOption {
  keyPrefix?: string;
  key?: string;
}

interface heading {
  key: string;
  label: string;
}

export interface ISheet {
  data: { headings: heading[]; data: object[] };
  name: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}
