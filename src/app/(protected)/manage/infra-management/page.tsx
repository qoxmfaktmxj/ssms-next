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
import { manageInfraApi } from "@/features/manage-infra/api";
import type {
  InfraCompanyOption,
  InfraMaster,
  InfraMasterDraft,
  InfraSearchFilters,
  InfraSection,
  InfraSectionDraft,
  InfraSummary,
} from "@/features/manage-infra/types";
import { cn } from "@/lib/utils";

type InfraEditorState = {
  draft: InfraMasterDraft;
};

const emptyMasterDraft = (): InfraMasterDraft => ({
  companyCd: "",
  taskGubunCd: "",
  devGbCdList: [],
});

const emptySectionDraft = (selected: InfraSummary | null, devGbCd: string): InfraSectionDraft => ({
  companyCd: selected?.companyCd ?? "",
  taskGubunCd: selected?.taskGubunCd ?? "",
  devGbCd,
  sectionId: "",
  seq: "",
  title: "",
  type: "",
  columnNm: "",
  columnSeq: "",
  contents: "",
});

const rowKey = (row: InfraSummary): string => `${row.taskGubunCd}:${row.companyCd}`;

const taskOptions = [
  { value: "", label: "All" },
  { value: "10", label: "HR" },
  { value: "20", label: "Mobile" },
  { value: "30", label: "Recruit" },
];

