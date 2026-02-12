import type { UserDraft, SystemUser } from "@/features/system-user/types";
import { request } from "@/shared/api/http";

type UserListResponse = {
  content: SystemUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type UserMutationResponse = {
  succeeded: number;
  failed: number;
};

type UserFilters = {
  page: number;
  size: number;
  keyword: string;
  orgNm: string;
  roleCd: string;
};

const toPayload = (draft: UserDraft) => ({
  sabun: draft.sabun.trim(),
  name: draft.name.trim(),
  orgCd: draft.orgCd.trim(),
  orgNm: draft.orgNm.trim(),
  mailId: draft.mailId.trim() || null,
  jikweeNm: draft.jikweeNm.trim() || null,
  useYn: draft.useYn,
  handPhone: draft.handPhone.trim() || null,
  note: draft.note.trim() || null,
  roleCd: draft.roleCd.trim(),
});

const buildListPath = (filters: UserFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }
  if (filters.orgNm.trim()) {
    params.set("orgNm", filters.orgNm.trim());
  }
  if (filters.roleCd.trim()) {
    params.set("roleCd", filters.roleCd.trim());
  }
  return `/user/list?${params.toString()}`;
};

export const systemUserApi = {
  list: (filters: UserFilters) => request<UserListResponse>(buildListPath(filters)),
  create: (draft: UserDraft) =>
    request<SystemUser>("/user/insert", {
      method: "POST",
      body: toPayload(draft),
    }),
  update: (draft: UserDraft) =>
    request<SystemUser>("/user/update", {
      method: "PUT",
      body: toPayload(draft),
    }),
  deleteMany: (items: Array<{ sabun: string; enterCd: string }>) =>
    request<UserMutationResponse>("/user/delete", {
      method: "DELETE",
      body: items,
    }),
  resetPassword: (sabun: string, enterCd: string) =>
    request<UserMutationResponse>("/user/reset-password", {
      method: "POST",
      body: { sabun, enterCd },
    }),
};
