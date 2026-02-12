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
import { manageCompanyApi } from "@/features/manage-company/api";
import type { ManageCompany, ManageCompanyDraft } from "@/features/manage-company/types";

type CompanyEditorState = {
  mode: "create" | "edit";
  draft: ManageCompanyDraft;
};

const emptyDraft = (): ManageCompanyDraft => ({
  companyCd: "",
  companyNm: "",
  companyGrpCd: "",
  objectDiv: "",
  manageDiv: "",
  representCompany: "",
  sdate: "",
  indutyCd: "",
  zip: "",
  address: "",
  homepage: "",
});

const toDraft = (row: ManageCompany): ManageCompanyDraft => ({
  companyCd: row.companyCd,
  companyNm: row.companyNm,
  companyGrpCd: row.companyGrpCd ?? "",
  objectDiv: row.objectDiv ?? "",
  manageDiv: row.manageDiv ?? "",
  representCompany: row.representCompany ?? "",
  sdate: row.sdate ?? "",
  indutyCd: row.indutyCd ?? "",
  zip: row.zip ?? "",
  address: row.address ?? "",
  homepage: row.homepage ?? "",
});

const rowKey = (row: ManageCompany) => row.companyCd;

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function ManageCompanyPage() {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ManageCompany[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<CompanyEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("고객사 데이터를 불러오세요.");
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedKeys.has(rowKey(row))), [rows, selectedKeys]);

  const loadRows = useCallback(
    async (nextPage: number, searchKeyword: string) => {
      setIsLoading(true);
      setStatusText("Loading company list...");
      try {
        const response = await manageCompanyApi.list({
          page: nextPage,
          size,
          companyNm: searchKeyword,
        });
        setRows(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setSelectedKeys(new Set());
        setStatusText(`Loaded ${response.content?.length ?? 0} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load company list.";
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

  const openCreate = () => {
    setEditor({ mode: "create", draft: emptyDraft() });
  };

  const openEdit = (row: ManageCompany) => {
    setEditor({ mode: "edit", draft: toDraft(row) });
  };

  const validate = (draft: ManageCompanyDraft): string | null => {
    if (!draft.companyCd.trim()) {
      return "Company code is required.";
    }
    if (!draft.companyNm.trim()) {
      return "Company name is required.";
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
    setStatusText(editor.mode === "create" ? "Creating company..." : "Updating company...");
    try {
      if (editor.mode === "create") {
        await manageCompanyApi.create(editor.draft);
      } else {
        await manageCompanyApi.update(editor.draft);
      }
      setEditor(null);
      await loadRows(page, query);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save company.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: ManageCompany[]) => {
    if (targetRows.length === 0) {
      setStatusText("고객사 행을 하나 이상 선택하세요.");
      return;
    }
    const confirmed = window.confirm(`고객사 데이터 ${targetRows.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("Deleting company rows...");
    try {
      const response = await manageCompanyApi.deleteMany(targetRows.map((row) => row.companyCd));
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadRows(page, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete company rows.";
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
          <h2>고객사 관리</h2>
          <p className="subtle">Company list/create/update/delete</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Company code or name"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(0);
              setQuery(keyword.trim());
            }
          }}
          className="w-56"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(0);
            setQuery(keyword.trim());
          }}
          disabled={isLoading}
        >조회</Button>
        <Button type="button" onClick={openCreate} disabled={isSubmitting}>입력</Button>
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
              <TableHead>고객사 코드</TableHead>
              <TableHead>고객사명</TableHead>
              <TableHead>그룹 코드</TableHead>
              <TableHead>객체 구분</TableHead>
              <TableHead>관리 구분</TableHead>
              <TableHead>대표사</TableHead>
              <TableHead>시작일</TableHead>
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
                  <TableCell>{row.companyCd}</TableCell>
                  <TableCell>{row.companyNm}</TableCell>
                  <TableCell>{row.companyGrpCd ?? "-"}</TableCell>
                  <TableCell>{row.objectDiv ?? "-"}</TableCell>
                  <TableCell>{row.manageDiv ?? "-"}</TableCell>
                  <TableCell>{row.representCompany ?? "-"}</TableCell>
                  <TableCell>{formatYmd(row.sdate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>수정</Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => void deleteRows([row])}>삭제</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                  조회된 고객사 데이터가 없습니다.
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
          <DialogContent className="max-w-4xl" aria-label={editor.mode === "create" ? "고객사 입력" : "고객사 수정"}>
            <DialogHeader>
              <DialogTitle>{editor.mode === "create" ? "고객사 입력" : "고객사 수정"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Company Code *</Label>
                <Input
                  value={editor.draft.companyCd}
                  disabled={editor.mode === "edit"}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              companyCd: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Company Name *</Label>
                <Input
                  value={editor.draft.companyNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              companyNm: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Group Code</Label>
                <Input
                  value={editor.draft.companyGrpCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              companyGrpCd: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Object Div</Label>
                <Input
                  value={editor.draft.objectDiv}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              objectDiv: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Manage Div</Label>
                <Input
                  value={editor.draft.manageDiv}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              manageDiv: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Representative</Label>
                <Input
                  value={editor.draft.representCompany}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              representCompany: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Start Date (YYYYMMDD)</Label>
                <Input
                  value={editor.draft.sdate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              sdate: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Industry Code</Label>
                <Input
                  value={editor.draft.indutyCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              indutyCd: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Zip</Label>
                <Input
                  value={editor.draft.zip}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              zip: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={editor.draft.address}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              address: event.target.value,
                            },
                          }
                        : current,
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Homepage</Label>
                <Input
                  value={editor.draft.homepage}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: {
                              ...current.draft,
                              homepage: event.target.value,
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



