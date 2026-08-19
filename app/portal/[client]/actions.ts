"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getClient } from "@/content/clients";
import { verifyPasscode } from "@/lib/portal/auth";
import { SESSION_MAX_AGE_SECONDS, sessionCookieName, signSession } from "@/lib/portal/cookie";
import { logAgreementAcceptance, logClientFeedback } from "@/lib/airtable";
import { rateLimit } from "@/lib/ratelimit";
import { clientIpFromHeaders } from "@/lib/request";
import { errMeta } from "@/lib/log";

export type ActionState = { error?: string; ok?: boolean };

/** Only ever redirect to a path inside this client's own portal. */
function safeNext(slug: string, next: string | null): string {
  const base = `/portal/${slug}`;
  if (!next || !next.startsWith(`${base}/`)) return base;
  // Reject anything that could read as another origin ("//evil.com").
  if (next.startsWith("//")) return base;
  return next;
}

const unlockSchema = z.object({
  slug: z.string().min(1).max(120),
  passcode: z.string().min(1).max(200),
  next: z.string().max(300).nullable(),
});

export async function unlockPortal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = unlockSchema.safeParse({
    slug: formData.get("slug"),
    passcode: formData.get("passcode"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { error: "Something went wrong. Refresh and try again." };

  const { slug, passcode, next } = parsed.data;

  // Reuse the existing Upstash limiter rather than adding another. Keyed on IP
  // and slug together, so one client's visitors cannot lock out another's.
  const ip = clientIpFromHeaders(headers());
  const limit = await rateLimit("portal-unlock", `${slug}:${ip}`, 8, "10 m");
  if (!limit.success) {
    return { error: "Too many attempts. Wait ten minutes and try again." };
  }

  const client = getClient(slug);
  // Verify even when the slug is unknown would be ideal, but an unknown slug
  // never reaches here: the layout 404s first. Fail closed regardless.
  if (!client) return { error: "That passcode is not right." };

  const normalised = passcode.trim().toUpperCase();
  if (!verifyPasscode(normalised, client.passcodeHash, client.passcodeSalt)) {
    return { error: "That passcode is not right. Check the message we sent you." };
  }

  cookies().set(sessionCookieName(slug), await signSession(slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Scoped to this client, so unlocking one portal never unlocks another.
    path: `/portal/${slug}`,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(safeNext(slug, next));
}

const acceptSchema = z.object({
  slug: z.string().min(1).max(120),
  docSlug: z.string().min(1).max(120),
  fullName: z.string().trim().min(2, "Type your full name.").max(120),
  confirmed: z.literal("on", { errorMap: () => ({ message: "Tick the box to confirm." }) }),
});

/**
 * Record acceptance of the client agreement.
 *
 * Deliberately unlike lib/airtable.ts logLead, which swallows write failures so
 * a lead form never breaks. Here a failed write must surface: telling a client
 * their contract is signed when no record exists is worse than asking them to
 * click again.
 */
export async function acceptAgreement(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = acceptSchema.safeParse({
    slug: formData.get("slug"),
    docSlug: formData.get("docSlug"),
    fullName: formData.get("fullName"),
    confirmed: formData.get("confirmed"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { slug, docSlug, fullName } = parsed.data;
  const client = getClient(slug);
  if (!client) return { error: "Something went wrong. Refresh and try again." };

  try {
    await logAgreementAcceptance({
      clientSlug: slug,
      businessName: client.business.name,
      documentSlug: docSlug,
      signatoryName: fullName,
      ip: clientIpFromHeaders(headers()),
      userAgent: headers().get("user-agent") ?? "",
    });
  } catch (err) {
    // The client gets a calm message; the operator needs to know WHY. Without
    // this, a missing Airtable table or a renamed field looks identical to a
    // network blip and there is nothing to debug from. errMeta keeps PII out
    // of the log, same as every other writer in this codebase.
    console.error(
      "[fenwright] agreement acceptance failed:",
      err instanceof Error ? err.message : errMeta(err)
    );
    return {
      error:
        "We could not record your acceptance just now. Please try again, or email contact@fenwright.ie and we will sort it.",
    };
  }

  return { ok: true };
}

const feedbackSchema = z.object({
  slug: z.string().min(1).max(120),
  docSlug: z.string().min(1).max(120),
  ratings: z.string().max(500),
  answers: z.string().max(8000),
  testimonial: z.string().max(2000),
  name: z.string().max(120),
});

export async function submitFeedback(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({
    slug: formData.get("slug"),
    docSlug: formData.get("docSlug"),
    ratings: formData.get("ratings") ?? "",
    answers: formData.get("answers") ?? "",
    testimonial: formData.get("testimonial") ?? "",
    name: formData.get("name") ?? "",
  });
  if (!parsed.success) return { error: "Check the form and try again." };

  const { slug, docSlug, ratings, answers, testimonial, name } = parsed.data;
  const client = getClient(slug);
  if (!client) return { error: "Something went wrong. Refresh and try again." };

  try {
    await logClientFeedback({
      clientSlug: slug,
      businessName: client.business.name,
      documentSlug: docSlug,
      ratings,
      answers,
      testimonial,
      respondentName: name,
    });
  } catch (err) {
    console.error(
      "[fenwright] client feedback save failed:",
      err instanceof Error ? err.message : errMeta(err)
    );
    return { error: "We could not save that just now. Please try again in a moment." };
  }

  return { ok: true };
}
