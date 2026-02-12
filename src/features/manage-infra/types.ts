import type { ManageCompany } from "@/features/manage-company/types";

export type InfraSummary = {
  enterCd: string;
  taskGubunCd: string;
  taskGubunNm: string;
  companyCd: string;
  companyNm: string | null;
  devYn: string;
  prodYn: string;
};

export type InfraMaster = {
  enterCd: string;
  taskGubunCd: string;
  taskGubunNm: string;
  companyCd: string;
  companyNm: string | null;
  devGbCd: string;
};

export type InfraSection = {
  enterCd: string;
  companyCd: string;
  companyNm: string | null;
  taskGubunCd: string;
  devGbCd: string;
  sectionId: string | null;
  seq: number | null;
  title: string | null;
  type: string | null;
  columnNm: string | null;
  columnSeq: string | null;
  contents: string | null;
};

export type InfraMasterDraft = {
  companyCd: string;
  taskGubunCd: string;
  devGbCdList: string[];
};

export type InfraSectionDraft = {
  companyCd: string;
  taskGubunCd: string;
  devGbCd: string;
  sectionId: string;
  seq: string;
  title: string;
  type: string;
  columnNm: string;
  columnSeq: string;
  contents: string;
};

export type InfraSearchFilters = {
  keyword: string;
  taskGubunCd: string;
};

export type InfraCompanyOption = Pick<ManageCompany, "companyCd" | "companyNm">;
