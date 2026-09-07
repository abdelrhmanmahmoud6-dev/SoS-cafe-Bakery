import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: "SOS Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The login page renders inside this layout too, before a session exists —
  // so render children bare rather than the signed-in shell.
  if (!session) return <>{children}</>;

  return <AdminShell adminName={session.email}>{children}</AdminShell>;
}
