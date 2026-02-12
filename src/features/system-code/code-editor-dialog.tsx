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
import type { CodeDraft, CodeEditorState } from "@/features/system-code/types";

type CodeEditorDialogProps = {
  state: CodeEditorState;
  onChange: (nextDraft: CodeDraft) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
};

export const CodeEditorDialog = ({
  state,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting,
}: CodeEditorDialogProps) => {
  const selectClassName =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const update = (key: keyof CodeDraft, value: string) => {
    onChange({
      ...state.draft,
      [key]: value,
    });
  };

  const title = state.mode === "create" ? "공통코드 입력" : "공통코드 수정";

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent aria-label={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>그룹 코드 *</Label>
            <Input
              value={state.draft.grcodeCd}
              onChange={(event) => update("grcodeCd", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>코드 *</Label>
            <Input
              value={state.draft.code}
              onChange={(event) => update("code", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>코드명 *</Label>
            <Input value={state.draft.codeNm} onChange={(event) => update("codeNm", event.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>영문명</Label>
            <Input
              value={state.draft.codeEngNm}
              onChange={(event) => update("codeEngNm", event.target.value)}
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

          <div className="grid gap-1.5 md:col-span-2">
            <Label>ERP 코드</Label>
            <Input value={state.draft.erpCode} onChange={(event) => update("erpCode", event.target.value)} />
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
