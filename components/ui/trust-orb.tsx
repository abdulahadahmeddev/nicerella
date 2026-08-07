"use client";

import { cn } from "@/lib/utils";

interface TrustOrbProps {
  className?: string;
}

/**
 * Signature Nicerella visual element — a subtle animated gradient orb that
 * drifts behind trust-focused sections. Decorative and purely presentational.
 */
export function TrustOrb({ className = "" }: TrustOrbProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute overflow-hidden", className)}
    >
      <div className="trust-orb absolute h-96 w-96 rounded-full opacity-20 blur-3xl" />
    </div>
  );
}
