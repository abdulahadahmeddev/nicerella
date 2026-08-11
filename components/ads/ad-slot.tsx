"use client";

import { useEffect, useRef } from "react";

import { AD_CLIENT_ID, adsenseConfigured } from "@/lib/ads/env";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  /** Ad unit slot ID — see `AD_SLOTS` in lib/ads/env.ts. */
  slot: string;
  className?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Track slots already pushed so React StrictMode double-effects don't create
// duplicate ad requests for the same slot.
const pushedSlots = new Set<string>();

/**
 * Responsive AdSense ad slot. Renders the standard `<ins class="adsbygoogle">`
 * unit and fires the required `(adsbygoogle = window.adsbygoogle || []).push`
 * once after mount. Renders nothing until `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is
 * configured, so the app works before AdSense approval.
 */
export function AdSlot({ slot, className, format = "auto" }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adsenseConfigured()) return;
    if (!slot) return;
    if (pushed.current || pushedSlots.has(slot)) return;
    pushed.current = true;
    pushedSlots.add(slot);
    try {
      const w = window as Window & { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // Ad load failures must never break the page.
    }
  }, [slot]);

  if (!adsenseConfigured()) return null;
  if (!slot) return null;

  return (
    <div className={cn("ad-slot", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