export default function ManageInfraManagementPage() {
  const [filters, setFilters] = useState<InfraSearchFilters>({ keyword: "", taskGubunCd: "" });
  const [query, setQuery] = useState<InfraSearchFilters>({ keyword: "", taskGubunCd: "" });
  const [rows, setRows] = useState<InfraSummary[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedSummaryKey, setSelectedSummaryKey] = useState<string | null>(null);
  const [masters, setMasters] = useState<InfraMaster[]>([]);
  const [sections, setSections] = useState<InfraSection[]>([]);
  const [companies, setCompanies] = useState<InfraCompanyOption[]>([]);
  const [selectedDevGb, setSelectedDevGb] = useState("1");
  const [sectionDraft, setSectionDraft] = useState<InfraSectionDraft>(emptySectionDraft(null, "1"));
  const [editor, setEditor] = useState<InfraEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("인프라 데이터를 불러오세요.");

  const selectedSummary = useMemo(
    () => rows.find((row) => rowKey(row) === selectedSummaryKey) ?? null,
    [rows, selectedSummaryKey],
  );
  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);

  const loadList = useCallback(async (appliedQuery: InfraSearchFilters) => {
    setIsLoading(true);
    setStatusText("Loading infra list...");
    try {
      const response = await manageInfraApi.list(appliedQuery);
      setRows(response);
      setSelectedKeys(new Set());
      if (response.length === 0) {
        setSelectedSummaryKey(null);
        setMasters([]);
        setSections([]);
      } else {
        setSelectedSummaryKey((current) => current ?? rowKey(response[0]));
      }
      setStatusText(`Loaded ${response.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load infra list.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const list = await manageInfraApi.listCompanies();
      setCompanies(list);
    } catch {
      // Keep page working even if this fails.
    }
  }, []);

  const loadDetail = useCallback(async (summary: InfraSummary, devGbCd: string) => {
    setIsLoading(true);
    setStatusText("Loading infra detail...");
    try {
      const [masterRows, sectionRows] = await Promise.all([
        manageInfraApi.listMaster(summary.companyCd, summary.taskGubunCd),
        manageInfraApi.listSection(summary.companyCd, summary.taskGubunCd, devGbCd),
      ]);
      setMasters(masterRows);
      setSections(sectionRows);
      setSectionDraft(emptySectionDraft(summary, devGbCd));
      setStatusText(`Loaded ${sectionRows.length} section rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load infra detail.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
    void loadList(query);
  }, [loadCompanies, loadList, query]);

  useEffect(() => {
    if (!selectedSummary) {
      return;
    }
    void loadDetail(selectedSummary, selectedDevGb);
  }, [loadDetail, selectedDevGb, selectedSummary]);

  const toggleSummary = (key: string, selected: boolean) => {
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

  const toggleAllSummary = (selected: boolean) => {
    if (!selected) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys(new Set(rows.map((row) => rowKey(row))));
  };

  const validateMasterDraft = (draft: InfraMasterDraft): string | null => {
    if (!draft.companyCd.trim()) {
      return "Company is required.";
    }
    if (!draft.taskGubunCd.trim()) {
      return "Task category is required.";
    }
    if (draft.devGbCdList.length === 0) {
      return "At least one environment must be selected.";
    }
    return null;
  };

  const saveMaster = async () => {
    if (!editor) {
      return;
    }
    const validation = validateMasterDraft(editor.draft);
    if (validation) {
      setStatusText(validation);
      return;
    }
    setIsSubmitting(true);
    setStatusText("Creating infra master...");
    try {
      const dupCount = await manageInfraApi.dupCount(editor.draft);
      if (dupCount > 0) {
        setStatusText("Duplicate mapping exists.");
        setIsSubmitting(false);
        return;
      }
      const response = await manageInfraApi.createMaster(editor.draft);
      setStatusText(`Created ${response.succeeded}, failed ${response.failed}.`);
      setEditor(null);
      await loadList(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "생성에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSelectedMaster = async () => {
    if (selectedRows.length === 0) {
      setStatusText("요약 행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`인프라 매핑 그룹 ${selectedRows.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting infra mappings...");
    try {
      const response = await manageInfraApi.deleteMaster(
        selectedRows.map((row) => ({
          companyCd: row.companyCd,
          taskGubunCd: row.taskGubunCd,
        })),
      );
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadList(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete mappings.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCurrentMapping = async () => {
    if (!selectedSummary) {
      setStatusText("요약 행을 먼저 선택하세요.");
      return;
    }
    const confirmed = window.confirm(
      `선택한 매핑(${selectedSummary.companyCd}, 업무 ${selectedSummary.taskGubunCd}, 환경 ${selectedDevGb})을 삭제할까요?`,
    );
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting selected mapping...");
    try {
      const response = await manageInfraApi.deleteMapping(selectedSummary.companyCd, selectedSummary.taskGubunCd, selectedDevGb);
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadList(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete selected mapping.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSectionDraft = (draft: InfraSectionDraft): string | null => {
    if (!draft.companyCd.trim() || !draft.taskGubunCd.trim() || !draft.devGbCd.trim()) {
      return "요약 행을 먼저 선택하세요.";
    }
    if (!draft.sectionId.trim()) {
      return "Section ID is required.";
    }
    if (draft.seq.trim() && Number.isNaN(Number(draft.seq.trim()))) {
      return "Sequence must be numeric.";
    }
    return null;
  };

  const saveSection = async () => {
    const validation = validateSectionDraft(sectionDraft);
    if (validation) {
      setStatusText(validation);
      return;
    }
    setIsSubmitting(true);
    setStatusText("Saving section row...");
    try {
      const response = await manageInfraApi.addSection(sectionDraft);
      setStatusText(`Saved ${response.succeeded}, failed ${response.failed}.`);
      if (selectedSummary) {
        await loadDetail(selectedSummary, selectedDevGb);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "섹션 저장에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClassName =
    "flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>인프라 구성 관리</h2>
          <p className="subtle">Summary, master, and section management</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Company code or name"
          value={filters.keyword}
          onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          className="w-52"
        />
        <select
          className={selectClassName}
          value={filters.taskGubunCd}
          onChange={(event) => setFilters((current) => ({ ...current, taskGubunCd: event.target.value }))}
        >
          {taskOptions.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={() => setQuery({ ...filters })} disabled={isLoading}>조회</Button>
        <Button type="button" onClick={() => setEditor({ draft: emptyMasterDraft() })}>
          매핑 입력
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteSelectedMaster()}
          disabled={selectedRows.length === 0}
        >선택삭제 ({selectedRows.length})
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Summary</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.length === rows.length}
                  onChange={(event) => toggleAllSummary(event.target.checked)}
                />
              </TableHead>
              <TableHead>업무</TableHead>
              <TableHead>고객사 코드</TableHead>
              <TableHead>고객사명</TableHead>
              <TableHead>개발</TableHead>
              <TableHead>운영</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const key = rowKey(row);
              const isSelected = key === selectedSummaryKey;
              return (
                <TableRow
                  key={key}
                  className={cn(isSelected ? "bg-blue-50 hover:bg-blue-50" : "")}
                  onClick={() => setSelectedSummaryKey(key)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(event) => toggleSummary(key, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{row.taskGubunNm}</TableCell>
                  <TableCell>{row.companyCd}</TableCell>
                  <TableCell>{row.companyNm ?? "-"}</TableCell>
                  <TableCell>{row.devYn}</TableCell>
                  <TableCell>{row.prodYn}</TableCell>
                </TableRow>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  조회된 인프라 요약 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <span className="text-sm font-medium text-slate-600">Environment</span>
        <select className={selectClassName} value={selectedDevGb} onChange={(event) => setSelectedDevGb(event.target.value)}>
          <option value="1">개발</option>
          <option value="2">운영</option>
        </select>
        <Button type="button" variant="destructive" onClick={() => void deleteCurrentMapping()} disabled={!selectedSummary}>
          현재 매핑 삭제
        </Button>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Master Rows</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>업무</TableHead>
              <TableHead>고객사 코드</TableHead>
              <TableHead>고객사명</TableHead>
              <TableHead>환경</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {masters.map((row, index) => (
              <TableRow key={`${row.companyCd}:${row.taskGubunCd}:${row.devGbCd}:${index}`}>
                <TableCell>{row.taskGubunNm}</TableCell>
                <TableCell>{row.companyCd}</TableCell>
                <TableCell>{row.companyNm ?? "-"}</TableCell>
                <TableCell>{row.devGbCd === "1" ? "개발" : row.devGbCd === "2" ? "운영" : row.devGbCd}</TableCell>
              </TableRow>
            ))}
            {!isLoading && masters.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                  조회된 마스터 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Section Rows</h3>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1.5">
            <Label>Section ID</Label>
            <Input value={sectionDraft.sectionId} onChange={(event) => setSectionDraft((current) => ({ ...current, sectionId: event.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sequence</Label>
            <Input value={sectionDraft.seq} onChange={(event) => setSectionDraft((current) => ({ ...current, seq: event.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={sectionDraft.title} onChange={(event) => setSectionDraft((current) => ({ ...current, title: event.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Input value={sectionDraft.type} onChange={(event) => setSectionDraft((current) => ({ ...current, type: event.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Column Name</Label>
            <Input value={sectionDraft.columnNm} onChange={(event) => setSectionDraft((current) => ({ ...current, columnNm: event.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Column Seq</Label>
            <Input value={sectionDraft.columnSeq} onChange={(event) => setSectionDraft((current) => ({ ...current, columnSeq: event.target.value }))} />
          </div>
          <div className="grid gap-1.5 md:col-span-3">
            <Label>Contents</Label>
            <Input value={sectionDraft.contents} onChange={(event) => setSectionDraft((current) => ({ ...current, contents: event.target.value }))} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => void saveSection()} disabled={!selectedSummary || isSubmitting}>
            Add Section Row
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>섹션 ID</TableHead>
              <TableHead>순번</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>컬럼명</TableHead>
              <TableHead>컬럼 순서</TableHead>
              <TableHead>내용</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((row, index) => (
              <TableRow key={`${row.sectionId ?? ""}:${row.seq ?? 0}:${index}`}>
                <TableCell>{row.sectionId ?? "-"}</TableCell>
                <TableCell>{row.seq ?? "-"}</TableCell>
                <TableCell>{row.title ?? "-"}</TableCell>
                <TableCell>{row.type ?? "-"}</TableCell>
                <TableCell>{row.columnNm ?? "-"}</TableCell>
                <TableCell>{row.columnSeq ?? "-"}</TableCell>
                <TableCell>{row.contents ?? "-"}</TableCell>
              </TableRow>
            ))}
            {!isLoading && sections.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  조회된 섹션 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent aria-label="인프라 매핑 입력">
            <DialogHeader>
              <DialogTitle>인프라 매핑 입력</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Company</Label>
                <select
                  className={selectClassName}
                  value={editor.draft.companyCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, companyCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">회사 선택</option>
                  {companies.map((row) => (
                    <option key={row.companyCd} value={row.companyCd}>
                      {row.companyCd} - {row.companyNm}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Task Category</Label>
                <select
                  className={selectClassName}
                  value={editor.draft.taskGubunCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, taskGubunCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">업무 선택</option>
                  {taskOptions
                    .filter((item) => item.value)
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Environment</Label>
                <div className="flex gap-4 text-sm text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editor.draft.devGbCdList.includes("1")}
                      onChange={(event) =>
                        setEditor((current) => {
                          if (!current) {
                            return current;
                          }
                          const next = new Set(current.draft.devGbCdList);
                          if (event.target.checked) {
                            next.add("1");
                          } else {
                            next.delete("1");
                          }
                          return {
                            ...current,
                            draft: {
                              ...current.draft,
                              devGbCdList: [...next],
                            },
                          };
                        })
                      }
                    />
                    Dev
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editor.draft.devGbCdList.includes("2")}
                      onChange={(event) =>
                        setEditor((current) => {
                          if (!current) {
                            return current;
                          }
                          const next = new Set(current.draft.devGbCdList);
                          if (event.target.checked) {
                            next.add("2");
                          } else {
                            next.delete("2");
                          }
                          return {
                            ...current,
                            draft: {
                              ...current.draft,
                              devGbCdList: [...next],
                            },
                          };
                        })
                      }
                    />
                    Prod
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>취소</Button>
              <Button type="button" onClick={() => void saveMaster()} disabled={isSubmitting}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}


