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
import { developManagementApi } from "@/features/develop-management/api";
import type { DevelopManagement, DevelopManagementDraft, DevelopManagementFilters } from "@/features/develop-management/types";
import { manageCompanyApi } from "@/features/manage-company/api";
import type { ManageCompany } from "@/features/manage-company/types";

type EditorState = {
  mode: "create" | "edit";
  draft: DevelopManagementDraft;
};

const statusOptions = [
  { value: "", label: "All" },
  { value: "10", label: "Requested" },
  { value: "20", label: "On Hold (Requested)" },
  { value: "30", label: "Defined" },
  { value: "40", label: "On Hold (Defined)" },
  { value: "50", label: "In Progress" },
  { value: "60", label: "On Hold (Progress)" },
  { value: "70", label: "In QA" },
  { value: "80", label: "On Hold (QA)" },
  { value: "90", label: "Ready" },
  { value: "100", label: "Done" },
];

const emptyDraft = (): DevelopManagementDraft => ({
  requestCompanyCd: "",
  requestYm: "",
  requestSeq: "",
  statusCd: "",
  requestNm: "",
  requestContent: "",
  managerSabun: "",
  developerSabun: "",
  outsideYn: "",
  paidYn: "Y",
  paidContent: "",
  taxBillYn: "Y",
  startYm: "",
  endYm: "",
  paidMm: "",
  realMm: "",
  content: "",
  sdate: "",
  edate: "",
  partCd: "",
});

const toDraft = (row: DevelopManagement): DevelopManagementDraft => ({
  requestCompanyCd: row.requestCompanyCd,
  requestYm: row.requestYm,
  requestSeq: String(row.requestSeq),
  statusCd: row.statusCd ?? "",
  requestNm: row.requestNm ?? "",
  requestContent: row.requestContent ?? "",
  managerSabun: row.managerSabun ?? "",
  developerSabun: row.developerSabun ?? "",
  outsideYn: row.outsideYn ?? "",
  paidYn: row.paidYn ?? "",
  paidContent: row.paidContent ?? "",
  taxBillYn: row.taxBillYn ?? "",
  startYm: row.startYm ?? "",
  endYm: row.endYm ?? "",
  paidMm: row.paidMm == null ? "" : String(row.paidMm),
  realMm: row.realMm == null ? "" : String(row.realMm),
  content: row.content ?? "",
  sdate: row.sdate ?? "",
  edate: row.edate ?? "",
  partCd: row.partCd ?? "",
});

const rowKey = (row: DevelopManagement): string => `${row.requestCompanyCd}:${row.requestYm}:${row.requestSeq}`;

const formatYm = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 6) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
};

