export type DevelopInquiry = {
  inSeq: number;
  requestCompanyCd: string;
  requestCompanyNm: string | null;
  inContent: string;
  proceedHopeDt: string | null;
  estRealMm: number | null;
  salesNm: string | null;
  chargeNm: string | null;
  inProceedCode: string | null;
  inProceedNm: string | null;
  confirmYn: string | null;
  confirmNm: string | null;
  projectNm: string | null;
  remark: string | null;
};

export type DevelopInquiryDraft = {
  inSeq: number | null;
  requestCompanyCd: string;
  inContent: string;
  proceedHopeDt: string;
  estRealMm: string;
  salesNm: string;
  chargeNm: string;
  inProceedCode: string;
  confirmYn: string;
  projectNm: string;
  remark: string;
};
