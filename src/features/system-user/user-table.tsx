"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SystemUser } from "@/features/system-user/types";

type UserTableProps = {
  rows: SystemUser[];
  selectedSabuns: Set<string>;
  onToggleOne: (sabun: string, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onEdit: (row: SystemUser) => void;
  onDelete: (row: SystemUser) => void;
  onResetPassword: (row: SystemUser) => void;
};

export const UserTable = ({
  rows,
  selectedSabuns,
  onToggleOne,
  onToggleAll,
  onEdit,
  onDelete,
  onResetPassword,
}: UserTableProps) => {
  const allSelected = rows.length > 0 && rows.every((row) => selectedSabuns.has(row.sabun));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </TableHead>
            <TableHead>사번</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>조직</TableHead>
            <TableHead>권한</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>전화번호</TableHead>
            <TableHead>사용</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                조회된 사용자 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={`${row.enterCd}-${row.sabun}`}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedSabuns.has(row.sabun)}
                    onChange={(event) => onToggleOne(row.sabun, event.target.checked)}
                  />
                </TableCell>
                <TableCell>{row.sabun}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.orgNm}</TableCell>
                <TableCell>{row.roleCd}</TableCell>
                <TableCell>{row.mailId ?? "-"}</TableCell>
                <TableCell>{row.handPhone ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={row.useYn === "Y" ? "success" : "destructive"}>{row.useYn}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>
                      수정
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(row)}>
                      삭제
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => onResetPassword(row)}>
                      비밀번호 초기화
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};



