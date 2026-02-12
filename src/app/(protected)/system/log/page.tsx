"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [statusText, setStatusText] = useState("로그를 불러오세요.");
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadLogs = useCallback(
    async (nextPage: number, appliedFilters: LogFilterState) => {
      setIsLoading(true);
      setStatusText("로그 조회 중...");
      try {
        const response = await systemLogApi.list({
          page: nextPage,
          size,
          sabun: appliedFilters.sabun,
          actionType: appliedFilters.actionType,
        });
        setRows(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setStatusText(`${response.content?.length ?? 0}건 조회되었습니다.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "로그 조회에 실패했습니다.";
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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="사번"
          value={filters.sabun}
          onChange={(event) => setFilters((prev) => ({ ...prev, sabun: event.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="액션 타입"
          value={filters.actionType}
          onChange={(event) => setFilters((prev) => ({ ...prev, actionType: event.target.value }))}
          className="w-44"
        />
        <Button type="button" variant="outline" onClick={applySearch} disabled={isLoading}>
          조회
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <LogTable rows={rows} />

      <div className="pagination">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextPage = Math.max(page - 1, 0);
            setPage(nextPage);
            void loadLogs(nextPage, query);
          }}
          disabled={page === 0 || isLoading}
        >이전</Button>
        <span>
          페이지 {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextPage = Math.min(page + 1, totalPages - 1);
            setPage(nextPage);
            void loadLogs(nextPage, query);
          }}
          disabled={page >= totalPages - 1 || isLoading}
        >다음</Button>
      </div>
    </section>
  );
}


