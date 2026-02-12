import type {
  OutManageCodeOption,
  OutManageTimeDetail,
  OutManageTimeDetailDraft,
  OutManageTimeSummary,
} from "@/features/manage-out-manage-time/types";
import { request } from "@/shared/api/http";

type ContentResponse<T> = {
  content: T[];
};

const normalizeDate = (value: string): string => value.trim().replaceAll("-", "");

const normalizeDecimalOrNull = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const toPayload = (draft: OutManageTimeDetailDraft) => ({
  id: draft.id,
  sabun: draft.sabun.trim(),
  gntCd: draft.gntCd.trim() || null,
  applyDate: normalizeDate(draft.applyDate),
  statusCd: draft.statusCd.trim() || null,
  sdate: normalizeDate(draft.sdate),
  edate: normalizeDate(draft.edate),
  applyCnt: normalizeDecimalOrNull(draft.applyCnt),
  note: draft.note.trim() || null,
});

const buildSummaryPath = (searchYmd: string, searchName: string): string => {
  const params = new URLSearchParams();
  if (searchYmd.trim()) {
    params.set("searchYmd", normalizeDate(searchYmd));
  }
  if (searchName.trim()) {
    params.set("searchName", searchName.trim());
  }
  const qs = params.toString();
  return qs ? `/out-manage/time?${qs}` : "/out-manage/time";
};

const buildDetailPath = (sabun: string, sdate: string, edate: string): string => {
  const params = new URLSearchParams({
    sdate: normalizeDate(sdate),
    edate: normalizeDate(edate),
  });
  return `/out-manage/time/${encodeURIComponent(sabun)}?${params.toString()}`;
};

export const manageOutManageTimeApi = {
  listSummary: (searchYmd: string, searchName: string) =>
    request<ContentResponse<OutManageTimeSummary>>(buildSummaryPath(searchYmd, searchName)),
  listDetail: (sabun: string, sdate: string, edate: string) =>
    request<ContentResponse<OutManageTimeDetail>>(buildDetailPath(sabun, sdate, edate)),
  saveDetail: (draft: OutManageTimeDetailDraft) =>
    request<OutManageTimeDetailDraft>("/out-manage/time", {
      method: "POST",
      body: toPayload(draft),
    }),
  deleteDetails: (items: Array<{ id: number; sabun: string }>) =>
    request<boolean>("/out-manage/time", {
      method: "DELETE",
      body: {
        deleteList: items.map((item) => ({ id: item.id, sabun: item.sabun })),
      },
    }),
  listCode: (groupCode: string) =>
    request<OutManageCodeOption[]>(`/code/list?${new URLSearchParams({ grcodeCd: groupCode }).toString()}`),
};
