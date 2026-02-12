"use client";

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
  const update = (key: keyof UserDraft, value: string) => {
    onChange({
      ...state.draft,
      [key]: value,
    });
  };

  const title = state.mode === "create" ? "Create User" : "Edit User";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <header className="modal-header">
          <h3>{title}</h3>
        </header>
        <div className="form-grid">
          <label>
            <span>Sabun *</span>
            <input
              value={state.draft.sabun}
              onChange={(event) => update("sabun", event.target.value)}
              disabled={state.mode === "edit"}
            />
          </label>
          <label>
            <span>Name *</span>
            <input value={state.draft.name} onChange={(event) => update("name", event.target.value)} />
          </label>
          <label>
            <span>Org Code *</span>
            <input value={state.draft.orgCd} onChange={(event) => update("orgCd", event.target.value)} />
          </label>
          <label>
            <span>Org Name *</span>
            <input value={state.draft.orgNm} onChange={(event) => update("orgNm", event.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input value={state.draft.mailId} onChange={(event) => update("mailId", event.target.value)} />
          </label>
          <label>
            <span>Title</span>
            <input
              value={state.draft.jikweeNm}
              onChange={(event) => update("jikweeNm", event.target.value)}
            />
          </label>
          <label>
            <span>Phone</span>
            <input
              value={state.draft.handPhone}
              onChange={(event) => update("handPhone", event.target.value)}
            />
          </label>
          <label>
            <span>Role *</span>
            <select value={state.draft.roleCd} onChange={(event) => update("roleCd", event.target.value)}>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Use</span>
            <select value={state.draft.useYn} onChange={(event) => update("useYn", event.target.value)}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </label>
          <label>
            <span>Note</span>
            <input value={state.draft.note} onChange={(event) => update("note", event.target.value)} />
          </label>
        </div>
        <footer className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
};

