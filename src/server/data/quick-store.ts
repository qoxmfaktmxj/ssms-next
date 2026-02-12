import { query } from "@/server/db/pool";

export type QuickMenuItemRow = {
  menuId: number;
  menuLabel: string;
  menuPath: string | null;
  menuIcon: string | null;
  seq: number;
};

export type QuickMenuCandidateRow = {
  menuId: number;
  menuLabel: string;
  menuPath: string | null;
  menuIcon: string | null;
  seq: number | null;
};

export type QuickCandidatePageResult = {
  content: QuickMenuCandidateRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const listQuickMenus = async (
  enterCd: string,
  sabun: string,
): Promise<QuickMenuItemRow[]> => {
  const result = await query<QuickMenuItemRow>(
    `
      select
        m.menu_id::int as "menuId",
        m.menu_label as "menuLabel",
        m.menu_path as "menuPath",
        m.menu_icon as "menuIcon",
        q.seq::int as seq
      from quick_menu q
      join tsys301_new m
        on m.enter_cd = q.enter_cd and m.menu_id = q.menu_id
      where q.enter_cd = $1 and q.sabun = $2
      order by q.seq asc, q.menu_id asc
    `,
    [enterCd, sabun],
  );
  return result.rows;
};

export const listQuickCandidates = async (
  enterCd: string,
  page: number,
  size: number,
  keyword: string,
): Promise<QuickCandidatePageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const normalizedKeyword = keyword.trim();

  const [contentResult, countResult] = await Promise.all([
    query<QuickMenuCandidateRow>(
      `
        select
          menu_id::int as "menuId",
          menu_label as "menuLabel",
          menu_path as "menuPath",
          menu_icon as "menuIcon",
          seq::int as seq
        from tsys301_new
        where enter_cd = $1
          and use_yn = 'Y'
          and length(trim(coalesce(menu_path, ''))) > 0
          and (
            $2 = ''
            or lower(menu_label) like lower('%' || $2 || '%')
            or lower(coalesce(menu_path, '')) like lower('%' || $2 || '%')
          )
        order by seq asc nulls last, menu_label asc, menu_id asc
        limit $3 offset $4
      `,
      [enterCd, normalizedKeyword, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from tsys301_new
        where enter_cd = $1
          and use_yn = 'Y'
          and length(trim(coalesce(menu_path, ''))) > 0
          and (
            $2 = ''
            or lower(menu_label) like lower('%' || $2 || '%')
            or lower(coalesce(menu_path, '')) like lower('%' || $2 || '%')
          )
      `,
      [enterCd, normalizedKeyword],
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

export const clearQuickMenus = async (
  enterCd: string,
  sabun: string,
): Promise<number> => {
  const result = await query(
    `
      delete from quick_menu
      where enter_cd = $1 and sabun = $2
    `,
    [enterCd, sabun],
  );
  return result.rowCount ?? 0;
};

export const findValidProgramMenuIds = async (
  enterCd: string,
  menuIds: number[],
): Promise<Set<number>> => {
  if (menuIds.length === 0) {
    return new Set<number>();
  }
  const result = await query<{ menuId: number }>(
    `
      select menu_id::int as "menuId"
      from tsys301_new
      where enter_cd = $1
        and menu_id = any($2::bigint[])
        and use_yn = 'Y'
        and length(trim(coalesce(menu_path, ''))) > 0
    `,
    [enterCd, menuIds],
  );
  return new Set(result.rows.map((row) => row.menuId));
};

export const saveQuickMenus = async (
  enterCd: string,
  sabun: string,
  menuIds: number[],
  chkid: string,
): Promise<number> => {
  let inserted = 0;
  let seq = 1;
  for (const menuId of menuIds) {
    const result = await query(
      `
        insert into quick_menu
          (enter_cd, sabun, menu_id, seq, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, now())
      `,
      [enterCd, sabun, menuId, seq, chkid],
    );
    if ((result.rowCount ?? 0) > 0) {
      inserted += 1;
      seq += 1;
    }
  }
  return inserted;
};
