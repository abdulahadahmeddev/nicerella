import Link from "next/link";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "sm" for compact contexts (header), "lg" for hero/footer. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Nicerella logo — ShieldCheck mark in a gradient-tinted rounded square with
 * the lowercase wordmark. Links to the home page.
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
      <span
        className="flex items-center justify-center rounded-[var(--radius-md)]"
        style={{
          width: markSize,
          height: markSize,
          background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        <ShieldCheckIcon
          size={markSize * 0.6}
          weight="fill"
          color="#ffffff"
          aria-hidden="true"
        />
      </span>
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
