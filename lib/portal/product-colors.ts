import type { DashboardData } from "@/content/clients/types";

/**
 * One colour per product version, used for its dot in the sidebar, the
 * findings rows and the filters, so a client learns "violet is the gateway"
 * once. Order follows the products list the pipeline sends. None of these is
 * a status colour (see tailwind `signal`), so a product dot never reads as
 * "affected" or "queued".
 */
const PRODUCT_COLORS = ["#6FD6A8", "#7AA7FF", "#C3A6FF", "#F2B35B", "#5CC8D8", "#F28DB2"] as const;

export function productLabel(p: { name: string; version: string }): string {
  return `${p.name} ${p.version}`;
}

export function productColor(index: number): string {
  return PRODUCT_COLORS[index % PRODUCT_COLORS.length];
}

/** The colour for a finding's `product` string ("LC-40 room controller 2.6"). */
export function colorForProduct(data: DashboardData, product: string): string | null {
  const i = data.products.findIndex((p) => productLabel(p) === product);
  return i === -1 ? null : productColor(i);
}
