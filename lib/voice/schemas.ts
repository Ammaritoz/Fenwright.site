import { z } from "zod";
import { personaIds } from "@/lib/voice/personas";

/**
 * Tool arguments come from a model listening to a member of the public, so they
 * are validated exactly as strictly as a public form body. A manipulated
 * argument must not be able to book, text or transfer outside these shapes.
 */

const personaField = z.enum(personaIds);

const e164 = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "phone must be E.164");

const isoDateTime = z
  .string()
  .trim()
  .refine((s) => !Number.isNaN(Date.parse(s)), "slotStart must be an ISO 8601 date-time");

const shortText = z.string().trim().min(1).max(80);
const longText = z.string().trim().min(1).max(500);

export const checkAvailabilitySchema = z.object({
  personaId: personaField,
  preferredDate: z.string().trim().max(40).optional(),
  partOfDay: z.enum(["morning", "afternoon", "evening", "any"]).default("any"),
});

export const bookAppointmentSchema = z.object({
  personaId: personaField,
  slotStart: isoDateTime,
  name: shortText,
  phone: e164,
  notes: longText.optional(),
});

export const captureLeadSchema = z.object({
  personaId: personaField,
  name: shortText,
  phone: e164,
  intent: shortText,
  summary: longText,
  urgency: z.enum(["emergency", "soon", "routine"]),
});

export const sendRecapSchema = z.object({
  personaId: personaField,
  phone: e164,
  kind: z.enum(["booking", "callback"]),
  name: shortText,
  spokenTime: shortText.optional(),
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type CaptureLeadInput = z.infer<typeof captureLeadSchema>;
export type SendRecapInput = z.infer<typeof sendRecapSchema>;
