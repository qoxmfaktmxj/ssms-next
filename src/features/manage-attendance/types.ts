export type AttendanceRecord = {
  id: number;
  sabun: string;
  sdate: string;
  edate: string;
  gntCd: string | null;
  statusCd: string | null;
  note: string | null;
  applyDate: string | null;
  name: string | null;
  gntCdName: string | null;
  statusCdName: string | null;
  orgNm: string | null;
  jikweeNm: string | null;
};

export type AttendanceDraft = {
  id: number | null;
  sabun: string;
  sdate: string;
  edate: string;
  gntCd: string;
  statusCd: string;
  note: string;
  applyDate: string;
};

export type CodeOption = {
  code: string;
  codeNm: string;
};
