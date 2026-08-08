"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees. Default 8. */
  maxTilt?: number;
  /** Enable cursor-following glow overlay. */
  glow?: boolean;
  /** Glow color. */
  glowColor?: string;
}

/**
 * 3D Card wrapper — perspective tilt on hover (fine pointer only) with
 * optional cursor-following radial glow. Respects prefers-reduced-motion.
 *
 * Follows the accessibility pattern: keyboard focus stays flat on the
 * outer element; tilt only applies on pointer move.
 */
export function Card3D({
  children,
  className,
  maxTilt = 8,
  glow = true,
  glowColor = "rgba(124, 58, 237, 0.15)",
}: Card3DProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef(0);
  const [glowPos, setGlowPos] = React.useState({ x: 50, y: 50 });
  const [hovered, setHovered] = React.useState(false);

  const activeRef = React.useRef(false);

  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

    function checkActive() {
      activeRef.current = !reduced.matches && fine.matches;
    }
    checkActive();

    function onMove(e: PointerEvent) {
      if (!activeRef.current || !el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rx = py * -maxTilt;
        const ry = px * maxTilt;
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;
        el.style.willChange = "transform";
        setGlowPos({ x: (e.clientX - rect.left) / rect.width * 100, y: (e.clientY - rect.top) / rect.height * 100 });
      });
    }

    function onLeave() {
      cancelAnimationFrame(frameRef.current);
      if (!el) return;
      el.style.transform = "";
      el.style.willChange = "";
    }

    function onPointerEnter() {
      if (activeRef.current) setHovered(true);
    }

    function onPointerLeave() {
      setHovered(false);
      onLeave();
    }

    function onChange() {
      if (!activeRef.current) onLeave();
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("pointerenter", onPointerEnter);
    reduced.addEventListener("change", onChange);
    fine.addEventListener("change", onChange);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointerenter", onPointerEnter);
      reduced.removeEventListener("change", onChange);
      fine.removeEventListener("change", onChange);
      cancelAnimationFrame(frameRef.current);
    };
  }, [maxTilt]);

  return (
    <div ref={cardRef} className={cn("relative", className)}>
      {glow && hovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 55%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
