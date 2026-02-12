export type ManageCompany = {
  enterCd: string;
  companyCd: string;
  companyNm: string;
  companyGrpCd: string | null;
  objectDiv: string | null;
  manageDiv: string | null;
  representCompany: string | null;
  sdate: string | null;
  indutyCd: string | null;
  zip: string | null;
  address: string | null;
  homepage: string | null;
  chkid: string | null;
};

export type ManageCompanyDraft = {
  companyCd: string;
  companyNm: string;
  companyGrpCd: string;
  objectDiv: string;
  manageDiv: string;
  representCompany: string;
  sdate: string;
  indutyCd: string;
  zip: string;
  address: string;
  homepage: string;
};

export type ManageCompanyFilters = {
  page: number;
  size: number;
  companyNm: string;
};
