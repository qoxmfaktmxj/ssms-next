import { query } from "@/server/db/pool";

export type InfraSummaryRow = {
  enterCd: string;
  taskGubunCd: string;
  taskGubunNm: string;
  companyCd: string;
  companyNm: string | null;
  devYn: string;
  prodYn: string;
};

export type InfraMasterRow = {
  enterCd: string;
  taskGubunCd: string;
  taskGubunNm: string;
  companyCd: string;
  companyNm: string | null;
  devGbCd: string;
};

export type InfraSectionRow = {
  enterCd: string;
  companyCd: string;
  companyNm: string | null;
  taskGubunCd: string;
  devGbCd: string;
  sectionId: string | null;
  seq: number | null;
  title: string | null;
  type: string | null;
  columnNm: string | null;
  columnSeq: string | null;
  contents: string | null;
};

export type InfraMasterItem = {
  companyCd: string;
  taskGubunCd: string;
  devGbCd: string;
};

export type InfraSectionItem = {
  companyCd: string;
  taskGubunCd: string;
  devGbCd: string;
  sectionId: string | null;
  seq: number | null;
  title: string | null;
  type: string | null;
  columnNm: string | null;
  columnSeq: string | null;
  contents: string | null;
};

export type MutationCount = {
  succeeded: number;
  failed: number;
};

const taskGubunName = (value: string): string => {
  switch (value.trim()) {
    case "10":
      return "HR";
    case "20":
      return "Mobile";
    case "30":
      return "Recruit";
    default:
      return value;
  }
};

export const listInfraSummary = async (
  enterCd: string,
  keyword: string,
  taskGubunCd: string,
): Promise<InfraSummaryRow[]> => {
  const normalizedKeyword = keyword.trim();
  const normalizedTask = taskGubunCd.trim();

  const result = await query<{
    enterCd: string;
    taskGubunCd: string;
    companyCd: string;
    companyNm: string | null;
    hasDev: boolean;
    hasProd: boolean;
  }>(
    `
      select
        max(m.enter_cd) as "enterCd",
        m.task_gubun_cd as "taskGubunCd",
        m.company_cd as "companyCd",
        c.company_nm as "companyNm",
        bool_or(m.dev_gb_cd = '1') as "hasDev",
        bool_or(m.dev_gb_cd = '2') as "hasProd"
      from infra_master m
      left join tmst001_new c
        on c.enter_cd = m.enter_cd and c.company_cd = m.company_cd
      where m.enter_cd = $1
        and ($2 = '' or m.task_gubun_cd = $2)
        and (
          $3 = ''
          or lower(m.company_cd) like lower('%' || $3 || '%')
          or lower(coalesce(c.company_nm, '')) like lower('%' || $3 || '%')
        )
      group by m.task_gubun_cd, m.company_cd, c.company_nm
      order by m.company_cd asc, m.task_gubun_cd asc
    `,
    [enterCd, normalizedTask, normalizedKeyword],
  );

  return result.rows.map((row) => ({
    enterCd: row.enterCd,
    taskGubunCd: row.taskGubunCd,
    taskGubunNm: taskGubunName(row.taskGubunCd),
    companyCd: row.companyCd,
    companyNm: row.companyNm,
    devYn: row.hasDev ? "Y" : "N",
    prodYn: row.hasProd ? "Y" : "N",
  }));
};

export const listInfraMaster = async (
  enterCd: string,
  companyCd: string,
  taskGubunCd: string,
): Promise<InfraMasterRow[]> => {
  const result = await query<InfraMasterRow>(
    `
      select
        m.enter_cd as "enterCd",
        m.task_gubun_cd as "taskGubunCd",
        c.company_nm as "companyNm",
        m.company_cd as "companyCd",
        m.dev_gb_cd as "devGbCd",
        m.task_gubun_cd as "__taskName"
      from infra_master m
      left join tmst001_new c
        on c.enter_cd = m.enter_cd and c.company_cd = m.company_cd
      where m.enter_cd = $1 and m.company_cd = $2 and m.task_gubun_cd = $3
      order by m.dev_gb_cd asc
    `,
    [enterCd, companyCd, taskGubunCd],
  );

  return result.rows.map((row) => ({
    ...row,
    taskGubunNm: taskGubunName(row.taskGubunCd),
  }));
};

export const listInfraSection = async (
  enterCd: string,
  companyCd: string,
  taskGubunCd: string,
  devGbCd: string,
): Promise<InfraSectionRow[]> => {
  const result = await query<InfraSectionRow>(
    `
      select
        s.enter_cd as "enterCd",
        s.company_cd as "companyCd",
        c.company_nm as "companyNm",
        s.task_gubun_cd as "taskGubunCd",
        s.dev_gb_cd as "devGbCd",
        s.section_id as "sectionId",
        s.seq::int as seq,
        s.title,
        s.type,
        s.column_nm as "columnNm",
        s.column_seq as "columnSeq",
        s.contents
      from infra_section s
      left join tmst001_new c
        on c.enter_cd = s.enter_cd and c.company_cd = s.company_cd
      where s.enter_cd = $1 and s.company_cd = $2 and s.task_gubun_cd = $3 and s.dev_gb_cd = $4
      order by s.section_id asc nulls last, s.seq asc nulls last, s.column_seq asc nulls last, s.id asc
    `,
    [enterCd, companyCd, taskGubunCd, devGbCd],
  );
  return result.rows;
};

