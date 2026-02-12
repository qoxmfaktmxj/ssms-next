"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { systemLogApi } from "@/features/system-log/api";
import { LogTable } from "@/features/system-log/log-table";
import type { SystemLogRecord } from "@/features/system-log/types";

type LogFilterState = {
  sabun: string;
  actionType: string;
};

export default function SystemLogPage() {
  const [filters, setFilters] = useState<LogFilterState>({ sabun: "", actionType: "" });
  const [query, setQuery] = useState<LogFilterState>({ sabun: "", actionType: "" });
  const [rows, setRows] = useState<SystemLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Load system logs to begin.");
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadLogs = useCallback(
    async (nextPage: number, appliedFilters: LogFilterState) => {
      setIsLoading(true);
      setStatusText("Loading logs...");
      try {
        const response = await systemLogApi.list({
          page: nextPage,
          size,
          sabun: appliedFilters.sabun,
          actionType: appliedFilters.actionType,
        });
        setRows(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setStatusText(`Loaded ${response.content?.length ?? 0} rows.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load logs.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    },
    [size],
  );

  useEffect(() => {
    void loadLogs(0, query);
  }, [loadLogs, query]);

  const applySearch = () => {
    setPage(0);
    setQuery({ ...filters });
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>로그관리</h2>
          <p className="subtle">로그 조회 및 페이징 화면입니다.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Sabun"
          value={filters.sabun}
          onChange={(event) => setFilters((prev) => ({ ...prev, sabun: event.target.value }))}
        />
        <input
          placeholder="Action type"
          value={filters.actionType}
          onChange={(event) => setFilters((prev) => ({ ...prev, actionType: event.target.value }))}
        />
        <button type="button" className="ghost" onClick={applySearch} disabled={isLoading}>조회</button>
      </div>

      <p className="status-text">{statusText}</p>

      <LogTable rows={rows} />

      <div className="pagination">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const nextPage = Math.max(page - 1, 0);
            setPage(nextPage);
            void loadLogs(nextPage, query);
          }}
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
          onClick={() => {
            const nextPage = Math.min(page + 1, totalPages - 1);
            setPage(nextPage);
            void loadLogs(nextPage, query);
          }}
          disabled={page >= totalPages - 1 || isLoading}
        >
          Next
        </button>
      </div>
    </section>
  );
}

