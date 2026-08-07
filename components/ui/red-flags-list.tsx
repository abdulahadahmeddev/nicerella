"use client";

import * as React from "react";
import { WarningIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface RedFlag {
  type: string;
  description: string;
}

interface RedFlagsListProps {
  flags: RedFlag[];
  className?: string;
}

/**
 * Red flags list with staggered reveal animation.
 * Each flag fades in sequentially for a polished entrance.
 */
export function RedFlagsList({ flags, className }: RedFlagsListProps) {
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    if (flags.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= flags.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [flags.length]);

  if (flags.length === 0) {
    return (
      <div className={cn("card", className)}>
        <h3 className="text-h4 mb-2 text-[var(--color-foreground)]">Red Flags</h3>
        <p className="text-body-sm text-[var(--color-foreground-muted)]">No red flags detected.</p>
      </div>
    );
  }

  return (
    <div className={cn("card", className)}>
      <h3 className="text-h4 mb-4 text-[var(--color-foreground)]">Red Flags</h3>
      <ul className="space-y-2" aria-label="Red flags detected">
        {flags.map((flag, index) => (
          <li
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 transition-all duration-300 ease-out",
              "border-l-[3px] border-[var(--color-destructive)]",
              "bg-[rgba(239,68,68,0.08)]"
            )}
            style={{
              opacity: index < visibleCount ? 1 : 0,
              transform: index < visibleCount ? "translateX(0)" : "translateX(-8px)",
            }}
          >
            <WarningIcon
              size={18}
              weight="fill"
              className="mt-0.5 shrink-0 text-[var(--color-destructive)]"
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-medium capitalize text-[var(--color-foreground)]">
                {flag.type}
              </div>
              <div className="text-xs text-[var(--color-foreground-muted)]">
                {flag.description}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
