export type SystemLogRecord = {
  logId: number;
  sabun?: string | null;
  actionType: string;
  requestUrl?: string | null;
  ipAddress?: string | null;
  successYn: "Y" | "N";
  errorMessage?: string | null;
  createdAt: string;
};

export type SystemLogFilters = {
  page: number;
  size: number;
  sabun: string;
  actionType: string;
};
