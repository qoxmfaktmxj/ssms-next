"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { developStaffApi } from "@/features/develop-staff/api";
import type { DevelopStaff } from "@/features/develop-staff/types";

const formatYm = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 6) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
};

const formatYmd = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export default function DevelopStaffPage() {
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [query, setQuery] = useState({ startDate: "", endDate: "" });
  const [rows, setRows] = useState<DevelopStaff[]>([]);
  const [rows2, setRows2] = useState<DevelopStaff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Load staff data to begin.");
  const [page, setPage] = useState(0);
  const [page2, setPage2] = useState(0);
  const [size] = useState(20);
  const [size2] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalElements2, setTotalElements2] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);
  const totalPages2 = useMemo(() => Math.max(Math.ceil(totalElements2 / size2), 1), [size2, totalElements2]);

  const loadRows = useCallback(
    async (nextPage: number, nextPage2: number, nextQuery: { startDate: string; endDate: string }) => {
      setIsLoading(true);
      setStatusText("Loading staff lists...");
      try {
        const common = { startDate: nextQuery.startDate, endDate: nextQuery.endDate };
        const [response, response2] = await Promise.all([
          developStaffApi.list({ ...common, page: nextPage, size }),
          developStaffApi.list2({ ...common, page: nextPage2, size: size2 }),
        ]);
        setRows(response.content ?? []);
        setRows2(response2.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setTotalElements2(response2.totalElements ?? 0);
        setStatusText(`Loaded table1=${response.content?.length ?? 0}, table2=${response2.content?.length ?? 0}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load staff lists.";
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

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>추가개발인력관리</h2>
          <p className="subtle">추가개발 인력 조회(목록1/목록2) 화면입니다.</p>
        </div>
      </header>

      <div className="toolbar">
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
      </div>

      <p className="status-text">{statusText}</p>

      <h3>Staff List 1</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Project</th>
              <th>Part</th>
              <th>Input Man Power</th>
              <th>Develop Period</th>
              <th>Contract Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.requestCompanyCd}:${row.projectNm ?? "project"}:${index}`}>
                <td>{row.requestCompanyNm ?? row.requestCompanyCd}</td>
                <td>{row.projectNm ?? "-"}</td>
                <td>{row.partNm ?? row.partCd ?? "-"}</td>
                <td>{row.inputManPower ?? "-"}</td>
                <td>
                  {formatYmd(row.developStdDt)} ~ {formatYmd(row.developEndDt)}
                </td>
                <td>{row.contractPrice ?? 0}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No staff rows found.
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

      <h3>Staff List 2</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Project/Request</th>
              <th>Part</th>
              <th>Status</th>
              <th>Month Period</th>
            </tr>
          </thead>
          <tbody>
            {rows2.map((row, index) => (
              <tr key={`${row.requestCompanyCd}:${row.projectNm ?? "request"}:${index}:list2`}>
                <td>{row.requestCompanyNm ?? row.requestCompanyCd}</td>
                <td>{row.projectNm ?? "-"}</td>
                <td>{row.partNm ?? row.partCd ?? "-"}</td>
                <td>{row.inspectionYn ?? "-"}</td>
                <td>
                  {formatYm(row.startYm)} ~ {formatYm(row.endYm)}
                </td>
              </tr>
            ))}
            {!isLoading && rows2.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No staff list2 rows found.
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
    </section>
  );
}

