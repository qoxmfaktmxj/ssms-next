"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [enterCd, setEnterCd] = useState("SSMS");
  const [sabun, setSabun] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }
    const redirectPath = searchParams.get("redirect") ?? "/dashboard";
    router.replace(redirectPath === "/login" ? "/dashboard" : redirectPath);
  }, [isAuthenticated, isLoading, router, searchParams]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login({ enterCd, sabun, password });
      if (result.statusCode === "200") {
        const redirectPath = searchParams.get("redirect") ?? "/dashboard";
        router.replace(redirectPath);
        return;
      }
      setErrorMessage(result.message ?? "Login failed");
    } catch {
      setErrorMessage("로그인 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="centered-state">세션 확인 중...</div>;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dce8ff_0%,transparent_38%),radial-gradient(circle_at_left_85%,#eaf0f8_0%,transparent_35%),#f3f6fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full">
          <CardHeader className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <LogIn className="h-5 w-5" />
            </div>
            <CardTitle>SSMS 로그인</CardTitle>
            <CardDescription>기존 SSMS 계정으로 로그인하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enterCd">회사코드</Label>
                <Input
                  id="enterCd"
                  name="enterCd"
                  value={enterCd}
                  onChange={(event) => setEnterCd(event.target.value)}
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sabun">Sabun</Label>
                <Input
                  id="sabun"
                  name="sabun"
                  value={sabun}
                  onChange={(event) => setSabun(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {errorMessage && <p className="text-sm font-medium text-rose-600">{errorMessage}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="centered-state">로그인 페이지 로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}

