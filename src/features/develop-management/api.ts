import type {
  DevelopManagement,
  DevelopManagementDraft,
  DevelopManagementFilters,
} from "@/features/develop-management/types";
import { request } from "@/shared/api/http";

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type MutationResponse = {
  succeeded: number;
  failed: number;
};

const normalizeYm = (value: string): string | null => {
  const normalized = value.trim().replaceAll("-", "");
  return normalized ? normalized.slice(0, 6) : null;
};

const normalizeYmd = (value: string): string | null => {
  const normalized = value.trim().replaceAll("-", "");
  return normalized ? normalized.slice(0, 8) : null;
};

const normalizeNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const toPayload = (draft: DevelopManagementDraft) => ({
  requestCompanyCd: draft.requestCompanyCd.trim(),
  requestYm: normalizeYm(draft.requestYm),
  requestSeq: draft.requestSeq.trim() ? Number(draft.requestSeq.trim()) : null,
  statusCd: draft.statusCd.trim() || null,
  requestNm: draft.requestNm.trim() || null,
  requestContent: draft.requestContent.trim() || null,
  managerSabun: draft.managerSabun.trim() || null,
  developerSabun: draft.developerSabun.trim() || null,
  outsideYn: draft.outsideYn.trim() || null,
  paidYn: draft.paidYn.trim() || null,
  paidContent: draft.paidContent.trim() || null,
  taxBillYn: draft.taxBillYn.trim() || null,
  startYm: normalizeYm(draft.startYm),
  endYm: normalizeYm(draft.endYm),
  paidMm: normalizeNumber(draft.paidMm),
  realMm: normalizeNumber(draft.realMm),
  content: draft.content.trim() || null,
  sdate: normalizeYmd(draft.sdate),
  edate: normalizeYmd(draft.edate),
  partCd: draft.partCd.trim() || null,
});

const buildListPath = (path: "/develop/management/list" | "/develop/management/list2", filters: DevelopManagementFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.companyName.trim()) {
    params.set("companyName", filters.companyName.trim());
  }
  if (filters.startDate.trim()) {
    params.set("startDate", filters.startDate.trim());
  }
  if (filters.endDate.trim()) {
    params.set("endDate", filters.endDate.trim());
  }
  if (filters.statusCd.trim()) {
    params.set("statusCd", filters.statusCd.trim());
  }
  if (filters.mngName.trim()) {
    params.set("mngName", filters.mngName.trim());
  }
  return `${path}?${params.toString()}`;
};

export const developManagementApi = {
  list: (filters: DevelopManagementFilters) =>
    request<PageResponse<DevelopManagement>>(buildListPath("/develop/management/list", filters)),
  list2: (filters: DevelopManagementFilters) =>
    request<PageResponse<DevelopManagement>>(buildListPath("/develop/management/list2", filters)),
  create: (draft: DevelopManagementDraft) =>
    request<DevelopManagement>("/develop/management/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: DevelopManagementDraft) =>
    request<DevelopManagement>("/develop/management/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteMany: (rows: Array<{ requestCompanyCd: string; requestYm: string; requestSeq: number }>) =>
    request<MutationResponse>("/develop/management/delete", {
      method: "DELETE",
      body: rows,
    }),
};
