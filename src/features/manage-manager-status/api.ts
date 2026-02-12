import type { ManagerStatusRecord } from "@/features/manage-manager-status/types";
import { request } from "@/shared/api/http";

export const manageManagerStatusApi = {
  list: () => request<ManagerStatusRecord[]>("/dashboard/manager-status"),
};
