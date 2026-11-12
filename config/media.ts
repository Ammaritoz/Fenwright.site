/**
 * Photography and video slots. The files live in public/media.
 *
 * Every entry is licensed stock, approved by the owner on 2026-11-12 (Pexels
 * licence: free commercial use, no attribution). The people shown are
 * atmosphere: never caption or name them as Fenwright staff or clients, and
 * never imply they, or any brand visible in shot, endorse us.
 *
 * Video: three slots loop a muted mp4 over their still (desktop only, see
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
  // Man at a laptop, data wall behind.
  enquiries: { image: "/media/enquiries.jpg", source: "https://www.pexels.com/photo/7567434/" },
  // Headset at a desk.
  systems: { image: "/media/systems.jpg", source: "https://www.pexels.com/photo/8204321/" },
  // Roofer laying shingles. Cropped on purpose: the left 28% of the original
  // carries an underlayment maker's printed logo. Don't swap in the full frame.
  roofing: { image: "/media/roofing.jpg", source: "https://www.pexels.com/photo/38028508/", focus: "40% 35%" },
  // Two colleagues at a laptop.
  process: { image: "/media/process.jpg", source: "https://www.pexels.com/photo/4960379/" },
  // Crew building a roof, from above. Video file: roofing-hero.mp4
  roofingHero: { image: "/media/roofing-hero.jpg", video: "/media/roofing-hero.mp4", source: "https://www.pexels.com/video/31025088/" },
  // Homes at dusk, from the air. Video file: closing.mp4
  closing: { image: "/media/closing.jpg", video: "/media/closing.mp4", source: "https://www.pexels.com/video/34807217/" },
} satisfies Record<string, MediaSlot>;

export type MediaKey = keyof typeof media;
