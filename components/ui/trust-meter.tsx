"use client";

import * as React from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  ShieldCheckIcon,
  ShieldWarningIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { getTrustConfig, getTrustLabel, isTrustLabel } from "@/lib/design-tokens";
import type { TrustLabel } from "@/lib/design-tokens";

const ICON_BY_LABEL: Record<TrustLabel, React.ComponentType<IconProps>> = {
  "highly trustworthy": ShieldCheckIcon,
  "mostly trustworthy": ShieldCheckIcon,
  mixed: ShieldWarningIcon,
  suspicious: ShieldWarningIcon,
  "likely manipulated": ShieldIcon,
};

interface TrustMeterProps {
  /** Trust score between 0 and 1. */
  score: number;
  /** Optional stored label; derived from score when omitted. */
  label?: string;
  /** Compact variant renders at a smaller height (used on cards). */
  compact?: boolean;
  /** Estimated fake/bot review percentage (0–100) — full variant only. */
  fakePercentage?: number;
  /** Authenticity confidence (0–1) — full variant only. */
  confidence?: number;
  className?: string;
}

/**
 * Signature trust score visualization — animated progress bar with label,
 * icon, and score percentage. Uses the design-system trust colors.
 * Full (non-compact) variant also renders the config message and, when
 * provided, the fake-review percentage and analysis confidence.
 */
export function TrustMeter({
  score,
  label,
  compact = false,
  fakePercentage,
  confidence,
  className,
}: TrustMeterProps) {
  const [animated, setAnimated] = React.useState(0);
  const trimmed = label?.trim();
  const resolvedLabel = trimmed && isTrustLabel(trimmed) ? trimmed : getTrustLabel(score);
  const config = getTrustConfig(resolvedLabel);
  const IconComponent = ICON_BY_LABEL[resolvedLabel];
  const percent = Math.round(score * 100);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(score));
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Score row: icon, label, percent */}
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <IconComponent size={18} weight="fill" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold capitalize text-[var(--color-foreground)]">
          {resolvedLabel}
        </span>
        <span className="ml-auto text-lg font-bold tabular-nums" style={{ color: config.color }}>
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]",
          compact ? "h-1.5" : "h-2.5"
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Trust score: ${resolvedLabel}, ${percent}%`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.round(animated * 100)}%`,
            backgroundColor: config.color,
          }}
        />
      </div>

      {/* Full variant: message + stats */}
      {!compact && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-foreground-muted)]">{config.message}</p>
          {(fakePercentage !== undefined || confidence !== undefined) && (
            <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4">
              {fakePercentage !== undefined && (
                <div>
                  <div className="text-xs text-[var(--color-foreground-muted)] mb-1">
                    Estimated Fake Reviews
                  </div>
                  <div className="text-lg font-semibold tabular-nums text-[var(--color-foreground)]">
                    {Math.round(fakePercentage)}%
                  </div>
                </div>
              )}
              {confidence !== undefined && (
                <div>
                  <div className="text-xs text-[var(--color-foreground-muted)] mb-1">
                    Analysis Confidence
                  </div>
                  <div className="text-lg font-semibold tabular-nums text-[var(--color-foreground)]">
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-xs italic text-[var(--color-foreground-muted)]">
            This is an AI estimate based on available data, not a certified fraud determination.
          </p>
        </div>
      )}
    </div>
  );
}
