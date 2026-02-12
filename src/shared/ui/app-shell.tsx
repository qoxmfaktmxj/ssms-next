"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useMenuTree } from "@/features/menu/use-menu-tree";
import { Button } from "@/components/ui/button";
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
    <div className="grid h-screen overflow-hidden lg:grid-cols-[18.5rem_1fr]">
      <aside className="overflow-y-auto border-r border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-4 lg:sticky lg:top-0 lg:h-screen">
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <h1 className="text-lg font-semibold text-blue-900">SSMS Next</h1>
          <p className="mt-1 text-xs text-slate-500">마이그레이션 워크스페이스</p>
        </div>
        {menuLoading && <p className="text-sm text-slate-500">메뉴 불러오는 중...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!menuLoading && !error && <MenuTree items={menu} />}
      </aside>
      <div className="grid min-w-0 grid-rows-[auto_1fr] overflow-hidden lg:h-screen">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs text-slate-500">로그인 사용자</p>
            <strong className="text-sm text-slate-900">{user?.name ?? user?.sabun ?? "알 수 없는 사용자"}</strong>
          </div>
          <nav className="flex items-center gap-2">
            <Link className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50" href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              <span>대시보드</span>
            </Link>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </nav>
        </header>
        <main className="overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
};


