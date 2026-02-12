"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [statusText, setStatusText] = useState("외주 인력 계약 데이터를 불러오세요.");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);

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
      const message = error instanceof Error ? error.message : "Failed to save out-manage row.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: OutManageRecord[]) => {
    if (targetRows.length === 0) {
      setStatusText("삭제할 행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`계약 데이터 ${targetRows.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting out-manage rows...");
    try {
      const response = await manageOutManageApi.deleteMany(targetRows.map((row) => ({ sabun: row.sabun, sdate: row.sdate })));
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadRows(page, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete out-manage rows.";
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
          <h2>외주인력 계약 관리</h2>
          <p className="subtle">Outsource contract list/create/update/delete</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Base date (YYYYMMDD)"
          value={filters.sdate}
          onChange={(event) => setFilters((current) => ({ ...current, sdate: event.target.value }))}
          className="w-44"
        />
        <Input
          placeholder="Name"
          value={filters.name}
          onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
          className="w-44"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(0);
            setQuery({ ...filters });
          }}
          disabled={isLoading}
        >조회</Button>
        <Button type="button" onClick={() => setEditor({ mode: "create", draft: emptyDraft() })}>입력</Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteRows(selectedRows)}
          disabled={selectedRows.length === 0 || isSubmitting}
        >선택삭제 ({selectedRows.length})
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.length === rows.length}
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </TableHead>
              <TableHead>사번</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
              <TableHead>총 수량</TableHead>
              <TableHead>서비스 수량</TableHead>
              <TableHead>비고</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const key = rowKey(row);
              return (
                <TableRow key={key}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(event) => toggleOne(key, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{row.sabun}</TableCell>
                  <TableCell>{row.name ?? "-"}</TableCell>
                  <TableCell>{formatYmd(row.sdate)}</TableCell>
                  <TableCell>{formatYmd(row.edate)}</TableCell>
                  <TableCell>{row.totCnt ?? 0}</TableCell>
                  <TableCell>{row.svcCnt ?? 0}</TableCell>
                  <TableCell>{row.note ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditor({ mode: "edit", draft: toDraft(row) })}>수정</Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => void deleteRows([row])}>삭제</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                  조회된 계약 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="pagination">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
          disabled={page === 0 || isLoading}
        >이전</Button>
        <span>
          페이지 {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
          disabled={page >= totalPages - 1 || isLoading}
        >다음</Button>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent aria-label={editor.mode === "create" ? "계약 입력" : "계약 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "계약 입력" : "계약 수정"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Sabun *</Label>
                <Input
                  value={editor.draft.sabun}
                  disabled={editor.mode === "edit"}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, sabun: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Start Date (YYYYMMDD) *</Label>
                <Input
                  value={editor.draft.sdate}
                  disabled={editor.mode === "edit"}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, sdate: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>End Date (YYYYMMDD) *</Label>
                <Input
                  value={editor.draft.edate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, edate: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Total Count</Label>
                <Input
                  value={editor.draft.totCnt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, totCnt: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Service Count</Label>
                <Input
                  value={editor.draft.svcCnt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, svcCnt: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Note</Label>
                <Input
                  value={editor.draft.note}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, note: event.target.value } } : current,
                    )
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>취소</Button>
              <Button type="button" onClick={() => void save()} disabled={isSubmitting}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}



