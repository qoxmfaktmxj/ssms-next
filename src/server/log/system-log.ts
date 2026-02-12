import { query } from "@/server/db/pool";

type SaveLogInput = {
  sabun: string | null;
  actionType: string;
  requestUrl: string;
  ipAddress: string;
  success: boolean;
  errorMessage?: string | null;
};

export const saveSystemLog = async ({
  sabun,
  actionType,
  requestUrl,
  ipAddress,
  success,
  errorMessage,
}: SaveLogInput): Promise<void> => {
  try {
    await query(
      `
        insert into system_log
          (sabun, action_type, request_url, ip_address, success_yn, error_message)
        values
          ($1, $2, $3, $4, $5, $6)
      `,
      [
        sabun,
        actionType,
        requestUrl,
        ipAddress,
        success ? "Y" : "N",
        errorMessage ?? null,
      ],
    );
  } catch {
    // Logging failure should not block API responses.
  }
};
