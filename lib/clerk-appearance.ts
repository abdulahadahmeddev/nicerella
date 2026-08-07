/**
 * Clerk appearance theme — maps the Nicerella design system tokens (see
 * app/globals.css and DESIGN_SYSTEM.md) onto Clerk's hosted UI components
 * (SignIn, SignUp, UserButton, etc.) so auth screens match the rest of the app.
 *
 * These values intentionally mirror the @theme tokens:
 *   --color-primary: #7c3aed  ·  --color-surface: #131825
 *   --color-surface-elevated: #1a1f2e  ·  --color-foreground: #f1f5f9
 *   --color-foreground-muted: #94a3b8  ·  --color-border: rgba(148,163,184,0.15)
 *   --radius-lg: 12px  ·  --color-destructive: #ef4444
 */

export const clerkAppearance = {
  variables: {
    colorPrimary: "#7c3aed",
    colorPrimaryForeground: "#ffffff",
    colorDanger: "#ef4444",
    colorNeutral: "#f1f5f9",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorBackground: "#131825",
    colorInputForeground: "#f1f5f9",
    colorInput: "#1a1f2e",
    colorBorder: "rgba(148, 163, 184, 0.15)",
    colorShadow: "#000000",
    borderRadius: "12px",
    fontFamily: "inherit",
  },
} as const;
