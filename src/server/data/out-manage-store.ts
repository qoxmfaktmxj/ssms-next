import { query } from "@/server/db/pool";

export type OutManageRow = {
  sabun: string;
  name: string | null;
  sdate: string;
  edate: string;
  totCnt: number | null;
  svcCnt: number | null;
  note: string | null;
};

export type OutManagePageResult = {
  content: OutManageRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type OutManageUpsertInput = {
  sabun: string;
  sdate: string;
  edate: string;
  totCnt: number | null;
  svcCnt: number | null;
  note: string | null;
  oriSdate: string | null;
};

export type OutManageTimeSummaryRow = {
  sabun: string;
  name: string | null;
  sdate: string;
  edate: string;
  totalCnt: number | null;
  useCnt: number | null;
  remainCnt: number | null;
  note: string | null;
};

export type OutManageTimeDetailRow = {
  id: number;
  sabun: string;
  gntCd: string | null;
  gntName: string | null;
  applyDate: string | null;
  statusCd: string | null;
  statusName: string | null;
  sdate: string;
  edate: string;
  applyCnt: number | null;
  note: string | null;
};

export type OutManageTimeSaveInput = {
  id: number | null;
  sabun: string;
  gntCd: string | null;
  applyDate: string | null;
  statusCd: string | null;
  sdate: string;
  edate: string;
  applyCnt: number | null;
  note: string | null;
};

export type MutationCount = {
  succeeded: number;
  failed: number;
};

const normalize = (value: string): string => value.trim();
const normalizeDateOrBlank = (value: string | null | undefined): string =>
  (value ?? "").trim().replaceAll("-", "");

const formatYmd = (value: string): string =>
  value.length === 8
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : value;

const defaultTotCnt = (sdate: string, edate: string): number => {
  const startY = Number(sdate.slice(0, 4));
  const startM = Number(sdate.slice(4, 6));
  const endY = Number(edate.slice(0, 4));
  const endM = Number(edate.slice(4, 6));
  if (
    !Number.isFinite(startY) ||
    !Number.isFinite(startM) ||
    !Number.isFinite(endY) ||
    !Number.isFinite(endM)
  ) {
    return 1;
  }
  const diff = endY * 12 + endM - (startY * 12 + startM);
  return Math.max(diff, 0);
};

export const searchOutManage = async (
  enterCd: string,
  page: number,
  size: number,
  sdate: string,
  name: string,
): Promise<OutManagePageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const normalizedDate = normalizeDateOrBlank(sdate);
  const normalizedName = normalize(name);

  const [contentResult, countResult] = await Promise.all([
    query<OutManageRow>(
      `
        select
          o.sabun,
          u.name,
          o.sdate,
          o.edate,
          o.tot_cnt::double precision as "totCnt",
          o.svc_cnt::double precision as "svcCnt",
          o.note
        from out_manage o
        left join tsys305_new u
          on u.enter_cd = o.enter_cd and u.sabun = o.sabun
        where o.enter_cd = $1
          and ($2 = '' or $2 between o.sdate and o.edate)
          and ($3 = '' or lower(coalesce(u.name, '')) like lower('%' || $3 || '%'))
        order by o.sdate desc, o.sabun asc
        limit $4 offset $5
      `,
      [enterCd, normalizedDate, normalizedName, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from out_manage o
        left join tsys305_new u
          on u.enter_cd = o.enter_cd and u.sabun = o.sabun
        where o.enter_cd = $1
          and ($2 = '' or $2 between o.sdate and o.edate)
          and ($3 = '' or lower(coalesce(u.name, '')) like lower('%' || $3 || '%'))
      `,
      [enterCd, normalizedDate, normalizedName],
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

export const insertOutManage = async (
  enterCd: string,
  input: OutManageUpsertInput,
  chkid: string,
): Promise<OutManageRow> => {
  const sabun = normalize(input.sabun);
  const sdate = normalizeDateOrBlank(input.sdate);
  const edate = normalizeDateOrBlank(input.edate);
  const totCnt = input.totCnt ?? defaultTotCnt(sdate, edate);
  const svcCnt = input.svcCnt ?? 0;

  await query(
    `
      insert into out_manage
        (enter_cd, sabun, sdate, edate, tot_cnt, svc_cnt, note, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, now())
    `,
    [enterCd, sabun, sdate, edate, totCnt, svcCnt, input.note, chkid],
  );

  const loaded = await findOutManageRow(enterCd, sabun, sdate);
  if (!loaded) {
    throw new Error("Failed to load inserted out-manage row");
  }
  return loaded;
};

export const updateOutManage = async (
  enterCd: string,
  input: OutManageUpsertInput,
  chkid: string,
): Promise<OutManageRow | null> => {
  const sabun = normalize(input.sabun);
  const sdate = normalizeDateOrBlank(input.sdate);
  const edate = normalizeDateOrBlank(input.edate);
  const oriSdate = normalizeDateOrBlank(input.oriSdate);
  const lookupSdate = oriSdate || sdate;
  const totCnt = input.totCnt ?? defaultTotCnt(sdate, edate);
  const svcCnt = input.svcCnt ?? 0;

  const existing = await query<{ exists: boolean }>(
    `
      select exists(
        select 1 from out_manage
        where enter_cd = $1 and sabun = $2 and sdate = $3
      ) as exists
    `,
    [enterCd, sabun, lookupSdate],
  );
  if (!existing.rows[0]?.exists) {
    return null;
  }

  if (lookupSdate !== sdate) {
    await query(
      `
        delete from out_manage
        where enter_cd = $1 and sabun = $2 and sdate = $3
      `,
      [enterCd, sabun, lookupSdate],
    );

    await query(
      `
        insert into out_manage
          (enter_cd, sabun, sdate, edate, tot_cnt, svc_cnt, note, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, now())
      `,
      [enterCd, sabun, sdate, edate, totCnt, svcCnt, input.note, chkid],
    );
  } else {
    await query(
      `
        update out_manage
        set
          edate = $4,
          tot_cnt = $5,
          svc_cnt = $6,
          note = $7,
          chkid = $8,
          chkdate = now()
        where enter_cd = $1 and sabun = $2 and sdate = $3
      `,
      [enterCd, sabun, sdate, edate, totCnt, svcCnt, input.note, chkid],
    );
  }

  return findOutManageRow(enterCd, sabun, sdate);
};

export const findOutManageDuplicateText = async (
  enterCd: string,
  sabun: string,
  sdate: string,
  edate: string,
  oriSdate: string | null,
): Promise<string | null> => {
  const normalizedSabun = normalize(sabun);
  const normalizedSdate = normalizeDateOrBlank(sdate);
  const normalizedEdate = normalizeDateOrBlank(edate);
  const normalizedOriSdate = normalizeDateOrBlank(oriSdate);

  const result = await query<{ sdate: string; edate: string }>(
    `
      select sdate, edate
      from out_manage
      where enter_cd = $1
        and sabun = $2
        and ($5 = '' or sdate <> $5)
        and (($3 between sdate and edate) or ($4 between sdate and edate))
      order by sdate asc
    `,
    [
      enterCd,
      normalizedSabun,
      normalizedSdate,
      normalizedEdate,
      normalizedOriSdate,
    ],
  );

  if (result.rows.length === 0) {
    return null;
  }
  return result.rows
    .map((row) => `${formatYmd(row.sdate)}~${formatYmd(row.edate)}`)
    .join(",");
};

export const deleteOutManageRows = async (
  enterCd: string,
  rows: Array<{ sabun: string; sdate: string }>,
): Promise<MutationCount> => {
  let requested = 0;
  let succeeded = 0;
  for (const row of rows) {
    const sabun = normalize(row.sabun);
    const sdate = normalizeDateOrBlank(row.sdate);
    if (!sabun || !sdate) {
      continue;
    }
    requested += 1;
    const result = await query(
      `
        delete from out_manage
        where enter_cd = $1 and sabun = $2 and sdate = $3
      `,
      [enterCd, sabun, sdate],
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

export const listOutManageTimeSummary = async (
  enterCd: string,
  searchYmd: string,
  searchName: string,
): Promise<OutManageTimeSummaryRow[]> => {
  const normalizedDate = normalizeDateOrBlank(searchYmd);
  const normalizedName = normalize(searchName);

  const result = await query<OutManageTimeSummaryRow>(
    `
      select
        o.sabun,
        u.name,
        o.sdate,
        o.edate,
        (coalesce(o.tot_cnt, 0) + coalesce(o.svc_cnt, 0))::double precision as "totalCnt",
        coalesce((
          select sum(coalesce(t.apply_cnt, 0))
          from out_manage_time t
          where t.enter_cd = o.enter_cd
            and t.sabun = o.sabun
            and t.status_cd = '20'
            and t.sdate >= o.sdate
            and t.edate <= o.edate
        ), 0)::double precision as "useCnt",
        (
          (coalesce(o.tot_cnt, 0) + coalesce(o.svc_cnt, 0))
          - coalesce((
            select sum(coalesce(t.apply_cnt, 0))
            from out_manage_time t
            where t.enter_cd = o.enter_cd
              and t.sabun = o.sabun
              and t.status_cd = '20'
              and t.sdate >= o.sdate
              and t.edate <= o.edate
          ), 0)
        )::double precision as "remainCnt",
        o.note
      from out_manage o
      left join tsys305_new u
        on u.enter_cd = o.enter_cd and u.sabun = o.sabun
      where o.enter_cd = $1
        and ($2 = '' or $2 between o.sdate and o.edate)
        and ($3 = '' or lower(coalesce(u.name, '')) like lower('%' || $3 || '%'))
      order by o.sdate desc, o.sabun asc
    `,
    [enterCd, normalizedDate, normalizedName],
  );
  return result.rows;
};

export const listOutManageTimeDetail = async (
  enterCd: string,
  sabun: string,
  sdate: string,
  edate: string,
): Promise<OutManageTimeDetailRow[]> => {
  const result = await query<OutManageTimeDetailRow>(
    `
      select
        t.id,
        t.sabun,
        t.gnt_cd as "gntCd",
        coalesce(g.code_nm, t.gnt_cd) as "gntName",
        t.apply_date as "applyDate",
        t.status_cd as "statusCd",
        coalesce(s.code_nm, t.status_cd) as "statusName",
        t.sdate,
        t.edate,
        t.apply_cnt::double precision as "applyCnt",
        t.note
      from out_manage_time t
      left join tsys005_new g
        on g.enter_cd = t.enter_cd and g.grcode_cd = 'GNT_CD' and g.code = t.gnt_cd and g.use_yn = 'Y'
      left join tsys005_new s
        on s.enter_cd = t.enter_cd and s.grcode_cd = 'STATUS_CD' and s.code = t.status_cd and s.use_yn = 'Y'
      where t.enter_cd = $1
        and t.sabun = $2
        and t.sdate >= $3
        and t.edate <= $4
      order by t.apply_date desc nulls last, t.id desc
    `,
    [enterCd, normalize(sabun), normalizeDateOrBlank(sdate), normalizeDateOrBlank(edate)],
  );
  return result.rows;
};

export const saveOutManageTimeDetail = async (
  enterCd: string,
  input: OutManageTimeSaveInput,
  chkid: string,
): Promise<OutManageTimeSaveInput> => {
  const payload = [
    enterCd,
    normalize(input.sabun),
    input.gntCd,
    normalizeDateOrBlank(input.applyDate),
    input.statusCd,
    normalizeDateOrBlank(input.sdate),
    normalizeDateOrBlank(input.edate),
    input.applyCnt ?? 0,
    input.note,
    chkid,
  ];

  if (input.id == null) {
    const created = await query<{ id: number }>(
      `
        insert into out_manage_time
          (enter_cd, sabun, gnt_cd, apply_date, status_cd, sdate, edate, apply_cnt, note, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
        returning id
      `,
      payload,
    );
    return {
      ...input,
      id: created.rows[0]?.id ?? null,
      sabun: normalize(input.sabun),
      applyDate: normalizeDateOrBlank(input.applyDate),
      sdate: normalizeDateOrBlank(input.sdate),
      edate: normalizeDateOrBlank(input.edate),
      applyCnt: input.applyCnt ?? 0,
    };
  }

  await query(
    `
      update out_manage_time
      set
        sabun = $2,
        gnt_cd = $3,
        apply_date = $4,
        status_cd = $5,
        sdate = $6,
        edate = $7,
        apply_cnt = $8,
        note = $9,
        chkid = $10,
        chkdate = now()
      where enter_cd = $1 and id = $11
    `,
    [...payload, input.id],
  );

  return {
    ...input,
    id: input.id,
    sabun: normalize(input.sabun),
    applyDate: normalizeDateOrBlank(input.applyDate),
    sdate: normalizeDateOrBlank(input.sdate),
    edate: normalizeDateOrBlank(input.edate),
    applyCnt: input.applyCnt ?? 0,
  };
};

export const deleteOutManageTimeDetails = async (
  enterCd: string,
  ids: number[],
): Promise<boolean> => {
  if (ids.length === 0) {
    return false;
  }
  const result = await query(
    `
      delete from out_manage_time
      where enter_cd = $1 and id = any($2::bigint[])
    `,
    [enterCd, ids],
  );
  return (result.rowCount ?? 0) > 0;
};

const findOutManageRow = async (
  enterCd: string,
  sabun: string,
  sdate: string,
): Promise<OutManageRow | null> => {
  const result = await query<OutManageRow>(
    `
      select
        o.sabun,
        u.name,
        o.sdate,
        o.edate,
        o.tot_cnt::double precision as "totCnt",
        o.svc_cnt::double precision as "svcCnt",
        o.note
      from out_manage o
      left join tsys305_new u
        on u.enter_cd = o.enter_cd and u.sabun = o.sabun
      where o.enter_cd = $1 and o.sabun = $2 and o.sdate = $3
      limit 1
    `,
    [enterCd, sabun, sdate],
  );
  return result.rows[0] ?? null;
};
