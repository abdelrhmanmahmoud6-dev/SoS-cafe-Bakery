"use client";

import { PackageSearch } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Motion";

export function TrackPageHeader() {
  const { sh } = useI18n();

  return (
    <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-4 text-center">
      <Reveal>
        <span className="flex size-16 items-center justify-center rounded-3xl bg-gold-500/12 text-gold-500 ring-1 ring-gold-500/25">
          <PackageSearch aria-hidden className="size-8" />
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {sh.track.title}
        </h1>
      </Reveal>
      <Reveal delay={0.16}>
        <p className="max-w-md leading-relaxed text-muted">{sh.track.subtitle}</p>
      </Reveal>
    </div>
  );
}
