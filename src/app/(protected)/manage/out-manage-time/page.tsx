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
import { manageOutManageTimeApi } from "@/features/manage-out-manage-time/api";
import type {
  OutManageCodeOption,
  OutManageTimeDetail,
  OutManageTimeDetailDraft,
  OutManageTimeSummary,
} from "@/features/manage-out-manage-time/types";
import { cn } from "@/lib/utils";

type DetailEditorState = {
  mode: "create" | "edit";
  draft: OutManageTimeDetailDraft;
};

const todayYmd = (): string => new Date().toISOString().slice(0, 10).replaceAll("-", "");

const emptyDetailDraft = (sabun: string, sdate: string, edate: string): OutManageTimeDetailDraft => ({
  id: null,
  sabun,
  gntCd: "",
  applyDate: todayYmd(),
  statusCd: "",
  sdate,
  edate,
  applyCnt: "",
  note: "",
});

const toDetailDraft = (row: OutManageTimeDetail): OutManageTimeDetailDraft => ({
  id: row.id,
  sabun: row.sabun,
  gntCd: row.gntCd ?? "",
  applyDate: row.applyDate ?? row.sdate,
  statusCd: row.statusCd ?? "",
  sdate: row.sdate,
  edate: row.edate,
  applyCnt: row.applyCnt == null ? "" : String(row.applyCnt),
  note: row.note ?? "",
});

