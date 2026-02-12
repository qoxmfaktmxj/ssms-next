"use client";

import type { QuickMenuCandidate } from "@/features/system-quick-menu/types";

type CandidateTableProps = {
  rows: QuickMenuCandidate[];
  selectedMenuId: number | null;
  onSelect: (menuId: number) => void;
  onAdd: (candidate: QuickMenuCandidate) => void;
};

export const CandidateTable = ({ rows, selectedMenuId, onSelect, onAdd }: CandidateTableProps) => {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: "3.5rem" }}>Pick</th>
            <th>Menu Label</th>
            <th>Path</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty-row">
                No candidate menu found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.menuId}>
                <td>
                  <input
                    type="radio"
                    name="candidate-menu"
                    checked={selectedMenuId === row.menuId}
                    onChange={() => onSelect(row.menuId)}
                  />
                </td>
                <td>{row.menuLabel}</td>
                <td className="path-cell">{row.menuPath ?? "-"}</td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => onAdd(row)}>
                    Add
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

