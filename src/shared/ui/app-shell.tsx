"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useMenuTree } from "@/features/menu/use-menu-tree";
import { MenuTree } from "@/shared/ui/menu-tree";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { menu, isLoading: menuLoading, error } = useMenuTree(isAuthenticated);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="shell-layout">
      <aside className="shell-sidebar">
        <div className="brand">
          <h1>SSMS Next</h1>
          <p>마이그레이션 워크스페이스</p>
        </div>
        {menuLoading && <p className="subtle">메뉴 불러오는 중...</p>}
        {error && <p className="error-text">{error}</p>}
        {!menuLoading && !error && <MenuTree items={menu} />}
      </aside>
      <div className="shell-main">
        <header className="shell-header">
          <div>
            <p className="subtle">로그인 사용자</p>
            <strong>{user?.name ?? user?.sabun ?? "알 수 없는 사용자"}</strong>
          </div>
          <nav className="header-actions">
            <Link href="/dashboard">대시보드</Link>
            <button type="button" className="logout-button" onClick={handleLogout}>
              <span aria-hidden="true">⎋</span>
              <span>로그아웃</span>
            </button>
          </nav>
        </header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};


