import type {
  OutManageDraft,
  OutManageRecord,
  OutManageSearchFilters,
} from "@/features/manage-out-manage/types";
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

type DupResponse = {
  dupData: string | null;
};

const normalizeDate = (value: string): string => value.trim().replaceAll("-", "");

const normalizeDecimalOrNull = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const buildSearchPath = (filters: OutManageSearchFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.sdate.trim()) {
    params.set("sdate", normalizeDate(filters.sdate));
  }
  if (filters.name.trim()) {
    params.set("name", filters.name.trim());
  }
  return `/out-manage/search?${params.toString()}`;
};

const toPayload = (draft: OutManageDraft) => ({
  sabun: draft.sabun.trim(),
  sdate: normalizeDate(draft.sdate),
  edate: normalizeDate(draft.edate),
  totCnt: normalizeDecimalOrNull(draft.totCnt),
  svcCnt: normalizeDecimalOrNull(draft.svcCnt),
  note: draft.note.trim() || null,
  oriSdate: draft.oriSdate.trim() ? normalizeDate(draft.oriSdate) : null,
});

const buildDupPath = (draft: OutManageDraft): string => {
  const params = new URLSearchParams({
    sabun: draft.sabun.trim(),
    sdate: normalizeDate(draft.sdate),
    edate: normalizeDate(draft.edate),
  });
  if (draft.oriSdate.trim()) {
    params.set("oriSdate", normalizeDate(draft.oriSdate));
  }
  return `/out-manage/dup?${params.toString()}`;
};

export const manageOutManageApi = {
  search: (filters: OutManageSearchFilters) => request<PageResponse<OutManageRecord>>(buildSearchPath(filters)),
  dupCheck: (draft: OutManageDraft) => request<DupResponse>(buildDupPath(draft)),
  create: (draft: OutManageDraft) =>
    request<OutManageRecord>("/out-manage/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: OutManageDraft) =>
    request<OutManageRecord>("/out-manage/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteMany: (rows: Array<{ sabun: string; sdate: string }>) =>
    request<MutationResponse>("/out-manage/delete", {
      method: "DELETE",
      body: { deleteList: rows.map((row) => ({ sabun: row.sabun, sdate: normalizeDate(row.sdate) })) },
    }),
};
