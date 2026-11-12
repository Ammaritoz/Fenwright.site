import type { MediaSlot } from "@/config/media";

type Props = {
  slot: MediaSlot;
  /** how hard the navy sits over the picture; `heavy` for text set directly on it */
  wash?: "medium" | "heavy";
  /** slow push-in on the still, for heroes */
  drift?: boolean;
  /** fade the bottom edge into the navy page below */
  fade?: boolean;
};

/**
 * A photograph or looping video behind a navy section. Every picture gets the
 * same navy colour wash, so stock from different photographers reads as one
 * set. The parent needs `relative isolate overflow-hidden`.
 */
export function Backdrop({ slot, wash = "medium", drift = false, fade = true }: Props) {
  const position = { objectPosition: slot.focus ?? "50% 50%" };
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-ink" aria-hidden="true">
      <img
        src={slot.image}
        alt=""
        loading={drift ? "eager" : "lazy"}
        className={`h-full w-full object-cover ${drift ? "animate-drift" : ""}`}
        style={position}
      />
      {/* Phones get the still: these files are large, and mobile data is not free. */}
      {slot.video && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={slot.image}
          className="absolute inset-0 h-full w-full object-cover max-md:hidden motion-reduce:hidden"
          style={position}
        >
          <source src={slot.video} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-[#0C2F5E] opacity-50 mix-blend-color" />
      <div className={`absolute inset-0 bg-ink ${wash === "heavy" ? "opacity-70" : "opacity-50"}`} />
      {fade && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-ink" />}
    </div>
  );
}
