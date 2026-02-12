"use client";

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
            <th>Sabun</th>
            <th>Name</th>
            <th>Org</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Use</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="empty-row">
                User 데이터가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${row.enterCd}-${row.sabun}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSabuns.has(row.sabun)}
                    onChange={(event) => onToggleOne(row.sabun, event.target.checked)}
                  />
                </td>
                <td>{row.sabun}</td>
                <td>{row.name}</td>
                <td>{row.orgNm}</td>
                <td>{row.roleCd}</td>
                <td>{row.mailId ?? "-"}</td>
                <td>{row.handPhone ?? "-"}</td>
                <td>
                  <span className={row.useYn === "Y" ? "badge green" : "badge red"}>{row.useYn}</span>
                </td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => onEdit(row)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(row)}>
                    Delete
                  </button>
                  <button type="button" className="ghost" onClick={() => onResetPassword(row)}>
                    Reset PW
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

