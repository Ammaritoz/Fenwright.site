/**
 * Photography and video slots. The files live in public/media.
 *
 * Every entry is licensed stock from Pexels (free commercial use, no
 * attribution). hero, systems, process and closing were approved by the owner
 * on 2026-11-12; components, firmware and field were picked for the CRA
 * rebrand on 2026-11-17 and checked for readable logos and brand names. The people shown are
 * atmosphere: never caption or name them as Fenwright staff or clients, and
 * never imply they, or any brand visible in shot, endorse us.
 *
 * Video: two slots loop a muted mp4 over their still (desktop only, see
 * Backdrop). Video must be self-hosted: the CSP in next.config.mjs blocks
 * video from other hosts.
 */

export type MediaSlot = {
  /** still image, also the poster for the video */
  image: string;
  /** self-hosted mp4, optional */
  video?: string;
  /** Pexels page, for the licence record */
  source: string;
  /** where the subject sits in the frame, as a CSS object-position */
  focus?: string;
};

export const media = {
  // Team at a long desk. Video file: hero.mp4
  hero: { image: "/media/hero.jpg", video: "/media/hero.mp4", source: "https://www.pexels.com/video/8461065/", focus: "50% 40%" },
  // Macro of chips on a circuit board. Only part numbers on the chips.
  components: { image: "/media/components.jpg", source: "https://www.pexels.com/photo/36169774/" },
  // Hands soldering a circuit board in a lab.
  firmware: { image: "/media/firmware.jpg", source: "https://www.pexels.com/photo/37426135/" },
  // An unbranded connected wall controller (wifi icon on screen) on a stone
  // wall: a product already in the field. The device sits centre-left, so the
  // banner text at the bottom left does not cover it.
  field: { image: "/media/field.jpg", source: "https://www.pexels.com/photo/39912933/", focus: "40% 45%" },
  // Headset at a desk.
  systems: { image: "/media/systems.jpg", source: "https://www.pexels.com/photo/8204321/" },
  // Two colleagues at a laptop.
  process: { image: "/media/process.jpg", source: "https://www.pexels.com/photo/4960379/" },
  // Homes at dusk, from the air. Video file: closing.mp4
  closing: { image: "/media/closing.jpg", video: "/media/closing.mp4", source: "https://www.pexels.com/video/34807217/" },
} satisfies Record<string, MediaSlot>;

export type MediaKey = keyof typeof media;
