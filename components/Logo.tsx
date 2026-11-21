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
 * The same rule at any width: hairline, the W flourish, hairline.
 *
 * Stretching the whole image distorts the W, and clamping its height squashes
 * it. So the rule is cut into pieces (scripts/extract-logo.py): a thin slice of
 * the hairline that is safe to stretch sideways, and the flourish, which keeps
 * its natural proportions. All three are the same height, so the hairlines meet
 * the W exactly. `height` is the height of the W in pixels.
 */
export function SignatureRule({
  className = "",
  variant = "ink",
  height = 44,
}: {
  className?: string;
  variant?: Variant;
  height?: number;
}) {
  const tone = variant === "paper" ? "paper" : "ink";
  const line = `/brand/rule-line-${tone}.png`;
  return (
    <div aria-hidden="true" className={`flex w-full items-center ${className}`} style={{ height }}>
      <img src={line} alt="" className="h-full min-w-0 flex-1 object-fill" style={{ width: 0 }} />
      <img src={`/brand/rule-center-${tone}.png`} alt="" className="h-full w-auto shrink-0" />
      <img src={line} alt="" className="h-full min-w-0 flex-1 object-fill" style={{ width: 0 }} />
    </div>
  );
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