export const countInfraMasterDuplicates = async (
  enterCd: string,
  companyCd: string,
  taskGubunCd: string,
  devGbCds: string[],
): Promise<number> => {
  if (devGbCds.length === 0) {
    return 0;
  }
  const result = await query<{ total: string }>(
    `
      select count(*)::text as total
      from infra_master
      where enter_cd = $1 and company_cd = $2 and task_gubun_cd = $3 and dev_gb_cd = any($4::text[])
    `,
    [enterCd, companyCd, taskGubunCd, devGbCds],
  );
  return Number(result.rows[0]?.total ?? "0");
};

export const insertInfraMasters = async (
  enterCd: string,
  companyCd: string,
  taskGubunCd: string,
  devGbCds: string[],
  chkid: string,
): Promise<MutationCount> => {
  const uniqueDevGbCds = Array.from(new Set(devGbCds));
  let succeeded = 0;

  for (const devGbCd of uniqueDevGbCds) {
    const existsResult = await query<{ exists: boolean }>(
      `
        select exists(
          select 1
          from infra_master
          where enter_cd = $1 and company_cd = $2 and task_gubun_cd = $3 and dev_gb_cd = $4
        ) as exists
      `,
      [enterCd, companyCd, taskGubunCd, devGbCd],
    );

    if (existsResult.rows[0]?.exists) {
      continue;
    }

    const inserted = await query(
      `
        insert into infra_master
          (enter_cd, task_gubun_cd, company_cd, dev_gb_cd, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, now())
      `,
      [enterCd, taskGubunCd, companyCd, devGbCd, chkid],
    );
    if ((inserted.rowCount ?? 0) > 0) {
      succeeded += 1;
    }
  }

  return {
    succeeded,
    failed: Math.max(uniqueDevGbCds.length - succeeded, 0),
  };
};

export const deleteInfraMasterGroups = async (
  enterCd: string,
  items: Array<{ companyCd: string; taskGubunCd: string }>,
): Promise<MutationCount> => {
  let requested = 0;
  let deleted = 0;
  for (const item of items) {
    const companyCd = item.companyCd.trim();
    const taskGubunCd = item.taskGubunCd.trim();
    if (!companyCd || !taskGubunCd) {
      continue;
    }

    requested += 1;
    await query(
      `
        delete from infra_section
        where enter_cd = $1 and company_cd = $2 and task_gubun_cd = $3
      `,
      [enterCd, companyCd, taskGubunCd],
    );

    const result = await query(
      `
        delete from infra_master
        where enter_cd = $1 and company_cd = $2 and task_gubun_cd = $3
      `,
      [enterCd, companyCd, taskGubunCd],
    );
    deleted += result.rowCount ?? 0;
  }

  const succeeded = Math.min(requested, deleted);
  return {
    succeeded,
    failed: Math.max(requested - succeeded, 0),
  };
};

export const deleteInfraSingle = async (
  enterCd: string,
  companyCd: string,
  taskGubunCd: string,
  devGbCd: string,
): Promise<MutationCount> => {
  await query(
    `
      delete from infra_section
      where enter_cd = $1 and company_cd = $2 and task_gubun_cd = $3 and dev_gb_cd = $4
    `,
    [enterCd, companyCd, taskGubunCd, devGbCd],
  );
  const result = await query(
    `
      delete from infra_master
      where enter_cd = $1 and company_cd = $2 and task_gubun_cd = $3 and dev_gb_cd = $4
    `,
    [enterCd, companyCd, taskGubunCd, devGbCd],
  );
  const succeeded = result.rowCount ?? 0;
  return {
    succeeded,
    failed: succeeded === 0 ? 1 : 0,
  };
};

export const insertInfraSections = async (
  enterCd: string,
  rows: InfraSectionItem[],
  chkid: string,
): Promise<MutationCount> => {
  let requested = 0;
  let succeeded = 0;
  for (const row of rows) {
    if (!row.companyCd.trim() || !row.taskGubunCd.trim() || !row.devGbCd.trim()) {
      continue;
    }
    requested += 1;
    const result = await query(
      `
        insert into infra_section
          (enter_cd, task_gubun_cd, company_cd, dev_gb_cd, section_id, seq, title, type, column_nm, column_seq, contents, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      `,
      [
        enterCd,
        row.taskGubunCd,
        row.companyCd,
        row.devGbCd,
        row.sectionId,
        row.seq,
        row.title,
        row.type,
        row.columnNm,
        row.columnSeq,
        row.contents,
        chkid,
      ],
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
