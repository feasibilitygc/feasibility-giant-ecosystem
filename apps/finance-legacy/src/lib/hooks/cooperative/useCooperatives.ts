"use client";

import { useQuery } from "@tanstack/react-query";
import {
  cooperativeService,
  type CooperativeListItem,
} from "@/lib/api/services/cooperativeService";

/**
 * Hook to fetch all registered cooperatives for dropdown selection.
 * Used in the member verification and join flows so members can
 * associate themselves with the correct cooperative.
 */
export function useCooperatives() {
  return useQuery<CooperativeListItem[]>({
    queryKey: ["cooperatives", "list"],
    queryFn: async () => {
      const response = await cooperativeService.listCooperatives();
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: 2,
  });
}

export type { CooperativeListItem };
