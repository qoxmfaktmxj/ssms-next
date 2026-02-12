"use client";

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
  const update = (key: keyof CodeDraft, value: string) => {
    onChange({
      ...state.draft,
      [key]: value,
    });
  };

  const title = state.mode === "create" ? "공통코드 입력" : "공통코드 수정";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <header className="modal-header">
          <h3>{title}</h3>
        </header>
        <div className="form-grid">
          <label>
            <span>Group Code *</span>
            <input
              value={state.draft.grcodeCd}
              onChange={(event) => update("grcodeCd", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </label>
          <label>
            <span>Code *</span>
            <input
              value={state.draft.code}
              onChange={(event) => update("code", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </label>
          <label>
            <span>Code Name *</span>
            <input value={state.draft.codeNm} onChange={(event) => update("codeNm", event.target.value)} />
          </label>
          <label>
            <span>English Name</span>
            <input
              value={state.draft.codeEngNm}
              onChange={(event) => update("codeEngNm", event.target.value)}
            />
          </label>
          <label>
            <span>Sequence</span>
            <input value={state.draft.seq} onChange={(event) => update("seq", event.target.value)} />
          </label>
          <label>
            <span>Use</span>
            <select value={state.draft.useYn} onChange={(event) => update("useYn", event.target.value)}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </label>
          <label>
            <span>ERP Code</span>
            <input value={state.draft.erpCode} onChange={(event) => update("erpCode", event.target.value)} />
          </label>
        </div>
        <footer className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>취소</button>
          <button type="button" onClick={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </footer>
      </div>
    </div>
  );
};

