import { query } from "@/server/db/pool";

export type DevelopStaffRow = {
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

export type DevelopStaffPageResult = {
  content: DevelopStaffRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const partName = (value: string | null): string | null => {
  switch ((value ?? "").trim()) {
    case "10":
      return "HR";
    case "20":
      return "Recruit";
    case "30":
      return "Mobile";
    case "40":
      return "SaaS";
    default:
      return value;
  }
};

export const listDevelopStaff = async (
  enterCd: string,
  page: number,
  size: number,
  startDate: string,
  endDate: string,
): Promise<DevelopStaffPageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const startYm = startDate.trim().replaceAll("-", "");
  const endYm = endDate.trim().replaceAll("-", "");

  const [contentResult, countResult] = await Promise.all([
    query<DevelopStaffRow>(
      `
        select
          p.request_company_cd as "requestCompanyCd",
          c.company_nm as "requestCompanyNm",
          p.project_nm as "projectNm",
          p.part_cd as "partCd",
          p.inspection_yn as "inspectionYn",
          p.real_mm::double precision as "realMm",
          p.input_man_power as "inputManPower",
          p.develop_std_dt as "developStdDt",
          p.develop_end_dt as "developEndDt",
          p.tax_bill_yn as "taxBillYn",
          p.contract_price::double precision as "contractPrice",
          p.develop_std_dt as sdate,
          p.develop_end_dt as edate,
          p.contract_std_dt as "startYm",
          p.contract_end_dt as "endYm"
        from develop_project p
        left join tmst001_new c
          on c.enter_cd = p.enter_cd and c.company_cd = p.request_company_cd
        where p.enter_cd = $1
          and ($2 = '' or coalesce(p.contract_std_dt, '999999') >= $2)
          and ($3 = '' or coalesce(p.contract_end_dt, '000000') <= $3)
        order by p.project_id desc
        limit $4 offset $5
      `,
      [enterCd, startYm, endYm, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from develop_project p
        where p.enter_cd = $1
          and ($2 = '' or coalesce(p.contract_std_dt, '999999') >= $2)
          and ($3 = '' or coalesce(p.contract_end_dt, '000000') <= $3)
      `,
      [enterCd, startYm, endYm],
    ),
  ]);

  const totalElements = Number(countResult.rows[0]?.total ?? "0");
  const totalPages = Math.ceil(totalElements / safeSize);
  return {
    content: contentResult.rows.map((row) => ({
      ...row,
      partNm: partName(row.partCd),
    })),
    totalElements,
    totalPages,
    number: safePage,
    size: safeSize,
  };
};

export const listDevelopStaff2 = async (
  enterCd: string,
  page: number,
  size: number,
  startDate: string,
  endDate: string,
): Promise<DevelopStaffPageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const startYm = startDate.trim().replaceAll("-", "");
  const endYm = endDate.trim().replaceAll("-", "");

  const [contentResult, countResult] = await Promise.all([
    query<DevelopStaffRow>(
      `
        select
          d.request_company_cd as "requestCompanyCd",
          c.company_nm as "requestCompanyNm",
          d.request_content as "projectNm",
          d.part_cd as "partCd",
          d.status_cd as "inspectionYn",
          d.real_mm::double precision as "realMm",
          null::text as "inputManPower",
          d.sdate as "developStdDt",
          d.edate as "developEndDt",
          d.tax_bill_yn as "taxBillYn",
          null::double precision as "contractPrice",
          d.sdate,
          d.edate,
          d.start_ym as "startYm",
          d.end_ym as "endYm"
        from develop_management d
        left join tmst001_new c
          on c.enter_cd = d.enter_cd and c.company_cd = d.request_company_cd
        where d.enter_cd = $1
          and ($2 = '' or coalesce(d.start_ym, '999999') >= $2)
          and ($3 = '' or coalesce(d.end_ym, '000000') <= $3)
        order by d.request_ym desc, d.request_seq desc
        limit $4 offset $5
      `,
      [enterCd, startYm, endYm, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from develop_management d
        where d.enter_cd = $1
          and ($2 = '' or coalesce(d.start_ym, '999999') >= $2)
          and ($3 = '' or coalesce(d.end_ym, '000000') <= $3)
      `,
      [enterCd, startYm, endYm],
    ),
  ]);

  const totalElements = Number(countResult.rows[0]?.total ?? "0");
  const totalPages = Math.ceil(totalElements / safeSize);
  return {
    content: contentResult.rows.map((row) => ({
      ...row,
      partNm: partName(row.partCd),
    })),
    totalElements,
    totalPages,
    number: safePage,
    size: safeSize,
  };
};
