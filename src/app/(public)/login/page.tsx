"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

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
    <div className="auth-page">
      <section className="auth-card">
        <h1>SSMS 로그인</h1>
        <p>기존 SSMS 계정으로 로그인하세요.</p>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            <span>회사코드</span>
            <input
              name="enterCd"
              value={enterCd}
              onChange={(event) => setEnterCd(event.target.value)}
              autoComplete="organization"
              required
            />
          </label>
          <label>
            <span>Sabun</span>
            <input
              name="sabun"
              value={sabun}
              onChange={(event) => setSabun(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </section>
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

