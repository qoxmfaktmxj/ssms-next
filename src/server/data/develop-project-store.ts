import { query } from "@/server/db/pool";

export type DevelopProjectRow = {
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

export type DevelopProjectUpsertInput = {
  projectId: number | null;
  projectNm: string;
  requestCompanyCd: string;
  partCd: string;
  inputManPower: string | null;
  contractStdDt: string | null;
  contractEndDt: string | null;
  developStdDt: string | null;
  developEndDt: string | null;
  inspectionYn: string | null;
  taxBillYn: string | null;
  realMm: number | null;
  contractPrice: number | null;
  fileSeq: number | null;
  remark: string | null;
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
    p.project_id as "projectId",
    p.project_nm as "projectNm",
    p.request_company_cd as "requestCompanyCd",
    c.company_nm as "requestCompanyNm",
    p.part_cd as "partCd",
    p.input_man_power as "inputManPower",
    p.contract_std_dt as "contractStdDt",
    p.contract_end_dt as "contractEndDt",
    p.develop_std_dt as "developStdDt",
    p.develop_end_dt as "developEndDt",
    p.inspection_yn as "inspectionYn",
    p.tax_bill_yn as "taxBillYn",
    p.real_mm::double precision as "realMm",
    p.contract_price::double precision as "contractPrice",
    case when p.file_seq is null then null else p.file_seq::text end as "fileSeq",
    p.remark
  from develop_project p
  left join tmst001_new c
    on c.enter_cd = p.enter_cd and c.company_cd = p.request_company_cd
`;

export const listDevelopProjects = async (
  enterCd: string,
  keyword: string,
  startDate: string,
  endDate: string,
): Promise<DevelopProjectRow[]> => {
  const normalizedKeyword = keyword.trim();
  const normalizedStartDate = startDate.trim().replaceAll("-", "");
  const normalizedEndDate = endDate.trim().replaceAll("-", "");

  const result = await query<DevelopProjectRow>(
    `
      ${baseSelect}
      where p.enter_cd = $1
        and (
          $2 = ''
          or lower(coalesce(p.project_nm, '')) like lower('%' || $2 || '%')
          or lower(coalesce(p.request_company_cd, '')) like lower('%' || $2 || '%')
          or lower(coalesce(p.input_man_power, '')) like lower('%' || $2 || '%')
        )
        and ($3 = '' or coalesce(p.develop_std_dt, '99999999') >= $3)
        and ($4 = '' or coalesce(p.develop_end_dt, '00000000') <= $4)
      order by p.project_id desc
    `,
    [enterCd, normalizedKeyword, normalizedStartDate, normalizedEndDate],
  );

  return result.rows.map((row) => ({
    ...row,
    partNm: partName(row.partCd),
  }));
};

export const createDevelopProject = async (
  enterCd: string,
  input: DevelopProjectUpsertInput,
  chkid: string,
): Promise<DevelopProjectRow> => {
  const inserted = await query<{ projectId: number }>(
    `
      insert into develop_project
        (enter_cd, project_nm, request_company_cd, part_cd, input_man_power, contract_std_dt, contract_end_dt, develop_std_dt, develop_end_dt, inspection_yn, tax_bill_yn, real_mm, contract_price, remark, file_seq, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now())
      returning project_id as "projectId"
    `,
    [
      enterCd,
      input.projectNm,
      input.requestCompanyCd,
      input.partCd,
      input.inputManPower,
      input.contractStdDt,
      input.contractEndDt,
      input.developStdDt,
      input.developEndDt,
      input.inspectionYn,
      input.taxBillYn,
      input.realMm,
      input.contractPrice,
      input.remark,
      input.fileSeq,
      chkid,
    ],
  );

  const row = await findDevelopProjectById(enterCd, inserted.rows[0]?.projectId);
  if (!row) {
    throw new Error("Failed to load inserted project");
  }
  return row;
};

export const updateDevelopProject = async (
  enterCd: string,
  input: DevelopProjectUpsertInput,
  chkid: string,
): Promise<DevelopProjectRow | null> => {
  if (input.projectId == null) {
    return null;
  }

  const result = await query(
    `
      update develop_project
      set
        project_nm = $3,
        request_company_cd = $4,
        part_cd = $5,
        input_man_power = $6,
        contract_std_dt = $7,
        contract_end_dt = $8,
        develop_std_dt = $9,
        develop_end_dt = $10,
        inspection_yn = $11,
        tax_bill_yn = $12,
        real_mm = $13,
        contract_price = $14,
        file_seq = $15,
        remark = $16,
        chkid = $17,
        chkdate = now()
      where enter_cd = $1 and project_id = $2
    `,
    [
      enterCd,
      input.projectId,
      input.projectNm,
      input.requestCompanyCd,
      input.partCd,
      input.inputManPower,
      input.contractStdDt,
      input.contractEndDt,
      input.developStdDt,
      input.developEndDt,
      input.inspectionYn,
      input.taxBillYn,
      input.realMm,
      input.contractPrice,
      input.fileSeq,
      input.remark,
      chkid,
    ],
  );
  if ((result.rowCount ?? 0) < 1) {
    return null;
  }

  return findDevelopProjectById(enterCd, input.projectId);
};

export const deleteDevelopProjects = async (
  enterCd: string,
  projectIds: number[],
): Promise<MutationCount> => {
  if (projectIds.length === 0) {
    return { succeeded: 0, failed: 0 };
  }
  const result = await query(
    `
      delete from develop_project
      where enter_cd = $1 and project_id = any($2::bigint[])
    `,
    [enterCd, projectIds],
  );
  const succeeded = result.rowCount ?? 0;
  return {
    succeeded,
    failed: Math.max(projectIds.length - succeeded, 0),
  };
};

const findDevelopProjectById = async (
  enterCd: string,
  projectId: number | undefined,
): Promise<DevelopProjectRow | null> => {
  if (!projectId) {
    return null;
  }
  const result = await query<DevelopProjectRow>(
    `
      ${baseSelect}
      where p.enter_cd = $1 and p.project_id = $2
      limit 1
    `,
    [enterCd, projectId],
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
