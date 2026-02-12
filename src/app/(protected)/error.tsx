"use client";

import { useEffect } from "react";

type ProtectedErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: ProtectedErrorProps) {
  useEffect(() => {
    // Keep basic console output during migration to speed up debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="centered-state">
      <h2>문제가 발생했습니다</h2>
      <p className="subtle">보호된 화면 렌더링에 실패했습니다.</p>
      <button type="button" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}

