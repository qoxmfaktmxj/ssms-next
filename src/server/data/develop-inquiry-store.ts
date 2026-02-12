import { query } from "@/server/db/pool";

export type DevelopInquiryRow = {
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

export type DevelopInquiryUpsertInput = {
  inSeq: number | null;
  requestCompanyCd: string;
  inContent: string;
  proceedHopeDt: string | null;
  estRealMm: number | null;
  salesNm: string | null;
  chargeNm: string | null;
  inProceedCode: string | null;
  confirmYn: string | null;
  projectNm: string | null;
  remark: string | null;
};

export type MutationCount = {
  succeeded: number;
  failed: number;
};

const baseSelect = `
  select
    d.in_seq::int as "inSeq",
    d.request_company_cd as "requestCompanyCd",
    c.company_nm as "requestCompanyNm",
    d.in_content as "inContent",
    d.proceed_hope_dt as "proceedHopeDt",
    d.est_real_mm::double precision as "estRealMm",
    d.sales_nm as "salesNm",
    d.charge_nm as "chargeNm",
    d.in_proceed_code as "inProceedCode",
    d.in_proceed_code as "inProceedNm",
    d.confirm_yn as "confirmYn",
    case
      when upper(coalesce(d.confirm_yn, 'N')) = 'Y' then 'Confirmed'
      else 'Pending'
    end as "confirmNm",
    d.project_nm as "projectNm",
    d.remark
  from develop_inquiry d
  left join tmst001_new c
    on c.enter_cd = d.enter_cd and c.company_cd = d.request_company_cd
`;

export const listDevelopInquiries = async (
  enterCd: string,
  keyword: string,
  inProceedCode: string,
): Promise<DevelopInquiryRow[]> => {
  const normalizedKeyword = keyword.trim();
  const normalizedProceed = inProceedCode.trim();

  const result = await query<DevelopInquiryRow>(
    `
      ${baseSelect}
      where d.enter_cd = $1
        and (
          $2 = ''
          or lower(coalesce(d.request_company_cd, '')) like lower('%' || $2 || '%')
          or lower(coalesce(d.in_content, '')) like lower('%' || $2 || '%')
          or lower(coalesce(d.project_nm, '')) like lower('%' || $2 || '%')
          or lower(coalesce(d.sales_nm, '')) like lower('%' || $2 || '%')
          or lower(coalesce(d.charge_nm, '')) like lower('%' || $2 || '%')
        )
        and ($3 = '' or d.in_proceed_code = $3)
      order by d.in_seq desc
    `,
    [enterCd, normalizedKeyword, normalizedProceed],
  );
  return result.rows;
};

export const createDevelopInquiry = async (
  enterCd: string,
  input: DevelopInquiryUpsertInput,
  chkid: string,
): Promise<DevelopInquiryRow> => {
  const inserted = await query<{ inSeq: number }>(
    `
      insert into develop_inquiry
        (enter_cd, request_company_cd, in_content, proceed_hope_dt, est_real_mm, sales_nm, charge_nm, in_proceed_code, confirm_yn, project_nm, remark, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      returning in_seq::int as "inSeq"
    `,
    [
      enterCd,
      input.requestCompanyCd,
      input.inContent,
      input.proceedHopeDt,
      input.estRealMm,
      input.salesNm,
      input.chargeNm,
      input.inProceedCode,
      input.confirmYn,
      input.projectNm,
      input.remark,
      chkid,
    ],
  );

  const inSeq = inserted.rows[0]?.inSeq;
  const row = await findDevelopInquiryBySeq(enterCd, inSeq);
  if (!row) {
    throw new Error("Failed to load inserted inquiry");
  }
  return row;
};

export const updateDevelopInquiry = async (
  enterCd: string,
  input: DevelopInquiryUpsertInput,
  chkid: string,
): Promise<DevelopInquiryRow | null> => {
  if (input.inSeq == null) {
    return null;
  }

  const result = await query(
    `
      update develop_inquiry
      set
        request_company_cd = $3,
        in_content = $4,
        proceed_hope_dt = $5,
        est_real_mm = $6,
        sales_nm = $7,
        charge_nm = $8,
        in_proceed_code = $9,
        confirm_yn = $10,
        project_nm = $11,
        remark = $12,
        chkid = $13,
        chkdate = now()
      where enter_cd = $1 and in_seq = $2
    `,
    [
      enterCd,
      input.inSeq,
      input.requestCompanyCd,
      input.inContent,
      input.proceedHopeDt,
      input.estRealMm,
      input.salesNm,
      input.chargeNm,
      input.inProceedCode,
      input.confirmYn,
      input.projectNm,
      input.remark,
      chkid,
    ],
  );
  if ((result.rowCount ?? 0) < 1) {
    return null;
  }

  return findDevelopInquiryBySeq(enterCd, input.inSeq);
};

export const deleteDevelopInquiries = async (
  enterCd: string,
  inSeqs: number[],
): Promise<MutationCount> => {
  if (inSeqs.length === 0) {
    return { succeeded: 0, failed: 0 };
  }
  const result = await query(
    `
      delete from develop_inquiry
      where enter_cd = $1 and in_seq = any($2::bigint[])
    `,
    [enterCd, inSeqs],
  );
  const succeeded = result.rowCount ?? 0;
  return {
    succeeded,
    failed: Math.max(inSeqs.length - succeeded, 0),
  };
};

const findDevelopInquiryBySeq = async (
  enterCd: string,
  inSeq: number | undefined,
): Promise<DevelopInquiryRow | null> => {
  if (!inSeq) {
    return null;
  }
  const result = await query<DevelopInquiryRow>(
    `
      ${baseSelect}
      where d.enter_cd = $1 and d.in_seq = $2
      limit 1
    `,
    [enterCd, inSeq],
  );
  return result.rows[0] ?? null;
};
