import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Right-aligned actions slot — reserved for auth (Clerk) controls. */
  actions?: ReactNode;
  className?: string;
}

const NAV_LINKS = [
  { href: "/", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/articles", label: "Articles" },
];

/**
 * Sticky top navigation bar. Logo on the left, primary nav links in the
 * center, optional actions (auth buttons) on the right. Uses surface-elevated
 * background with blur.
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
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-body-sm text-[var(--color-foreground-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {actions ? (
            <div className="hidden items-center gap-2 sm:flex">{actions}</div>
          ) : null}
          <MobileNav links={NAV_LINKS} actions={actions} />
        </div>
      </div>
    </header>
  );
}
