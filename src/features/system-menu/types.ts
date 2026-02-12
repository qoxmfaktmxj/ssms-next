export type SystemMenuRecord = {
  menuId: number;
  parentMenuId: number | null;
  menuLabel: string;
  menuPath: string | null;
  menuIcon: string | null;
  seq: number | null;
  useYn: "Y" | "N";
};

export type SystemMenuDraft = {
  menuId: string;
  parentMenuId: string;
  menuLabel: string;
  menuPath: string;
  menuIcon: string;
  seq: string;
  useYn: "Y" | "N";
};

export type MenuEditorState =
  | {
      mode: "create";
      draft: SystemMenuDraft;
    }
  | {
      mode: "edit";
      draft: SystemMenuDraft;
    };
