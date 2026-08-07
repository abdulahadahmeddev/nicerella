/**
 * Type-safe accessors for the Nicerella design system.
 * Values mirror DESIGN_SYSTEM.md (see app/globals.css for the CSS variables).
 */

export const TRUST_LABELS = [
  "highly trustworthy",
  "mostly trustworthy",
  "mixed",
  "suspicious",
  "likely manipulated",
] as const;

export type TrustLabel = (typeof TRUST_LABELS)[number];

export interface TrustConfig {
  label: TrustLabel;
  /** CSS variable for the trust color (e.g. var(--trust-high)). */
  color: string;
  /** Soft tint used behind trust icons. */
  bgColor: string;
  message: string;
}

/** Per-label config used by the trust badge, trust meter, and charts. */
export const TRUST_CONFIG: Record<TrustLabel, TrustConfig> = {
  "highly trustworthy": {
    label: "highly trustworthy",
    color: "var(--trust-high)",
    bgColor: "rgba(16, 185, 129, 0.15)",
    message:
      "Excellent authenticity. Reviews appear genuine with minimal suspicious patterns.",
  },
  "mostly trustworthy": {
    label: "mostly trustworthy",
    color: "var(--trust-medium-high)",
    bgColor: "rgba(34, 197, 94, 0.15)",
    message:
      "Good authenticity. Most reviews appear genuine with minor concerns.",
  },
  mixed: {
    label: "mixed",
    color: "var(--trust-mixed)",
    bgColor: "rgba(245, 158, 11, 0.15)",
    message:
      "Mixed signals. Some reviews show unusual patterns that warrant attention.",
  },
  suspicious: {
    label: "suspicious",
    color: "var(--trust-suspicious)",
    bgColor: "rgba(249, 115, 22, 0.15)",
    message:
      "Multiple red flags detected. Exercise caution with these reviews.",
  },
  "likely manipulated": {
    label: "likely manipulated",
    color: "var(--trust-low)",
    bgColor: "rgba(239, 68, 68, 0.15)",
    message:
      "Strong evidence of manipulation. Reviews may not reflect genuine experiences.",
  },
};

const DEFAULT_TRUST: TrustConfig = TRUST_CONFIG.mixed;

/** Map a trust score (0–1) to its label using the thresholds in section 19. */
export function getTrustLabel(score: number): TrustLabel {
  if (score >= 0.85) return "highly trustworthy";
  if (score >= 0.65) return "mostly trustworthy";
  if (score >= 0.4) return "mixed";
  if (score >= 0.2) return "suspicious";
  return "likely manipulated";
}

/** Map a trust score (0–1) to its color CSS variable. */
export function getTrustColor(score: number): string {
  return TRUST_CONFIG[getTrustLabel(score)].color;
}

/**
 * Look up a trust config by label string (from stored data). Falls back to
 * "mixed" for unknown labels so the UI never renders unstyled.
 */
export function getTrustConfig(label: string): TrustConfig {
  const normalized = label.trim().toLowerCase();
  return isTrustLabel(normalized) ? TRUST_CONFIG[normalized] : DEFAULT_TRUST;
}

export function isTrustLabel(v: string): v is TrustLabel {
  return (TRUST_LABELS as readonly string[]).includes(v);
}

/** Short, human-readable message per label (Quick Reference in DESIGN_SYSTEM.md). */
export const TRUST_MESSAGES: Record<TrustLabel, string> = {
  "highly trustworthy": "Excellent authenticity. Reviews appear genuine.",
  "mostly trustworthy": "Good authenticity with minor concerns.",
  mixed: "Mixed signals. Some reviews show unusual patterns.",
  suspicious: "Multiple red flags detected. Exercise caution.",
  "likely manipulated": "Strong evidence of manipulation.",
};
