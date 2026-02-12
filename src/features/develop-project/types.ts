export type DevelopProject = {
  projectId: number;
  projectNm: string;
  requestCompanyCd: string;
  requestCompanyNm: string | null;
  partCd: string | null;
  partNm: string | null;
  inputManPower: string | null;
  contractStdDt: string | null;
  contractEndDt: string | null;
  developStdDt: string | null;
  developEndDt: string | null;
  inspectionYn: string | null;
  taxBillYn: string | null;
  realMm: number | null;
  contractPrice: number | null;
  fileSeq: string | null;
  remark: string | null;
};

export type DevelopProjectDraft = {
  projectId: number | null;
  projectNm: string;
  requestCompanyCd: string;
  partCd: string;
  inputManPower: string;
  contractStdDt: string;
  contractEndDt: string;
  developStdDt: string;
  developEndDt: string;
  inspectionYn: string;
  taxBillYn: string;
  realMm: string;
  contractPrice: string;
  fileSeq: string;
  remark: string;
};
