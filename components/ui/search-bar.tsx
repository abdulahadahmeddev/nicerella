"use client";

import * as React from "react";
import { MagnifyingGlassIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  /** Called with the trimmed query when the form is submitted. */
  onSearch?: (query: string) => void;
  placeholder?: string;
  /** "lg" matches the hero search treatment (16/24px padding, larger radius). */
  size?: "default" | "lg";
  className?: string;
}

/** Nicerella search input with magnifying-glass icon and submit-on-Enter. */
export function SearchBar({
  onSearch,
  placeholder = "Search products…",
  size = "default",
  className,
}: SearchBarProps) {
  const [query, setQuery] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={cn("relative w-full", className)}>
      <label htmlFor="nicerella-search" className="sr-only">
        Search products
      </label>
      <MagnifyingGlassIcon
        size={20}
        weight="regular"
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-foreground-muted)]"
      />
      <input
        id="nicerella-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "input pl-12",
          size === "lg" && "rounded-[var(--radius-lg)] py-4 pr-6 text-base"
        )}
      />
    </form>
  );
}
