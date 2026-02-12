import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="centered-state">
      <h2>페이지를 찾을 수 없습니다</h2>
      <p className="subtle">현재 마이그레이션 범위에 없는 경로입니다.</p>
      <Link href="/dashboard">대시보드로 이동</Link>
    </div>
  );
}

