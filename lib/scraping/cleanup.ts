import "server-only";

/**
 * Review `raw_text` cleanup (AGENTS.md section 13). Before saving, review text
 * must read like an actual review, not a copied webpage dump. These helpers
 * strip markup, boilerplate (Q&A, seller replies, ad blocks, "helpful votes"),
 * CSS-class dumps, and navigation labels.
 */

const BOILERPLATE_PATTERNS: RegExp[] = [
  /\bwas this helpful\?/gi,
  /\bhelpful \(?\d+\)?/gi,
  /\bverified purchase\b/gi,
  /\bauthenticity guaranteed\b/gi,
  /\bsee more\b/gi,
  /\bsee less\b/gi,
  /\bread more\b/gi,
  /\bmore less\b/gi,
  /\breport\b/gi,
  /\bcomment\b/gi,
  /\bshare\b/gi,
  /q&a/gi,
  /^\s*answer\s*$/gi,
  /seller response/gi,
  /response from (?:the )?seller/gi,
  /customer service/gi,
];

const MULTI_SPACE = /\s{2,}/g;
const LEADING_TRAILING = /^\s+|\s+$/g;

/** Clean a block of review text: strip boilerplate lines and collapse space. */
export function cleanReviewText(raw: string): string {
  const text = raw
    .replace(/<[^>]+>/g, " ") // strip any stray markup
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ");

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const cleaned: string[] = [];
  for (const line of lines) {
    if (isBoilerplateLine(line)) continue;
    cleaned.push(line);
  }

  const joined = cleaned.join(" ").replace(MULTI_SPACE, " ").replace(LEADING_TRAILING, "");
  return joined;
}

/** Whether a single line is boilerplate (navigation, helper, ad-like). */
function isBoilerplateLine(line: string): boolean {
  const lower = line.toLowerCase();
  for (const pattern of BOILERPLATE_PATTERNS) {
    if (pattern.test(lower)) return true;
  }
  // Pure punctuation / css-class dump / numeric score lines.
  if (/^[\W_]+$/.test(line)) return true;
  if (/^[0-9.,%()+\-xX]+$/.test(line)) return true;
  if (/^[a-z_-]{3,}\s*$/.test(lower) && lower.length < 40 && !/\s/.test(lower.trim())) return true;
  return false;
}
