"use client";

import { useAuth } from "@/features/auth/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="panel">
      <h2>대시보드</h2>
      <p>기본 셸이 준비되었습니다. 도메인 화면을 순차적으로 이 앱으로 이관합니다.</p>
      <dl className="kv-grid">
        <div>
          <dt>이름</dt>
          <dd>{user?.name ?? "-"}</dd>
        </div>
        <div>
          <dt>Sabun</dt>
          <dd>{user?.sabun ?? "-"}</dd>
        </div>
        <div>
          <dt>권한</dt>
          <dd>{user?.roleCd ?? "-"}</dd>
        </div>
        <div>
          <dt>조직</dt>
          <dd>{user?.orgNm ?? "-"}</dd>
        </div>
      </dl>
    </section>
  );
}

