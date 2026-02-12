"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [statusText, setStatusText] = useState("Load inquiry data to begin.");

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(rowKey(row))),
    [rows, selectedKeys],
  );

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
      const message = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targets: DevelopInquiry[]) => {
    if (targets.length === 0) {
      setStatusText("Select at least one row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targets.length} inquiry row(s)?`);
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
          <h2>Develop Inquiry</h2>
          <p className="subtle">Phase 4 slice: inquiry list/search/create/update/delete.</p>
        </div>
      </header>

      <div className="toolbar">
        <input placeholder="Keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <input
          placeholder="Proceed code"
          value={inProceedCode}
          onChange={(event) => setInProceedCode(event.target.value)}
        />
        <button
          type="button"
          className="ghost"
          onClick={() => setQuery({ keyword: keyword.trim(), inProceedCode: inProceedCode.trim() })}
          disabled={isLoading}
        >
          Search
        </button>
        <button type="button" onClick={() => setEditor({ mode: "create", draft: emptyDraft() })}>
          Create
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => void deleteRows(selectedRows)}
          disabled={selectedRows.length === 0 || isSubmitting}
        >
          Delete Selected ({selectedRows.length})
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
              <th>Inquiry ID</th>
              <th>Company</th>
              <th>Content</th>
              <th>Hope Date</th>
              <th>Proceed</th>
              <th>Confirm</th>
              <th>Project</th>
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
                  <td>{row.inSeq}</td>
                  <td>{row.requestCompanyNm ?? row.requestCompanyCd}</td>
                  <td>{row.inContent}</td>
                  <td>{formatYmd(row.proceedHopeDt)}</td>
                  <td>{row.inProceedNm ?? row.inProceedCode ?? "-"}</td>
                  <td>{row.confirmNm ?? row.confirmYn ?? "-"}</td>
                  <td>{row.projectNm ?? "-"}</td>
                  <td className="row-actions">
                    <button type="button" className="ghost" onClick={() => setEditor({ mode: "edit", draft: toDraft(row) })}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => void deleteRows([row])}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-row">
                  No inquiry rows found.
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
              <h3>{editor.mode === "create" ? "Create Inquiry" : "Edit Inquiry"}</h3>
            </header>
            <div className="form-grid">
              <label>
                <span>Company</span>
                <select
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
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.companyCd} value={company.companyCd}>
                      {company.companyCd} - {company.companyNm}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Inquiry Content</span>
                <input
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
              </label>
              <label>
                <span>Proceed Hope Date (YYYYMMDD)</span>
                <input
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
              </label>
              <label>
                <span>Estimated MM</span>
                <input
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
              </label>
              <label>
                <span>Sales Name</span>
                <input
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
              </label>
              <label>
                <span>Charge Name</span>
                <input
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
              </label>
              <label>
                <span>Proceed Code</span>
                <input
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
              </label>
              <label>
                <span>Confirm (Y/N)</span>
                <select
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
              </label>
              <label>
                <span>Project Name</span>
                <input
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
              </label>
              <label>
                <span>Remark</span>
                <input
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
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setEditor(null)}>
                Cancel
              </button>
              <button type="button" onClick={() => void save()} disabled={isSubmitting}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

