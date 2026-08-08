import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nicerella — Trustworthy product reviews",
    short_name: "Nicerella",
    description:
      "AI-powered review authenticity. Detect fake, bot-written, or incentivized reviews and get honest trust scores.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b12",
    theme_color: "#0b0b12",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
