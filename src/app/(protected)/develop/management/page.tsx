"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { developManagementApi } from "@/features/develop-management/api";
import type {
  DevelopManagement,
  DevelopManagementDraft,
  DevelopManagementFilters,
} from "@/features/develop-management/types";
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
  const [statusText, setStatusText] = useState("Load management data to begin.");
  const [page, setPage] = useState(0);
  const [page2, setPage2] = useState(0);
  const [size] = useState(20);
  const [size2] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalElements2, setTotalElements2] = useState(0);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.has(rowKey(row))),
    [rows, selectedKeys],
  );
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
        setStatusText(
          `Loaded table1=${response.content?.length ?? 0}, table2=${response2.content?.length ?? 0} rows.`,
        );
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
      const message = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targets: DevelopManagement[]) => {
    if (targets.length === 0) {
      setStatusText("Select at least one row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targets.length} management row(s)?`);
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
          <h2>추가개발관리</h2>
          <p className="subtle">추가개발 목록 1/2 및 CRUD 화면입니다.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Company code/name"
          value={filters.companyName}
          onChange={(event) => setFilters((current) => ({ ...current, companyName: event.target.value }))}
        />
        <input
          placeholder="Start YM (YYYYMM)"
          value={filters.startDate}
          onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
        />
        <input
          placeholder="End YM (YYYYMM)"
          value={filters.endDate}
          onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
        />
        <select
          value={filters.statusCd}
          onChange={(event) => setFilters((current) => ({ ...current, statusCd: event.target.value }))}
        >
          {statusOptions.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Manager/Requester name"
          value={filters.mngName}
          onChange={(event) => setFilters((current) => ({ ...current, mngName: event.target.value }))}
        />
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setPage(0);
            setPage2(0);
            setQuery({ ...filters });
          }}
          disabled={isLoading}
        >조회</button>
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

      <h3>List 1</h3>
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
              <th>Company</th>
              <th>Request YM</th>
              <th>Seq</th>
              <th>Status</th>
              <th>Part</th>
              <th>Requester</th>
              <th>Period</th>
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
                  <td>{row.requestCompanyNm ?? row.requestCompanyCd}</td>
                  <td>{formatYm(row.requestYm)}</td>
                  <td>{row.requestSeq}</td>
                  <td>{row.statusCd ?? "-"}</td>
                  <td>{row.partNm ?? row.partCd ?? "-"}</td>
                  <td>{row.requestNm ?? "-"}</td>
                  <td>
                    {formatYm(row.startYm)} ~ {formatYm(row.endYm)}
                  </td>
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
                  No management rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button type="button" className="ghost" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0 || isLoading}>
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

      <h3>List 2</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Request YM</th>
              <th>Seq</th>
              <th>Status</th>
              <th>Part</th>
              <th>Requester</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {rows2.map((row) => (
              <tr key={`${rowKey(row)}:list2`}>
                <td>{row.requestCompanyNm ?? row.requestCompanyCd}</td>
                <td>{formatYm(row.requestYm)}</td>
                <td>{row.requestSeq}</td>
                <td>{row.statusCd ?? "-"}</td>
                <td>{row.partNm ?? row.partCd ?? "-"}</td>
                <td>{row.requestNm ?? "-"}</td>
                <td>
                  {formatYm(row.startYm)} ~ {formatYm(row.endYm)}
                </td>
              </tr>
            ))}
            {!isLoading && rows2.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  No list2 rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button type="button" className="ghost" onClick={() => setPage2((current) => Math.max(current - 1, 0))} disabled={page2 === 0 || isLoading}>
          Prev
        </button>
        <span>
          Page {page2 + 1} / {totalPages2}
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => setPage2((current) => Math.min(current + 1, totalPages2 - 1))}
          disabled={page2 >= totalPages2 - 1 || isLoading}
        >
          Next
        </button>
      </div>

      {editor && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{editor.mode === "create" ? "추가개발 입력" : "추가개발 수정"}</h3>
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
                <span>Request YM (YYYYMM)</span>
                <input
                  value={editor.draft.requestYm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestYm: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Request Seq</span>
                <input
                  value={editor.draft.requestSeq}
                  placeholder="Leave blank to auto-generate"
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestSeq: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
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
              </label>
              <label>
                <span>Requester Name</span>
                <input
                  value={editor.draft.requestNm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestNm: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Request Content</span>
                <input
                  value={editor.draft.requestContent}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, requestContent: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Manager Sabun</span>
                <input
                  value={editor.draft.managerSabun}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, managerSabun: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Developer Sabun</span>
                <input
                  value={editor.draft.developerSabun}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, developerSabun: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Start YM</span>
                <input
                  value={editor.draft.startYm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, startYm: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>End YM</span>
                <input
                  value={editor.draft.endYm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, endYm: event.target.value } } : current,
                    )
                  }
                />
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
                <span>Paid MM</span>
                <input
                  value={editor.draft.paidMm}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, paidMm: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Detail Content</span>
                <input
                  value={editor.draft.content}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, content: event.target.value } } : current,
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

