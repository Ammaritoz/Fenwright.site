import { site } from "@/config/site";

type Variant = "ink" | "paper";

type Props = {
  /** color scheme: on light surfaces vs on the dark ink surface */
  variant?: Variant;
  className?: string;
  showWordmark?: boolean;
};

/**
 * The Fenwright rule, cropped directly from the official logo artwork
 * (public/logo.JPG, see scripts/extract-logo.py) -- not hand-drawn. Used
 * standalone as a section divider, and inside `Logo` for the full lockup.
 */
export function WaveRule({
  className = "",
  variant = "ink",
}: {
  className?: string;
  variant?: Variant;
}) {
  const src = variant === "paper" ? "/brand/rule-paper.png" : "/brand/rule-ink.png";
  return <img src={src} alt="" aria-hidden="true" className={className} />;
}

/**
 * Fenwright lockup: the official logo artwork (public/logo.JPG), cropped and
 * keyed to a transparent background. The `paper` variant is the same
 * artwork recolored for the dark ink surface (footer), not a redraw.
 */
export function Logo({ variant = "ink", className = "", showWordmark = true }: Props) {
  if (!showWordmark) {
    return <WaveRule className={`h-2 w-auto ${className}`} variant={variant} />;
  }
  const src = variant === "paper" ? "/brand/logo-paper.png" : "/brand/logo-ink.png";
  return <img src={src} alt={site.brand.wordmark} className={`h-10 w-auto ${className}`} />;
}
