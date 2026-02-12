"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [statusText, setStatusText] = useState("사용자 데이터를 불러오세요.");
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const selectedCount = selectedSabuns.size;
  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadUsers = useCallback(
    async (nextPage: number, appliedFilters: FilterState) => {
      setIsLoading(true);
      setStatusText("사용자 목록 조회 중...");
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
        setStatusText(`${response.content?.length ?? 0}건 조회되었습니다.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "목록 조회에 실패했습니다.";
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
    setEditor({ mode: "create", draft: defaultDraft() });
  };

  const openEdit = (user: SystemUser) => {
    setEditor({ mode: "edit", draft: toDraft(user) });
  };

  const validateDraft = (draft: UserDraft): string | null => {
    if (!draft.sabun.trim()) return "사번은 필수입니다.";
    if (!draft.name.trim()) return "이름은 필수입니다.";
    if (!draft.orgCd.trim()) return "조직 코드는 필수입니다.";
    if (!draft.orgNm.trim()) return "조직명은 필수입니다.";
    if (!draft.roleCd.trim()) return "권한은 필수입니다.";
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
    setStatusText(editor.mode === "create" ? "사용자 등록 중..." : "사용자 수정 중...");
    try {
      if (editor.mode === "create") {
        await systemUserApi.create(editor.draft);
      } else {
        await systemUserApi.update(editor.draft);
      }
      setEditor(null);
      await loadUsers(page, queryFilters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUsers = async (users: Array<{ sabun: string; enterCd: string }>) => {
    if (users.length === 0) {
      setStatusText("삭제할 사용자를 선택하세요.");
      return;
    }
    const ok = window.confirm(`${users.length}명의 사용자를 삭제할까요?`);
    if (!ok) return;

    setIsSubmitting(true);
    setStatusText("사용자 삭제 중...");
    try {
      const result = await systemUserApi.deleteMany(users);
      setStatusText(`삭제 ${result.succeeded}건, 실패 ${result.failed}건`);
      await loadUsers(page, queryFilters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "삭제에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (user: SystemUser) => {
    const ok = window.confirm(`${user.name} (${user.sabun}) 사용자의 비밀번호를 사번으로 초기화할까요?`);
    if (!ok) return;
    setIsSubmitting(true);
    setStatusText("비밀번호 초기화 중...");
    try {
      await systemUserApi.resetPassword(user.sabun, user.enterCd);
      setStatusText("비밀번호가 초기화되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "비밀번호 초기화에 실패했습니다.";
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
  const selectClassName =
    "flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>사용자관리</h2>
          <p className="subtle">사용자 조회/입력/수정/삭제/비밀번호 초기화 화면입니다.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="사번 또는 이름"
          value={filters.keyword}
          onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
          className="w-52"
        />
        <Input
          placeholder="조직명"
          value={filters.orgNm}
          onChange={(event) => setFilters((prev) => ({ ...prev, orgNm: event.target.value }))}
          className="w-44"
        />
        <select
          className={selectClassName}
          value={filters.roleCd}
          onChange={(event) => setFilters((prev) => ({ ...prev, roleCd: event.target.value }))}
        >
          <option value="">전체 권한</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <Button type="button" variant="outline" onClick={() => void applySearch()} disabled={isLoading}>
          조회
        </Button>
        <Button type="button" onClick={openCreate} disabled={isSubmitting}>
          입력
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={selectedCount === 0 || isSubmitting}
          onClick={() => void deleteUsers(selectedUsers.map((user) => ({ sabun: user.sabun, enterCd: user.enterCd })))}
        >
          선택삭제 ({selectedCount})
        </Button>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextPage = Math.max(page - 1, 0);
            setPage(nextPage);
            void loadUsers(nextPage, queryFilters);
          }}
          disabled={page === 0 || isLoading}
        >이전</Button>
        <span>
          페이지 {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextPage = Math.min(page + 1, totalPages - 1);
            setPage(nextPage);
            void loadUsers(nextPage, queryFilters);
          }}
          disabled={page >= totalPages - 1 || isLoading}
        >다음</Button>
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


