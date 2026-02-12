export type OutManageRecord = {
  sabun: string;
  name: string | null;
  sdate: string;
  edate: string;
  totCnt: number | null;
  svcCnt: number | null;
  note: string | null;
};

export type OutManageDraft = {
  sabun: string;
  sdate: string;
  edate: string;
  totCnt: string;
  svcCnt: string;
  note: string;
  oriSdate: string;
};

export type OutManageSearchFilters = {
  page: number;
  size: number;
  sdate: string;
  name: string;
};
