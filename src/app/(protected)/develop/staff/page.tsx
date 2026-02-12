"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [statusText, setStatusText] = useState("인력 데이터를 불러오세요.");
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
      setStatusText("인력 목록 조회 중...");
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
        setStatusText(`목록1 ${response.content?.length ?? 0}건, 목록2 ${response2.content?.length ?? 0}건 조회되었습니다.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "인력 목록 조회에 실패했습니다.";
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
          <h2>추가개발 인력 관리</h2>
          <p className="subtle">추가개발 인력 조회(목록1/목록2) 화면입니다.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="Start YM (YYYYMM)"
          value={filters.startDate}
          onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="End YM (YYYYMM)"
          value={filters.endDate}
          onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          className="w-40"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(0);
            setPage2(0);
            setQuery({ ...filters });
          }}
          disabled={isLoading}
        >
          조회
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <h3>인력 목록 1</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>고객사</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>투입 인력</TableHead>
              <TableHead>개발 기간</TableHead>
              <TableHead>계약 금액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.requestCompanyCd}:${row.projectNm ?? "project"}:${index}`}>
                <TableCell>{row.requestCompanyNm ?? row.requestCompanyCd}</TableCell>
                <TableCell>{row.projectNm ?? "-"}</TableCell>
                <TableCell>{row.partNm ?? row.partCd ?? "-"}</TableCell>
                <TableCell>{row.inputManPower ?? "-"}</TableCell>
                <TableCell>
                  {formatYmd(row.developStdDt)} ~ {formatYmd(row.developEndDt)}
                </TableCell>
                <TableCell>{row.contractPrice ?? 0}</TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  조회된 인력 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="pagination">
        <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0 || isLoading}>이전</Button>
        <span>
          페이지 {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
          disabled={page >= totalPages - 1 || isLoading}
        >다음</Button>
      </div>

      <h3>인력 목록 2</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>고객사</TableHead>
              <TableHead>프로젝트/요청</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>월 기간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows2.map((row, index) => (
              <TableRow key={`${row.requestCompanyCd}:${row.projectNm ?? "request"}:${index}:list2`}>
                <TableCell>{row.requestCompanyNm ?? row.requestCompanyCd}</TableCell>
                <TableCell>{row.projectNm ?? "-"}</TableCell>
                <TableCell>{row.partNm ?? row.partCd ?? "-"}</TableCell>
                <TableCell>{row.inspectionYn ?? "-"}</TableCell>
                <TableCell>
                  {formatYm(row.startYm)} ~ {formatYm(row.endYm)}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows2.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  조회된 인력 데이터(목록2)가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="pagination">
        <Button type="button" variant="outline" size="sm" onClick={() => setPage2((current) => Math.max(current - 1, 0))} disabled={page2 === 0 || isLoading}>이전</Button>
        <span>
          페이지 {page2 + 1} / {totalPages2}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPage2((current) => Math.min(current + 1, totalPages2 - 1))}
          disabled={page2 >= totalPages2 - 1 || isLoading}
        >다음</Button>
      </div>
    </section>
  );
}



