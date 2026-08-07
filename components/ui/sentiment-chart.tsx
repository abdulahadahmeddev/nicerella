"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentChartProps {
  breakdown: SentimentBreakdown;
  className?: string;
}

/**
 * Horizontal stacked bar chart for sentiment breakdown.
 * Animates on mount with CSS transitions.
 */
export function SentimentChart({ breakdown, className }: SentimentChartProps) {
  const [animated, setAnimated] = React.useState<SentimentBreakdown>({
    positive: 0,
    neutral: 0,
    negative: 0,
  });

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(breakdown));
    return () => cancelAnimationFrame(id);
  }, [breakdown]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stacked bar */}
      <div
        className="flex h-8 overflow-hidden rounded-lg bg-[var(--color-surface-elevated)]"
        role="img"
        aria-label={`Sentiment: ${Math.round(animated.positive)}% positive, ${Math.round(animated.neutral)}% neutral, ${Math.round(animated.negative)}% negative`}
      >
        <div
          className="flex items-center justify-center transition-[width] duration-700 ease-out"
          style={{ width: `${animated.positive}%`, backgroundColor: "var(--trust-high)" }}
        >
          {animated.positive >= 15 && (
            <span className="text-xs font-semibold text-white">{Math.round(animated.positive)}%</span>
          )}
        </div>
        <div
          className="flex items-center justify-center transition-[width] duration-700 ease-out"
          style={{ width: `${animated.neutral}%`, backgroundColor: "var(--color-foreground-muted)" }}
        >
          {animated.neutral >= 15 && (
            <span className="text-xs font-semibold text-white">{Math.round(animated.neutral)}%</span>
          )}
        </div>
        <div
          className="flex items-center justify-center transition-[width] duration-700 ease-out"
          style={{ width: `${animated.negative}%`, backgroundColor: "var(--color-destructive)" }}
        >
          {animated.negative >= 15 && (
            <span className="text-xs font-semibold text-white">{Math.round(animated.negative)}%</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--trust-high)" }} />
          <span className="text-[var(--color-foreground-muted)]">Positive {Math.round(animated.positive)}%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-foreground-muted)" }} />
          <span className="text-[var(--color-foreground-muted)]">Neutral {Math.round(animated.neutral)}%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-destructive)" }} />
          <span className="text-[var(--color-foreground-muted)]">Negative {Math.round(animated.negative)}%</span>
        </span>
      </div>
    </div>
  );
}
