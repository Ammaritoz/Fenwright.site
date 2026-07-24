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

  // POST /api/contact : real inbound leads, a touch more generous
  contact: {
    perIpPerHour: { tokens: 5, window: "1 h" as const },
    perPhonePerHour: { tokens: 3, window: "1 h" as const },
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
