"use client";

import { ShareFatIcon, XLogoIcon, LinkedinLogoIcon, RedditLogoIcon } from "@phosphor-icons/react";

interface SocialShareProps {
  title: string;
  url: string;
  description?: string;
}

function shareOn(platform: "twitter" | "linkedin" | "reddit", props: SocialShareProps) {
  const encodedUrl = encodeURIComponent(props.url);
  const encodedTitle = encodeURIComponent(props.title);
  const encodedDesc = encodeURIComponent(props.description ?? props.title);

  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };

  window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=500");
}

export function SocialShare({ title, url, description }: SocialShareProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-caption flex items-center gap-1.5 text-[var(--color-foreground-muted)]">
        <ShareFatIcon size={14} weight="fill" />
        Share
      </span>

      <button
        onClick={() => shareOn("twitter", { title, url, description })}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-foreground-muted)] transition-colors hover:border-[#1DA1F2] hover:text-[#1DA1F2]"
        aria-label="Share on X (Twitter)"
        type="button"
      >
        <XLogoIcon size={14} weight="fill" />
      </button>

      <button
        onClick={() => shareOn("linkedin", { title, url, description })}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-foreground-muted)] transition-colors hover:border-[#0A66C2] hover:text-[#0A66C2]"
        aria-label="Share on LinkedIn"
        type="button"
      >
        <LinkedinLogoIcon size={14} weight="fill" />
      </button>

      <button
        onClick={() => shareOn("reddit", { title, url, description })}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-foreground-muted)] transition-colors hover:border-[#FF4500] hover:text-[#FF4500]"
        aria-label="Share on Reddit"
        type="button"
      >
        <RedditLogoIcon size={14} weight="fill" />
      </button>
    </div>
  );
}
