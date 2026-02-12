import { query } from "@/server/db/pool";

export type CompanyRow = {
  enterCd: string;
  companyCd: string;
  companyNm: string;
  companyGrpCd: string | null;
  objectDiv: string | null;
  manageDiv: string | null;
  representCompany: string | null;
  sdate: string | null;
  indutyCd: string | null;
  zip: string | null;
  address: string | null;
  homepage: string | null;
  chkid: string | null;
};

export type CompanyPageResult = {
  content: CompanyRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type CompanyUpsertInput = {
  companyCd: string;
  companyNm: string;
  companyGrpCd: string | null;
  objectDiv: string | null;
  manageDiv: string | null;
  representCompany: string | null;
  sdate: string | null;
  indutyCd: string | null;
  zip: string | null;
  address: string | null;
  homepage: string | null;
};

const baseSelect = `
  select
    enter_cd as "enterCd",
    company_cd as "companyCd",
    company_nm as "companyNm",
    company_grp_cd as "companyGrpCd",
    object_div as "objectDiv",
    manage_div as "manageDiv",
    represent_company as "representCompany",
    sdate,
    induty_cd as "indutyCd",
    zip,
    address,
    homepage,
    chkid
  from tmst001_new
`;

export const listCompanies = async (
  enterCd: string,
  page: number,
  size: number,
  companyNm: string,
): Promise<CompanyPageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const keyword = companyNm.trim();

  const [contentResult, countResult] = await Promise.all([
    query<CompanyRow>(
      `
        ${baseSelect}
        where enter_cd = $1
          and (
            $2 = ''
            or lower(company_nm) like lower($2 || '%')
            or lower(company_cd) like lower($2 || '%')
          )
        order by company_nm asc, company_cd asc
        limit $3 offset $4
      `,
      [enterCd, keyword, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from tmst001_new
        where enter_cd = $1
          and (
            $2 = ''
            or lower(company_nm) like lower($2 || '%')
            or lower(company_cd) like lower($2 || '%')
          )
      `,
      [enterCd, keyword],
    ),
  ]);

  const totalElements = Number(countResult.rows[0]?.total ?? "0");
  const totalPages = Math.ceil(totalElements / safeSize);
  return {
    content: contentResult.rows,
    totalElements,
    totalPages,
    number: safePage,
    size: safeSize,
  };
};

export const listAllCompanies = async (enterCd: string): Promise<CompanyRow[]> => {
  const result = await query<CompanyRow>(
    `
      ${baseSelect}
      where enter_cd = $1
      order by company_nm asc, company_cd asc
    `,
    [enterCd],
  );
  return result.rows;
};

export const companyExists = async (
  enterCd: string,
  companyCd: string,
): Promise<boolean> => {
  const result = await query<{ exists: boolean }>(
    `
      select exists(
        select 1 from tmst001_new
        where enter_cd = $1 and company_cd = $2
      ) as exists
    `,
    [enterCd, companyCd],
  );
  return Boolean(result.rows[0]?.exists);
};

export const insertCompanies = async (
  enterCd: string,
  rows: CompanyUpsertInput[],
  chkid: string,
): Promise<CompanyRow[]> => {
  const created: CompanyRow[] = [];
  for (const row of rows) {
    const result = await query<CompanyRow>(
      `
        insert into tmst001_new
          (enter_cd, company_cd, company_nm, company_grp_cd, object_div, manage_div, represent_company, sdate, induty_cd, zip, address, homepage, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
        returning
          enter_cd as "enterCd",
          company_cd as "companyCd",
          company_nm as "companyNm",
          company_grp_cd as "companyGrpCd",
          object_div as "objectDiv",
          manage_div as "manageDiv",
          represent_company as "representCompany",
          sdate,
          induty_cd as "indutyCd",
          zip,
          address,
          homepage,
          chkid
      `,
      [
        enterCd,
        row.companyCd,
        row.companyNm,
        row.companyGrpCd,
        row.objectDiv,
        row.manageDiv,
        row.representCompany,
        row.sdate,
        row.indutyCd,
        row.zip,
        row.address,
        row.homepage,
        chkid,
      ],
    );
    if (result.rows[0]) {
      created.push(result.rows[0]);
    }
  }
  return created;
};

export const updateCompanies = async (
  enterCd: string,
  rows: CompanyUpsertInput[],
  chkid: string,
): Promise<CompanyRow[]> => {
  const updated: CompanyRow[] = [];
  for (const row of rows) {
    const result = await query<CompanyRow>(
      `
        update tmst001_new
        set
          company_nm = $3,
          company_grp_cd = $4,
          object_div = $5,
          manage_div = $6,
          represent_company = $7,
          sdate = $8,
          induty_cd = $9,
          zip = $10,
          address = $11,
          homepage = $12,
          chkid = $13,
          chkdate = now()
        where enter_cd = $1 and company_cd = $2
        returning
          enter_cd as "enterCd",
          company_cd as "companyCd",
          company_nm as "companyNm",
          company_grp_cd as "companyGrpCd",
          object_div as "objectDiv",
          manage_div as "manageDiv",
          represent_company as "representCompany",
          sdate,
          induty_cd as "indutyCd",
          zip,
          address,
          homepage,
          chkid
      `,
      [
        enterCd,
        row.companyCd,
        row.companyNm,
        row.companyGrpCd,
        row.objectDiv,
        row.manageDiv,
        row.representCompany,
        row.sdate,
        row.indutyCd,
        row.zip,
        row.address,
        row.homepage,
        chkid,
      ],
    );
    if (result.rows[0]) {
      updated.push(result.rows[0]);
    }
  }
  return updated;
};

export const deleteCompanies = async (
  enterCd: string,
  companyCds: string[],
): Promise<number> => {
  if (companyCds.length === 0) {
    return 0;
  }
  const result = await query(
    `
      delete from tmst001_new
      where enter_cd = $1 and company_cd = any($2::text[])
    `,
    [enterCd, companyCds],
  );
  return result.rowCount ?? 0;
};
