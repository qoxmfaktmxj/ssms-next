"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [statusText, setStatusText] = useState("Load project data to begin.");

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(rowKey(row))),
    [rows, selectedKeys],
  );

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
      const message = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targets: DevelopProject[]) => {
    if (targets.length === 0) {
      setStatusText("Select at least one row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targets.length} project row(s)?`);
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
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
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

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>추가개발프로젝트관리</h2>
          <p className="subtle">추가개발 프로젝트 조회/입력/수정/삭제 화면입니다.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Keyword"
          value={filters.keyword}
          onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
        />
        <input
          placeholder="Start Date (YYYYMMDD)"
          value={filters.startDate}
          onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
        />
        <input
          placeholder="End Date (YYYYMMDD)"
          value={filters.endDate}
          onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
        />
        <button type="button" className="ghost" onClick={() => setQuery({ ...filters })} disabled={isLoading}>조회</button>
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
              <th>ID</th>
              <th>Project</th>
              <th>Company</th>
              <th>Part</th>
              <th>Contract</th>
              <th>Develop</th>
              <th>Price</th>
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
                  <td>{row.projectId}</td>
                  <td>{row.projectNm}</td>
                  <td>{row.requestCompanyNm ?? row.requestCompanyCd}</td>
                  <td>{row.partNm ?? row.partCd ?? "-"}</td>
                  <td>
                    {formatDate(row.contractStdDt)} ~ {formatDate(row.contractEndDt)}
                  </td>
                  <td>
                    {formatDate(row.developStdDt)} ~ {formatDate(row.developEndDt)}
                  </td>
                  <td>{row.contractPrice ?? 0}</td>
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
                  No project rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editor && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{editor.mode === "create" ? "프로젝트 입력" : "프로젝트 수정"}</h3>
            </header>
            <div className="form-grid">
              <label>
                <span>Project Name</span>
                <input
                  value={editor.draft.projectNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, projectNm: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Company</span>
                <select
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
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.companyCd} value={company.companyCd}>
                      {company.companyCd} - {company.companyNm}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Part Code</span>
                <input
                  value={editor.draft.partCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, partCd: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Input Man Power</span>
                <input
                  value={editor.draft.inputManPower}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, inputManPower: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Contract Start (YYYYMM)</span>
                <input
                  value={editor.draft.contractStdDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, contractStdDt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Contract End (YYYYMM)</span>
                <input
                  value={editor.draft.contractEndDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, contractEndDt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Develop Start (YYYYMMDD)</span>
                <input
                  value={editor.draft.developStdDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, developStdDt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Develop End (YYYYMMDD)</span>
                <input
                  value={editor.draft.developEndDt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, developEndDt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Inspection (Y/N)</span>
                <input
                  value={editor.draft.inspectionYn}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, inspectionYn: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Tax Bill (Y/N)</span>
                <input
                  value={editor.draft.taxBillYn}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, taxBillYn: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Real MM</span>
                <input
                  value={editor.draft.realMm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, realMm: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Contract Price</span>
                <input
                  value={editor.draft.contractPrice}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, contractPrice: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>File Seq</span>
                <input
                  value={editor.draft.fileSeq}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, fileSeq: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Remark</span>
                <input
                  value={editor.draft.remark}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, remark: event.target.value } } : current,
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

