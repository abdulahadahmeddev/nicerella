"use client";

import {
  ShieldIcon as PhosphorShield,
  ShieldCheckIcon as PhosphorShieldCheck,
  ShieldWarningIcon as PhosphorShieldWarning,
  StarIcon as PhosphorStar,
  TrendUpIcon as PhosphorTrendUp,
  MagnifyingGlassIcon as PhosphorMagnifyingGlass,
  WarningIcon as PhosphorWarning,
  type IconProps,
} from "@phosphor-icons/react";

/*
 * Client-side icon wrappers.
 *
 * @phosphor-icons/react calls React.createContext at module scope, which is not
 * available in the RSC server bundle. These thin wrappers keep every Phosphor
 * import behind a "use client" boundary so both Server and Client components
 * can render icons safely. The non-deprecated `*Icon` exports are used here.
 */

export function ShieldIcon(props: IconProps) {
  return <PhosphorShield {...props} />;
}

export function ShieldCheckIcon(props: IconProps) {
  return <PhosphorShieldCheck {...props} />;
}

export function ShieldWarningIcon(props: IconProps) {
  return <PhosphorShieldWarning {...props} />;
}

export function StarIcon(props: IconProps) {
  return <PhosphorStar {...props} />;
}

export function TrendUpIcon(props: IconProps) {
  return <PhosphorTrendUp {...props} />;
}

export function MagnifyingGlassIcon(props: IconProps) {
  return <PhosphorMagnifyingGlass {...props} />;
}

export function WarningIcon(props: IconProps) {
  return <PhosphorWarning {...props} />;
}