export default function DevelopManagementPage() {
  const [filters, setFilters] = useState<Omit<DevelopManagementFilters, "page" | "size">>({
    companyName: "",
    startDate: "",
    endDate: "",
    statusCd: "",
    mngName: "",
  });
  const [query, setQuery] = useState<Omit<DevelopManagementFilters, "page" | "size">>({
    companyName: "",
    startDate: "",
    endDate: "",
    statusCd: "",
    mngName: "",
  });
  const [rows, setRows] = useState<DevelopManagement[]>([]);
  const [rows2, setRows2] = useState<DevelopManagement[]>([]);
  const [companies, setCompanies] = useState<ManageCompany[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("관리 데이터를 불러오세요.");
  const [page, setPage] = useState(0);
  const [page2, setPage2] = useState(0);
  const [size] = useState(20);
  const [size2] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalElements2, setTotalElements2] = useState(0);

  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);
  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);
  const totalPages2 = useMemo(() => Math.max(Math.ceil(totalElements2 / size2), 1), [size2, totalElements2]);

  const loadRows = useCallback(
    async (nextPage: number, nextPage2: number, nextQuery: Omit<DevelopManagementFilters, "page" | "size">) => {
      setIsLoading(true);
      setStatusText("Loading management lists...");
      try {
        const common = {
          companyName: nextQuery.companyName,
          startDate: nextQuery.startDate,
          endDate: nextQuery.endDate,
          statusCd: nextQuery.statusCd,
          mngName: nextQuery.mngName,
        };
        const [response, response2] = await Promise.all([
          developManagementApi.list({ ...common, page: nextPage, size }),
          developManagementApi.list2({ ...common, page: nextPage2, size: size2 }),
        ]);
        setRows(response.content ?? []);
        setRows2(response2.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setTotalElements2(response2.totalElements ?? 0);
        setSelectedKeys(new Set());
        setStatusText(`Loaded table1=${response.content?.length ?? 0}, table2=${response2.content?.length ?? 0} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load management lists.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    },
    [size, size2],
  );

  useEffect(() => {
    void loadRows(page, page2, query);
  }, [loadRows, page, page2, query]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await manageCompanyApi.listAll();
        setCompanies(response);
      } catch {
        // keep page usable
      }
    };
    void loadCompanies();
  }, []);

  const validate = (draft: DevelopManagementDraft): string | null => {
    if (!draft.requestCompanyCd.trim()) {
      return "Company is required.";
    }
    if (!draft.requestYm.trim()) {
      return "Request YM is required.";
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
    setStatusText(editor.mode === "create" ? "Creating management row..." : "Updating management row...");
    try {
      if (editor.mode === "create") {
        await developManagementApi.create(editor.draft);
      } else {
        await developManagementApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(page, page2, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save management row.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targets: DevelopManagement[]) => {
    if (targets.length === 0) {
      setStatusText("행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`관리 데이터 ${targets.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting management rows...");
    try {
      const response = await developManagementApi.deleteMany(
        targets.map((row) => ({
          requestCompanyCd: row.requestCompanyCd,
          requestYm: row.requestYm,
          requestSeq: row.requestSeq,
        })),
      );
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadRows(page, page2, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete management rows.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (key: string, checked: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys(new Set(rows.map((row) => rowKey(row))));
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>추가개발 관리</h2>
          <p className="subtle">List 1 / List 2 and CRUD</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Company code/name"
          value={filters.companyName}
          onChange={(event) => setFilters((current) => ({ ...current, companyName: event.target.value }))}
          className="w-52"
        />
        <Input
          placeholder="Start YM (YYYYMM)"
          value={filters.startDate}
          onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="End YM (YYYYMM)"
          value={filters.endDate}
          onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          className="w-40"
        />
        <select
          className={selectClassName}
          value={filters.statusCd}
          onChange={(event) => setFilters((current) => ({ ...current, statusCd: event.target.value }))}
        >
          {statusOptions.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Manager/requester name"
          value={filters.mngName}
          onChange={(event) => setFilters((current) => ({ ...current, mngName: event.target.value }))}
          className="w-52"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(0);
            setPage2(0);
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

      <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">List 1</h3>
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
              <TableHead>고객사</TableHead>
              <TableHead>요청년월</TableHead>
              <TableHead>순번</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>요청자</TableHead>
              <TableHead>기간</TableHead>
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
                  <TableCell>{row.requestCompanyNm ?? row.requestCompanyCd}</TableCell>
                  <TableCell>{formatYm(row.requestYm)}</TableCell>
                  <TableCell>{row.requestSeq}</TableCell>
                  <TableCell>{row.statusCd ?? "-"}</TableCell>
                  <TableCell>{row.partNm ?? row.partCd ?? "-"}</TableCell>
                  <TableCell>{row.requestNm ?? "-"}</TableCell>
                  <TableCell>
                    {formatYm(row.startYm)} ~ {formatYm(row.endYm)}
                  </TableCell>
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
                  조회된 관리 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="pagination">
        <Button type="button" variant="outline" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0 || isLoading}>이전</Button>
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

      <h3 className="mt-8 mb-2 text-sm font-semibold text-slate-700">List 2</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>고객사</TableHead>
              <TableHead>요청년월</TableHead>
              <TableHead>순번</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>요청자</TableHead>
              <TableHead>기간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows2.map((row) => (
              <TableRow key={`${rowKey(row)}:list2`}>
                <TableCell>{row.requestCompanyNm ?? row.requestCompanyCd}</TableCell>
                <TableCell>{formatYm(row.requestYm)}</TableCell>
                <TableCell>{row.requestSeq}</TableCell>
                <TableCell>{row.statusCd ?? "-"}</TableCell>
                <TableCell>{row.partNm ?? row.partCd ?? "-"}</TableCell>
                <TableCell>{row.requestNm ?? "-"}</TableCell>
                <TableCell>
                  {formatYm(row.startYm)} ~ {formatYm(row.endYm)}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows2.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  조회된 목록2 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="pagination">
        <Button type="button" variant="outline" onClick={() => setPage2((current) => Math.max(current - 1, 0))} disabled={page2 === 0 || isLoading}>이전</Button>
        <span>
          페이지 {page2 + 1} / {totalPages2}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPage2((current) => Math.min(current + 1, totalPages2 - 1))}
          disabled={page2 >= totalPages2 - 1 || isLoading}
        >다음</Button>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent className="max-w-5xl" aria-label={editor.mode === "create" ? "관리 입력" : "관리 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "관리 입력" : "관리 수정"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Company *</Label>
                <select
                  className={selectClassName}
                  value={editor.draft.requestCompanyCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              requestCompanyCd: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                >
                  <option value="">회사 선택</option>
                  {companies.map((company) => (
                    <option key={company.companyCd} value={company.companyCd}>
                      {company.companyCd} - {company.companyNm}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Request YM (YYYYMM) *</Label>
                <Input
                  value={editor.draft.requestYm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestYm: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Request Seq</Label>
                <Input
                  value={editor.draft.requestSeq}
                  placeholder="Leave blank to auto-generate"
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestSeq: event.target.value } } : current,
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
                  {statusOptions.map((item) => (
                    <option key={item.value || "all"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Requester Name</Label>
                <Input
                  value={editor.draft.requestNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestNm: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Request Content</Label>
                <Input
                  value={editor.draft.requestContent}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, requestContent: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Manager Sabun</Label>
                <Input
                  value={editor.draft.managerSabun}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, managerSabun: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Developer Sabun</Label>
                <Input
                  value={editor.draft.developerSabun}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, developerSabun: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Start YM</Label>
                <Input
                  value={editor.draft.startYm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, startYm: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>End YM</Label>
                <Input
                  value={editor.draft.endYm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, endYm: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Part Code</Label>
                <Input
                  value={editor.draft.partCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, partCd: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Real MM</Label>
                <Input
                  value={editor.draft.realMm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, realMm: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Paid MM</Label>
                <Input
                  value={editor.draft.paidMm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, paidMm: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Detail Content</Label>
                <Input
                  value={editor.draft.content}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, content: event.target.value } } : current,
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


