"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [statusText, setStatusText] = useState("유지보수 통계 데이터를 불러오세요.");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusText("유지보수 통계 조회 중...");
      try {
        const response = await manageManagerStatusApi.list();
        setRows(response);
        setStatusText(`${response.length}건 조회되었습니다.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "유지보수 통계 조회에 실패했습니다.";
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
          <p className="subtle">활성 유지보수 담당자와 고객사 매핑 조회 화면입니다.</p>
        </div>
      </header>

      <p className="status-text">{statusText}</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>사번</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>고객사 코드</TableHead>
              <TableHead>고객사명</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.sabun}:${row.companyCd}:${row.sdate ?? ""}`}>
                <TableCell>{row.sabun}</TableCell>
                <TableCell>{row.name ?? "-"}</TableCell>
                <TableCell>{row.companyCd}</TableCell>
                <TableCell>{row.companyNm ?? "-"}</TableCell>
                <TableCell>{formatYmd(row.sdate)}</TableCell>
                <TableCell>{formatYmd(row.edate)}</TableCell>
                <TableCell>{row.note ?? "-"}</TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  활성 매핑 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}




