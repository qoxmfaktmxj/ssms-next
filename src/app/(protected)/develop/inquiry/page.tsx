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
import { developInquiryApi } from "@/features/develop-inquiry/api";
import type { DevelopInquiry, DevelopInquiryDraft } from "@/features/develop-inquiry/types";
import { manageCompanyApi } from "@/features/manage-company/api";
import type { ManageCompany } from "@/features/manage-company/types";

type EditorState = {
  mode: "create" | "edit";
  draft: DevelopInquiryDraft;
};

const emptyDraft = (): DevelopInquiryDraft => ({
  inSeq: null,
  requestCompanyCd: "",
  inContent: "",
  proceedHopeDt: "",
  estRealMm: "",
  salesNm: "",
  chargeNm: "",
  inProceedCode: "",
  confirmYn: "N",
  projectNm: "",
  remark: "",
});

const toDraft = (row: DevelopInquiry): DevelopInquiryDraft => ({
  inSeq: row.inSeq,
  requestCompanyCd: row.requestCompanyCd,
  inContent: row.inContent,
  proceedHopeDt: row.proceedHopeDt ?? "",
  estRealMm: row.estRealMm == null ? "" : String(row.estRealMm),
  salesNm: row.salesNm ?? "",
  chargeNm: row.chargeNm ?? "",
  inProceedCode: row.inProceedCode ?? "",
  confirmYn: row.confirmYn ?? "N",
  projectNm: row.projectNm ?? "",
  remark: row.remark ?? "",
});

const rowKey = (row: DevelopInquiry) => String(row.inSeq);

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function DevelopInquiryPage() {
  const [keyword, setKeyword] = useState("");
  const [inProceedCode, setInProceedCode] = useState("");
  const [query, setQuery] = useState({ keyword: "", inProceedCode: "" });
  const [rows, setRows] = useState<DevelopInquiry[]>([]);
  const [companies, setCompanies] = useState<ManageCompany[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("문의 데이터를 불러오세요.");

  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);

  const loadRows = useCallback(async (nextQuery: { keyword: string; inProceedCode: string }) => {
    setIsLoading(true);
    setStatusText("Loading inquiry list...");
    try {
      const response = await developInquiryApi.list(nextQuery.keyword, nextQuery.inProceedCode);
      setRows(response);
      setSelectedKeys(new Set());
      setStatusText(`Loaded ${response.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load inquiry list.";
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
        // keep page usable even when company lookup fails
      }
    };
    void loadCompanies();
  }, []);

  const validateDraft = (draft: DevelopInquiryDraft): string | null => {
    if (!draft.requestCompanyCd.trim()) {
      return "Company is required.";
    }
    if (!draft.inContent.trim()) {
      return "Inquiry content is required.";
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
    setStatusText(editor.mode === "create" ? "Creating inquiry..." : "Updating inquiry...");
    try {
      if (editor.mode === "create") {
        await developInquiryApi.create(editor.draft);
      } else {
        await developInquiryApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save inquiry.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targets: DevelopInquiry[]) => {
    if (targets.length === 0) {
      setStatusText("행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`문의 데이터 ${targets.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting inquiry rows...");
    try {
      const response = await developInquiryApi.deleteMany(targets.map((row) => row.inSeq));
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadRows(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete inquiry rows.";
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
          <h2>추가개발 문의 관리</h2>
          <p className="subtle">Inquiry list/create/update/delete</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input placeholder="Keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="w-48" />
        <Input
          placeholder="Proceed code"
          value={inProceedCode}
          onChange={(event) => setInProceedCode(event.target.value)}
          className="w-40"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setQuery({ keyword: keyword.trim(), inProceedCode: inProceedCode.trim() })}
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
              <TableHead>문의 ID</TableHead>
              <TableHead>고객사</TableHead>
              <TableHead>내용</TableHead>
              <TableHead>희망일</TableHead>
              <TableHead>진행</TableHead>
              <TableHead>확인</TableHead>
              <TableHead>프로젝트</TableHead>
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
                  <TableCell>{row.inSeq}</TableCell>
                  <TableCell>{row.requestCompanyNm ?? row.requestCompanyCd}</TableCell>
                  <TableCell>{row.inContent}</TableCell>
                  <TableCell>{formatYmd(row.proceedHopeDt)}</TableCell>
                  <TableCell>{row.inProceedNm ?? row.inProceedCode ?? "-"}</TableCell>
                  <TableCell>{row.confirmNm ?? row.confirmYn ?? "-"}</TableCell>
                  <TableCell>{row.projectNm ?? "-"}</TableCell>
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
                  조회된 문의 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editor && (
        <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent className="max-w-4xl" aria-label={editor.mode === "create" ? "문의 입력" : "문의 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "문의 입력" : "문의 수정"}</DialogTitle>
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
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Inquiry Content *</Label>
                <Input
                  value={editor.draft.inContent}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              inContent: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Proceed Hope Date (YYYYMMDD)</Label>
                <Input
                  value={editor.draft.proceedHopeDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              proceedHopeDt: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Estimated MM</Label>
                <Input
                  value={editor.draft.estRealMm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              estRealMm: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Sales Name</Label>
                <Input
                  value={editor.draft.salesNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              salesNm: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Charge Name</Label>
                <Input
                  value={editor.draft.chargeNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              chargeNm: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Proceed Code</Label>
                <Input
                  value={editor.draft.inProceedCode}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              inProceedCode: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Confirm</Label>
                <select
                  className={selectClassName}
                  value={editor.draft.confirmYn}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              confirmYn: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                >
                  <option value="N">N</option>
                  <option value="Y">Y</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Project Name</Label>
                <Input
                  value={editor.draft.projectNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              projectNm: event.target.value,
                            },
                          }
                        : current,
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
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              remark: event.target.value,
                            },
                          }
                        : current,
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


