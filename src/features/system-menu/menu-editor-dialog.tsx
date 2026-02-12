"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MenuEditorState, SystemMenuDraft } from "@/features/system-menu/types";

type MenuEditorDialogProps = {
  state: MenuEditorState;
  onChange: (nextDraft: SystemMenuDraft) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
};

export const MenuEditorDialog = ({
  state,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting,
}: MenuEditorDialogProps) => {
  const selectClassName =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const update = (key: keyof SystemMenuDraft, value: string) => {
    onChange({
      ...state.draft,
      [key]: value,
    });
  };

  const title = state.mode === "create" ? "메뉴 입력" : "메뉴 수정";

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent aria-label={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>메뉴 ID *</Label>
            <Input
              value={state.draft.menuId}
              onChange={(event) => update("menuId", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>상위 메뉴 ID</Label>
            <Input
              value={state.draft.parentMenuId}
              onChange={(event) => update("parentMenuId", event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>메뉴명 *</Label>
            <Input
              value={state.draft.menuLabel}
              onChange={(event) => update("menuLabel", event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>메뉴 경로</Label>
            <Input
              value={state.draft.menuPath}
              onChange={(event) => update("menuPath", event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>메뉴 아이콘</Label>
            <Input
              value={state.draft.menuIcon}
              onChange={(event) => update("menuIcon", event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>순번</Label>
            <Input value={state.draft.seq} onChange={(event) => update("seq", event.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>사용 여부</Label>
            <select
              className={selectClassName}
              value={state.draft.useYn}
              onChange={(event) => update("useYn", event.target.value)}
            >
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
