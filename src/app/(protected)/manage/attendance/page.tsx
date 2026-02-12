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
import { useAuth } from "@/features/auth/auth-context";
import { manageAttendanceApi } from "@/features/manage-attendance/api";
import type { AttendanceDraft, AttendanceRecord, CodeOption } from "@/features/manage-attendance/types";

type AttendanceEditorState = {
  mode: "create" | "edit";
  draft: AttendanceDraft;
};

const todayYmd = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");

const emptyDraft = (sabun = ""): AttendanceDraft => {
  const today = todayYmd();
  return {
    id: null,
    sabun,
    sdate: today,
    edate: today,
    gntCd: "",
    statusCd: "",
    note: "",
    applyDate: today,
  };
};

const toDraft = (row: AttendanceRecord): AttendanceDraft => ({
  id: row.id,
  sabun: row.sabun,
  sdate: row.sdate,
  edate: row.edate,
  gntCd: row.gntCd ?? "",
  statusCd: row.statusCd ?? "",
  note: row.note ?? "",
  applyDate: row.applyDate ?? row.sdate,
});

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

const rowKey = (row: AttendanceRecord): string => `${row.id}:${row.sabun}`;

export default function ManageAttendancePage() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [gntCodes, setGntCodes] = useState<CodeOption[]>([]);
  const [statusCodes, setStatusCodes] = useState<CodeOption[]>([]);
  const [editor, setEditor] = useState<AttendanceEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("근태 데이터를 불러오세요.");

  const visibleRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) => {
      const text = `${row.sabun} ${row.name ?? ""} ${row.orgNm ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [keyword, rows]);

  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.has(row.id)), [rows, selectedIds]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setStatusText("Loading attendance list...");
    try {
      const [attendanceRows, gnt, status] = await Promise.all([
        manageAttendanceApi.list(),
        manageAttendanceApi.listCode("GNT_CD"),
        manageAttendanceApi.listCode("STATUS_CD"),
      ]);
      setRows(attendanceRows);
      setGntCodes(gnt);
      setStatusCodes(status);
      setSelectedIds(new Set());
      setStatusText(`Loaded ${attendanceRows.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load attendance data.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const validate = (draft: AttendanceDraft): string | null => {
    if (!draft.sabun.trim()) {
      return "Sabun is required.";
    }
    if (!draft.sdate.trim()) {
      return "Start date is required.";
    }
    if (!draft.edate.trim()) {
      return "End date is required.";
    }
    return null;
  };

  const save = async () => {
    if (!editor) {
      return;
    }
    const error = validate(editor.draft);
    if (error) {
      setStatusText(error);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "Creating attendance..." : "Updating attendance...");
    try {
      if (editor.mode === "create") {
        await manageAttendanceApi.create(editor.draft);
      } else {
        await manageAttendanceApi.update(editor.draft);
      }
      setEditor(null);
      await load();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save attendance.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: AttendanceRecord[]) => {
    if (targetRows.length === 0) {
      setStatusText("근태 행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`근태 데이터 ${targetRows.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("Deleting attendance rows...");
    try {
      let succeeded = 0;
      let failed = 0;
      for (const row of targetRows) {
        try {
          await manageAttendanceApi.deleteOne(row.id, row.sabun);
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }
      setStatusText(`Deleted ${succeeded}, failed ${failed}.`);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete attendance rows.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (id: number, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleAllVisible = (selected: boolean) => {
    if (!selected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleRows.map((row) => row.id)));
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>외주인력 일정 관리</h2>
          <p className="subtle">Attendance list/create/update/delete</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Filter by sabun, name, org"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="w-72"
        />
        <Button type="button" variant="outline" onClick={() => void load()} disabled={isLoading}>
          Refresh
        </Button>
        <Button type="button" onClick={() => setEditor({ mode: "create", draft: emptyDraft(user?.sabun ?? "") })}>입력</Button>
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
                  checked={visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id))}
                  onChange={(event) => toggleAllVisible(event.target.checked)}
                />
              </TableHead>
              <TableHead>사번</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>적용일</TableHead>
              <TableHead>조직</TableHead>
              <TableHead>비고</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={rowKey(row)}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={(event) => toggleOne(row.id, event.target.checked)}
                  />
                </TableCell>
                <TableCell>{row.sabun}</TableCell>
                <TableCell>{row.name ?? "-"}</TableCell>
                <TableCell>{formatYmd(row.sdate)}</TableCell>
                <TableCell>{formatYmd(row.edate)}</TableCell>
                <TableCell>{row.gntCdName ?? row.gntCd ?? "-"}</TableCell>
                <TableCell>{row.statusCdName ?? row.statusCd ?? "-"}</TableCell>
                <TableCell>{formatYmd(row.applyDate)}</TableCell>
                <TableCell>{row.orgNm ?? "-"}</TableCell>
                <TableCell>{row.note ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditor({ mode: "edit", draft: toDraft(row) })}>수정</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => void deleteRows([row])}>삭제</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-slate-500">
                  조회된 근태 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent aria-label={editor.mode === "create" ? "근태 입력" : "근태 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "근태 입력" : "근태 수정"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Sabun *</Label>
                <Input
                  value={editor.draft.sabun}
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
                <Label>Type</Label>
                <select
                  className={selectClassName}
                  value={editor.draft.gntCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, gntCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">유형 선택</option>
                  {gntCodes.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.codeNm}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <select
                  className={selectClassName}
                  value={editor.draft.statusCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, statusCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">상태 선택</option>
                  {statusCodes.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.codeNm}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Apply Date (YYYYMMDD)</Label>
                <Input
                  value={editor.draft.applyDate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, applyDate: event.target.value } } : current,
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



