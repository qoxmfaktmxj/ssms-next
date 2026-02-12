import type { SystemLogFilters, SystemLogRecord } from "@/features/system-log/types";
import { request } from "@/shared/api/http";

type SystemLogListResponse = {
  content: SystemLogRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const buildListPath = (filters: SystemLogFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.sabun.trim()) {
    params.set("sabun", filters.sabun.trim());
  }
  if (filters.actionType.trim()) {
    params.set("actionType", filters.actionType.trim());
  }
  return `/log/list?${params.toString()}`;
};

export const systemLogApi = {
  list: (filters: SystemLogFilters) => request<SystemLogListResponse>(buildListPath(filters)),
};
