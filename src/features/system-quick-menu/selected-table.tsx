"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuickMenuItem } from "@/features/system-quick-menu/types";

type SelectedTableProps = {
  rows: QuickMenuItem[];
  selectedMenuId: number | null;
  onSelect: (menuId: number) => void;
  onRemove: (menuId: number) => void;
};

export const SelectedTable = ({ rows, selectedMenuId, onSelect, onRemove }: SelectedTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="w-14">선택</TableHead>
            <TableHead className="w-16">순번</TableHead>
            <TableHead>메뉴명</TableHead>
            <TableHead>경로</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                등록된 퀵메뉴가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.menuId}>
                <TableCell>
                  <input
                    type="radio"
                    name="quick-menu"
                    checked={selectedMenuId === row.menuId}
                    onChange={() => onSelect(row.menuId)}
                  />
                </TableCell>
                <TableCell>{row.seq}</TableCell>
                <TableCell>{row.menuLabel}</TableCell>
                <TableCell className="max-w-[18rem] break-all">{row.menuPath ?? "-"}</TableCell>
                <TableCell>
                  <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(row.menuId)}>
                    제거
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};



