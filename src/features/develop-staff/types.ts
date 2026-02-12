export type DevelopStaff = {
  requestCompanyCd: string;
  requestCompanyNm: string | null;
  projectNm: string | null;
  partCd: string | null;
  partNm: string | null;
  inspectionYn: string | null;
  realMm: number | null;
  inputManPower: string | null;
  developStdDt: string | null;
  developEndDt: string | null;
  taxBillYn: string | null;
  contractPrice: number | null;
  sdate: string | null;
  edate: string | null;
  startYm: string | null;
  endYm: string | null;
};

export type DevelopStaffFilters = {
  startDate: string;
  endDate: string;
  page: number;
  size: number;
};
