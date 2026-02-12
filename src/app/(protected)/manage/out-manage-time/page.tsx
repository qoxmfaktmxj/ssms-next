"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { manageOutManageTimeApi } from "@/features/manage-out-manage-time/api";
import type {
  OutManageCodeOption,
  OutManageTimeDetail,
  OutManageTimeDetailDraft,
  OutManageTimeSummary,
} from "@/features/manage-out-manage-time/types";

type DetailEditorState = {
  mode: "create" | "edit";
  draft: OutManageTimeDetailDraft;
};

const todayYmd = (): string => new Date().toISOString().slice(0, 10).replaceAll("-", "");

const emptyDetailDraft = (sabun: string, sdate: string, edate: string): OutManageTimeDetailDraft => ({
  id: null,
  sabun,
  gntCd: "",
  applyDate: todayYmd(),
  statusCd: "",
  sdate,
  edate,
  applyCnt: "",
  note: "",
});

const toDetailDraft = (row: OutManageTimeDetail): OutManageTimeDetailDraft => ({
  id: row.id,
  sabun: row.sabun,
  gntCd: row.gntCd ?? "",
  applyDate: row.applyDate ?? row.sdate,
  statusCd: row.statusCd ?? "",
  sdate: row.sdate,
  edate: row.edate,
  applyCnt: row.applyCnt == null ? "" : String(row.applyCnt),
  note: row.note ?? "",
});

