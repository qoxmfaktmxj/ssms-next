"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuickMenuCandidate } from "@/features/system-quick-menu/types";

type CandidateTableProps = {
  rows: QuickMenuCandidate[];
  selectedMenuId: number | null;
  onSelect: (menuId: number) => void;
  onAdd: (candidate: QuickMenuCandidate) => void;
};

export const CandidateTable = ({ rows, selectedMenuId, onSelect, onAdd }: CandidateTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="w-14">선택</TableHead>
            <TableHead>메뉴명</TableHead>
            <TableHead>경로</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                조회된 후보 메뉴가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.menuId}>
                <TableCell>
                  <input
                    type="radio"
                    name="candidate-menu"
                    checked={selectedMenuId === row.menuId}
                    onChange={() => onSelect(row.menuId)}
                  />
                </TableCell>
                <TableCell>{row.menuLabel}</TableCell>
                <TableCell className="max-w-[18rem] break-all">{row.menuPath ?? "-"}</TableCell>
                <TableCell>
                  <Button type="button" variant="outline" size="sm" onClick={() => onAdd(row)}>
                    추가
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



