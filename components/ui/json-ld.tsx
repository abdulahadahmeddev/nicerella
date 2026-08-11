/**
 * Reusable JSON-LD structured data component.
 *
 * Renders a <script type="application/ld+json"> tag with the provided data.
 * Use this on every page to help search engines understand content structure.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
