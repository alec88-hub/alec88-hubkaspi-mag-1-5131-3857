import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useCatalog() {
  return useQuery(orpc.catalog.list.queryOptions({ staleTime: 15_000 }));
}
export function useReviews(id: string, page: number) {
  return useQuery(orpc.catalog.reviews.queryOptions({ input: { id, page } }));
}
export function useAdmin() {
  return useQuery(orpc.administration.dashboard.queryOptions({ retry: false }));
}
