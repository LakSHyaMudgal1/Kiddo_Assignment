/**
 * API response envelope for SDUI pages.
 */
export interface SDUIPageResponse {
  pageId: string;
  version: number;
  ttl: number; // seconds
  nodes: import('@registry/types').SDUINode[];
  meta: Record<string, unknown>;
}

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message: string | null;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
