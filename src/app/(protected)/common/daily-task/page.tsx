"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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

type TaskStatus = "진행전" | "진행중" | "완료";

type DailyTask = {
  id: number;
  taskDate: string;
  category: string;
  company: string;
  project: string;
  summary: string;
  hours: number;
  status: TaskStatus;
  assignee: string;
  note: string;
};

type DraftTask = {
  taskDate: string;
  category: string;
  company: string;
  project: string;
  summary: string;
  hours: string;
  status: TaskStatus;
  assignee: string;
  note: string;
};

const initialRows: DailyTask[] = [
  {
    id: 1,
    taskDate: "2026-02-11",
    category: "개발",
    company: "A고객사",
    project: "차세대 포털",
    summary: "메뉴 트리 API 성능 개선",
    hours: 3.5,
    status: "완료",
    assignee: "김민수",
    note: "캐시 적용 및 테스트 완료",
  },
  {
    id: 2,
    taskDate: "2026-02-12",
    category: "운영",
    company: "B고객사",
    project: "유지보수",
    summary: "장애 로그 분석 및 원인 정리",
    hours: 2,
    status: "진행중",
    assignee: "박지은",
    note: "재현 시나리오 작성 중",
  },
  {
    id: 3,
    taskDate: "2026-02-12",
    category: "회의",
    company: "내부",
    project: "SSMS 마이그레이션",
    summary: "Phase 진행 점검 회의",
    hours: 1,
    status: "진행전",
    assignee: "이준호",
    note: "오후 3시 예정",
  },
];

const emptyDraft = (): DraftTask => ({
  taskDate: new Date().toISOString().slice(0, 10),
  category: "개발",
  company: "",
  project: "",
  summary: "",
  hours: "1",
  status: "진행전",
  assignee: "",
  note: "",
});

const statusVariant: Record<TaskStatus, "secondary" | "success" | "outline"> = {
  진행전: "outline",
  진행중: "secondary",
  완료: "success",
};

const taskStatuses: TaskStatus[] = ["진행전", "진행중", "완료"];

export default function DailyTaskPage() {
  const [rows, setRows] = useState<DailyTask[]>(initialRows);
  const [filters, setFilters] = useState({ from: "", to: "", status: "", keyword: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<DraftTask>(emptyDraft());
  const [statusText, setStatusText] = useState("일일업무 프로토타입 화면입니다.");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filters.from && row.taskDate < filters.from) {
        return false;
      }
      if (filters.to && row.taskDate > filters.to) {
        return false;
      }
      if (filters.status && row.status !== filters.status) {
        return false;
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const merged = `${row.company} ${row.project} ${row.summary} ${row.assignee}`.toLowerCase();
        if (!merged.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }, [filters, rows]);

  const summary = useMemo(() => {
    const totalHours = filtered.reduce((sum, row) => sum + row.hours, 0);
    const doneCount = filtered.filter((row) => row.status === "완료").length;
    const inProgressCount = filtered.filter((row) => row.status === "진행중").length;
    return {
      count: filtered.length,
      totalHours,
      doneCount,
      inProgressCount,
    };
  }, [filtered]);

  const saveDraft = () => {
    if (!draft.company.trim() || !draft.summary.trim() || !draft.assignee.trim()) {
      setStatusText("고객사, 업무 내용, 담당자는 필수입니다.");
      return;
    }
    const parsedHours = Number(draft.hours);
    if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
      setStatusText("소요 시간은 0보다 큰 숫자여야 합니다.");
      return;
    }

    const nextId = rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1;
    const nextRow: DailyTask = {
      id: nextId,
      taskDate: draft.taskDate,
      category: draft.category,
      company: draft.company.trim(),
      project: draft.project.trim(),
      summary: draft.summary.trim(),
      hours: parsedHours,
      status: draft.status,
      assignee: draft.assignee.trim(),
      note: draft.note.trim(),
    };

    setRows((current) => [nextRow, ...current]);
    setDraft(emptyDraft());
    setIsOpen(false);
    setStatusText("일일업무가 등록되었습니다.");
  };

  const changeStatus = (id: number, status: TaskStatus) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    setStatusText(`업무 상태를 ${status}(으)로 변경했습니다.`);
  };

  const deleteRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id));
    setStatusText("업무를 삭제했습니다.");
  };

  const selectClassName =
    "flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>일일업무</h2>
          <p className="subtle">일일업무 등록/조회용 프로토타입 화면입니다.</p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">총 업무 건수</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.count}건</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">총 투입 시간</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.totalHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">진행중</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.inProgressCount}건</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">완료</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.doneCount}건</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          className="w-40"
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          className="w-40"
        />
        <select
          className={selectClassName}
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="">전체 상태</option>
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <Input
          placeholder="고객사/프로젝트/업무/담당자 검색"
          value={filters.keyword}
          onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          className="min-w-[16rem]"
        />
        <Button type="button" onClick={() => setIsOpen(true)}>입력</Button>
      </div>

      <p className="status-text">{statusText}</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>일자</TableHead>
              <TableHead>구분</TableHead>
              <TableHead>고객사</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>업무 내용</TableHead>
              <TableHead>소요시간(h)</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>비고</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-slate-500">
                  조회된 일일업무 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.taskDate}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.company}</TableCell>
                  <TableCell>{row.project || "-"}</TableCell>
                  <TableCell className="max-w-[22rem] break-all">{row.summary}</TableCell>
                  <TableCell>{row.hours.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.assignee}</TableCell>
                  <TableCell className="max-w-[16rem] break-all">{row.note || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        value={row.status}
                        onChange={(event) => changeStatus(row.id, event.target.value as TaskStatus)}
                      >
                        {taskStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button type="button" variant="destructive" size="sm" onClick={() => deleteRow(row.id)}>
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent aria-label="일일업무 입력" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>일일업무 입력</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>일자 *</Label>
              <Input type="date" value={draft.taskDate} onChange={(event) => setDraft((c) => ({ ...c, taskDate: event.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>구분 *</Label>
              <select className={selectClassName} value={draft.category} onChange={(event) => setDraft((c) => ({ ...c, category: event.target.value }))}>
                <option value="개발">개발</option>
                <option value="운영">운영</option>
                <option value="회의">회의</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>고객사 *</Label>
              <Input value={draft.company} onChange={(event) => setDraft((c) => ({ ...c, company: event.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>프로젝트</Label>
              <Input value={draft.project} onChange={(event) => setDraft((c) => ({ ...c, project: event.target.value }))} />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label>업무 내용 *</Label>
              <Input value={draft.summary} onChange={(event) => setDraft((c) => ({ ...c, summary: event.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>소요시간(h) *</Label>
              <Input type="number" step="0.5" min="0.5" value={draft.hours} onChange={(event) => setDraft((c) => ({ ...c, hours: event.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>상태</Label>
              <select className={selectClassName} value={draft.status} onChange={(event) => setDraft((c) => ({ ...c, status: event.target.value as TaskStatus }))}>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>담당자 *</Label>
              <Input value={draft.assignee} onChange={(event) => setDraft((c) => ({ ...c, assignee: event.target.value }))} />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label>비고</Label>
              <Input value={draft.note} onChange={(event) => setDraft((c) => ({ ...c, note: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              취소
            </Button>
            <Button type="button" onClick={saveDraft}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
