import { request } from "@/shared/api/http";
import type { SystemMenuDraft, SystemMenuRecord } from "@/features/system-menu/types";

type MenuListResponse = {
  content?: SystemMenuRecord[];
};

type DeleteResponse = {
  succeeded: number;
  failed: number;
};

const buildListPath = (keyword: string): string => {
  const params = new URLSearchParams();
  if (keyword.trim().length > 0) {
    params.set("keyword", keyword.trim());
  }
  const query = params.toString();
  return query.length > 0 ? `/menu/list?${query}` : "/menu/list";
};

const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPayload = (draft: SystemMenuDraft) => ({
  menuId: Number(draft.menuId),
  parentMenuId: toNullableNumber(draft.parentMenuId),
  menuLabel: draft.menuLabel.trim(),
  menuPath: draft.menuPath.trim() || null,
  menuIcon: draft.menuIcon.trim() || null,
  seq: toNullableNumber(draft.seq),
  useYn: draft.useYn,
});

export const systemMenuApi = {
  list: async (keyword: string): Promise<SystemMenuRecord[]> => {
    const response = await request<MenuListResponse>(buildListPath(keyword));
    return response.content ?? [];
  },
  create: async (draft: SystemMenuDraft): Promise<SystemMenuRecord> => {
    return request<SystemMenuRecord>("/menu/insert", {
      method: "POST",
      body: toPayload(draft),
    });
  },
  update: async (draft: SystemMenuDraft): Promise<SystemMenuRecord> => {
    return request<SystemMenuRecord>("/menu/update", {
      method: "PUT",
      body: toPayload(draft),
    });
  },
  deleteMany: async (menuIds: number[]): Promise<DeleteResponse> => {
    return request<DeleteResponse>("/menu/delete", {
      method: "DELETE",
      body: {
        deleteList: menuIds.map((menuId) => ({ menuId })),
      },
    });
  },
};
