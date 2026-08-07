import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Right-aligned actions slot — reserved for auth (Clerk) controls later. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Sticky top navigation bar. Logo on the left, optional actions (auth
 * buttons) on the right. Uses surface-elevated background with blur.
 */
export function Header({ actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--color-border-subtle)]",
        "bg-[var(--color-background)]/80 backdrop-blur-md",
        className
      )}
    >
      <div className="page-container flex h-16 items-center justify-between">
        <Logo />
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
