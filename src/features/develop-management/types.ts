export type DevelopManagement = {
  requestCompanyCd: string;
  requestCompanyNm: string | null;
  requestYm: string;
  requestSeq: number;
  statusCd: string | null;
  requestNm: string | null;
  requestContent: string | null;
  managerSabun: string | null;
  developerSabun: string | null;
  outsideYn: string | null;
  paidYn: string | null;
  paidContent: string | null;
  taxBillYn: string | null;
  startYm: string | null;
  endYm: string | null;
  paidMm: number | null;
  realMm: number | null;
  content: string | null;
  sdate: string | null;
  edate: string | null;
  partCd: string | null;
  partNm: string | null;
};

export type DevelopManagementDraft = {
  requestCompanyCd: string;
  requestYm: string;
  requestSeq: string;
  statusCd: string;
  requestNm: string;
  requestContent: string;
  managerSabun: string;
  developerSabun: string;
  outsideYn: string;
  paidYn: string;
  paidContent: string;
  taxBillYn: string;
  startYm: string;
  endYm: string;
  paidMm: string;
  realMm: string;
  content: string;
  sdate: string;
  edate: string;
  partCd: string;
};

export type DevelopManagementFilters = {
  companyName: string;
  startDate: string;
  endDate: string;
  statusCd: string;
  mngName: string;
  page: number;
  size: number;
};
