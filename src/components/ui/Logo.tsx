"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/**
 * SOS badge mark, rebuilt as vector so it stays crisp at any size and can be
 * animated. Mirrors the printed logo: yellow disc, roped shield, SOS wordmark,
 * arched "Bakery And Coffee" lockup and the est:2026 footer.
 */
export function Logo({
  size = 48,
  animated = true,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const arcTop = `arc-top-${uid}`;
  const ring = `ring-${uid}`;

  const Wrapper = animated ? motion.svg : "svg";
  const wrapperProps = animated
    ? {
        whileHover: { rotate: 6, scale: 1.06 },
        transition: { type: "spring" as const, stiffness: 320, damping: 18 },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="SOS Bakery And Coffee"
      className={className}
    >
      <defs>
        <path id={arcTop} d="M 26 100 A 74 74 0 0 1 174 100" fill="none" />
        <path id={ring} d="M 100 178 A 78 78 0 0 0 100 22" fill="none" />
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ECFF9B" />
          <stop offset="55%" stopColor="#DFFF3C" />
          <stop offset="100%" stopColor="#C9F016" />
        </linearGradient>
      </defs>

      {/* Yellow disc */}
      <circle cx="100" cy="100" r="99" fill={`url(#g-${uid})`} />

      {/* Arched brand text, top */}
      <text
        fill="#0E0E15"
        fontSize="20.5"
        fontWeight="800"
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
        letterSpacing="0.6"
      >
        <textPath href={`#${arcTop}`} startOffset="50%" textAnchor="middle">
          Bakery And Coffee
        </textPath>
      </text>

      {/* Rope ring around the shield */}
      <circle
        cx="100"
        cy="106"
        r="60"
        fill="none"
        stroke="#0E0E15"
        strokeWidth="9"
        strokeDasharray="5 4.6"
        strokeLinecap="round"
        opacity="0.92"
      />

      {/* Cup / glass / stack pictograms above the shield */}
      <g fill="#0E0E15">
        <rect x="62" y="60" width="15" height="11" rx="2.5" />
        <rect x="64.5" y="57" width="10" height="3" rx="1.5" />
        <rect x="81" y="57" width="10.5" height="14" rx="2" />
        <rect x="99" y="58" width="19" height="4" rx="2" />
        <rect x="99" y="63.5" width="19" height="4" rx="2" />
        <rect x="99" y="69" width="19" height="3.5" rx="1.75" />
        <rect x="123" y="59" width="18" height="4" rx="2" />
        <rect x="123" y="64.5" width="18" height="4" rx="2" />
        <rect x="123" y="70" width="18" height="3.5" rx="1.75" />
      </g>

      {/* Shield */}
      <path
        d="M46 78 H154 V116 C154 146 130 166 100 176 C70 166 46 146 46 116 Z"
        fill="none"
        stroke="#0E0E15"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M44 78 H156" stroke="#0E0E15" strokeWidth="8" strokeLinecap="round" />

      {/* SOS wordmark */}
      <text
        x="100"
        y="132"
        textAnchor="middle"
        fill="#0E0E15"
        fontSize="52"
        fontWeight="800"
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
        letterSpacing="-1"
      >
        SoS
      </text>

      {/* Wheat / wave sheaf at the shield base */}
      <g stroke="#0E0E15" strokeWidth="4.5" fill="none" strokeLinecap="round">
        <path d="M62 156 C82 140 122 140 142 156" />
        <path d="M66 164 C86 148 120 148 140 164" />
        <path d="M72 171 C90 158 114 158 132 171" />
      </g>

      {/* est:2026 */}
      <text
        fill="#0E0E15"
        fontSize="15"
        fontWeight="700"
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
        letterSpacing="1.2"
      >
        <textPath href={`#${ring}`} startOffset="50%" textAnchor="middle">
          est:2026
        </textPath>
      </text>
    </Wrapper>
  );
}
