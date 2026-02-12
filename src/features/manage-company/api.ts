import type { ManageCompany, ManageCompanyDraft, ManageCompanyFilters } from "@/features/manage-company/types";
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

const buildListPath = (filters: ManageCompanyFilters): string => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.companyNm.trim()) {
    params.set("companyNm", filters.companyNm.trim());
  }
  return `/company/list?${params.toString()}`;
};

const toPayload = (draft: ManageCompanyDraft) => ({
  companyCd: draft.companyCd.trim(),
  companyNm: draft.companyNm.trim(),
  companyGrpCd: draft.companyGrpCd.trim() || null,
  objectDiv: draft.objectDiv.trim() || null,
  manageDiv: draft.manageDiv.trim() || null,
  representCompany: draft.representCompany.trim() || null,
  sdate: draft.sdate.trim().replaceAll("-", "") || null,
  indutyCd: draft.indutyCd.trim() || null,
  zip: draft.zip.trim() || null,
  address: draft.address.trim() || null,
  homepage: draft.homepage.trim() || null,
});

export const manageCompanyApi = {
  list: (filters: ManageCompanyFilters) => request<PageResponse<ManageCompany>>(buildListPath(filters)),
  listAll: () => request<ManageCompany[]>("/company/all"),
  create: (draft: ManageCompanyDraft) =>
    request<ManageCompany[]>("/company/insert", {
      method: "POST",
      body: [toPayload(draft)],
    }),
  update: (draft: ManageCompanyDraft) =>
    request<ManageCompany[]>("/company/update", {
      method: "PUT",
      body: [toPayload(draft)],
    }),
  deleteMany: (companyCds: string[]) =>
    request<MutationResponse>("/company/delete", {
      method: "DELETE",
      body: { enterCd: null, companyCds },
    }),
};
