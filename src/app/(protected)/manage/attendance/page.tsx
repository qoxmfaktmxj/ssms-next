"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { manageAttendanceApi } from "@/features/manage-attendance/api";
import type { AttendanceDraft, AttendanceRecord, CodeOption } from "@/features/manage-attendance/types";

type AttendanceEditorState = {
  mode: "create" | "edit";
  draft: AttendanceDraft;
};

const todayYmd = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");

const emptyDraft = (sabun = ""): AttendanceDraft => {
  const today = todayYmd();
  return {
    id: null,
    sabun,
    sdate: today,
    edate: today,
    gntCd: "",
    statusCd: "",
    note: "",
    applyDate: today,
  };
};

const toDraft = (row: AttendanceRecord): AttendanceDraft => ({
  id: row.id,
  sabun: row.sabun,
  sdate: row.sdate,
  edate: row.edate,
  gntCd: row.gntCd ?? "",
  statusCd: row.statusCd ?? "",
  note: row.note ?? "",
  applyDate: row.applyDate ?? row.sdate,
});

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

const rowKey = (row: AttendanceRecord): string => `${row.id}:${row.sabun}`;

export default function ManageAttendancePage() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [gntCodes, setGntCodes] = useState<CodeOption[]>([]);
  const [statusCodes, setStatusCodes] = useState<CodeOption[]>([]);
  const [editor, setEditor] = useState<AttendanceEditorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("Load attendance data to begin.");

  const visibleRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) => {
      const text = `${row.sabun} ${row.name ?? ""} ${row.orgNm ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [keyword, rows]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setStatusText("Loading attendance list...");
    try {
      const [attendanceRows, gnt, status] = await Promise.all([
        manageAttendanceApi.list(),
        manageAttendanceApi.listCode("GNT_CD"),
        manageAttendanceApi.listCode("STATUS_CD"),
      ]);
      setRows(attendanceRows);
      setGntCodes(gnt);
      setStatusCodes(status);
      setSelectedIds(new Set());
      setStatusText(`Loaded ${attendanceRows.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load attendance data.";
      setStatusText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const validate = (draft: AttendanceDraft): string | null => {
    if (!draft.sabun.trim()) {
      return "Sabun is required.";
    }
    if (!draft.sdate.trim()) {
      return "Start date is required.";
    }
    if (!draft.edate.trim()) {
      return "End date is required.";
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
    setStatusText(editor.mode === "create" ? "Creating attendance..." : "Updating attendance...");
    try {
      if (editor.mode === "create") {
        await manageAttendanceApi.create(editor.draft);
      } else {
        await manageAttendanceApi.update(editor.draft);
      }
      setEditor(null);
      await load();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Save에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRows = async (targetRows: AttendanceRecord[]) => {
    if (targetRows.length === 0) {
      setStatusText("Select at least one attendance row.");
      return;
    }
    const confirmed = window.confirm(`Delete ${targetRows.length} attendance row(s)?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setStatusText("Deleting attendance rows...");
    try {
      let succeeded = 0;
      let failed = 0;
      for (const row of targetRows) {
        try {
          await manageAttendanceApi.deleteOne(row.id, row.sabun);
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }
      setStatusText(`Deleted ${succeeded}, failed ${failed}.`);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOne = (id: number, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleAllVisible = (selected: boolean) => {
    if (!selected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleRows.map((row) => row.id)));
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>Attendance</h2>
          <p className="subtle">Phase 3 slice: attendance list/create/update/delete.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Filter by sabun, name, org"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <button type="button" className="ghost" onClick={() => void load()} disabled={isLoading}>
          Refresh
        </button>
        <button type="button" onClick={() => setEditor({ mode: "create", draft: emptyDraft(user?.sabun ?? "") })}>
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
                  checked={visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id))}
                  onChange={(event) => toggleAllVisible(event.target.checked)}
                />
              </th>
              <th>Sabun</th>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Apply Date</th>
              <th>Org</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={rowKey(row)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={(event) => toggleOne(row.id, event.target.checked)}
                  />
                </td>
                <td>{row.sabun}</td>
                <td>{row.name ?? "-"}</td>
                <td>{formatYmd(row.sdate)}</td>
                <td>{formatYmd(row.edate)}</td>
                <td>{row.gntCdName ?? row.gntCd ?? "-"}</td>
                <td>{row.statusCdName ?? row.statusCd ?? "-"}</td>
                <td>{formatYmd(row.applyDate)}</td>
                <td>{row.orgNm ?? "-"}</td>
                <td>{row.note ?? "-"}</td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => setEditor({ mode: "edit", draft: toDraft(row) })}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => void deleteRows([row])}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && visibleRows.length === 0 && (
              <tr>
                <td colSpan={11} className="empty-row">
                  No attendance rows found.
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
              <h3>{editor.mode === "create" ? "Create Attendance" : "Edit Attendance"}</h3>
            </header>

            <div className="form-grid">
              <label>
                <span>Sabun</span>
                <input
                  value={editor.draft.sabun}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: { ...current.draft, sabun: event.target.value },
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
                            draft: { ...current.draft, sdate: event.target.value },
                          }
                        : current,
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
                      current
                        ? {
                            ...current,
                            draft: { ...current.draft, edate: event.target.value },
                          }
                        : current,
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
                      current
                        ? {
                            ...current,
                            draft: { ...current.draft, gntCd: event.target.value },
                          }
                        : current,
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
                <span>Status</span>
                <select
                  value={editor.draft.statusCd}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: { ...current.draft, statusCd: event.target.value },
                          }
                        : current,
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
                <span>Apply Date (YYYYMMDD)</span>
                <input
                  value={editor.draft.applyDate}
                  onChange={(event) =>
                    setEditor((current) =>
                      current
                        ? {
                            ...current,
                            draft: { ...current.draft, applyDate: event.target.value },
                          }
                        : current,
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
                      current
                        ? {
                            ...current,
                            draft: { ...current.draft, note: event.target.value },
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

