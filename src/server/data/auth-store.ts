import { query } from "@/server/db/pool";

type UserRow = {
  enterCd: string;
  sabun: string;
  password: string;
  name: string;
  orgCd: string | null;
  orgNm: string | null;
  mailId: string | null;
  jikweeNm: string | null;
  useYn: string | null;
  handPhone: string | null;
  note: string | null;
  roleCd: string | null;
  refreshToken: string | null;
};

export const findUserByCredentials = async (
  enterCd: string,
  sabun: string,
): Promise<UserRow | null> => {
  const result = await query<UserRow>(
    `
      select
        enter_cd as "enterCd",
        sabun,
        password,
        name,
        org_cd as "orgCd",
        org_nm as "orgNm",
        mail_id as "mailId",
        jikwee_nm as "jikweeNm",
        use_yn as "useYn",
        hand_phone as "handPhone",
        note,
        role_cd as "roleCd",
        refresh_token as "refreshToken"
      from tsys305_new
      where enter_cd = $1 and sabun = $2
      limit 1
    `,
    [enterCd, sabun],
  );
  return result.rows[0] ?? null;
};

export const updateUserRefreshToken = async (
  enterCd: string,
  sabun: string,
  refreshToken: string | null,
): Promise<void> => {
  await query(
    `
      update tsys305_new
      set refresh_token = $3
      where enter_cd = $1 and sabun = $2
    `,
    [enterCd, sabun, refreshToken],
  );
};
