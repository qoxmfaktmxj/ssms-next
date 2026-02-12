import { query } from "@/server/db/pool";

export type AttendanceRow = {
  id: number;
  sabun: string;
  sdate: string;
  edate: string;
  gntCd: string | null;
  statusCd: string | null;
  note: string | null;
  applyDate: string | null;
  name: string | null;
  gntCdName: string | null;
  statusCdName: string | null;
  orgNm: string | null;
  jikweeNm: string | null;
};

export type AttendanceUpsertInput = {
  id: number | null;
  sabun: string;
  sdate: string;
  edate: string;
  gntCd: string | null;
  statusCd: string | null;
  note: string | null;
  applyDate: string | null;
};

const baseSelect = `
  select
    a.id,
    a.sabun,
    a.sdate,
    a.edate,
    a.gnt_cd as "gntCd",
    a.status_cd as "statusCd",
    a.note,
    a.apply_date as "applyDate",
    u.name,
    coalesce(g.code_nm, a.gnt_cd) as "gntCdName",
    coalesce(s.code_nm, a.status_cd) as "statusCdName",
    u.org_nm as "orgNm",
    u.jikwee_nm as "jikweeNm"
  from attendance a
  left join tsys305_new u
    on u.enter_cd = a.enter_cd and u.sabun = a.sabun
  left join tsys005_new g
    on g.enter_cd = a.enter_cd and g.grcode_cd = 'GNT_CD' and g.code = a.gnt_cd and g.use_yn = 'Y'
  left join tsys005_new s
    on s.enter_cd = a.enter_cd and s.grcode_cd = 'STATUS_CD' and s.code = a.status_cd and s.use_yn = 'Y'
`;

export const listAttendance = async (enterCd: string): Promise<AttendanceRow[]> => {
  const result = await query<AttendanceRow>(
    `
      ${baseSelect}
      where a.enter_cd = $1
      order by a.gnt_cd asc nulls last, a.sabun asc, a.sdate asc, a.id asc
    `,
    [enterCd],
  );
  return result.rows;
};

export const insertAttendance = async (
  enterCd: string,
  input: AttendanceUpsertInput,
  chkid: string,
): Promise<AttendanceRow> => {
  const inserted = await query<{ id: number }>(
    `
      insert into attendance
        (enter_cd, sabun, sdate, edate, gnt_cd, status_cd, note, apply_date, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      returning id
    `,
    [
      enterCd,
      input.sabun,
      input.sdate,
      input.edate,
      input.gntCd,
      input.statusCd,
      input.note,
      input.applyDate,
      chkid,
    ],
  );

  const id = inserted.rows[0]?.id;
  const loaded = await findAttendanceById(enterCd, id);
  if (!loaded) {
    throw new Error("Failed to load inserted attendance");
  }
  return loaded;
};

export const updateAttendance = async (
  enterCd: string,
  input: AttendanceUpsertInput,
  chkid: string,
): Promise<AttendanceRow | null> => {
  if (input.id == null) {
    return null;
  }

  const result = await query(
    `
      update attendance
      set
        sabun = $3,
        sdate = $4,
        edate = $5,
        gnt_cd = $6,
        status_cd = $7,
        note = $8,
        apply_date = $9,
        chkid = $10,
        chkdate = now()
      where enter_cd = $1 and id = $2
    `,
    [
      enterCd,
      input.id,
      input.sabun,
      input.sdate,
      input.edate,
      input.gntCd,
      input.statusCd,
      input.note,
      input.applyDate,
      chkid,
    ],
  );

  if ((result.rowCount ?? 0) < 1) {
    return null;
  }
  return findAttendanceById(enterCd, input.id);
};

export const deleteAttendance = async (
  enterCd: string,
  id: number,
  sabun: string,
): Promise<boolean> => {
  const result = await query(
    `
      delete from attendance
      where enter_cd = $1 and id = $2 and sabun = $3
    `,
    [enterCd, id, sabun],
  );
  return (result.rowCount ?? 0) > 0;
};

const findAttendanceById = async (
  enterCd: string,
  id: number | undefined,
): Promise<AttendanceRow | null> => {
  if (!id) {
    return null;
  }
  const result = await query<AttendanceRow>(
    `
      ${baseSelect}
      where a.enter_cd = $1 and a.id = $2
      limit 1
    `,
    [enterCd, id],
  );
  return result.rows[0] ?? null;
};
