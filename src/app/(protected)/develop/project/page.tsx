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
import { developProjectApi } from "@/features/develop-project/api";
import type { DevelopProject, DevelopProjectDraft } from "@/features/develop-project/types";
import { manageCompanyApi } from "@/features/manage-company/api";
import type { ManageCompany } from "@/features/manage-company/types";

type EditorState = {
  mode: "create" | "edit";
  draft: DevelopProjectDraft;
};

const emptyDraft = (): DevelopProjectDraft => ({
  projectId: null,
  projectNm: "",
  requestCompanyCd: "",
  partCd: "",
  inputManPower: "",
  contractStdDt: "",
  contractEndDt: "",
  developStdDt: "",
  developEndDt: "",
  inspectionYn: "",
  taxBillYn: "",
  realMm: "",
  contractPrice: "",
  fileSeq: "",
  remark: "",
});

const toDraft = (row: DevelopProject): DevelopProjectDraft => ({
  projectId: row.projectId,
  projectNm: row.projectNm,
  requestCompanyCd: row.requestCompanyCd,
  partCd: row.partCd ?? "",
  inputManPower: row.inputManPower ?? "",
  contractStdDt: row.contractStdDt ?? "",
  contractEndDt: row.contractEndDt ?? "",
  developStdDt: row.developStdDt ?? "",
  developEndDt: row.developEndDt ?? "",
  inspectionYn: row.inspectionYn ?? "",
  taxBillYn: row.taxBillYn ?? "",
  realMm: row.realMm == null ? "" : String(row.realMm),
  contractPrice: row.contractPrice == null ? "" : String(row.contractPrice),
  fileSeq: row.fileSeq ?? "",
  remark: row.remark ?? "",
});

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length === 6) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
  }
  if (value.length === 8) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
};

const rowKey = (row: DevelopProject): string => String(row.projectId);

export default function DevelopProjectPage() {
  const [filters, setFilters] = useState({ keyword: "", startDate: "", endDate: "" });
  const [query, setQuery] = useState({ keyword: "", startDate: "", endDate: "" });
  const [rows, setRows] = useState<DevelopProject[]>([]);
  const [companies, setCompanies] = useState<ManageCompany[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("프로젝트 데이터를 불러오세요.");

  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);

  const loadRows = useCallback(async (nextQuery: { keyword: string; startDate: string; endDate: string }) => {
    setIsLoading(true);
    setStatusText("Loading project list...");
    try {
      const response = await developProjectApi.list(nextQuery.keyword, nextQuery.startDate, nextQuery.endDate);
      setRows(response);
      setSelectedKeys(new Set());
      setStatusText(`Loaded ${response.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load project list.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows(query);
  }, [loadRows, query]);

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

  const validateDraft = (draft: DevelopProjectDraft): string | null => {
    if (!draft.projectNm.trim()) {
      return "Project name is required.";
    }
    if (!draft.requestCompanyCd.trim()) {
      return "Company is required.";
    }
    if (!draft.partCd.trim()) {
      return "Part code is required.";
    }
    return null;
  };

  const save = async () => {
    if (!editor) {
      return;
    }
    const validation = validateDraft(editor.draft);
    if (validation) {
      setStatusText(validation);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "Creating project..." : "Updating project...");
    try {
      if (editor.mode === "create") {
        await developProjectApi.create(editor.draft);
      } else {
        await developProjectApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save project.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targets: DevelopProject[]) => {
    if (targets.length === 0) {
      setStatusText("행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`프로젝트 데이터 ${targets.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting project rows...");
    try {
      const response = await developProjectApi.deleteMany(targets.map((row) => row.projectId));
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadRows(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete project rows.";
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
          <h2>추가개발 프로젝트 관리</h2>
          <p className="subtle">Project list/create/update/delete</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Keyword"
          value={filters.keyword}
          onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          className="w-48"
        />
        <Input
          placeholder="Start Date (YYYYMMDD)"
          value={filters.startDate}
          onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          className="w-44"
        />
        <Input
          placeholder="End Date (YYYYMMDD)"
          value={filters.endDate}
          onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          className="w-44"
        />
        <Button type="button" variant="outline" onClick={() => setQuery({ ...filters })} disabled={isLoading}>조회</Button>
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
              <TableHead>ID</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>고객사</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>계약기간</TableHead>
              <TableHead>개발기간</TableHead>
              <TableHead>금액</TableHead>
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
                  <TableCell>{row.projectId}</TableCell>
                  <TableCell>{row.projectNm}</TableCell>
                  <TableCell>{row.requestCompanyNm ?? row.requestCompanyCd}</TableCell>
                  <TableCell>{row.partNm ?? row.partCd ?? "-"}</TableCell>
                  <TableCell>
                    {formatDate(row.contractStdDt)} ~ {formatDate(row.contractEndDt)}
                  </TableCell>
                  <TableCell>
                    {formatDate(row.developStdDt)} ~ {formatDate(row.developEndDt)}
                  </TableCell>
                  <TableCell>{row.contractPrice ?? 0}</TableCell>
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
                  조회된 프로젝트 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent className="max-w-5xl" aria-label={editor.mode === "create" ? "프로젝트 입력" : "프로젝트 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "프로젝트 입력" : "프로젝트 수정"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Project Name *</Label>
                <Input
                  value={editor.draft.projectNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, projectNm: event.target.value } } : current,
                    )
                  }
                />
              </div>
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
                            draft: { ...current.draft, requestCompanyCd: event.target.value },
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
                <Label>Part Code *</Label>
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
                <Label>Input Man Power</Label>
                <Input
                  value={editor.draft.inputManPower}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, inputManPower: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Contract Start (YYYYMM)</Label>
                <Input
                  value={editor.draft.contractStdDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, contractStdDt: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Contract End (YYYYMM)</Label>
                <Input
                  value={editor.draft.contractEndDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, contractEndDt: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Develop Start (YYYYMMDD)</Label>
                <Input
                  value={editor.draft.developStdDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, developStdDt: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Develop End (YYYYMMDD)</Label>
                <Input
                  value={editor.draft.developEndDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, developEndDt: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Inspection (Y/N)</Label>
                <Input
                  value={editor.draft.inspectionYn}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, inspectionYn: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Tax Bill (Y/N)</Label>
                <Input
                  value={editor.draft.taxBillYn}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, taxBillYn: event.target.value } } : current,
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
                <Label>Contract Price</Label>
                <Input
                  value={editor.draft.contractPrice}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? { ...current, draft: { ...current.draft, contractPrice: event.target.value } }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>File Seq</Label>
                <Input
                  value={editor.draft.fileSeq}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, fileSeq: event.target.value } } : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Remark</Label>
                <Input
                  value={editor.draft.remark}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, remark: event.target.value } } : current,
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




