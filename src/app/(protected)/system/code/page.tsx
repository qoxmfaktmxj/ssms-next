"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [statusText, setStatusText] = useState("코드 데이터를 불러오세요.");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);
  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadCodes = useCallback(
    async (nextPage: number, appliedFilters: CodeFilters) => {
      setIsLoading(true);
      setStatusText("코드 목록 조회 중...");
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
        setStatusText(`${response.content?.length ?? 0}건 조회되었습니다.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "코드 목록 조회에 실패했습니다.";
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
    if (!draft.grcodeCd.trim()) return "그룹 코드는 필수입니다.";
    if (!draft.code.trim()) return "코드는 필수입니다.";
    if (!draft.codeNm.trim()) return "코드명은 필수입니다.";
    if (draft.seq.trim() && Number.isNaN(Number(draft.seq))) return "정렬 순서는 숫자여야 합니다.";
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
    setStatusText(editor.mode === "create" ? "코드 등록 중..." : "코드 수정 중...");
    try {
      if (editor.mode === "create") {
        await systemCodeApi.create(editor.draft);
      } else {
        await systemCodeApi.update(editor.draft);
      }
      setEditor(null);
      await loadCodes(page, query);
    } catch (error) {
      const failMessage = error instanceof Error ? error.message : "저장에 실패했습니다.";
      setStatusText(failMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: SystemCode[]) => {
    if (targetRows.length === 0) {
      setStatusText("삭제할 코드를 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`${targetRows.length}건의 코드를 삭제할까요?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    setStatusText("코드 삭제 중...");
    try {
      const response = await systemCodeApi.deleteMany(targetRows.map((row) => ({ grcodeCd: row.grcodeCd, code: row.code })));
      setStatusText(`삭제 ${response.succeeded}건, 실패 ${response.failed}건`);
      await loadCodes(page, query);
    } catch (error) {
      const failMessage = error instanceof Error ? error.message : "삭제에 실패했습니다.";
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
          <h2>공통코드관리</h2>
          <p className="subtle">공통코드 조회/입력/수정/삭제 화면입니다.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="그룹 코드"
          value={filters.grcodeCd}
          onChange={(event) => setFilters((prev) => ({ ...prev, grcodeCd: event.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="코드"
          value={filters.code}
          onChange={(event) => setFilters((prev) => ({ ...prev, code: event.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="코드명"
          value={filters.codeNm}
          onChange={(event) => setFilters((prev) => ({ ...prev, codeNm: event.target.value }))}
          className="w-52"
        />
        <Button type="button" variant="outline" onClick={onSearch} disabled={isLoading}>
          조회
        </Button>
        <Button type="button" onClick={openCreate} disabled={isSubmitting}>
          입력
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteRows(selectedRows)}
          disabled={selectedRows.length === 0 || isSubmitting}
        >
          선택삭제 ({selectedRows.length})
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              const result = await systemCodeApi.refreshCache();
              setStatusText(result.message);
            } catch (error) {
              const failMessage = error instanceof Error ? error.message : "캐시 초기화에 실패했습니다.";
              setStatusText(failMessage);
            }
          }}
        >
          캐시 새로고침
        </Button>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextPage = Math.max(page - 1, 0);
            setPage(nextPage);
            void loadCodes(nextPage, query);
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
            void loadCodes(nextPage, query);
          }}
          disabled={page >= totalPages - 1 || isLoading}
        >다음</Button>
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


