export type OutManageTimeSummary = {
  sabun: string;
  name: string | null;
  sdate: string;
  edate: string;
  totalCnt: number | null;
  useCnt: number | null;
  remainCnt: number | null;
  note: string | null;
};

export type OutManageTimeDetail = {
  id: number;
  sabun: string;
  gntCd: string | null;
  gntName: string | null;
  applyDate: string | null;
  statusCd: string | null;
  statusName: string | null;
  sdate: string;
  edate: string;
  applyCnt: number | null;
  note: string | null;
};

export type OutManageTimeDetailDraft = {
  id: number | null;
  sabun: string;
  gntCd: string;
  applyDate: string;
  statusCd: string;
  sdate: string;
  edate: string;
  applyCnt: string;
  note: string;
};

export type OutManageCodeOption = {
  code: string;
  codeNm: string;
};
