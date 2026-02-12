"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { manageOutManageApi } from "@/features/manage-out-manage/api";
import type { OutManageDraft, OutManageRecord } from "@/features/manage-out-manage/types";

type OutManageEditorState = {
  mode: "create" | "edit";
  draft: OutManageDraft;
};

const emptyDraft = (): OutManageDraft => ({
  sabun: "",
  sdate: "",
  edate: "",
  totCnt: "",
  svcCnt: "",
  note: "",
  oriSdate: "",
});

const toDraft = (row: OutManageRecord): OutManageDraft => ({
  sabun: row.sabun,
  sdate: row.sdate,
  edate: row.edate,
  totCnt: row.totCnt == null ? "" : String(row.totCnt),
  svcCnt: row.svcCnt == null ? "" : String(row.svcCnt),
  note: row.note ?? "",
  oriSdate: row.sdate,
});

const rowKey = (row: OutManageRecord): string => `${row.sabun}:${row.sdate}`;

const formatYmd = (value: string): string => {
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function ManageOutManagePage() {
  const [filters, setFilters] = useState({ sdate: "", name: "" });
  const [query, setQuery] = useState({ sdate: "", name: "" });
  const [rows, setRows] = useState<OutManageRecord[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<OutManageEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("Load out-manage data to begin.");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(rowKey(row))),
    [rows, selectedKeys],
  );

  const loadRows = useCallback(
    async (nextPage: number, appliedQuery: { sdate: string; name: string }) => {
      setIsLoading(true);
      setStatusText("Loading out-manage list...");
      try {
        const response = await manageOutManageApi.search({
          page: nextPage,
          size,
          sdate: appliedQuery.sdate,
          name: appliedQuery.name,
        });
        setRows(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setSelectedKeys(new Set());
        setStatusText(`Loaded ${response.content?.length ?? 0} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load out-manage rows.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    },
    [size],
  );

  useEffect(() => {
    void loadRows(page, query);
  }, [loadRows, page, query]);

  const validate = (draft: OutManageDraft): string | null => {
    if (!draft.sabun.trim()) {
      return "Sabun is required.";
    }
    if (!draft.sdate.trim()) {
      return "Start date is required.";
    }
    if (!draft.edate.trim()) {
      return "End date is required.";
    }
    if (draft.totCnt.trim() && Number.isNaN(Number(draft.totCnt.trim()))) {
      return "Total count must be numeric.";
    }
    if (draft.svcCnt.trim() && Number.isNaN(Number(draft.svcCnt.trim()))) {
      return "Service count must be numeric.";
    }
    return null;
  };

  const save = async () => {
    if (!editor) {
      return;
    }
    const validation = validate(editor.draft);
    if (validation) {
      setStatusText(validation);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "Creating out-manage row..." : "Updating out-manage row...");
    try {
      const dup = await manageOutManageApi.dupCheck(editor.draft);
      if (dup.dupData?.trim()) {
        setStatusText(`Duplicate period found: ${dup.dupData}`);
        setIsSubmitting(false);
        return;
      }
      if (editor.mode === "create") {
        await manageOutManageApi.create(editor.draft);
      } else {
        await manageOutManageApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(page, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: OutManageRecord[]) => {
    if (targetRows.length === 0) {
      setStatusText("Select at least one row to delete.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targetRows.length} out-manage row(s)?`);
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting out-manage rows...");
    try {
      const response = await manageOutManageApi.deleteMany(
        targetRows.map((row) => ({ sabun: row.sabun, sdate: row.sdate })),
      );
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadRows(page, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (key: string, selected: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(key);
      } else {
        next.delete(key);
      }
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
          <h2>외주인력계약관리</h2>
          <p className="subtle">외주인력 계약 조회/입력/수정/삭제 및 중복검사 화면입니다.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Base date (YYYYMMDD)"
          value={filters.sdate}
          onChange={(event) => setFilters((current) => ({ ...current, sdate: event.target.value }))}
        />
        <input
          placeholder="Name"
          value={filters.name}
          onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
        />
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setPage(0);
            setQuery({ ...filters });
          }}
          disabled={isLoading}
        >조회</button>
        <button type="button" onClick={() => setEditor({ mode: "create", draft: emptyDraft() })}>입력</button>
        <button
          type="button"
          className="danger"
          onClick={() => void deleteRows(selectedRows)}
          disabled={selectedRows.length === 0 || isSubmitting}
        >
          선택삭제 ({selectedRows.length})
        </button>
      </div>

      <p className="status-text">{statusText}</p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.length === rows.length}
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </th>
              <th>Sabun</th>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total Count</th>
              <th>Service Count</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = rowKey(row);
              return (
                <tr key={key}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(event) => toggleOne(key, event.target.checked)}
                    />
                  </td>
                  <td>{row.sabun}</td>
                  <td>{row.name ?? "-"}</td>
                  <td>{formatYmd(row.sdate)}</td>
                  <td>{formatYmd(row.edate)}</td>
                  <td>{row.totCnt ?? 0}</td>
                  <td>{row.svcCnt ?? 0}</td>
                  <td>{row.note ?? "-"}</td>
                  <td className="row-actions">
                    <button type="button" className="ghost" onClick={() => setEditor({ mode: "edit", draft: toDraft(row) })}>수정</button>
                    <button type="button" className="danger" onClick={() => void deleteRows([row])}>삭제</button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-row">
                  No out-manage rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          className="ghost"
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
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
          onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
          disabled={page >= totalPages - 1 || isLoading}
        >
          Next
        </button>
      </div>

      {editor && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{editor.mode === "create" ? "계약 입력" : "계약 수정"}</h3>
            </header>

            <div className="form-grid">
              <label>
                <span>Sabun</span>
                <input
                  value={editor.draft.sabun}
                  disabled={editor.mode === "edit"}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, sabun: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Start Date (YYYYMMDD)</span>
                <input
                  value={editor.draft.sdate}
                  disabled={editor.mode === "edit"}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, sdate: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>End Date (YYYYMMDD)</span>
                <input
                  value={editor.draft.edate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, edate: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Total Count</span>
                <input
                  value={editor.draft.totCnt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, totCnt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Service Count</span>
                <input
                  value={editor.draft.svcCnt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, svcCnt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Note</span>
                <input
                  value={editor.draft.note}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, note: event.target.value } } : current,
                    )
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setEditor(null)}>취소</button>
              <button type="button" onClick={() => void save()} disabled={isSubmitting}>저장</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

