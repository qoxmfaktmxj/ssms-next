"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuEditorDialog } from "@/features/system-menu/menu-editor-dialog";
import { MenuTable } from "@/features/system-menu/menu-table";
import { systemMenuApi } from "@/features/system-menu/api";
import type { MenuEditorState, SystemMenuDraft, SystemMenuRecord } from "@/features/system-menu/types";

const emptyDraft = (): SystemMenuDraft => ({
  menuId: "",
  parentMenuId: "",
  menuLabel: "",
  menuPath: "",
  menuIcon: "",
  seq: "",
  useYn: "Y",
});

const toDraft = (row: SystemMenuRecord): SystemMenuDraft => ({
  menuId: String(row.menuId),
  parentMenuId: row.parentMenuId == null ? "" : String(row.parentMenuId),
  menuLabel: row.menuLabel,
  menuPath: row.menuPath ?? "",
  menuIcon: row.menuIcon ?? "",
  seq: row.seq == null ? "" : String(row.seq),
  useYn: row.useYn,
});

const sortRows = (rows: SystemMenuRecord[]): SystemMenuRecord[] => {
  return [...rows].sort((a, b) => {
    const seqA = a.seq ?? Number.MAX_SAFE_INTEGER;
    const seqB = b.seq ?? Number.MAX_SAFE_INTEGER;
    if (seqA !== seqB) {
      return seqA - seqB;
    }
    return a.menuId - b.menuId;
  });
};

export default function SystemMenuPage() {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SystemMenuRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editor, setEditor] = useState<MenuEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("메뉴 데이터를 불러오세요.");

  const selectedCount = selectedIds.size;
  const orderedRows = useMemo(() => sortRows(rows), [rows]);

  const loadRows = useCallback(async (nextQuery: string) => {
    setIsLoading(true);
    setStatusText("메뉴 목록 조회 중...");
    try {
      const list = await systemMenuApi.list(nextQuery);
      setRows(list);
      setSelectedIds(new Set());
      setStatusText(`${list.length}건 조회되었습니다.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "목록 조회에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    setQuery(keyword.trim());
    await loadRows(keyword.trim());
  };

  useEffect(() => {
    void loadRows("");
  }, [loadRows]);

  const openCreate = () => {
    setEditor({ mode: "create", draft: emptyDraft() });
  };

  const openEdit = (row: SystemMenuRecord) => {
    setEditor({ mode: "edit", draft: toDraft(row) });
  };

  const validateDraft = (draft: SystemMenuDraft): string | null => {
    if (draft.menuId.trim().length === 0) {
      return "메뉴 ID는 필수입니다.";
    }
    if (!Number.isFinite(Number(draft.menuId))) {
      return "메뉴 ID는 숫자여야 합니다.";
    }
    if (draft.menuLabel.trim().length === 0) {
      return "메뉴명은 필수입니다.";
    }
    if (draft.seq.trim().length > 0 && !Number.isFinite(Number(draft.seq))) {
      return "정렬 순서는 숫자여야 합니다.";
    }
    if (draft.parentMenuId.trim().length > 0 && !Number.isFinite(Number(draft.parentMenuId))) {
      return "상위 메뉴 ID는 숫자여야 합니다.";
    }
    return null;
  };

  const saveEditor = async () => {
    if (!editor) {
      return;
    }
    const error = validateDraft(editor.draft);
    if (error) {
      setStatusText(error);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "메뉴 등록 중..." : "메뉴 수정 중...");
    try {
      if (editor.mode === "create") {
        await systemMenuApi.create(editor.draft);
      } else {
        await systemMenuApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(query);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "저장에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteByIds = async (menuIds: number[]) => {
    if (menuIds.length === 0) {
      setStatusText("삭제할 행을 선택하세요.");
      return;
    }

    const confirmed = window.confirm(`선택한 메뉴 ${menuIds.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("메뉴 삭제 중...");
    try {
      const result = await systemMenuApi.deleteMany(menuIds);
      setStatusText(`삭제 ${result.succeeded}건, 실패 ${result.failed}건`);
      await loadRows(query);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "삭제에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (menuId: number, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(menuId);
      } else {
        next.delete(menuId);
      }
      return next;
    });
  };

  const toggleAllVisible = (selected: boolean) => {
    if (!selected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(orderedRows.map((row) => row.menuId)));
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>메뉴관리</h2>
          <p className="subtle">메뉴 조회/입력/수정/삭제 화면입니다.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="메뉴명 또는 경로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSearch();
            }
          }}
          className="w-72"
        />
        <Button type="button" variant="outline" onClick={() => void handleSearch()} disabled={isLoading}>
          조회
        </Button>
        <Button type="button" onClick={openCreate} disabled={isSubmitting}>
          입력
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteByIds([...selectedIds])}
          disabled={selectedCount === 0 || isSubmitting}
        >
          선택삭제 ({selectedCount})
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <MenuTable
        rows={orderedRows}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={toggleAllVisible}
        onEdit={openEdit}
        onDelete={(row) => void deleteByIds([row.menuId])}
      />

      {editor && (
        <MenuEditorDialog
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

