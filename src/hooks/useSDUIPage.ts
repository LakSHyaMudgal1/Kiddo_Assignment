import { useQuery } from '@tanstack/react-query';
import { fetchSDUIPage } from '@services/api/sduiService';
import type { SDUIPageResponse } from '@/types/sdui';

/**
 * Hook to fetch and cache a server-driven UI page.
 *
 * @param pageId  - The page identifier (e.g. 'home', 'pdp/123')
 * @param params  - Optional query parameters passed to the API
 */
export const useSDUIPage = (
  pageId: string,
  params?: Record<string, string>,
) => {
  return useQuery<SDUIPageResponse, Error>({
    queryKey: ['sdui-page', pageId, params],
    queryFn: () => fetchSDUIPage(pageId, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
