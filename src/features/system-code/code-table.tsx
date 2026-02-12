"use client";

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
            <th>Group</th>
            <th>Code</th>
            <th>Name</th>
            <th>Eng Name</th>
            <th>Seq</th>
            <th>Use</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-row">
                No code data found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = uniqueKey(row);
              return (
                <tr key={key}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(event) => onToggleOne(key, event.target.checked)}
                    />
                  </td>
                  <td>{row.grcodeCd}</td>
                  <td>{row.code}</td>
                  <td>{row.codeNm}</td>
                  <td>{row.codeEngNm ?? "-"}</td>
                  <td>{row.seq ?? "-"}</td>
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

