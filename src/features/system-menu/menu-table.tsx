"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SystemMenuRecord } from "@/features/system-menu/types";

type MenuTableProps = {
  rows: SystemMenuRecord[];
  selectedIds: Set<number>;
  onToggleOne: (menuId: number, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onEdit: (row: SystemMenuRecord) => void;
  onDelete: (row: SystemMenuRecord) => void;
};

export const MenuTable = ({
  rows,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onEdit,
  onDelete,
}: MenuTableProps) => {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.menuId));

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
            <TableHead>메뉴 ID</TableHead>
            <TableHead>상위 ID</TableHead>
            <TableHead>메뉴명</TableHead>
            <TableHead>경로</TableHead>
            <TableHead>아이콘</TableHead>
            <TableHead>순번</TableHead>
            <TableHead>사용</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                조회된 메뉴 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const checked = selectedIds.has(row.menuId);
              return (
                <TableRow key={row.menuId}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onToggleOne(row.menuId, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{row.menuId}</TableCell>
                  <TableCell>{row.parentMenuId ?? "-"}</TableCell>
                  <TableCell>{row.menuLabel}</TableCell>
                  <TableCell className="max-w-[20rem] break-all">{row.menuPath ?? "-"}</TableCell>
                  <TableCell>{row.menuIcon ?? "-"}</TableCell>
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



