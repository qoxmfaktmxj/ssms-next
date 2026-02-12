export type SystemCode = {
  enterCd: string;
  grcodeCd: string;
  code: string;
  codeNm: string;
  codeEngNm?: string | null;
  seq?: number | null;
  useYn: "Y" | "N";
  note1?: string | null;
  note2?: string | null;
  note3?: string | null;
  note4?: string | null;
  numNote?: string | null;
  chkid?: string | null;
  erpCode?: string | null;
};

export type CodeDraft = {
  grcodeCd: string;
  code: string;
  codeNm: string;
  codeEngNm: string;
  seq: string;
  useYn: "Y" | "N";
  note1: string;
  note2: string;
  note3: string;
  note4: string;
  numNote: string;
  erpCode: string;
};

export type CodeEditorState =
  | {
      mode: "create";
      draft: CodeDraft;
    }
  | {
      mode: "edit";
      draft: CodeDraft;
    };
