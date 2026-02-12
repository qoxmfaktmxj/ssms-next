import { AuthGate } from "@/features/auth/auth-gate";
import { AppShell } from "@/shared/ui/app-shell";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
