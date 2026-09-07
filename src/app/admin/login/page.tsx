import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Already signed in? Skip the form.
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <LoginForm />
    </main>
  );
}
