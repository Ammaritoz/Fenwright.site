import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  lead?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  /** size of the headline */
  size?: "md" | "lg";
  className?: string;
};

/**
 * A plain section headline with an optional lead. Set at regular weight: size
 * carries the hierarchy.
 */
export function SectionHead({
  title,
  lead,
  tone = "light",
  align = "left",
  size = "md",
  className = "",
}: Props) {
  const dark = tone === "dark";
  const center = align === "center";
  const headSize =
    size === "lg"
      ? "text-[2.4rem] leading-[1.06] sm:text-[3.5rem]"
      : "text-[2rem] leading-[1.08] sm:text-[2.75rem]";
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      <h2 className={`font-display font-normal tracking-[-0.015em] ${headSize} ${dark ? "text-paper" : "text-ink"}`}>
        {title}
      </h2>
      {lead && (
        <p
          className={`mt-5 text-lg leading-relaxed ${
            dark ? "text-stone-300" : "text-stone-600"
          } ${center ? "mx-auto" : ""} max-w-xl`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
