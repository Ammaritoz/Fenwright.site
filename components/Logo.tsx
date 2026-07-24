import { site } from "@/config/site";

type Props = {
  /** color scheme: on light surfaces vs on the dark ink surface */
  variant?: "ink" | "paper";
  className?: string;
  /** height in px of the mark; wordmark scales with text */
  showWordmark?: boolean;
};

/**
 * Fenwright mark: a lightning bolt inside a speech bubble = "instant reply".
 * Monochrome-friendly. Accent bolt stays the one pop of colour.
 */
export function Mark({
  className,
  variant = "ink",
}: {
  className?: string;
  variant?: "ink" | "paper";
}) {
  const stroke = variant === "paper" ? "#F4F6FB" : "#0E1526";
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={`${site.brand.name} mark`}
      fill="none"
    >
      <path
        d="M4 7.5A3.5 3.5 0 0 1 7.5 4h17A3.5 3.5 0 0 1 28 7.5v11a3.5 3.5 0 0 1-3.5 3.5H14l-6 5.5V22H7.5A3.5 3.5 0 0 1 4 18.5z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18.6 7.4 12.3 15h4.2l-1.8 6 6.3-7.6h-4.2z"
        fill="#22E39A"
      />
    </svg>
  );
}

export function Logo({ variant = "ink", className = "", showWordmark = true }: Props) {
  const text = variant === "paper" ? "text-paper" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-8 w-8 shrink-0" variant={variant} />
      {showWordmark && (
        <span className={`font-display text-[1.4rem] font-extrabold tracking-[-0.02em] ${text}`}>
          {site.brand.wordmark}
        </span>
      )}
    </span>
  );
}
