import { query } from "@/server/db/pool";

export type SystemLogRow = {
  logId: number;
  sabun: string | null;
  actionType: string;
  requestUrl: string | null;
  ipAddress: string | null;
  successYn: string;
  errorMessage: string | null;
  createdAt: string;
};

export type SystemLogPageResult = {
  content: SystemLogRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const listSystemLogs = async (
  page: number,
  size: number,
  sabun: string,
  actionType: string,
): Promise<SystemLogPageResult> => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.max(size, 1);
  const offset = safePage * safeSize;
  const normalizedSabun = sabun.trim();
  const normalizedActionType = actionType.trim();

  const [contentResult, countResult] = await Promise.all([
    query<SystemLogRow>(
      `
        select
          log_id as "logId",
          sabun,
          action_type as "actionType",
          request_url as "requestUrl",
          ip_address as "ipAddress",
          success_yn as "successYn",
          error_message as "errorMessage",
          created_at as "createdAt"
        from system_log
        where
          ($1 = '' or lower(coalesce(sabun, '')) like lower('%' || $1 || '%'))
          and ($2 = '' or lower(action_type) like lower('%' || $2 || '%'))
        order by created_at desc, log_id desc
        limit $3 offset $4
      `,
      [normalizedSabun, normalizedActionType, safeSize, offset],
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from system_log
        where
          ($1 = '' or lower(coalesce(sabun, '')) like lower('%' || $1 || '%'))
          and ($2 = '' or lower(action_type) like lower('%' || $2 || '%'))
      `,
      [normalizedSabun, normalizedActionType],
    ),
  ]);

  const totalElements = Number(countResult.rows[0]?.total ?? "0");
  const totalPages = Math.ceil(totalElements / safeSize);

  return {
    content: contentResult.rows,
    totalElements,
    totalPages,
    number: safePage,
    size: safeSize,
  };
};
