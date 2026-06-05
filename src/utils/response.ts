export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function successResponse<T>(data: T, message: string = "Request successful"): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function failResponse<T = null>(message: string, errors: string[] | null = null): ApiResponse<T> {
  return {
    success: false,
    message,
    data: null,
    errors,
  };
}

export function createPagedResult<T>(
  items: T[],
  totalCount: number,
  pageNumber: number,
  pageSize: number
): PagedResult<T> {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  };
}
