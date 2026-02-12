"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [statusText, setStatusText] = useState("Load menu data to begin.");

  const selectedCount = selectedIds.size;
  const orderedRows = useMemo(() => sortRows(rows), [rows]);

  const loadRows = useCallback(async (nextQuery: string) => {
    setIsLoading(true);
    setStatusText("Loading menu list...");
    try {
      const list = await systemMenuApi.list(nextQuery);
      setRows(list);
      setSelectedIds(new Set());
      setStatusText(`Loaded ${list.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load rows.";
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
    setEditor({
      mode: "create",
      draft: emptyDraft(),
    });
  };

  const openEdit = (row: SystemMenuRecord) => {
    setEditor({
      mode: "edit",
      draft: toDraft(row),
    });
  };

  const validateDraft = (draft: SystemMenuDraft): string | null => {
    if (draft.menuId.trim().length === 0) {
      return "Menu ID is required.";
    }
    if (!Number.isFinite(Number(draft.menuId))) {
      return "Menu ID must be numeric.";
    }
    if (draft.menuLabel.trim().length === 0) {
      return "Menu label is required.";
    }
    if (draft.seq.trim().length > 0 && !Number.isFinite(Number(draft.seq))) {
      return "Sequence must be numeric.";
    }
    if (draft.parentMenuId.trim().length > 0 && !Number.isFinite(Number(draft.parentMenuId))) {
      return "Parent menu ID must be numeric.";
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
    setStatusText(editor.mode === "create" ? "Creating menu..." : "Updating menu...");
    try {
      if (editor.mode === "create") {
        await systemMenuApi.create(editor.draft);
      } else {
        await systemMenuApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(query);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteByIds = async (menuIds: number[]) => {
    if (menuIds.length === 0) {
      setStatusText("Select at least one row to delete.");
      return;
    }

    const confirmed = window.confirm(`Delete ${menuIds.length} selected menu rows?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("Deleting selected rows...");
    try {
      const result = await systemMenuApi.deleteMany(menuIds);
      setStatusText(`Deleted ${result.succeeded}, failed ${result.failed}.`);
      await loadRows(query);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Delete에 실패했습니다.";
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

      <div className="toolbar">
        <input
          placeholder="Search by menu label or path"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSearch();
            }
          }}
        />
        <button type="button" className="ghost" onClick={() => void handleSearch()} disabled={isLoading}>조회</button>
        <button type="button" onClick={openCreate} disabled={isSubmitting}>입력</button>
        <button
          type="button"
          className="danger"
          onClick={() => void deleteByIds([...selectedIds])}
          disabled={selectedCount === 0 || isSubmitting}
        >
          선택삭제 ({selectedCount})
        </button>
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

