"use client";

import type { QuickMenuItem } from "@/features/system-quick-menu/types";

type SelectedTableProps = {
  rows: QuickMenuItem[];
  selectedMenuId: number | null;
  onSelect: (menuId: number) => void;
  onRemove: (menuId: number) => void;
};

export const SelectedTable = ({ rows, selectedMenuId, onSelect, onRemove }: SelectedTableProps) => {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: "3.5rem" }}>Pick</th>
            <th style={{ width: "4rem" }}>Seq</th>
            <th>Menu Label</th>
            <th>Path</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-row">
                Quick menu is empty.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.menuId}>
                <td>
                  <input
                    type="radio"
                    name="quick-menu"
                    checked={selectedMenuId === row.menuId}
                    onChange={() => onSelect(row.menuId)}
                  />
                </td>
                <td>{row.seq}</td>
                <td>{row.menuLabel}</td>
                <td className="path-cell">{row.menuPath ?? "-"}</td>
                <td className="row-actions">
                  <button type="button" className="danger" onClick={() => onRemove(row.menuId)}>
                    Remove
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

