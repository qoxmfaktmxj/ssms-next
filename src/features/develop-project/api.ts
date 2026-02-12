import type { DevelopProject, DevelopProjectDraft } from "@/features/develop-project/types";
import { request } from "@/shared/api/http";

type MutationResponse = {
  succeeded: number;
  failed: number;
};

const normalizeDate = (value: string, length: 6 | 8): string | null => {
  const normalized = value.trim().replaceAll("-", "");
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, length);
};

const normalizeNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const toPayload = (draft: DevelopProjectDraft) => ({
  projectId: draft.projectId,
  projectNm: draft.projectNm.trim(),
  requestCompanyCd: draft.requestCompanyCd.trim(),
  partCd: draft.partCd.trim(),
  inputManPower: draft.inputManPower.trim() || null,
  contractStdDt: normalizeDate(draft.contractStdDt, 6),
  contractEndDt: normalizeDate(draft.contractEndDt, 6),
  developStdDt: normalizeDate(draft.developStdDt, 8),
  developEndDt: normalizeDate(draft.developEndDt, 8),
  inspectionYn: draft.inspectionYn.trim() || null,
  taxBillYn: draft.taxBillYn.trim() || null,
  realMm: normalizeNumber(draft.realMm),
  contractPrice: normalizeNumber(draft.contractPrice),
  fileSeq: normalizeNumber(draft.fileSeq),
  remark: draft.remark.trim() || null,
});

const buildListPath = (keyword: string, startDate: string, endDate: string): string => {
  const params = new URLSearchParams();
  if (keyword.trim()) {
    params.set("keyword", keyword.trim());
  }
  if (startDate.trim()) {
    params.set("startDate", startDate.trim());
  }
  if (endDate.trim()) {
    params.set("endDate", endDate.trim());
  }
  const qs = params.toString();
  return qs ? `/develop/project/list?${qs}` : "/develop/project/list";
};

export const developProjectApi = {
  list: (keyword = "", startDate = "", endDate = "") =>
    request<DevelopProject[]>(buildListPath(keyword, startDate, endDate)),
  create: (draft: DevelopProjectDraft) =>
    request<DevelopProject>("/develop/project/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: DevelopProjectDraft) =>
    request<DevelopProject>("/develop/project/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteMany: (projectIds: number[]) =>
    request<MutationResponse>("/develop/project/delete", {
      method: "DELETE",
      body: projectIds.map((projectId) => ({ projectId })),
    }),
};
