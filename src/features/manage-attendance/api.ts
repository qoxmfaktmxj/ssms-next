import type { AttendanceDraft, AttendanceRecord, CodeOption } from "@/features/manage-attendance/types";
import { request } from "@/shared/api/http";

const normalizeDate = (value: string): string => value.trim().replaceAll("-", "");

const toPayload = (draft: AttendanceDraft) => ({
  id: draft.id,
  sabun: draft.sabun.trim(),
  sdate: normalizeDate(draft.sdate),
  edate: normalizeDate(draft.edate),
  gntCd: draft.gntCd.trim() || null,
  statusCd: draft.statusCd.trim() || null,
  note: draft.note.trim() || null,
  applyDate: normalizeDate(draft.applyDate),
});

export const manageAttendanceApi = {
  list: () => request<AttendanceRecord[]>("/attendance/list"),
  create: (draft: AttendanceDraft) =>
    request<AttendanceRecord>("/attendance/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: AttendanceDraft) =>
    request<AttendanceRecord>("/attendance/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteOne: (id: number, sabun: string) =>
    request<void>("/attendance/delete", {
      method: "DELETE",
      body: { id, sabun },
    }),
  listCode: (groupCode: string) =>
    request<CodeOption[]>(`/code/list?${new URLSearchParams({ grcodeCd: groupCode }).toString()}`),
};
