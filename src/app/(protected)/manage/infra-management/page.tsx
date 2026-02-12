"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [statusText, setStatusText] = useState("Load infra data to begin.");

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
      const message = error instanceof Error ? error.message : "Create failed.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSelectedMaster = async () => {
    if (selectedRows.length === 0) {
      setStatusText("Select at least one summary row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${selectedRows.length} infra mapping group(s)?`);
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
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCurrentMapping = async () => {
    if (!selectedSummary) {
      setStatusText("Select summary row first.");
      return;
    }
    const confirmed = window.confirm(
      `Delete selected mapping (${selectedSummary.companyCd}, task ${selectedSummary.taskGubunCd}, env ${selectedDevGb})?`,
    );
    if (!confirmed) {
      return;
    }
    setIsSubmitting(true);
    setStatusText("Deleting selected mapping...");
    try {
      const response = await manageInfraApi.deleteMapping(
        selectedSummary.companyCd,
        selectedSummary.taskGubunCd,
        selectedDevGb,
      );
      setStatusText(`Deleted ${response.succeeded}, failed ${response.failed}.`);
      await loadList(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSectionDraft = (draft: InfraSectionDraft): string | null => {
    if (!draft.companyCd.trim() || !draft.taskGubunCd.trim() || !draft.devGbCd.trim()) {
      return "Select summary row first.";
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
      const message = error instanceof Error ? error.message : "Save section failed.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>Infra Management</h2>
          <p className="subtle">Phase 3 slice: infra summary/master/section management.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Company code or name"
          value={filters.keyword}
          onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
        />
        <select
          value={filters.taskGubunCd}
          onChange={(event) => setFilters((current) => ({ ...current, taskGubunCd: event.target.value }))}
        >
          {taskOptions.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="button" className="ghost" onClick={() => setQuery({ ...filters })} disabled={isLoading}>
          Search
        </button>
        <button type="button" onClick={() => setEditor({ draft: emptyMasterDraft() })}>
          Create Mapping
        </button>
        <button type="button" className="danger" onClick={() => void deleteSelectedMaster()} disabled={selectedRows.length === 0}>
          Delete Selected ({selectedRows.length})
        </button>
      </div>

      <p className="status-text">{statusText}</p>

      <h3>Summary</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.length === rows.length}
                  onChange={(event) => toggleAllSummary(event.target.checked)}
                />
              </th>
              <th>Task</th>
              <th>Company Code</th>
              <th>Company Name</th>
              <th>Dev</th>
              <th>Prod</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = rowKey(row);
              const isSelected = key === selectedSummaryKey;
              return (
                <tr
                  key={key}
                  style={isSelected ? { backgroundColor: "#eef6ff" } : undefined}
                  onClick={() => setSelectedSummaryKey(key)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(event) => toggleSummary(key, event.target.checked)}
                    />
                  </td>
                  <td>{row.taskGubunNm}</td>
                  <td>{row.companyCd}</td>
                  <td>{row.companyNm ?? "-"}</td>
                  <td>{row.devYn}</td>
                  <td>{row.prodYn}</td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No infra summary rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <span className="subtle">Environment</span>
        <select value={selectedDevGb} onChange={(event) => setSelectedDevGb(event.target.value)}>
          <option value="1">Development</option>
          <option value="2">Production</option>
        </select>
        <button type="button" className="danger" onClick={() => void deleteCurrentMapping()} disabled={!selectedSummary}>
          Delete Current Mapping
        </button>
      </div>

      <h3>Master Rows</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Company Code</th>
              <th>Company Name</th>
              <th>Environment</th>
            </tr>
          </thead>
          <tbody>
            {masters.map((row, index) => (
              <tr key={`${row.companyCd}:${row.taskGubunCd}:${row.devGbCd}:${index}`}>
                <td>{row.taskGubunNm}</td>
                <td>{row.companyCd}</td>
                <td>{row.companyNm ?? "-"}</td>
                <td>{row.devGbCd === "1" ? "Development" : row.devGbCd === "2" ? "Production" : row.devGbCd}</td>
              </tr>
            ))}
            {!isLoading && masters.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  No master rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3>Section Rows</h3>
      <div className="form-grid">
        <label>
          <span>Section ID</span>
          <input
            value={sectionDraft.sectionId}
            onChange={(event) => setSectionDraft((current) => ({ ...current, sectionId: event.target.value }))}
          />
        </label>
        <label>
          <span>Sequence</span>
          <input
            value={sectionDraft.seq}
            onChange={(event) => setSectionDraft((current) => ({ ...current, seq: event.target.value }))}
          />
        </label>
        <label>
          <span>Title</span>
          <input
            value={sectionDraft.title}
            onChange={(event) => setSectionDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label>
          <span>Type</span>
          <input
            value={sectionDraft.type}
            onChange={(event) => setSectionDraft((current) => ({ ...current, type: event.target.value }))}
          />
        </label>
        <label>
          <span>Column Name</span>
          <input
            value={sectionDraft.columnNm}
            onChange={(event) => setSectionDraft((current) => ({ ...current, columnNm: event.target.value }))}
          />
        </label>
        <label>
          <span>Column Seq</span>
          <input
            value={sectionDraft.columnSeq}
            onChange={(event) => setSectionDraft((current) => ({ ...current, columnSeq: event.target.value }))}
          />
        </label>
        <label>
          <span>Contents</span>
          <input
            value={sectionDraft.contents}
            onChange={(event) => setSectionDraft((current) => ({ ...current, contents: event.target.value }))}
          />
        </label>
      </div>
      <div className="toolbar">
        <button type="button" onClick={() => void saveSection()} disabled={!selectedSummary || isSubmitting}>
          Add Section Row
        </button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Section ID</th>
              <th>Seq</th>
              <th>Title</th>
              <th>Type</th>
              <th>Column Name</th>
              <th>Column Seq</th>
              <th>Contents</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((row, index) => (
              <tr key={`${row.sectionId ?? ""}:${row.seq ?? 0}:${index}`}>
                <td>{row.sectionId ?? "-"}</td>
                <td>{row.seq ?? "-"}</td>
                <td>{row.title ?? "-"}</td>
                <td>{row.type ?? "-"}</td>
                <td>{row.columnNm ?? "-"}</td>
                <td>{row.columnSeq ?? "-"}</td>
                <td>{row.contents ?? "-"}</td>
              </tr>
            ))}
            {!isLoading && sections.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  No section rows found.
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
              <h3>Create Infra Mapping</h3>
            </header>

            <div className="form-grid">
              <label>
                <span>Company</span>
                <select
                  value={editor.draft.companyCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, companyCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">Select company</option>
                  {companies.map((row) => (
                    <option key={row.companyCd} value={row.companyCd}>
                      {row.companyCd} - {row.companyNm}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Task Category</span>
                <select
                  value={editor.draft.taskGubunCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, taskGubunCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">Select task</option>
                  {taskOptions
                    .filter((item) => item.value)
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Environment</span>
                <div className="row-actions">
                  <label>
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
                  <label>
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
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setEditor(null)}>
                Cancel
              </button>
              <button type="button" onClick={() => void saveMaster()} disabled={isSubmitting}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

