import { apiClient } from './client';
import type { SDUIPageResponse, ApiResponse } from '@/types/sdui';

/**
 * Fetch a server-driven UI page by its page ID.
 */
export const fetchSDUIPage = async (
  pageId: string,
  params?: Record<string, string>,
): Promise<SDUIPageResponse> => {
  const response = await apiClient.get<ApiResponse<SDUIPageResponse>>(
    `/pages/${pageId}`,
    { params },
  );
  return response.data.data;
};
