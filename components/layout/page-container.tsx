import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page-width wrapper — max-width 1280px with responsive horizontal padding.
 * Applies the `.page-container` design-system class.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("page-container", className)}>{children}</div>;
}
