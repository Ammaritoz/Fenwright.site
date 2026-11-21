"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getClient, getDoc } from "@/content/clients";
import { createInvoiceCheckout, returnBaseUrl, stripePaidAmount } from "@/lib/portal/checkout";
import { normalisePasscode, verifyPasscode } from "@/lib/portal/auth";
import {
  SESSION_MAX_AGE_SECONDS,
  sessionCookieName,
  signSession,
  verifySession,
} from "@/lib/portal/cookie";
import { getAgreementAcceptance, getFeedbackSubmission, logAgreementAcceptance, logClientFeedback, logCompletion } from "@/lib/airtable";
import { getDashboard } from "@/lib/portal/dashboard";
import { deriveActionItems } from "@/lib/portal/action-items";
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

  const normalised = normalisePasscode(passcode);
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

const SESSION_ERROR = "Your session has ended. Unlock the portal again and retry.";

/**
 * The portal session gate, repeated inside the actions that write.
 *
 * middleware.ts gates page requests by URL path, but a server action is
 * dispatched by its action ID and can arrive on a path the middleware does not
 * gate (the unlock page imports this file, and middleware lets /unlock through
 * unauthenticated). A mutation must therefore prove the caller holds a valid
 * session for the tenant it names, rather than rely on the route it came in on.
 * The tenant is the form's `slug`, so the cookie is checked against exactly that
 * slug: a session for client A never authorises a write for client B.
 */
async function hasSession(slug: string): Promise<boolean> {
  try {
    return await verifySession(slug, cookies().get(sessionCookieName(slug))?.value);
  } catch {
    // A missing or short PORTAL_COOKIE_SECRET throws. Fail closed.
    return false;
  }
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
  if (!(await hasSession(slug))) return { error: SESSION_ERROR };

  // The signature is evidence for one specific agreement document, so the
  // document must exist for this client and actually be an agreement.
  if (getDoc(client, docSlug)?.payload.type !== "agreement") {
    return { error: "Something went wrong. Refresh and try again." };
  }

  // One signature per agreement. A second click, a second tab or a forged
  // resubmission must not stack up duplicate legal-evidence rows.
  if (await getAgreementAcceptance(slug, docSlug)) {
    return { error: "This agreement has already been signed. Refresh the page to see the record." };
  }

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
  if (!(await hasSession(slug))) return { error: SESSION_ERROR };
  if (getDoc(client, docSlug)?.payload.type !== "feedback") {
    return { error: "Something went wrong. Refresh and try again." };
  }
  // One response per feedback request, so a double click or a second tab does
  // not store the same testimonial twice.
  if (await getFeedbackSubmission(slug, docSlug)) {
    return { error: "We already have your feedback for this. Thank you. Refresh the page to see it." };
  }

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

const paySchema = z.object({
  slug: z.string().min(1).max(120),
  docSlug: z.string().min(1).max(120),
});

/**
 * Open a Stripe checkout page for the balance on one invoice.
 *
 * Session-gated like every action that does anything, and the price is never
 * read from the form: it is computed from the invoice in the client file.
 */
export async function startPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = paySchema.safeParse({ slug: formData.get("slug"), docSlug: formData.get("docSlug") });
  if (!parsed.success) return { error: "Something went wrong. Refresh and try again." };

  const { slug, docSlug } = parsed.data;
  const client = getClient(slug);
  if (!client) return { error: "Something went wrong. Refresh and try again." };
  if (!(await hasSession(slug))) return { error: SESSION_ERROR };

  const doc = getDoc(client, docSlug);
  if (!doc || doc.payload.type !== "invoice") {
    return { error: "Something went wrong. Refresh and try again." };
  }

  const result = await createInvoiceCheckout({
    client,
    docSlug,
    invoice: doc.payload,
    returnBase: returnBaseUrl(headers().get("host")),
    // Money already taken online counts, so a second click cannot charge twice.
    paidOnline: await stripePaidAmount(client, doc.payload),
  });
  if (!result.ok) return { error: result.error };

  // redirect() works by throwing, so it must stay outside any try/catch.
  redirect(result.url);
}

const doneSchema = z.object({
  slug: z.string().min(1).max(120),
  itemId: z.string().min(1).max(200),
});

/**
 * "Mark as done" on a report draft or an engineer question.
 *
 * Session-gated. The item id comes from the browser, so it is checked against
 * the items that are actually open for this client right now: a client cannot
 * write a completion for something that is not theirs, not completable, or
 * invented. It records the client's own statement; it does not file anything.
 */
export async function markItemDone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = doneSchema.safeParse({ slug: formData.get("slug"), itemId: formData.get("itemId") });
  if (!parsed.success) return { error: "Something went wrong. Refresh and try again." };

  const { slug, itemId } = parsed.data;
  const client = getClient(slug);
  if (!client) return { error: "Something went wrong. Refresh and try again." };
  if (!(await hasSession(slug))) return { error: SESSION_ERROR };

  const dashboard = await getDashboard(slug);
  const open = deriveActionItems(client, dashboard.ok ? dashboard.data : null, new Date());
  const item = open.find((i) => i.id === itemId && i.completable);
  if (!item) return { error: "That item is no longer open. Refresh the page." };

  try {
    await logCompletion({
      clientSlug: slug,
      itemId: item.id,
      kind: item.kind,
      title: item.title,
      ip: clientIpFromHeaders(headers()),
    });
  } catch (err) {
    console.error("[fenwright] completion save failed:", err instanceof Error ? err.message : errMeta(err));
    return { error: "We could not save that just now. Please try again in a moment." };
  }
  return { ok: true };
}
