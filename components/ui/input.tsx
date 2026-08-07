import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Nicerella text input — uses the design-system .input styles. */
export function Input({ className, ...props }: InputProps) {
  return <input className={cn("input", className)} {...props} />;
}
