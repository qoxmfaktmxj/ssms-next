import { query } from "@/server/db/pool";

export type MenuRow = {
  enterCd: string;
  menuId: number;
  parentMenuId: number | null;
  menuLabel: string;
  menuPath: string | null;
  menuIcon: string | null;
  seq: number | null;
  useYn: string;
};

const baseSelect = `
  select
    enter_cd as "enterCd",
    menu_id as "menuId",
    parent_menu_id as "parentMenuId",
    menu_label as "menuLabel",
    menu_path as "menuPath",
    menu_icon as "menuIcon",
    seq,
    use_yn as "useYn"
  from tsys301_new
`;

const orderClause = `
  order by
    case when seq is null then 1 else 0 end,
    seq asc,
    menu_id asc
`;

export const findActiveMenus = async (enterCd: string): Promise<MenuRow[]> => {
  const result = await query<MenuRow>(
    `
      ${baseSelect}
      where enter_cd = $1 and use_yn = 'Y'
      ${orderClause}
    `,
    [enterCd],
  );
  return result.rows;
};

export const searchMenus = async (
  enterCd: string,
  keyword: string,
): Promise<MenuRow[]> => {
  const normalized = keyword.trim();
  const result = await query<MenuRow>(
    `
      ${baseSelect}
      where enter_cd = $1
        and (
          $2 = ''
          or lower(menu_label) like lower('%' || $2 || '%')
          or lower(coalesce(menu_path, '')) like lower('%' || $2 || '%')
        )
      ${orderClause}
    `,
    [enterCd, normalized],
  );
  return result.rows;
};

type MenuUpsertInput = {
  menuId: number;
  parentMenuId: number | null;
  menuLabel: string;
  menuPath: string | null;
  menuIcon: string | null;
  seq: number | null;
  useYn: string;
  chkid: string;
};

export const insertMenu = async (
  enterCd: string,
  input: MenuUpsertInput,
): Promise<MenuRow> => {
  const result = await query<MenuRow>(
    `
      insert into tsys301_new
        (enter_cd, menu_id, parent_menu_id, menu_label, menu_path, menu_icon, seq, use_yn, chkid, chkdate)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      returning
        enter_cd as "enterCd",
        menu_id as "menuId",
        parent_menu_id as "parentMenuId",
        menu_label as "menuLabel",
        menu_path as "menuPath",
        menu_icon as "menuIcon",
        seq,
        use_yn as "useYn"
    `,
    [
      enterCd,
      input.menuId,
      input.parentMenuId,
      input.menuLabel,
      input.menuPath,
      input.menuIcon,
      input.seq,
      input.useYn,
      input.chkid,
    ],
  );
  return result.rows[0];
};

export const updateMenu = async (
  enterCd: string,
  input: MenuUpsertInput,
): Promise<MenuRow | null> => {
  const result = await query<MenuRow>(
    `
      update tsys301_new
      set
        parent_menu_id = $3,
        menu_label = $4,
        menu_path = $5,
        menu_icon = $6,
        seq = $7,
        use_yn = $8,
        chkid = $9,
        chkdate = now()
      where enter_cd = $1 and menu_id = $2
      returning
        enter_cd as "enterCd",
        menu_id as "menuId",
        parent_menu_id as "parentMenuId",
        menu_label as "menuLabel",
        menu_path as "menuPath",
        menu_icon as "menuIcon",
        seq,
        use_yn as "useYn"
    `,
    [
      enterCd,
      input.menuId,
      input.parentMenuId,
      input.menuLabel,
      input.menuPath,
      input.menuIcon,
      input.seq,
      input.useYn,
      input.chkid,
    ],
  );
  return result.rows[0] ?? null;
};

export const deleteMenus = async (
  enterCd: string,
  menuIds: number[],
): Promise<number> => {
  if (menuIds.length === 0) {
    return 0;
  }
  const result = await query(
    `
      delete from tsys301_new
      where enter_cd = $1 and menu_id = any($2::bigint[])
    `,
    [enterCd, menuIds],
  );
  return result.rowCount ?? 0;
};
