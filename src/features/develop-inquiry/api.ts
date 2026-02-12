import type { DevelopInquiry, DevelopInquiryDraft } from "@/features/develop-inquiry/types";
import { request } from "@/shared/api/http";

type MutationResponse = {
  succeeded: number;
  failed: number;
};

const normalizeDate = (value: string): string | null => {
  const normalized = value.trim().replaceAll("-", "");
  return normalized ? normalized : null;
};

const normalizeNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const toPayload = (draft: DevelopInquiryDraft) => ({
  inSeq: draft.inSeq,
  requestCompanyCd: draft.requestCompanyCd.trim(),
  inContent: draft.inContent.trim(),
  proceedHopeDt: normalizeDate(draft.proceedHopeDt),
  estRealMm: normalizeNumber(draft.estRealMm),
  salesNm: draft.salesNm.trim() || null,
  chargeNm: draft.chargeNm.trim() || null,
  inProceedCode: draft.inProceedCode.trim() || null,
  confirmYn: draft.confirmYn.trim() || null,
  projectNm: draft.projectNm.trim() || null,
  remark: draft.remark.trim() || null,
});

const buildListPath = (keyword: string, inProceedCode: string): string => {
  const params = new URLSearchParams();
  if (keyword.trim()) {
    params.set("keyword", keyword.trim());
  }
  if (inProceedCode.trim()) {
    params.set("inProceedCode", inProceedCode.trim());
  }
  const qs = params.toString();
  return qs ? `/develop/inquiry/list?${qs}` : "/develop/inquiry/list";
};

export const developInquiryApi = {
  list: (keyword = "", inProceedCode = "") => request<DevelopInquiry[]>(buildListPath(keyword, inProceedCode)),
  create: (draft: DevelopInquiryDraft) =>
    request<DevelopInquiry>("/develop/inquiry/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: DevelopInquiryDraft) =>
    request<DevelopInquiry>("/develop/inquiry/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteMany: (inSeqs: number[]) =>
    request<MutationResponse>("/develop/inquiry/delete", {
      method: "DELETE",
      body: inSeqs.map((inSeq) => ({ inSeq })),
    }),
};
