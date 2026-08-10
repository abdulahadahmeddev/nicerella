import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "sm" for compact contexts (header), "lg" for hero/footer. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Nicerella Gemmark — a faceted gem/shield abstract mark with purple→cyan
 * gradient. Inline SVG for crisp rendering at any size, no external asset
 * dependencies.
 */
function GemMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Nicerella gem mark"
    >
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="lg2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="lg3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="lg4" x1="1" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="lg5" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="lg6" x1="1" y1="0.3" x2="0" y2="0.8">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="lg7" x1="0" y1="0.2" x2="1" y2="0.9">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="lg8" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="1" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="lg9" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0891b2" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="lg10" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="lg-shine" x1="0.5" y1="0" x2="0.5" y2="0.55">
          <stop offset="0" stopColor="white" stopOpacity="0.30" />
          <stop offset="0.4" stopColor="white" stopOpacity="0.08" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Facets — 10 triangular panels forming a shield/gem silhouette */}
      <polygon points="256,48 136,128 256,228" fill="url(#lg1)" />
      <polygon points="256,48 256,228 376,128" fill="url(#lg2)" />
      <polygon points="136,128 72,256 256,228" fill="url(#lg3)" />
      <polygon points="376,128 256,228 440,256" fill="url(#lg4)" />
      <polygon points="72,256 256,228 148,396" fill="url(#lg5)" />
      <polygon points="256,228 440,256 364,396" fill="url(#lg6)" />
      <polygon points="72,256 148,396 256,228" fill="url(#lg7)" />
      <polygon points="148,396 256,228 364,396" fill="url(#lg8)" />
      <polygon points="148,396 256,472 256,228" fill="url(#lg9)" />
      <polygon points="364,396 256,228 256,472" fill="url(#lg10)" />

      {/* Top shine overlay for 3D depth */}
      <polygon
        points="256,48 136,128 256,228 376,128"
        fill="url(#lg-shine)"
      />

      {/* Gem-cut edge lines */}
      <g
        stroke="white"
        strokeWidth="1.0"
        fill="none"
        opacity="0.20"
        strokeLinecap="round"
      >
        <line x1="256" y1="48" x2="256" y2="228" />
        <line x1="136" y1="128" x2="256" y2="228" />
        <line x1="376" y1="128" x2="256" y2="228" />
        <line x1="72" y1="256" x2="256" y2="228" />
        <line x1="440" y1="256" x2="256" y2="228" />
        <line x1="148" y1="396" x2="256" y2="228" />
        <line x1="364" y1="396" x2="256" y2="228" />
        <line x1="256" y1="472" x2="256" y2="228" />
        <line x1="148" y1="396" x2="364" y2="396" />
      </g>

      {/* Shield outline */}
      <polyline
        points="256,48 136,128 72,256 148,396 256,472 364,396 440,256 376,128 256,48"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        opacity="0.20"
        strokeLinejoin="round"
      />

      {/* Sparkle accent at apex */}
      <g transform="translate(256 34)" fill="#e0e7ff" opacity="0.92">
        <path d="M 0 0 C -4 -10, -4 -10, 0 -26 C 4 -10, 4 -10, 0 0 Z" />
        <path
          d="M 0 0 C -4 -10, -4 -10, 0 -26 C 4 -10, 4 -10, 0 0 Z"
          transform="rotate(90 0 0)"
        />
        <path
          d="M 0 0 C -3 -7, -3 -7, 0 -18 C 3 -7, 3 -7, 0 0 Z"
          transform="rotate(45 0 0)"
        />
        <path
          d="M 0 0 C -3 -7, -3 -7, 0 -18 C 3 -7, 3 -7, 0 0 Z"
          transform="rotate(135 0 0)"
        />
        <path
          d="M 0 0 C -3 -7, -3 -7, 0 -18 C 3 -7, 3 -7, 0 0 Z"
          transform="rotate(225 0 0)"
        />
        <path
          d="M 0 0 C -3 -7, -3 -7, 0 -18 C 3 -7, 3 -7, 0 0 Z"
          transform="rotate(315 0 0)"
        />
        <circle cx="0" cy="0" r="3" fill="white" />
      </g>
    </svg>
  );
}

/**
 * Nicerella logo — Gemmark + lowercase wordmark. Links to home.
 */
export function Logo({ size = "sm", className }: LogoProps) {
  const markSize = size === "lg" ? 36 : 28;
  const wordmark = size === "lg" ? "text-xl" : "text-base";

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Nicerella — home"
    >
      <GemMark size={markSize} />
      <span
        className={cn(
          "font-bold tracking-tight text-[var(--color-foreground)]",
          wordmark
        )}
      >
        nicerella
      </span>
    </Link>
  );
}
