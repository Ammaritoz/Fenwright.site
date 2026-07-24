import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { industryLabel } from "@/lib/industry";
import { site } from "@/config/site";

const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Strip characters that push an SMS off a single GSM-7 segment, and any emoji. */
export function toGsm7(input: string): string {
  return input
    // smart quotes / dashes to ASCII
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—―]/g, "-")
    .replace(/…/g, "...")
    // strip anything outside the safe printable ASCII range (drops emoji)
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

type ReceptionistArgs = {
  industry: string;
  enquiry?: string;
  /** hard cap on characters; keeps demo SMS in one segment */
  maxChars?: number;
};

function systemPrompt(businessType: string): string {
  return [
    `You are the front-desk receptionist for a ${businessType} in Ireland or the UK.`,
    `A potential customer has just sent a first enquiry. Text them back the way a warm, competent, human receptionist would.`,
    ``,
    `Rules:`,
    `- 1 to 3 short sentences. Natural and friendly, never robotic or salesy.`,
    `- Thank them, answer or acknowledge their question, and move things forward by asking one helpful question (a time, a day, or a detail).`,
    `- Never invent specific prices, exact availability, or facts you cannot know. Speak in a way that fits any real business of this type.`,
    `- Plain text only. No emoji. No markdown. No sign-off signature.`,
    `- Do not mention that you are an AI.`,
    `- Use British and Irish English spelling.`,
  ].join("\n");
}

/**
 * Generate a receptionist-style reply to a customer enquiry.
 * Returns plain text, trimmed. Caller decides whether to GSM-7 sanitise.
 */
export async function generateReply({
  industry,
  enquiry,
  maxChars,
}: ReceptionistArgs): Promise<string> {
  const businessType = industryLabel(industry);
  const customerMessage =
    (enquiry && enquiry.trim()) ||
    site.industries.find((i) => i.id === industry)?.exampleEnquiry ||
    "Hi, I saw your details online and wanted to get in touch.";

  const lengthHint = maxChars
    ? `\n\nKeep the whole reply under ${maxChars} characters so it fits in a single text message.`
    : "";

  const msg = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt(businessType),
    messages: [
      {
        role: "user",
        content: `Customer enquiry: "${customerMessage}"${lengthHint}`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join(" ")
    .trim();

  return text || "Thanks for getting in touch. What day or time suits you best?";
}

/**
 * Warm Fenwright-branded reply for the real inbound contact form.
 * Acknowledges by name and includes the booking link.
 */
export async function generateFenwrightReply({
  name,
  message,
  bookingUrl,
}: {
  name: string;
  message: string;
  bookingUrl: string;
}): Promise<string> {
  const system = [
    `You are Fenwright, an AI receptionist studio for small service businesses.`,
    `Someone just left their number on the Fenwright website. Text them back warmly.`,
    ``,
    `Rules:`,
    `- Greet them by their first name.`,
    `- 1 to 2 short sentences. Confirm a human will follow up shortly.`,
    `- Do NOT include any link yourself; the link is appended after your text.`,
    `- Plain text only. No emoji. No markdown. British and Irish English.`,
  ].join("\n");

  const firstName = name.trim().split(/\s+/)[0] || name.trim();

  const msg = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 200,
    system,
    messages: [
      {
        role: "user",
        content: `Their name: ${firstName}. What they said: "${message.trim()}"`,
      },
    ],
  });

  const body =
    msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim() ||
    `Hi ${firstName}, thanks for reaching out to Fenwright. One of us will follow up shortly.`;

  return `${toGsm7(body)} Book a time here: ${bookingUrl}`;
}