const summaryKey = (row: OutManageTimeSummary): string => `${row.sabun}:${row.sdate}:${row.edate}`;

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function ManageOutManageTimePage() {
  const [searchYmd, setSearchYmd] = useState("");
  const [searchName, setSearchName] = useState("");
  const [summaryRows, setSummaryRows] = useState<OutManageTimeSummary[]>([]);
  const [selectedSummaryKey, setSelectedSummaryKey] = useState<string | null>(null);
  const [detailRows, setDetailRows] = useState<OutManageTimeDetail[]>([]);
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<number>>(new Set());
  const [gntCodes, setGntCodes] = useState<OutManageCodeOption[]>([]);
  const [statusCodes, setStatusCodes] = useState<OutManageCodeOption[]>([]);
  const [editor, setEditor] = useState<DetailEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("Load out-manage-time data to begin.");

  const selectedSummary = useMemo(
    () => summaryRows.find((row) => summaryKey(row) === selectedSummaryKey) ?? null,
    [selectedSummaryKey, summaryRows],
  );

  const selectedDetailRows = useMemo(
    () => detailRows.filter((row) => selectedDetailIds.has(row.id)),
    [detailRows, selectedDetailIds],
  );

  const loadCodes = useCallback(async () => {
    try {
      const [gnt, status] = await Promise.all([
        manageOutManageTimeApi.listCode("GNT_CD"),
        manageOutManageTimeApi.listCode("STATUS_CD"),
      ]);
      setGntCodes(gnt);
      setStatusCodes(status);
    } catch {
      // Keep page usable even if code lookup fails.
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setStatusText("Loading out-manage-time summary...");
    try {
      const response = await manageOutManageTimeApi.listSummary(searchYmd, searchName);
      const rows = response.content ?? [];
      setSummaryRows(rows);
      if (rows.length === 0) {
        setSelectedSummaryKey(null);
        setDetailRows([]);
        setSelectedDetailIds(new Set());
        setStatusText("No summary rows found.");
      } else {
        const first = rows[0];
        setSelectedSummaryKey(summaryKey(first));
        setStatusText(`Loaded ${rows.length} summary rows.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load out-manage-time summary.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, [searchName, searchYmd]);

  const loadDetail = useCallback(async (summary: OutManageTimeSummary) => {
    setIsLoading(true);
    setStatusText("Loading detail rows...");
    try {
      const response = await manageOutManageTimeApi.listDetail(summary.sabun, summary.sdate, summary.edate);
      setDetailRows(response.content ?? []);
      setSelectedDetailIds(new Set());
      setStatusText(`Loaded ${response.content?.length ?? 0} detail rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load detail rows.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCodes();
    void loadSummary();
  }, [loadCodes, loadSummary]);

  useEffect(() => {
    if (!selectedSummary) {
      return;
    }
    void loadDetail(selectedSummary);
  }, [loadDetail, selectedSummary]);

  const validateDraft = (draft: OutManageTimeDetailDraft): string | null => {
    if (!draft.sabun.trim()) {
      return "Sabun is required.";
    }
    if (!draft.sdate.trim()) {
      return "Start date is required.";
    }
    if (!draft.edate.trim()) {
      return "End date is required.";
    }
    if (draft.applyCnt.trim() && Number.isNaN(Number(draft.applyCnt.trim()))) {
      return "Apply count must be numeric.";
    }
    return null;
  };

  const saveDetail = async () => {
    if (!editor) {
      return;
    }
    const validation = validateDraft(editor.draft);
    if (validation) {
      setStatusText(validation);
      return;
    }

    setIsSubmitting(true);
    setStatusText(editor.mode === "create" ? "Creating detail row..." : "Updating detail row...");
    try {
      await manageOutManageTimeApi.saveDetail(editor.draft);
      setEditor(null);
      if (selectedSummary) {
        await loadDetail(selectedSummary);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteDetailRows = async (rowsToDelete: OutManageTimeDetail[]) => {
    if (rowsToDelete.length === 0) {
      setStatusText("Select at least one detail row to delete.");
      return;
    }
    const confirmed = window.confirm(`Delete ${rowsToDelete.length} detail row(s)?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("Deleting detail rows...");
    try {
      const deleted = await manageOutManageTimeApi.deleteDetails(
        rowsToDelete.map((row) => ({ id: row.id, sabun: row.sabun })),
      );
      setStatusText(deleted ? "Delete succeeded." : "Delete request finished with no change.");
      if (selectedSummary) {
        await loadDetail(selectedSummary);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDetail = (id: number, selected: boolean) => {
    setSelectedDetailIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>Out Manage Time</h2>
          <p className="subtle">Phase 3 slice: summary/detail attendance usage management.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Search date (YYYYMMDD)"
          value={searchYmd}
          onChange={(event) => setSearchYmd(event.target.value)}
        />
        <input placeholder="Search name" value={searchName} onChange={(event) => setSearchName(event.target.value)} />
        <button type="button" className="ghost" onClick={() => void loadSummary()} disabled={isLoading}>
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            if (!selectedSummary) {
              setStatusText("Select summary row first.");
              return;
            }
            setEditor({
              mode: "create",
              draft: emptyDetailDraft(selectedSummary.sabun, selectedSummary.sdate, selectedSummary.edate),
            });
          }}
          disabled={!selectedSummary}
        >
          Add Detail
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => void deleteDetailRows(selectedDetailRows)}
          disabled={selectedDetailRows.length === 0 || isSubmitting}
        >
          Delete Selected Detail ({selectedDetailRows.length})
        </button>
      </div>

      <p className="status-text">{statusText}</p>

      <h3>Summary</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sabun</th>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total</th>
              <th>Used</th>
              <th>Remain</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row) => {
              const key = summaryKey(row);
              const isSelected = key === selectedSummaryKey;
              return (
                <tr
                  key={key}
                  style={isSelected ? { backgroundColor: "#eef6ff" } : undefined}
                  onClick={() => setSelectedSummaryKey(key)}
                >
                  <td>{row.sabun}</td>
                  <td>{row.name ?? "-"}</td>
                  <td>{formatYmd(row.sdate)}</td>
                  <td>{formatYmd(row.edate)}</td>
                  <td>{row.totalCnt ?? 0}</td>
                  <td>{row.useCnt ?? 0}</td>
                  <td>{row.remainCnt ?? 0}</td>
                  <td>{row.note ?? "-"}</td>
                </tr>
              );
            })}
            {!isLoading && summaryRows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No summary rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3>Detail</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th />
              <th>Sabun</th>
              <th>Type</th>
              <th>Apply Date</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Apply Count</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {detailRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDetailIds.has(row.id)}
                    onChange={(event) => toggleDetail(row.id, event.target.checked)}
                  />
                </td>
                <td>{row.sabun}</td>
                <td>{row.gntName ?? row.gntCd ?? "-"}</td>
                <td>{formatYmd(row.applyDate)}</td>
                <td>{row.statusName ?? row.statusCd ?? "-"}</td>
                <td>{formatYmd(row.sdate)}</td>
                <td>{formatYmd(row.edate)}</td>
                <td>{row.applyCnt ?? 0}</td>
                <td>{row.note ?? "-"}</td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => setEditor({ mode: "edit", draft: toDetailDraft(row) })}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => void deleteDetailRows([row])}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && detailRows.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-row">
                  No detail rows found.
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
              <h3>{editor.mode === "create" ? "Create Detail Row" : "Edit Detail Row"}</h3>
            </header>

            <div className="form-grid">
              <label>
                <span>Sabun</span>
                <input
                  value={editor.draft.sabun}
                  disabled={editor.mode === "edit"}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, sabun: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={editor.draft.gntCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, gntCd: event.target.value } } : current,
                    )
                  }
                >
                  <option value="">Select type</option>
                  {gntCodes.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.codeNm}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Apply Date (YYYYMMDD)</span>
                <input
                  value={editor.draft.applyDate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, applyDate: event.target.value } } : current,
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
                  <option value="">Select status</option>
                  {statusCodes.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.codeNm}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Start Date (YYYYMMDD)</span>
                <input
                  value={editor.draft.sdate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, sdate: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>End Date (YYYYMMDD)</span>
                <input
                  value={editor.draft.edate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, edate: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Apply Count</span>
                <input
                  value={editor.draft.applyCnt}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, applyCnt: event.target.value } } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Note</span>
                <input
                  value={editor.draft.note}
                  onChange={(event) =>
                    setEditor((current) =>
                      current ? { ...current, draft: { ...current.draft, note: event.target.value } } : current,
                    )
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setEditor(null)}>
                Cancel
              </button>
              <button type="button" onClick={() => void saveDetail()} disabled={isSubmitting}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

