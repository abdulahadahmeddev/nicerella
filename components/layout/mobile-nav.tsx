"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { XIcon } from "@/components/ui/icons";

interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  /** Primary navigation links — shared with the desktop nav in header.tsx. */
  links: MobileNavLink[];
  /** Optional actions slot (auth controls). Rendered inside the dropdown. */
  actions?: ReactNode;
}

/**
 * Hamburger menu visible only below the sm breakpoint. No Phosphor "list" icon
 * is exported, so the hamburger is an inline SVG (stroke = currentColor) while
 * the close state reuses the shared XIcon.
 */
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/**
 * Mobile-only navigation dropdown. The panel is absolutely positioned against
 * the sticky <header> (nearest positioned ancestor) so it spans the full
 * header width. Closes on link click, Escape, and outside click; focus moves
 * into the panel on open and returns to the toggle on close.
 */
export function MobileNav({ links, actions }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the trigger so keyboard users land back on the toggle.
    toggleRef.current?.focus();
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Close when clicking/tapping outside the menu.
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, [open, close]);

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  // Clear stale state if the viewport grows past sm while the menu is open.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-[var(--color-foreground-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)] sm:hidden"
      >
        {open ? (
          <XIcon size={22} aria-hidden="true" />
        ) : (
          <MenuIcon className="size-[22px]" />
        )}
      </button>

      {open ? (
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-label="Navigation menu"
          style={{ animation: "auth-card-enter 200ms ease-out" }}
          className="absolute inset-x-0 top-full border-b border-[var(--color-border-subtle)] bg-[var(--color-background)]/95 backdrop-blur-md focus:outline-none sm:hidden"
        >
          <nav aria-label="Primary mobile" className="page-container py-2">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-body-sm text-[var(--color-foreground-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-foreground)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {actions ? (
            <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
