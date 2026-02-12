import type {
  InfraCompanyOption,
  InfraMaster,
  InfraMasterDraft,
  InfraSearchFilters,
  InfraSection,
  InfraSectionDraft,
  InfraSummary,
} from "@/features/manage-infra/types";
import { request } from "@/shared/api/http";

type MutationResponse = {
  succeeded: number;
  failed: number;
};

const buildListPath = (filters: InfraSearchFilters): string => {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }
  if (filters.taskGubunCd.trim()) {
    params.set("taskGubunCd", filters.taskGubunCd.trim());
  }
  const qs = params.toString();
  return qs ? `/infra/management/list?${qs}` : "/infra/management/list";
};

const buildMasterPath = (companyCd: string, taskGubunCd: string): string => {
  const params = new URLSearchParams({ companyCd, taskGubunCd });
  return `/infra/management/master?${params.toString()}`;
};

const buildSectionPath = (companyCd: string, taskGubunCd: string, devGbCd: string): string => {
  const params = new URLSearchParams({ companyCd, taskGubunCd, devGbCd });
  return `/infra/management/sectionList?${params.toString()}`;
};

const toMasterPayload = (draft: InfraMasterDraft) => ({
  companyCd: draft.companyCd.trim(),
  taskGubunCd: draft.taskGubunCd.trim(),
  devGbCdList: draft.devGbCdList.map((item) => item.trim()).filter(Boolean),
});

const toSectionPayload = (draft: InfraSectionDraft) => ({
  companyCd: draft.companyCd.trim(),
  taskGubunCd: draft.taskGubunCd.trim(),
  devGbCd: draft.devGbCd.trim(),
  sectionId: draft.sectionId.trim() || null,
  seq: draft.seq.trim() ? Number(draft.seq.trim()) : null,
  title: draft.title.trim() || null,
  type: draft.type.trim() || null,
  columnNm: draft.columnNm.trim() || null,
  columnSeq: draft.columnSeq.trim() || null,
  contents: draft.contents.trim() || null,
});

export const manageInfraApi = {
  list: (filters: InfraSearchFilters) => request<InfraSummary[]>(buildListPath(filters)),
  listMaster: (companyCd: string, taskGubunCd: string) => request<InfraMaster[]>(buildMasterPath(companyCd, taskGubunCd)),
  listSection: (companyCd: string, taskGubunCd: string, devGbCd: string) =>
    request<InfraSection[]>(buildSectionPath(companyCd, taskGubunCd, devGbCd)),
  dupCount: (draft: InfraMasterDraft) =>
    request<number>("/infra/management/dup", {
      method: "POST",
      body: toMasterPayload(draft),
    }),
  createMaster: (draft: InfraMasterDraft) =>
    request<MutationResponse>("/infra/management/insert/master", {
      method: "POST",
      body: toMasterPayload(draft),
    }),
  deleteMaster: (items: Array<{ companyCd: string; taskGubunCd: string }>) =>
    request<MutationResponse>("/infra/management/delete/master", {
      method: "DELETE",
      body: items,
    }),
  deleteMapping: (companyCd: string, taskGubunCd: string, devGbCd: string) =>
    request<MutationResponse>("/infra/management/delete", {
      method: "DELETE",
      body: { companyCd, taskGubunCd, devGbCd },
    }),
  addSection: (draft: InfraSectionDraft) =>
    request<MutationResponse>("/infra/management/insert", {
      method: "POST",
      body: [toSectionPayload(draft)],
    }),
  listCompanies: () =>
    request<InfraCompanyOption[]>("/company/all").then((rows) =>
      rows.map((row) => ({
        companyCd: row.companyCd,
        companyNm: row.companyNm,
      })),
    ),
};
