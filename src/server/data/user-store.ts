import { query } from "@/server/db/pool";

export type UserSummaryRow = {
  enterCd: string;
  sabun: string;
  name: string;
  orgCd: string | null;
  orgNm: string | null;
  mailId: string | null;
  jikweeNm: string | null;
  useYn: string | null;
  handPhone: string | null;
  note: string | null;
  roleCd: string | null;
};

export type UserPageResult = {
  content: UserSummaryRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type UserUpsertInput = {
  sabun: string;
  name: string;
  orgCd: string;
  orgNm: string;
  mailId: string | null;
  jikweeNm: string | null;
  useYn: string;
  handPhone: string | null;
  note: string | null;
  roleCd: string;
};

const baseSelect = `
  select
    enter_cd as "enterCd",
    sabun,
    name,
    org_cd as "orgCd",
    org_nm as "orgNm",
    mail_id as "mailId",
    jikwee_nm as "jikweeNm",
    use_yn as "useYn",
    hand_phone as "handPhone",
    note,
    role_cd as "roleCd"
  from tsys305_new
`;

export const listUsers = async (
  enterCd: string,
  page: number,
  size: number,
  keyword: string,
  orgNm: string,
  roleCd: string,
): Promise<UserPageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const params = [
    enterCd,
    keyword.trim(),
    orgNm.trim(),
    roleCd.trim(),
    safeSize,
    offset,
  ];

  const [contentResult, countResult] = await Promise.all([
    query<UserSummaryRow>(
      `
        ${baseSelect}
        where enter_cd = $1
          and (
            $2 = ''
            or lower(sabun) like lower('%' || $2 || '%')
            or lower(name) like lower('%' || $2 || '%')
          )
          and ($3 = '' or lower(coalesce(org_nm, '')) like lower('%' || $3 || '%'))
          and ($4 = '' or lower(coalesce(role_cd, '')) = lower($4))
        order by sabun asc
        limit $5 offset $6
      `,
      params,
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from tsys305_new
        where enter_cd = $1
          and (
            $2 = ''
            or lower(sabun) like lower('%' || $2 || '%')
            or lower(name) like lower('%' || $2 || '%')
          )
          and ($3 = '' or lower(coalesce(org_nm, '')) like lower('%' || $3 || '%'))
          and ($4 = '' or lower(coalesce(role_cd, '')) = lower($4))
      `,
      params.slice(0, 4),
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

export const createUser = async (
  enterCd: string,
  input: UserUpsertInput,
  hashedPassword: string,
  chkid: string,
): Promise<UserSummaryRow> => {
  const result = await query<UserSummaryRow>(
    `
      insert into tsys305_new
        (enter_cd, sabun, password, name, org_cd, org_nm, mail_id, jikwee_nm, use_yn, hand_phone, note, role_cd, refresh_token, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, null, $13, now())
      returning
        enter_cd as "enterCd",
        sabun,
        name,
        org_cd as "orgCd",
        org_nm as "orgNm",
        mail_id as "mailId",
        jikwee_nm as "jikweeNm",
        use_yn as "useYn",
        hand_phone as "handPhone",
        note,
        role_cd as "roleCd"
    `,
    [
      enterCd,
      input.sabun,
      hashedPassword,
      input.name,
      input.orgCd,
      input.orgNm,
      input.mailId,
      input.jikweeNm,
      input.useYn,
      input.handPhone,
      input.note,
      input.roleCd,
      chkid,
    ],
  );
  return result.rows[0];
};

export const updateUser = async (
  enterCd: string,
  input: UserUpsertInput,
  chkid: string,
): Promise<UserSummaryRow | null> => {
  const result = await query<UserSummaryRow>(
    `
      update tsys305_new
      set
        name = $3,
        org_cd = $4,
        org_nm = $5,
        mail_id = $6,
        jikwee_nm = $7,
        use_yn = $8,
        hand_phone = $9,
        note = $10,
        role_cd = $11,
        chkid = $12,
        chkdate = now()
      where enter_cd = $1 and sabun = $2
      returning
        enter_cd as "enterCd",
        sabun,
        name,
        org_cd as "orgCd",
        org_nm as "orgNm",
        mail_id as "mailId",
        jikwee_nm as "jikweeNm",
        use_yn as "useYn",
        hand_phone as "handPhone",
        note,
        role_cd as "roleCd"
    `,
    [
      enterCd,
      input.sabun,
      input.name,
      input.orgCd,
      input.orgNm,
      input.mailId,
      input.jikweeNm,
      input.useYn,
      input.handPhone,
      input.note,
      input.roleCd,
      chkid,
    ],
  );
  return result.rows[0] ?? null;
};

export const userExists = async (
  enterCd: string,
  sabun: string,
): Promise<boolean> => {
  const result = await query<{ exists: boolean }>(
    `
      select exists(
        select 1
        from tsys305_new
        where enter_cd = $1 and sabun = $2
      ) as exists
    `,
    [enterCd, sabun],
  );
  return Boolean(result.rows[0]?.exists);
};

export const deleteUsers = async (
  enterCd: string,
  sabuns: string[],
): Promise<number> => {
  if (sabuns.length === 0) {
    return 0;
  }
  const result = await query(
    `
      delete from tsys305_new
      where enter_cd = $1 and sabun = any($2::text[])
    `,
    [enterCd, sabuns],
  );
  return result.rowCount ?? 0;
};

export const resetUserPassword = async (
  enterCd: string,
  sabun: string,
  hashedPassword: string,
  chkid: string,
): Promise<boolean> => {
  const result = await query(
    `
      update tsys305_new
      set
        password = $3,
        chkid = $4,
        chkdate = now()
      where enter_cd = $1 and sabun = $2
    `,
    [enterCd, sabun, hashedPassword, chkid],
  );
  return (result.rowCount ?? 0) > 0;
};
