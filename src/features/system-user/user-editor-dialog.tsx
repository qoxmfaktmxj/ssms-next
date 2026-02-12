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
import type { UserDraft, UserEditorState } from "@/features/system-user/types";

type UserEditorDialogProps = {
  state: UserEditorState;
  onChange: (nextDraft: UserDraft) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
};

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "User", value: "user" },
];

export const UserEditorDialog = ({
  state,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting,
}: UserEditorDialogProps) => {
  const selectClassName =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const update = (key: keyof UserDraft, value: string) => {
    onChange({
      ...state.draft,
      [key]: value,
    });
  };

  const title = state.mode === "create" ? "사용자 입력" : "사용자 수정";

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent aria-label={title} className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>사번 *</Label>
            <Input
              value={state.draft.sabun}
              onChange={(event) => update("sabun", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>이름 *</Label>
            <Input value={state.draft.name} onChange={(event) => update("name", event.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>조직 코드 *</Label>
            <Input value={state.draft.orgCd} onChange={(event) => update("orgCd", event.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>조직명 *</Label>
            <Input value={state.draft.orgNm} onChange={(event) => update("orgNm", event.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>이메일</Label>
            <Input value={state.draft.mailId} onChange={(event) => update("mailId", event.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>직위</Label>
            <Input
              value={state.draft.jikweeNm}
              onChange={(event) => update("jikweeNm", event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>전화번호</Label>
            <Input
              value={state.draft.handPhone}
              onChange={(event) => update("handPhone", event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>권한 *</Label>
            <select
              className={selectClassName}
              value={state.draft.roleCd}
              onChange={(event) => update("roleCd", event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
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

          <div className="grid gap-1.5 md:col-span-2">
            <Label>비고</Label>
            <Input value={state.draft.note} onChange={(event) => update("note", event.target.value)} />
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
