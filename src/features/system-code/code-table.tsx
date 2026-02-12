"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SystemCode } from "@/features/system-code/types";

type CodeTableProps = {
  rows: SystemCode[];
  selectedKeys: Set<string>;
  onToggleOne: (key: string, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onEdit: (row: SystemCode) => void;
  onDelete: (row: SystemCode) => void;
};

const uniqueKey = (row: SystemCode) => `${row.grcodeCd}:${row.code}`;

export const CodeTable = ({
  rows,
  selectedKeys,
  onToggleOne,
  onToggleAll,
  onEdit,
  onDelete,
}: CodeTableProps) => {
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.has(uniqueKey(row)));

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
            <TableHead>그룹</TableHead>
            <TableHead>코드</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>영문명</TableHead>
            <TableHead>순번</TableHead>
            <TableHead>사용</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                조회된 코드 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const key = uniqueKey(row);
              return (
                <TableRow key={key}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(event) => onToggleOne(key, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{row.grcodeCd}</TableCell>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.codeNm}</TableCell>
                  <TableCell>{row.codeEngNm ?? "-"}</TableCell>
                  <TableCell>{row.seq ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={row.useYn === "Y" ? "success" : "destructive"}>{row.useYn}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                        수정
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(row)}>
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};



