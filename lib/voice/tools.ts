import "server-only";
import { z } from "zod";
import { requirePersona } from "@/lib/voice/personas";
import {
  bookAppointmentSchema,
  captureLeadSchema,
  checkAvailabilitySchema,
  sendRecapSchema,
} from "@/lib/voice/schemas";
import { createBooking, getAvailability, spokenTime } from "@/lib/voice/calcom";
import { bookingRecap, callbackRecap } from "@/lib/voice/recap";
import { claimOnce, idempotencyKey } from "@/lib/voice/idempotency";
import { logLead } from "@/lib/airtable";
import { sendSms, twilioConfigured } from "@/lib/twilio";
import { errMeta } from "@/lib/log";

/**
 * Every return value is spoken aloud by the assistant, so it is always a natural
 * sentence. A tool never returns an error code, a stack trace or JSON: the
 * assistant would read it out to a customer.
 */
export type ToolResult = { result: string };

export async function runTool(
  name: string,
  callId: string,
  args: unknown
): Promise<ToolResult> {
  try {
    switch (name) {
      case "check_availability":
        return await checkAvailability(args);
      case "book_appointment":
        return await bookAppointment(callId, args);
      case "capture_lead":
        return await captureLead(callId, args);
      case "send_recap_sms":
        return await sendRecap(callId, args);
      default:
        console.warn("[fenwright] unknown voice tool:", name);
        return { result: "I could not do that just now, but I can take your details instead." };
    }
  } catch (err) {
    console.error("[fenwright] voice tool failed:", name, errMeta(err));
    return {
      result:
        "That did not work on my side. Let me take your name and number and someone will come straight back to you.",
    };
  }
}

function invalid(): ToolResult {
  return {
    result:
      "That did not work. Let me take your name and number and someone will come straight back to you.",
  };
}

function parse<T extends z.ZodTypeAny>(schema: T, args: unknown): z.infer<T> | null {
  const parsed = schema.safeParse(args);
  return parsed.success ? parsed.data : null;
}

async function checkAvailability(args: unknown): Promise<ToolResult> {
  const input = parse(checkAvailabilitySchema, args);
  if (!input) return invalid();

  const slots = await getAvailability({ partOfDay: input.partOfDay, limit: 3 });
  if (slots.length === 0) {
    return {
      result:
        "I do not have anything showing just now. I can take your details and have someone ring you with times.",
    };
  }

  const spoken = slots.map((s) => s.spoken);
  const list =
    spoken.length === 1
      ? spoken[0]
      : `${spoken.slice(0, -1).join(", ")} or ${spoken[spoken.length - 1]}`;
  return { result: `I have ${list}. Which of those suits you best?` };
}

async function bookAppointment(callId: string, args: unknown): Promise<ToolResult> {
  const input = parse(bookAppointmentSchema, args);
  if (!input) return invalid();

  const persona = requirePersona(input.personaId);
  const key = idempotencyKey(callId, "book_appointment", input);
  if (!(await claimOnce(key))) {
    return { result: `That is already booked in for you, ${input.name.split(" ")[0]}.` };
  }

  const booking = await createBooking({
    slotStart: input.slotStart,
    name: input.name,
    phone: input.phone,
    notes: input.notes,
  });

  if (!booking.ok) {
    return {
      result:
        "That slot would not take, it may have just gone. Would another time suit, or shall I have someone ring you back?",
    };
  }

  const when = spokenTime(input.slotStart);
  await trySms(input.phone, bookingRecap(persona, { name: input.name, spokenTime: when }));
  await tryLogLead({
    name: input.name,
    phone: input.phone,
    message: input.notes,
    industry: persona.id,
    source: "voice-inbound",
  });

  return { result: `Booked, that is ${when}. I will text you a confirmation now.` };
}

async function captureLead(callId: string, args: unknown): Promise<ToolResult> {
  const input = parse(captureLeadSchema, args);
  if (!input) return invalid();

  const persona = requirePersona(input.personaId);
  const key = idempotencyKey(callId, "capture_lead", input);
  if (!(await claimOnce(key))) {
    return { result: "I have those details already, thanks." };
  }

  await tryLogLead({
    name: input.name,
    phone: input.phone,
    message: `[${input.intent}/${input.urgency}] ${input.summary}`,
    industry: persona.id,
    source: "voice-inbound",
  });

  return {
    result: "Grand, I have your details. Someone will come back to you shortly.",
  };
}

async function sendRecap(callId: string, args: unknown): Promise<ToolResult> {
  const input = parse(sendRecapSchema, args);
  if (!input) return invalid();

  const persona = requirePersona(input.personaId);
  const key = idempotencyKey(callId, "send_recap_sms", input);
  if (!(await claimOnce(key))) return { result: "That text is already on its way." };

  const body =
    input.kind === "booking" && input.spokenTime
      ? bookingRecap(persona, { name: input.name, spokenTime: input.spokenTime })
      : callbackRecap(persona, { name: input.name });

  const sent = await trySms(input.phone, body);
  return {
    result: sent
      ? "I have sent that to you by text."
      : "I could not get a text away just now, but I have your details.",
  };
}

async function trySms(to: string, body: string): Promise<boolean> {
  if (!twilioConfigured()) {
    console.warn("[fenwright] Twilio not configured, skipping voice recap SMS");
    return false;
  }
  try {
    await sendSms(to, body);
    return true;
  } catch (err) {
    console.error("[fenwright] voice recap SMS failed:", errMeta(err));
    return false;
  }
}

async function tryLogLead(lead: Parameters<typeof logLead>[0]): Promise<void> {
  try {
    await logLead(lead);
  } catch (err) {
    console.error("[fenwright] voice logLead failed:", errMeta(err));
  }
}