const summaryKey = (row: OutManageTimeSummary): string => `${row.sabun}:${row.sdate}:${row.edate}`;

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function ManageOutManageTimePage() {
  const [searchYmd, setSearchYmd] = useState("");
  const [searchName, setSearchName] = useState("");
  const [summaryRows, setSummaryRows] = useState<OutManageTimeSummary[]>([]);
  const [selectedSummaryKey, setSelectedSummaryKey] = useState<string | null>(null);
  const [detailRows, setDetailRows] = useState<OutManageTimeDetail[]>([]);
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<number>>(new Set());
  const [gntCodes, setGntCodes] = useState<OutManageCodeOption[]>([]);
  const [statusCodes, setStatusCodes] = useState<OutManageCodeOption[]>([]);
  const [editor, setEditor] = useState<DetailEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("외주 인력 근태 데이터를 불러오세요.");

  const selectedSummary = useMemo(
    () => summaryRows.find((row) => summaryKey(row) === selectedSummaryKey) ?? null,
    [selectedSummaryKey, summaryRows],
  );

  const selectedDetailRows = useMemo(() => detailRows.filter((row) => selectedDetailIds.has(row.id)), [detailRows, selectedDetailIds]);

  const loadCodes = useCallback(async () => {
    try {
      const [gnt, status] = await Promise.all([
        manageOutManageTimeApi.listCode("GNT_CD"),
        manageOutManageTimeApi.listCode("STATUS_CD"),
      ]);
      setGntCodes(gnt);
      setStatusCodes(status);
    } catch {
      // Keep page usable even if code lookup fails.
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setStatusText("Loading out-manage-time summary...");
    try {
      const response = await manageOutManageTimeApi.listSummary(searchYmd, searchName);
      const rows = response.content ?? [];
      setSummaryRows(rows);
      if (rows.length === 0) {
        setSelectedSummaryKey(null);
        setDetailRows([]);
        setSelectedDetailIds(new Set());
        setStatusText("조회된 요약 데이터가 없습니다.");
      } else {
        const first = rows[0];
        setSelectedSummaryKey(summaryKey(first));
        setStatusText(`Loaded ${rows.length} summary rows.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load out-manage-time summary.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, [searchName, searchYmd]);

  const loadDetail = useCallback(async (summary: OutManageTimeSummary) => {
    setIsLoading(true);
    setStatusText("Loading detail rows...");
    try {
      const response = await manageOutManageTimeApi.listDetail(summary.sabun, summary.sdate, summary.edate);
      setDetailRows(response.content ?? []);
      setSelectedDetailIds(new Set());
      setStatusText(`Loaded ${response.content?.length ?? 0} detail rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load detail rows.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCodes();
    void loadSummary();
  }, [loadCodes, loadSummary]);

  useEffect(() => {
    if (!selectedSummary) {
      return;
    }
    void loadDetail(selectedSummary);
  }, [loadDetail, selectedSummary]);

  const validateDraft = (draft: OutManageTimeDetailDraft): string | null => {
    if (!draft.sabun.trim()) {
      return "Sabun is required.";
    }
    if (!draft.sdate.trim()) {
      return "Start date is required.";
    }
    if (!draft.edate.trim()) {
      return "End date is required.";
    }
    if (draft.applyCnt.trim() && Number.isNaN(Number(draft.applyCnt.trim()))) {
      return "Apply count must be numeric.";
    }
    return null;
  };

  const saveDetail = async () => {
    if (!editor) {
      return;
    }
    const validation = validateDraft(editor.draft);
    if (validation) {
      setStatusText(validation);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "Creating detail row..." : "Updating detail row...");
    try {
      await manageOutManageTimeApi.saveDetail(editor.draft);
      setEditor(null);
      if (selectedSummary) {
        await loadDetail(selectedSummary);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save detail row.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDetailRows = async (rowsToDelete: OutManageTimeDetail[]) => {
    if (rowsToDelete.length === 0) {
      setStatusText("삭제할 상세 행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`상세 데이터 ${rowsToDelete.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("Deleting detail rows...");
    try {
      const deleted = await manageOutManageTimeApi.deleteDetails(rowsToDelete.map((row) => ({ id: row.id, sabun: row.sabun })));
      setStatusText(deleted ? "삭제되었습니다." : "삭제 처리 결과 변경된 데이터가 없습니다.");
      if (selectedSummary) {
        await loadDetail(selectedSummary);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete detail rows.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDetail = (id: number, selected: boolean) => {
    setSelectedDetailIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>외주인력 근태 관리</h2>
          <p className="subtle">Summary and detail management</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="조회일 (YYYYMMDD)"
          value={searchYmd}
          onChange={(event) => setSearchYmd(event.target.value)}
          className="w-44"
        />
        <Input
          placeholder="이름 조회"
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
          className="w-44"
        />
        <Button type="button" variant="outline" onClick={() => void loadSummary()} disabled={isLoading}>조회</Button>
        <Button
          type="button"
          onClick={() => {
            if (!selectedSummary) {
              setStatusText("요약 행을 먼저 선택하세요.");
              return;
            }
            setEditor({
              mode: "create",
              draft: emptyDetailDraft(selectedSummary.sabun, selectedSummary.sdate, selectedSummary.edate),
            });
          }}
          disabled={!selectedSummary}
        >
          Add Detail
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteDetailRows(selectedDetailRows)}
          disabled={selectedDetailRows.length === 0 || isSubmitting}
        >선택삭제 ({selectedDetailRows.length})
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Summary</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>사번</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
              <TableHead>총계</TableHead>
              <TableHead>사용</TableHead>
              <TableHead>잔여</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryRows.map((row) => {
              const key = summaryKey(row);
              const isSelected = key === selectedSummaryKey;
              return (
                <TableRow
                  key={key}
                  className={cn(isSelected ? "bg-blue-50 hover:bg-blue-50" : "")}
                  onClick={() => setSelectedSummaryKey(key)}
                >
                  <TableCell>{row.sabun}</TableCell>
                  <TableCell>{row.name ?? "-"}</TableCell>
                  <TableCell>{formatYmd(row.sdate)}</TableCell>
                  <TableCell>{formatYmd(row.edate)}</TableCell>
                  <TableCell>{row.totalCnt ?? 0}</TableCell>
                  <TableCell>{row.useCnt ?? 0}</TableCell>
                  <TableCell>{row.remainCnt ?? 0}</TableCell>
                  <TableCell>{row.note ?? "-"}</TableCell>
                </TableRow>
              );
            })}
            {!isLoading && summaryRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                  조회된 요약 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <h3 className="mt-8 mb-2 text-sm font-semibold text-slate-700">Detail</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead />
              <TableHead>사번</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>적용일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
              <TableHead>적용 수량</TableHead>
              <TableHead>비고</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedDetailIds.has(row.id)}
                    onChange={(event) => toggleDetail(row.id, event.target.checked)}
                  />
                </TableCell>
                <TableCell>{row.sabun}</TableCell>
                <TableCell>{row.gntName ?? row.gntCd ?? "-"}</TableCell>
                <TableCell>{formatYmd(row.applyDate)}</TableCell>
                <TableCell>{row.statusName ?? row.statusCd ?? "-"}</TableCell>
                <TableCell>{formatYmd(row.sdate)}</TableCell>
                <TableCell>{formatYmd(row.edate)}</TableCell>
                <TableCell>{row.applyCnt ?? 0}</TableCell>
                <TableCell>{row.note ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditor({ mode: "edit", draft: toDetailDraft(row) })}>수정</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => void deleteDetailRows([row])}>삭제</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && detailRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-slate-500">
                  조회된 상세 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent aria-label={editor.mode === "create" ? "상세 입력" : "상세 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "상세 입력" : "상세 수정"}</DialogTitle>
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
                <Label>Start Date (YYYYMMDD)</Label>
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
                <Label>End Date (YYYYMMDD)</Label>
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
                <Label>Apply Count</Label>
                <Input
                  value={editor.draft.applyCnt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, applyCnt: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
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
              <Button type="button" onClick={() => void saveDetail()} disabled={isSubmitting}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}



