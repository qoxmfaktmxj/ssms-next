"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CodeEditorDialog } from "@/features/system-code/code-editor-dialog";
import { CodeTable } from "@/features/system-code/code-table";
import { systemCodeApi } from "@/features/system-code/api";
import type { CodeDraft, CodeEditorState, SystemCode } from "@/features/system-code/types";

type CodeFilters = {
  grcodeCd: string;
  code: string;
  codeNm: string;
};

const emptyDraft = (): CodeDraft => ({
  grcodeCd: "",
  code: "",
  codeNm: "",
  codeEngNm: "",
  seq: "",
  useYn: "Y",
  note1: "",
  note2: "",
  note3: "",
  note4: "",
  numNote: "",
  erpCode: "",
});

const toDraft = (row: SystemCode): CodeDraft => ({
  grcodeCd: row.grcodeCd,
  code: row.code,
  codeNm: row.codeNm,
  codeEngNm: row.codeEngNm ?? "",
  seq: row.seq == null ? "" : String(row.seq),
  useYn: row.useYn,
  note1: row.note1 ?? "",
  note2: row.note2 ?? "",
  note3: row.note3 ?? "",
  note4: row.note4 ?? "",
  numNote: row.numNote ?? "",
  erpCode: row.erpCode ?? "",
});

const rowKey = (row: SystemCode) => `${row.grcodeCd}:${row.code}`;

export default function SystemCodePage() {
  const [filters, setFilters] = useState<CodeFilters>({ grcodeCd: "", code: "", codeNm: "" });
  const [query, setQuery] = useState<CodeFilters>({ grcodeCd: "", code: "", codeNm: "" });
  const [rows, setRows] = useState<SystemCode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<CodeEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("Load code data to begin.");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(rowKey(row))),
    [rows, selectedKeys],
  );
  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadCodes = useCallback(
    async (nextPage: number, appliedFilters: CodeFilters) => {
      setIsLoading(true);
      setStatusText("Loading code list...");
      try {
        const response = await systemCodeApi.search({
          page: nextPage,
          size,
          grcodeCd: appliedFilters.grcodeCd,
          code: appliedFilters.code,
          codeNm: appliedFilters.codeNm,
        });
        setRows(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setSelectedKeys(new Set());
        setStatusText(`Loaded ${response.content?.length ?? 0} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load code list.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    },
    [size],
  );

  useEffect(() => {
    void loadCodes(0, query);
  }, [loadCodes, query]);

  const onSearch = () => {
    setPage(0);
    setQuery({ ...filters });
  };

  const openCreate = () => {
    setEditor({ mode: "create", draft: emptyDraft() });
  };

  const openEdit = (row: SystemCode) => {
    setEditor({ mode: "edit", draft: toDraft(row) });
  };

  const validateDraft = (draft: CodeDraft): string | null => {
    if (!draft.grcodeCd.trim()) return "Group code is required.";
    if (!draft.code.trim()) return "Code is required.";
    if (!draft.codeNm.trim()) return "Code name is required.";
    if (draft.seq.trim() && Number.isNaN(Number(draft.seq))) return "Sequence must be numeric.";
    return null;
  };

  const onSave = async () => {
    if (!editor) return;
    const message = validateDraft(editor.draft);
    if (message) {
      setStatusText(message);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "Creating code..." : "Updating code...");
    try {
      if (editor.mode === "create") {
        await systemCodeApi.create(editor.draft);
      } else {
        await systemCodeApi.update(editor.draft);
      }
      setEditor(null);
      await loadCodes(page, query);
    } catch (error) {
      const failMessage = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(failMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: SystemCode[]) => {
    if (targetRows.length === 0) {
      setStatusText("Select at least one code row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targetRows.length} code row(s)?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatusText("Deleting code rows...");
    try {
      const response = await systemCodeApi.deleteMany(
        targetRows.map((row) => ({ grcodeCd: row.grcodeCd, code: row.code })),
      );
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadCodes(page, query);
    } catch (error) {
      const failMessage = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(failMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (key: string, selected: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (selected) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleAll = (selected: boolean) => {
    if (!selected) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys(new Set(rows.map((row) => rowKey(row))));
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>System Code</h2>
          <p className="subtle">Phase 2 slice: common code search/create/update/delete.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Group code"
          value={filters.grcodeCd}
          onChange={(event) => setFilters((prev) => ({ ...prev, grcodeCd: event.target.value }))}
        />
        <input
          placeholder="Code"
          value={filters.code}
          onChange={(event) => setFilters((prev) => ({ ...prev, code: event.target.value }))}
        />
        <input
          placeholder="Code name"
          value={filters.codeNm}
          onChange={(event) => setFilters((prev) => ({ ...prev, codeNm: event.target.value }))}
        />
        <button type="button" className="ghost" onClick={onSearch} disabled={isLoading}>
          Search
        </button>
        <button type="button" onClick={openCreate} disabled={isSubmitting}>
          Create
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => void deleteRows(selectedRows)}
          disabled={selectedRows.length === 0 || isSubmitting}
        >
          Delete Selected ({selectedRows.length})
        </button>
        <button
          type="button"
          className="ghost"
          onClick={async () => {
            try {
              const result = await systemCodeApi.refreshCache();
              setStatusText(result.message);
            } catch (error) {
              const failMessage = error instanceof Error ? error.message : "Refresh failed.";
              setStatusText(failMessage);
            }
          }}
        >
          Refresh Cache
        </button>
      </div>

      <p className="status-text">{statusText}</p>

      <CodeTable
        rows={rows}
        selectedKeys={selectedKeys}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
        onEdit={openEdit}
        onDelete={(row) => void deleteRows([row])}
      />

      <div className="pagination">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const nextPage = Math.max(page - 1, 0);
            setPage(nextPage);
            void loadCodes(nextPage, query);
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
            void loadCodes(nextPage, query);
          }}
          disabled={page >= totalPages - 1 || isLoading}
        >
          Next
        </button>
      </div>

      {editor && (
        <CodeEditorDialog
          state={editor}
          onChange={(nextDraft) => {
            setEditor((current) => (current ? { ...current, draft: nextDraft } : current));
          }}
          onCancel={() => setEditor(null)}
          onSubmit={onSave}
          isSubmitting={isSubmitting}
        />
      )}
    </section>
  );
}

