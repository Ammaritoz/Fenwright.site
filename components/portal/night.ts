/**
 * Shared class strings for the portal's dark workspace, so buttons and panels
 * look the same on every page without a component per variation.
 */
export const night = {
  panel: "rounded-xl border border-night-line bg-night-panel",
  btn: "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-night-edge bg-night-raised px-3.5 text-[0.82rem] font-medium text-night-text transition-colors hover:bg-night-hover disabled:opacity-60",
  btnPrimary:
    "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-night-text bg-night-text px-3.5 text-[0.82rem] font-medium text-night transition-colors hover:bg-white disabled:opacity-60",
  // font-ui: some labels are <h2>, which the site's base styles set in the serif.
  label: "font-ui text-[0.8rem] font-normal text-night-mute",
  h1: "font-ui text-[2.1rem] font-light leading-none tracking-[-0.025em] text-night-text",
  h2: "font-ui text-[0.82rem] font-normal text-night-dim",
} as const;
