import type { DevelopStaff, DevelopStaffFilters } from "@/features/develop-staff/types";
import { request } from "@/shared/api/http";

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const buildPath = (path: "/develop/staff/list" | "/develop/staff/list2", filters: DevelopStaffFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.startDate.trim()) {
    params.set("startDate", filters.startDate.trim());
  }
  if (filters.endDate.trim()) {
    params.set("endDate", filters.endDate.trim());
  }
  return `${path}?${params.toString()}`;
};

export const developStaffApi = {
  list: (filters: DevelopStaffFilters) => request<PageResponse<DevelopStaff>>(buildPath("/develop/staff/list", filters)),
  list2: (filters: DevelopStaffFilters) => request<PageResponse<DevelopStaff>>(buildPath("/develop/staff/list2", filters)),
};
