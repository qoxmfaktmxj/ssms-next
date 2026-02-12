import { query } from "@/server/db/pool";

export type DevelopManagementRow = {
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

export type DevelopManagementPageResult = {
  content: DevelopManagementRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type DevelopManagementUpsertInput = {
  requestCompanyCd: string;
  requestYm: string;
  requestSeq: number | null;
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
};

export type MutationCount = {
  succeeded: number;
  failed: number;
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

const baseSelect = `
  select
    d.request_company_cd as "requestCompanyCd",
    c.company_nm as "requestCompanyNm",
    d.request_ym as "requestYm",
    d.request_seq as "requestSeq",
    d.status_cd as "statusCd",
    d.request_nm as "requestNm",
    d.request_content as "requestContent",
    d.manager_sabun as "managerSabun",
    d.developer_sabun as "developerSabun",
    d.outside_yn as "outsideYn",
    d.paid_yn as "paidYn",
    d.paid_content as "paidContent",
    d.tax_bill_yn as "taxBillYn",
    d.start_ym as "startYm",
    d.end_ym as "endYm",
    d.paid_mm::double precision as "paidMm",
    d.real_mm::double precision as "realMm",
    d.content,
    d.sdate,
    d.edate,
    d.part_cd as "partCd"
  from develop_management d
  left join tmst001_new c
    on c.enter_cd = d.enter_cd and c.company_cd = d.request_company_cd
`;

export const listDevelopManagement = async (
  enterCd: string,
  page: number,
  size: number,
  filters: {
    companyName: string;
    startDate: string;
    endDate: string;
    statusCd: string;
    mngName: string;
  },
  sortByStartYm: boolean,
): Promise<DevelopManagementPageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const companyName = filters.companyName.trim();
  const startDate = filters.startDate.trim().replaceAll("-", "");
  const endDate = filters.endDate.trim().replaceAll("-", "");
  const statusCd = filters.statusCd.trim();
  const mngName = filters.mngName.trim();
  const orderBy = sortByStartYm
    ? "d.start_ym desc nulls last, d.request_ym desc, d.request_seq desc"
    : "d.request_ym desc, d.request_seq desc";

  const [contentResult, countResult] = await Promise.all([
    query<DevelopManagementRow>(
      `
        ${baseSelect}
        where d.enter_cd = $1
          and ($2 = '' or lower(coalesce(d.request_company_cd, '')) like lower('%' || $2 || '%'))
          and ($3 = '' or lower(coalesce(d.request_nm, '')) like lower('%' || $3 || '%'))
          and ($4 = '' or coalesce(d.start_ym, '999999') >= $4)
          and ($5 = '' or coalesce(d.end_ym, '000000') <= $5)
          and ($6 = '' or d.status_cd = $6)
        order by ${orderBy}
        limit $7 offset $8
      `,
      [enterCd, companyName, mngName, startDate, endDate, statusCd, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from develop_management d
        where d.enter_cd = $1
          and ($2 = '' or lower(coalesce(d.request_company_cd, '')) like lower('%' || $2 || '%'))
          and ($3 = '' or lower(coalesce(d.request_nm, '')) like lower('%' || $3 || '%'))
          and ($4 = '' or coalesce(d.start_ym, '999999') >= $4)
          and ($5 = '' or coalesce(d.end_ym, '000000') <= $5)
          and ($6 = '' or d.status_cd = $6)
      `,
      [enterCd, companyName, mngName, startDate, endDate, statusCd],
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

export const createDevelopManagement = async (
  enterCd: string,
  input: DevelopManagementUpsertInput,
  chkid: string,
): Promise<DevelopManagementRow> => {
  const requestCompanyCd = input.requestCompanyCd;
  const requestYm = input.requestYm;
  const requestSeq =
    input.requestSeq && input.requestSeq > 0
      ? input.requestSeq
      : await findNextRequestSeq(enterCd, requestCompanyCd, requestYm);

  const exists = await query<{ exists: boolean }>(
    `
      select exists(
        select 1
        from develop_management
        where enter_cd = $1 and request_company_cd = $2 and request_ym = $3 and request_seq = $4
      ) as exists
    `,
    [enterCd, requestCompanyCd, requestYm, requestSeq],
  );
  if (exists.rows[0]?.exists) {
    throw new Error("Develop management row already exists");
  }

  await query(
    `
      insert into develop_management
        (enter_cd, request_company_cd, request_ym, request_seq, status_cd, request_nm, request_content, manager_sabun, developer_sabun, outside_yn, paid_yn, paid_content, tax_bill_yn, start_ym, end_ym, paid_mm, real_mm, content, part_cd, sdate, edate, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, now())
    `,
    [
      enterCd,
      requestCompanyCd,
      requestYm,
      requestSeq,
      input.statusCd,
      input.requestNm,
      input.requestContent,
      input.managerSabun,
      input.developerSabun,
      input.outsideYn,
      input.paidYn,
      input.paidContent,
      input.taxBillYn,
      input.startYm,
      input.endYm,
      input.paidMm,
      input.realMm,
      input.content,
      input.partCd,
      input.sdate,
      input.edate,
      chkid,
    ],
  );

  const row = await findDevelopManagementRow(
    enterCd,
    requestCompanyCd,
    requestYm,
    requestSeq,
  );
  if (!row) {
    throw new Error("Failed to load created develop management row");
  }
  return row;
};

export const updateDevelopManagement = async (
  enterCd: string,
  input: DevelopManagementUpsertInput,
  chkid: string,
): Promise<DevelopManagementRow | null> => {
  if (input.requestSeq == null) {
    return null;
  }

  const result = await query(
    `
      update develop_management
      set
        status_cd = $5,
        request_nm = $6,
        request_content = $7,
        manager_sabun = $8,
        developer_sabun = $9,
        outside_yn = $10,
        paid_yn = $11,
        paid_content = $12,
        tax_bill_yn = $13,
        start_ym = $14,
        end_ym = $15,
        paid_mm = $16,
        real_mm = $17,
        content = $18,
        sdate = $19,
        edate = $20,
        part_cd = $21,
        chkid = $22,
        chkdate = now()
      where enter_cd = $1 and request_company_cd = $2 and request_ym = $3 and request_seq = $4
    `,
    [
      enterCd,
      input.requestCompanyCd,
      input.requestYm,
      input.requestSeq,
      input.statusCd,
      input.requestNm,
      input.requestContent,
      input.managerSabun,
      input.developerSabun,
      input.outsideYn,
      input.paidYn,
      input.paidContent,
      input.taxBillYn,
      input.startYm,
      input.endYm,
      input.paidMm,
      input.realMm,
      input.content,
      input.sdate,
      input.edate,
      input.partCd,
      chkid,
    ],
  );
  if ((result.rowCount ?? 0) < 1) {
    return null;
  }

  return findDevelopManagementRow(
    enterCd,
    input.requestCompanyCd,
    input.requestYm,
    input.requestSeq,
  );
};

export const deleteDevelopManagementRows = async (
  enterCd: string,
  rows: Array<{ requestCompanyCd: string; requestYm: string; requestSeq: number }>,
): Promise<MutationCount> => {
  let requested = 0;
  let succeeded = 0;
  for (const row of rows) {
    const requestCompanyCd = row.requestCompanyCd.trim();
    const requestYm = row.requestYm.trim();
    if (!requestCompanyCd || !requestYm || !row.requestSeq) {
      continue;
    }
    requested += 1;
    const result = await query(
      `
        delete from develop_management
        where enter_cd = $1 and request_company_cd = $2 and request_ym = $3 and request_seq = $4
      `,
      [enterCd, requestCompanyCd, requestYm, row.requestSeq],
    );
    if ((result.rowCount ?? 0) > 0) {
      succeeded += 1;
    }
  }
  return {
    succeeded,
    failed: Math.max(requested - succeeded, 0),
  };
};

const findNextRequestSeq = async (
  enterCd: string,
  companyCd: string,
  requestYm: string,
): Promise<number> => {
  const result = await query<{ maxSeq: string }>(
    `
      select coalesce(max(request_seq), 0)::text as "maxSeq"
      from develop_management
      where enter_cd = $1 and request_company_cd = $2 and request_ym = $3
    `,
    [enterCd, companyCd, requestYm],
  );
  return Number(result.rows[0]?.maxSeq ?? "0") + 1;
};

const findDevelopManagementRow = async (
  enterCd: string,
  requestCompanyCd: string,
  requestYm: string,
  requestSeq: number,
): Promise<DevelopManagementRow | null> => {
  const result = await query<DevelopManagementRow>(
    `
      ${baseSelect}
      where d.enter_cd = $1 and d.request_company_cd = $2 and d.request_ym = $3 and d.request_seq = $4
      limit 1
    `,
    [enterCd, requestCompanyCd, requestYm, requestSeq],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    ...row,
    partNm: partName(row.partCd),
  };
};
