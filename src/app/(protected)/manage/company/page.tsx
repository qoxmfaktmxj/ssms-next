"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [statusText, setStatusText] = useState("Load company data to begin.");
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(rowKey(row))),
    [rows, selectedKeys],
  );

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
      const message = saveError instanceof Error ? saveError.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: ManageCompany[]) => {
    if (targetRows.length === 0) {
      setStatusText("Select at least one company row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targetRows.length} company row(s)?`);
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
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
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
          <h2>Company</h2>
          <p className="subtle">Phase 3 slice: company search/create/update/delete.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Company code or name"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(0);
              setQuery(keyword.trim());
            }
          }}
        />
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setPage(0);
            setQuery(keyword.trim());
          }}
          disabled={isLoading}
        >
          Search
        </button>
        <button type="button" onClick={openCreate} disabled={isSubmitting}>
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
              <th>Company Code</th>
              <th>Company Name</th>
              <th>Group Code</th>
              <th>Object Div</th>
              <th>Manage Div</th>
              <th>Representative</th>
              <th>Start Date</th>
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
                  <td>{row.companyCd}</td>
                  <td>{row.companyNm}</td>
                  <td>{row.companyGrpCd ?? "-"}</td>
                  <td>{row.objectDiv ?? "-"}</td>
                  <td>{row.manageDiv ?? "-"}</td>
                  <td>{row.representCompany ?? "-"}</td>
                  <td>{formatYmd(row.sdate)}</td>
                  <td className="row-actions">
                    <button type="button" className="ghost" onClick={() => openEdit(row)}>
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
                  No company rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          className="ghost"
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
          disabled={page === 0 || isLoading}
        >
          Prev
        </button>
        <span>
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
          disabled={page >= totalPages - 1 || isLoading}
        >
          Next
        </button>
      </div>

      {editor && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{editor.mode === "create" ? "Create Company" : "Edit Company"}</h3>
            </header>

            <div className="form-grid">
              <label>
                <span>Company Code</span>
                <input
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
              </label>
              <label>
                <span>Company Name</span>
                <input
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
              </label>
              <label>
                <span>Group Code</span>
                <input
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
              </label>
              <label>
                <span>Object Div</span>
                <input
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
              </label>
              <label>
                <span>Manage Div</span>
                <input
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
              </label>
              <label>
                <span>Representative</span>
                <input
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
              </label>
              <label>
                <span>Start Date (YYYYMMDD)</span>
                <input
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
              </label>
              <label>
                <span>Industry Code</span>
                <input
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
              </label>
              <label>
                <span>Zip</span>
                <input
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
              </label>
              <label>
                <span>Address</span>
                <input
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
              </label>
              <label>
                <span>Homepage</span>
                <input
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

