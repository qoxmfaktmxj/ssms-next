"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserEditorDialog } from "@/features/system-user/user-editor-dialog";
import { UserTable } from "@/features/system-user/user-table";
import { systemUserApi } from "@/features/system-user/api";
import type { SystemUser, UserDraft, UserEditorState } from "@/features/system-user/types";

const defaultDraft = (): UserDraft => ({
  sabun: "",
  name: "",
  orgCd: "",
  orgNm: "",
  mailId: "",
  jikweeNm: "",
  useYn: "Y",
  handPhone: "",
  note: "",
  roleCd: "user",
});

const toDraft = (user: SystemUser): UserDraft => ({
  sabun: user.sabun,
  name: user.name,
  orgCd: user.orgCd,
  orgNm: user.orgNm,
  mailId: user.mailId ?? "",
  jikweeNm: user.jikweeNm ?? "",
  useYn: user.useYn,
  handPhone: user.handPhone ?? "",
  note: user.note ?? "",
  roleCd: user.roleCd,
});

type FilterState = {
  keyword: string;
  orgNm: string;
  roleCd: string;
};

export default function SystemUserPage() {
  const [filters, setFilters] = useState<FilterState>({ keyword: "", orgNm: "", roleCd: "" });
  const [queryFilters, setQueryFilters] = useState<FilterState>({ keyword: "", orgNm: "", roleCd: "" });
  const [rows, setRows] = useState<SystemUser[]>([]);
  const [selectedSabuns, setSelectedSabuns] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<UserEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("Load user data to begin.");
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const selectedCount = selectedSabuns.size;
  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadUsers = useCallback(
    async (nextPage: number, appliedFilters: FilterState) => {
      setIsLoading(true);
      setStatusText("Loading user list...");
      try {
        const response = await systemUserApi.list({
          page: nextPage,
          size,
          keyword: appliedFilters.keyword,
          orgNm: appliedFilters.orgNm,
          roleCd: appliedFilters.roleCd,
        });
        setRows(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setSelectedSabuns(new Set());
        setStatusText(`Loaded ${response.content?.length ?? 0} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load rows.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    },
    [size],
  );

  useEffect(() => {
    void loadUsers(0, queryFilters);
  }, [loadUsers, queryFilters]);

  const applySearch = async () => {
    setPage(0);
    setQueryFilters({ ...filters });
  };

  const openCreate = () => {
    setEditor({
      mode: "create",
      draft: defaultDraft(),
    });
  };

  const openEdit = (user: SystemUser) => {
    setEditor({
      mode: "edit",
      draft: toDraft(user),
    });
  };

  const validateDraft = (draft: UserDraft): string | null => {
    if (!draft.sabun.trim()) return "Sabun is required.";
    if (!draft.name.trim()) return "Name is required.";
    if (!draft.orgCd.trim()) return "Org code is required.";
    if (!draft.orgNm.trim()) return "Org name is required.";
    if (!draft.roleCd.trim()) return "Role is required.";
    return null;
  };

  const saveEditor = async () => {
    if (!editor) return;
    const validationMessage = validateDraft(editor.draft);
    if (validationMessage) {
      setStatusText(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "User Create 중..." : "User Edit 중...");
    try {
      if (editor.mode === "create") {
        await systemUserApi.create(editor.draft);
      } else {
        await systemUserApi.update(editor.draft);
      }
      setEditor(null);
      await loadUsers(page, queryFilters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUsers = async (users: Array<{ sabun: string; enterCd: string }>) => {
    if (users.length === 0) {
      setStatusText("Select at least one user to delete.");
      return;
    }
    const ok = window.confirm(`Delete ${users.length} user(s)?`);
    if (!ok) return;

    setIsSubmitting(true);
    setStatusText("User Delete 중...");
    try {
      const result = await systemUserApi.deleteMany(users);
      setStatusText(`Deleted ${result.succeeded}, failed ${result.failed}.`);
      await loadUsers(page, queryFilters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (user: SystemUser) => {
    const ok = window.confirm(`Reset password for ${user.name} (${user.sabun}) to sabun value?`);
    if (!ok) return;
    setIsSubmitting(true);
    setStatusText("비밀번호 초기화 중...");
    try {
      await systemUserApi.resetPassword(user.sabun, user.enterCd);
      setStatusText("비밀번호가 초기화되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reset password failed.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (sabun: string, selected: boolean) => {
    setSelectedSabuns((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(sabun);
      } else {
        next.delete(sabun);
      }
      return next;
    });
  };

  const toggleAllVisible = (selected: boolean) => {
    if (!selected) {
      setSelectedSabuns(new Set());
      return;
    }
    setSelectedSabuns(new Set(rows.map((row) => row.sabun)));
  };

  const selectedUsers = rows.filter((row) => selectedSabuns.has(row.sabun));

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>System User</h2>
          <p className="subtle">Phase 2 slice: user list/search/create/update/delete/reset-password.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Sabun or name"
          value={filters.keyword}
          onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
        />
        <input
          placeholder="Org name"
          value={filters.orgNm}
          onChange={(event) => setFilters((prev) => ({ ...prev, orgNm: event.target.value }))}
        />
        <select
          value={filters.roleCd}
          onChange={(event) => setFilters((prev) => ({ ...prev, roleCd: event.target.value }))}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <button type="button" className="ghost" onClick={() => void applySearch()} disabled={isLoading}>
          Search
        </button>
        <button type="button" onClick={openCreate} disabled={isSubmitting}>
          Create
        </button>
        <button
          type="button"
          className="danger"
          disabled={selectedCount === 0 || isSubmitting}
          onClick={() =>
            void deleteUsers(selectedUsers.map((user) => ({ sabun: user.sabun, enterCd: user.enterCd })))
          }
        >
          Delete Selected ({selectedCount})
        </button>
      </div>

      <p className="status-text">{statusText}</p>

      <UserTable
        rows={rows}
        selectedSabuns={selectedSabuns}
        onToggleOne={toggleOne}
        onToggleAll={toggleAllVisible}
        onEdit={openEdit}
        onDelete={(user) => void deleteUsers([{ sabun: user.sabun, enterCd: user.enterCd }])}
        onResetPassword={(user) => void resetPassword(user)}
      />

      <div className="pagination">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const nextPage = Math.max(page - 1, 0);
            setPage(nextPage);
            void loadUsers(nextPage, queryFilters);
          }}
          disabled={page === 0 || isLoading}
        >
          Prev
        </button>
        <span>
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const nextPage = Math.min(page + 1, totalPages - 1);
            setPage(nextPage);
            void loadUsers(nextPage, queryFilters);
          }}
          disabled={page >= totalPages - 1 || isLoading}
        >
          Next
        </button>
      </div>

      {editor && (
        <UserEditorDialog
          state={editor}
          onChange={(nextDraft) => {
            setEditor((current) => (current ? { ...current, draft: nextDraft } : current));
          }}
          onCancel={() => setEditor(null)}
          onSubmit={saveEditor}
          isSubmitting={isSubmitting}
        />
      )}
    </section>
  );
}

