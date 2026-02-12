"use client";

import { useEffect, useState } from "react";
import { manageManagerStatusApi } from "@/features/manage-manager-status/api";
import type { ManagerStatusRecord } from "@/features/manage-manager-status/types";

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function ManageManagerStatusPage() {
  const [rows, setRows] = useState<ManagerStatusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Load manager status data to begin.");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusText("Loading manager status...");
      try {
        const response = await manageManagerStatusApi.list();
        setRows(response);
        setStatusText(`Loaded ${response.length} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load manager status.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>유지보수통계</h2>
          <p className="subtle">활성 유지보수 담당자-고객사 매핑 조회 화면입니다.</p>
        </div>
      </header>

      <p className="status-text">{statusText}</p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sabun</th>
              <th>Name</th>
              <th>Company Code</th>
              <th>Company Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.sabun}:${row.companyCd}:${row.sdate ?? ""}`}>
                <td>{row.sabun}</td>
                <td>{row.name ?? "-"}</td>
                <td>{row.companyCd}</td>
                <td>{row.companyNm ?? "-"}</td>
                <td>{formatYmd(row.sdate)}</td>
                <td>{formatYmd(row.edate)}</td>
                <td>{row.note ?? "-"}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  No active manager mapping rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

