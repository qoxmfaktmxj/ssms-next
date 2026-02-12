import type {
  QuickMenuCandidate,
  QuickMenuCandidateFilters,
  QuickMenuItem,
} from "@/features/system-quick-menu/types";
import { request } from "@/shared/api/http";

type QuickMenuListResponse = {
  content: QuickMenuItem[];
};

type QuickMenuMutationResponse = {
  succeeded: number;
  failed: number;
};

type CandidateListResponse = {
  content: QuickMenuCandidate[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const buildCandidateListPath = (filters: QuickMenuCandidateFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }
  return `/quick/menu/list?${params.toString()}`;
};

export const systemQuickMenuApi = {
  list: () => request<QuickMenuListResponse>("/quick/list"),
  listCandidates: (filters: QuickMenuCandidateFilters) =>
    request<CandidateListResponse>(buildCandidateListPath(filters)),
  save: (items: Array<{ menuId: number; seq?: number }>) =>
    request<QuickMenuMutationResponse>("/quick/insert", {
      method: "POST",
      body: items,
    }),
  clear: () =>
    request<QuickMenuMutationResponse>("/quick/delete", {
      method: "DELETE",
    }),
};
