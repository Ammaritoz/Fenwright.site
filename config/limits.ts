/**
 * Rate-limit and abuse-control settings. Server-side only.
 * Edit these numbers to tune the demo without touching route code.
 */
export const limits = {
  // POST /api/demo-reply : cheap AI-only calls, per IP
  demoReply: {
    tokens: 10,
    window: "1 m" as const,
    // Global daily budget so a distributed/IP-rotating attacker cannot run up
    // unbounded Anthropic spend. Overridable via env DEMO_REPLY_DAILY_CAP.
    dailyCapDefault: 2000,
  },

  // POST /api/demo-text : real SMS, layered controls
  demoText: {
    perPhonePerDay: { tokens: 1, window: "24 h" as const },
    perIpPerHour: { tokens: 3, window: "1 h" as const },
    // Global daily cap, overridable via env DEMO_SMS_DAILY_CAP
    dailyCapDefault: 100,
  },

  // POST /api/contact : real inbound leads, a touch more generous.
  // This route also sends a real SMS, so it needs the same layered controls as
  // /api/demo-text. 3 texts per hour to one number is an SMS-bombing vector
  // (72/day at a victim's phone), and with no global cap an attacker rotating
  // IPs and numbers can drive unbounded Twilio and Anthropic spend.
  contact: {
    perIpPerHour: { tokens: 5, window: "1 h" as const },
    perPhonePerDay: { tokens: 3, window: "24 h" as const },
    // Global daily cap, overridable via env CONTACT_DAILY_CAP
    dailyCapDefault: 200,
  },

  // POST /api/voice/tools/<tool> : real SMS and real bookings, driven by a
  // model listening to a member of the public.
  voice: {
    // The plan's Global Constraints give a tool handler 8 seconds, because a
    // live conversation is waiting. Each external dependency gets this much,
    // which leaves headroom for our own work and the round trip. Lives here
    // rather than in each module so the two cannot drift apart.
    externalTimeoutMs: 6000,
    // send_recap_sms gets its own tighter per-callId budget: the shared tool
    // limiter is spent across four tools, so without this one signed call
    // could text forty different numbers.
    recapSmsPerCall: { tokens: 3, window: "10 m" as const },
    // Global daily cap, overridable via env VOICE_SMS_DAILY_CAP. callId comes
    // from the request body, so a sender gets a fresh per-call allowance for
    // every id it invents; this is the only limit it cannot restart. Enforced
    // in trySms so it caps the text and never the booking.
    smsDailyCapDefault: 100,
  },
} as const;

export function demoSmsDailyCap(): number {
  const raw = process.env.DEMO_SMS_DAILY_CAP;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : limits.demoText.dailyCapDefault;
}

export function demoReplyDailyCap(): number {
  const raw = process.env.DEMO_REPLY_DAILY_CAP;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : limits.demoReply.dailyCapDefault;
}

export function contactDailyCap(): number {
  const raw = process.env.CONTACT_DAILY_CAP;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : limits.contact.dailyCapDefault;
}

export function voiceSmsDailyCap(): number {
  const raw = process.env.VOICE_SMS_DAILY_CAP;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : limits.voice.smsDailyCapDefault;
}
