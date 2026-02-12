"use client";

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
  const update = (key: keyof SystemMenuDraft, value: string) => {
    onChange({
      ...state.draft,
      [key]: value,
    });
  };

  const title = state.mode === "create" ? "메뉴 입력" : "메뉴 수정";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <header className="modal-header">
          <h3>{title}</h3>
        </header>
        <div className="form-grid">
          <label>
            <span>Menu ID *</span>
            <input
              value={state.draft.menuId}
              onChange={(event) => update("menuId", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </label>
          <label>
            <span>Parent Menu ID</span>
            <input
              value={state.draft.parentMenuId}
              onChange={(event) => update("parentMenuId", event.target.value)}
            />
          </label>
          <label>
            <span>Menu Label *</span>
            <input
              value={state.draft.menuLabel}
              onChange={(event) => update("menuLabel", event.target.value)}
            />
          </label>
          <label>
            <span>Menu Path</span>
            <input
              value={state.draft.menuPath}
              onChange={(event) => update("menuPath", event.target.value)}
            />
          </label>
          <label>
            <span>Menu Icon</span>
            <input
              value={state.draft.menuIcon}
              onChange={(event) => update("menuIcon", event.target.value)}
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

