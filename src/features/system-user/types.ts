export type SystemUser = {
  enterCd: string;
  sabun: string;
  name: string;
  orgCd: string;
  orgNm: string;
  mailId?: string | null;
  jikweeNm?: string | null;
  useYn: "Y" | "N";
  handPhone?: string | null;
  note?: string | null;
  roleCd: string;
};

export type UserDraft = {
  sabun: string;
  name: string;
  orgCd: string;
  orgNm: string;
  mailId: string;
  jikweeNm: string;
  useYn: "Y" | "N";
  handPhone: string;
  note: string;
  roleCd: string;
};

export type UserEditorState =
  | {
      mode: "create";
      draft: UserDraft;
    }
  | {
      mode: "edit";
      draft: UserDraft;
    };
