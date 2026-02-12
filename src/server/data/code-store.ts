import { query } from "@/server/db/pool";

export type CodeRow = {
  enterCd: string;
  grcodeCd: string;
  code: string;
  codeNm: string;
  codeEngNm: string | null;
  seq: number | null;
  useYn: string;
  note1: string | null;
  note2: string | null;
  note3: string | null;
  note4: string | null;
  numNote: string | null;
  chkid: string | null;
  erpCode: string | null;
};

export type CodePageResult = {
  content: CodeRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type CodeUpsertInput = {
  grcodeCd: string;
  code: string;
  codeNm: string;
  codeEngNm: string | null;
  seq: number | null;
  useYn: string;
  note1: string | null;
  note2: string | null;
  note3: string | null;
  note4: string | null;
  numNote: string | null;
  erpCode: string | null;
};

const baseSelect = `
  select
    enter_cd as "enterCd",
    grcode_cd as "grcodeCd",
    code,
    code_nm as "codeNm",
    code_eng_nm as "codeEngNm",
    seq,
    use_yn as "useYn",
    note1,
    note2,
    note3,
    note4,
    num_note as "numNote",
    chkid,
    erp_code as "erpCode"
  from tsys005_new
`;

export const listCodes = async (
  enterCd: string,
  grcodeCd: string,
): Promise<CodeRow[]> => {
  const result = await query<CodeRow>(
    `
      ${baseSelect}
      where enter_cd = $1 and grcode_cd = $2 and use_yn = 'Y'
      order by
        case when seq is null then 1 else 0 end,
        seq asc,
        code asc
    `,
    [enterCd, grcodeCd],
  );
  return result.rows;
};

export const searchCodes = async (
  enterCd: string,
  page: number,
  size: number,
  grcodeCd: string,
  code: string,
  codeNm: string,
): Promise<CodePageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const params = [
    enterCd,
    grcodeCd.trim(),
    code.trim(),
    codeNm.trim(),
    safeSize,
    offset,
  ];

  const [contentResult, countResult] = await Promise.all([
    query<CodeRow>(
      `
        ${baseSelect}
        where enter_cd = $1
          and ($2 = '' or lower(grcode_cd) like lower('%' || $2 || '%'))
          and ($3 = '' or lower(code) like lower('%' || $3 || '%'))
          and (
            $4 = ''
            or lower(code_nm) like lower('%' || $4 || '%')
            or lower(coalesce(code_eng_nm, '')) like lower('%' || $4 || '%')
          )
        order by grcode_cd asc, seq asc nulls last, code asc
        limit $5 offset $6
      `,
      params,
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from tsys005_new
        where enter_cd = $1
          and ($2 = '' or lower(grcode_cd) like lower('%' || $2 || '%'))
          and ($3 = '' or lower(code) like lower('%' || $3 || '%'))
          and (
            $4 = ''
            or lower(code_nm) like lower('%' || $4 || '%')
            or lower(coalesce(code_eng_nm, '')) like lower('%' || $4 || '%')
          )
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

export const codeExists = async (
  enterCd: string,
  grcodeCd: string,
  code: string,
): Promise<boolean> => {
  const result = await query<{ exists: boolean }>(
    `
      select exists(
        select 1
        from tsys005_new
        where enter_cd = $1 and grcode_cd = $2 and code = $3
      ) as exists
    `,
    [enterCd, grcodeCd, code],
  );
  return Boolean(result.rows[0]?.exists);
};

export const insertCode = async (
  enterCd: string,
  input: CodeUpsertInput,
  chkid: string,
): Promise<CodeRow> => {
  const result = await query<CodeRow>(
    `
      insert into tsys005_new
        (enter_cd, grcode_cd, code, code_nm, code_eng_nm, seq, use_yn, note1, note2, note3, note4, num_note, chkid, chkdate, erp_code)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14)
      returning
        enter_cd as "enterCd",
        grcode_cd as "grcodeCd",
        code,
        code_nm as "codeNm",
        code_eng_nm as "codeEngNm",
        seq,
        use_yn as "useYn",
        note1,
        note2,
        note3,
        note4,
        num_note as "numNote",
        chkid,
        erp_code as "erpCode"
    `,
    [
      enterCd,
      input.grcodeCd,
      input.code,
      input.codeNm,
      input.codeEngNm,
      input.seq,
      input.useYn,
      input.note1,
      input.note2,
      input.note3,
      input.note4,
      input.numNote,
      chkid,
      input.erpCode,
    ],
  );
  return result.rows[0];
};

export const updateCode = async (
  enterCd: string,
  input: CodeUpsertInput,
  chkid: string,
): Promise<CodeRow | null> => {
  const result = await query<CodeRow>(
    `
      update tsys005_new
      set
        code_nm = $4,
        code_eng_nm = $5,
        seq = $6,
        use_yn = $7,
        note1 = $8,
        note2 = $9,
        note3 = $10,
        note4 = $11,
        num_note = $12,
        chkid = $13,
        chkdate = now(),
        erp_code = $14
      where enter_cd = $1 and grcode_cd = $2 and code = $3
      returning
        enter_cd as "enterCd",
        grcode_cd as "grcodeCd",
        code,
        code_nm as "codeNm",
        code_eng_nm as "codeEngNm",
        seq,
        use_yn as "useYn",
        note1,
        note2,
        note3,
        note4,
        num_note as "numNote",
        chkid,
        erp_code as "erpCode"
    `,
    [
      enterCd,
      input.grcodeCd,
      input.code,
      input.codeNm,
      input.codeEngNm,
      input.seq,
      input.useYn,
      input.note1,
      input.note2,
      input.note3,
      input.note4,
      input.numNote,
      chkid,
      input.erpCode,
    ],
  );
  return result.rows[0] ?? null;
};

export const deleteCodeItems = async (
  enterCd: string,
  items: Array<{ grcodeCd: string; code: string }>,
): Promise<number> => {
  let succeeded = 0;
  for (const item of items) {
    const result = await query(
      `
        delete from tsys005_new
        where enter_cd = $1 and grcode_cd = $2 and code = $3
      `,
      [enterCd, item.grcodeCd, item.code],
    );
    if ((result.rowCount ?? 0) > 0) {
      succeeded += 1;
    }
  }
  return succeeded;
};
