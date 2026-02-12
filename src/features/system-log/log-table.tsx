"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>ID</TableHead>
            <TableHead>생성일시</TableHead>
            <TableHead>사번</TableHead>
            <TableHead>작업</TableHead>
            <TableHead>요청 URL</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>결과</TableHead>
            <TableHead>오류</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                조회된 로그 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.logId}>
                <TableCell>{row.logId}</TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell>{row.sabun ?? "-"}</TableCell>
                <TableCell>{row.actionType}</TableCell>
                <TableCell className="max-w-[24rem] break-all">{row.requestUrl ?? "-"}</TableCell>
                <TableCell>{row.ipAddress ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={row.successYn === "Y" ? "success" : "destructive"}>{row.successYn}</Badge>
                </TableCell>
                <TableCell>{row.errorMessage ?? "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};




