"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/admin";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/ui/Logo";

export function LoginForm() {
  const { sh } = useI18n();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  const errorText =
    state.error === "INVALID"
      ? sh.admin.invalidCreds
      : state.error === "MISSING"
        ? sh.admin.missingCreds
        : null;

  const inputClass =
    "h-13 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 text-cream placeholder:text-muted-dim transition-colors duration-200 focus:border-gold-500/60 focus:outline-none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm"
    >
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <Logo size={72} />
        <h1 className="text-2xl font-extrabold text-cream">{sh.admin.brand}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-dim">
          <Lock aria-hidden className="size-3.5" />
          {sh.admin.login}
        </p>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-3xl border border-ink-700 bg-ink-900/80 p-6 shadow-float"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-cream">
            {sh.admin.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            dir="ltr"
            defaultValue=""
            className={`${inputClass} font-en text-start`}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-bold text-cream"
          >
            {sh.admin.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            dir="ltr"
            className={`${inputClass} font-en text-start`}
          />
        </div>

        {errorText && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200"
          >
            <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            {errorText}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gold-500 px-5 font-extrabold text-ink-950 shadow-glow transition-colors duration-200 hover:bg-gold-400 disabled:opacity-60"
        >
          {pending && <Loader2 aria-hidden className="size-5 animate-spin" />}
          {pending ? sh.admin.signingIn : sh.admin.signIn}
        </button>
      </form>
    </motion.div>
  );
}
