"use client";

import type { SystemLogRecord } from "@/features/system-log/types";

type LogTableProps = {
  rows: SystemLogRecord[];
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

export const LogTable = ({ rows }: LogTableProps) => {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Created At</th>
            <th>Sabun</th>
            <th>Action</th>
            <th>Request URL</th>
            <th>IP</th>
            <th>Result</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-row">
                No log data found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.logId}>
                <td>{row.logId}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.sabun ?? "-"}</td>
                <td>{row.actionType}</td>
                <td className="path-cell">{row.requestUrl ?? "-"}</td>
                <td>{row.ipAddress ?? "-"}</td>
                <td>
                  <span className={row.successYn === "Y" ? "badge green" : "badge red"}>{row.successYn}</span>
                </td>
                <td>{row.errorMessage ?? "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

