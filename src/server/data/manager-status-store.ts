import { query } from "@/server/db/pool";

export type ManagerStatusRow = {
  enterCd: string;
  sabun: string;
  companyCd: string;
  sdate: string | null;
  edate: string | null;
  note: string | null;
  name: string | null;
  companyNm: string | null;
};

export const listManagerStatus = async (
  enterCd: string,
  todayYmd: string,
): Promise<ManagerStatusRow[]> => {
  const result = await query<ManagerStatusRow>(
    `
      select
        m.enter_cd as "enterCd",
        m.sabun,
        m.company_cd as "companyCd",
        m.sdate,
        m.edate,
        m.note,
        u.name,
        c.company_nm as "companyNm"
      from manager_company_mapping m
      left join tsys305_new u
        on u.enter_cd = m.enter_cd and u.sabun = m.sabun
      left join tmst001_new c
        on c.enter_cd = m.enter_cd and c.company_cd = m.company_cd
      where m.enter_cd = $1
        and (coalesce(m.edate, '') = '' or m.edate >= $2)
      order by m.sabun asc, m.company_cd asc
    `,
    [enterCd, todayYmd],
  );
  return result.rows;
};
