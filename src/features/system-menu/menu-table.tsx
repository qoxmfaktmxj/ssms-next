"use client";

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
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </th>
            <th>Menu ID</th>
            <th>Parent ID</th>
            <th>Label</th>
            <th>Path</th>
            <th>Icon</th>
            <th>Seq</th>
            <th>Use</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="empty-row">
                No menu rows found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const checked = selectedIds.has(row.menuId);
              return (
                <tr key={row.menuId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onToggleOne(row.menuId, event.target.checked)}
                    />
                  </td>
                  <td>{row.menuId}</td>
                  <td>{row.parentMenuId ?? "-"}</td>
                  <td>{row.menuLabel}</td>
                  <td className="path-cell">{row.menuPath ?? "-"}</td>
                  <td>{row.menuIcon ?? "-"}</td>
                  <td>{row.seq ?? "-"}</td>
                  <td>
                    <span className={row.useYn === "Y" ? "badge green" : "badge red"}>{row.useYn}</span>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="ghost" onClick={() => onEdit(row)}>수정</button>
                    <button type="button" className="danger" onClick={() => onDelete(row)}>삭제</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

