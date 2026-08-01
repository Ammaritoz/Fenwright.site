import { site } from "@/config/site";

type Variant = "ink" | "paper";

type Props = {
  /** color scheme: on light surfaces vs on the dark ink surface */
  variant?: Variant;
  className?: string;
  showWordmark?: boolean;
};

/**
 * The Fenwright rule: thin line, hand-drawn double wave, thin line.
 * Taken from the official wordmark; also used standalone as a section divider.
 */
export function WaveRule({
  className = "",
  variant = "ink",
}: {
  className?: string;
  variant?: Variant;
}) {
  const stroke = variant === "paper" ? "#F7F5F0" : "#1A1713";
  return (
    <svg
      viewBox="0 0 240 16"
      className={className}
      aria-hidden="true"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M6 8h84" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M96 8c4-6 8-6 12 0s8 6 12 0 8-6 12 0 8 6 12 0"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M150 8h84" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Fenwright lockup: wave rule over a serif wordmark, per the official logo.
 * Monochrome by design; inverts via `variant` for the dark footer.
 */
export function Logo({ variant = "ink", className = "", showWordmark = true }: Props) {
  const text = variant === "paper" ? "text-paper" : "text-ink";
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <WaveRule className="h-2.5 w-full max-w-[9.5rem]" variant={variant} />
      {showWordmark && (
        <span className={`font-display text-[1.45rem] font-semibold leading-none tracking-[0.01em] ${text}`}>
          {site.brand.wordmark}
        </span>
      )}
    </span>
  );
}
