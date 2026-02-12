import type { CodeDraft, SystemCode } from "@/features/system-code/types";
import { request } from "@/shared/api/http";

type CodeListResponse = {
  content: SystemCode[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type MutationResponse = {
  succeeded: number;
  failed: number;
};

type CodeFilters = {
  page: number;
  size: number;
  grcodeCd: string;
  code: string;
  codeNm: string;
};

const buildSearchPath = (filters: CodeFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.grcodeCd.trim()) {
    params.set("grcodeCd", filters.grcodeCd.trim());
  }
  if (filters.code.trim()) {
    params.set("code", filters.code.trim());
  }
  if (filters.codeNm.trim()) {
    params.set("codeNm", filters.codeNm.trim());
  }
  return `/code/search?${params.toString()}`;
};

const toPayload = (draft: CodeDraft) => ({
  grcodeCd: draft.grcodeCd.trim(),
  code: draft.code.trim(),
  codeNm: draft.codeNm.trim(),
  codeEngNm: draft.codeEngNm.trim() || null,
  seq: draft.seq.trim() ? Number(draft.seq.trim()) : null,
  useYn: draft.useYn,
  note1: draft.note1.trim() || null,
  note2: draft.note2.trim() || null,
  note3: draft.note3.trim() || null,
  note4: draft.note4.trim() || null,
  numNote: draft.numNote.trim() || null,
  erpCode: draft.erpCode.trim() || null,
});

export const systemCodeApi = {
  search: (filters: CodeFilters) => request<CodeListResponse>(buildSearchPath(filters)),
  create: (draft: CodeDraft) =>
    request<SystemCode>("/code/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: CodeDraft) =>
    request<SystemCode>("/code/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteMany: (items: Array<{ grcodeCd: string; code: string }>) =>
    request<MutationResponse>("/code/delete", {
      method: "DELETE",
      body: { deleteList: items },
    }),
  refreshCache: () => request<{ message: string }>("/code/cache/refreshAll"),
};
