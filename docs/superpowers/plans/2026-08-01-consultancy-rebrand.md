# Fenwright Consultancy Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition fenwright.ie from "AI receptionist product site" to "efficiency consultancy for small service businesses" (AI implied, never named), restyle the whole site to match the new serif/editorial logo, and add a two-founder About Us section.

**Architecture:** Single-page Next.js 14 App Router marketing site. All visitor copy lives in `config/site.ts`; all colour comes from Tailwind tokens in `tailwind.config.ts`, so the rebrand is mostly (a) one token/font swap, (b) one big config copy rewrite, (c) a new `AboutUs` component, (d) a targeted contrast sweep where token semantics changed. The existing demo, APIs, and security posture are untouched.

**Tech Stack:** Next.js 14.2 App Router, TypeScript, Tailwind CSS, `next/font/google` (fonts self-hosted, no CSP change needed).

## Decisions already made by the owner (do not re-litigate)

- Full editorial rebrand matching the logo: serif display headings, warm ink-on-paper monochrome, green demoted to a muted accent.
- Receptionist demo stays mid-page as proof, reframed as "one of the systems we build".
- About Us is a homepage **section** (not a separate page): Ammar Bakhet (systems/software) + Billal Khan (consulting), serif monogram tiles (no photos yet), LinkedIn icon per person, **one shared business WhatsApp number** for both cards.
- Reply-speed claim: exactly **one** mention, the phrase "in seconds", inside the demo section. All "60 seconds" copy dies.
- The word "AI" must not appear in any new homepage copy. Hint at it ("quiet systems", "runs by itself"), never name it.

## Global Constraints

- **No em dashes anywhere in visitor-facing copy** (rule in `config/site.ts` header). Use commas, colons, or full stops.
- All visitor-facing copy lives in `config/site.ts`, never hardcoded in components.
- The speed claim "in seconds" appears exactly once (demo subhead). The dynamic "Replied in {n}s" timer in `Demo.tsx` is a measurement, not copy, and stays.
- Do not touch `app/api/**`, `lib/**`, rate limits, daily caps, `import "server-only"` lines, or the CSP in `next.config.mjs` (no new third-party origins are introduced: WhatsApp/LinkedIn are plain `<a href>` links, fonts are self-hosted via `next/font`).
- Do not break the `Reveal.tsx` no-JS guarantee (content visible by default; `js` class gates hiding).
- Do not touch `site.legal` or `/privacy` copy except where a task explicitly says so.
- Site is **live in production**. Commit locally per task; push to `main` (= deploy) only when the owner says so.
- OneDrive gotcha: if `next dev`/`next build` throws `EINVAL ... readlink ... .next\...`, stop the server, delete `.next`, retry. Not an app bug.
- No test framework exists in this repo. Each task's "test" is: `npx tsc --noEmit` passes, `npm run build` passes, and a rendered-DOM check via `curl` against a local dev server confirms the change. Run the dev server on a spare port: `npx next dev -p 3007`.
- Working directory for every task: `C:\Users\kingy\OneDrive\Desktop\fenwright\fenwright-site` (never the sibling n8n repo).

## Owner-supplied contact details (final, use verbatim)

- Ammar LinkedIn: `https://www.linkedin.com/in/ammar-bakhet-b66b97364`
- Billal LinkedIn: `https://www.linkedin.com/in/billal-khan-100505424`
- Shared business WhatsApp: `+353899406583` (E.164, no spaces)

## Final page order (Task 5 wires this)

Nav → Hero → Problem → Services → Demo → HowItWorks → AboutUs → BookCall → ContactForm → Footer

---

### Task 1: Commit the pending nav-duplication fix

The previous session removed the duplicate "Book a call" nav link (`config/site.ts` nav.links) and preserved the footer link list (`components/Footer.tsx`). Both edits are verified working but uncommitted.

**Files:**
- Modify: none (commit existing working-tree changes only)

**Interfaces:**
- Consumes: existing uncommitted edits to `config/site.ts` and `components/Footer.tsx`
- Produces: clean working tree for the rebrand commits

- [ ] **Step 1: Confirm the working tree contains only the expected edits**

Run: `git status --short` and `git diff --stat`
Expected: only `config/site.ts` and `components/Footer.tsx` modified. If anything else is dirty, stop and ask the owner.

- [ ] **Step 2: Commit**

```bash
git add config/site.ts components/Footer.tsx
git commit -m "fix(nav): remove duplicate Book a call link, keep footer links intact"
```

---

### Task 2: Brand tokens: serif display font, warm monochrome palette, muted green accent

Swap the design system to the logo's language. Colour classes across all components resolve from these tokens, so this task recolours ~90% of the site in one place. (Contrast fixes where semantics changed are Task 3.)

**Files:**
- Modify: `app/layout.tsx` (font imports, themeColor)
- Modify: `tailwind.config.ts` (colors, shadows)
- Modify: `app/globals.css` (font var fallbacks, heading tracking, focus/selection/button/phone-field hexes)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: Tailwind tokens every later task styles with: `ink` (warm near-black ramp), `paper`/`paper-alt` (warm off-white), `stone-50..800` (warm grey ramp), `accent` (deep fen green, `accent-300` light sage for use ON dark surfaces, `accent-soft` pale green tint), shadow `soft`. Font classes: `font-display` = Fraunces (serif), `font-sans` = Hanken Grotesk (unchanged).

- [ ] **Step 1: Swap the display font in `app/layout.tsx`**

Replace the `Bricolage_Grotesque` import and instantiation:

```tsx
import { Fraunces, Hanken_Grotesk } from "next/font/google";

// Display: classical serif to match the Fenwright wordmark. Editorial,
// established-firm feel; deliberately not a tech-startup grotesque.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});
```

(`Hanken_Grotesk` body font block stays exactly as is.)

In the same file change the viewport themeColor:

```tsx
export const viewport: Viewport = {
  themeColor: "#1A1713",
  width: "device-width",
  initialScale: 1,
};
```

- [ ] **Step 2: Replace the palette and shadows in `tailwind.config.ts`**

Replace the whole `colors` object and the `emerald` shadow inside `theme.extend`:

```ts
colors: {
  // Warm near-black ink: heading text + the dark brand surface.
  ink: {
    DEFAULT: "#1A1713",
    900: "#121009",
    800: "#1A1713",
    700: "#2A251D",
    600: "#3A342A",
    500: "#4E463A",
  },
  // Fen green: muted, deep, used sparingly. 300 is the light sage tone
  // for accent text ON dark ink surfaces (the deep green fails contrast there).
  accent: {
    DEFAULT: "#1F6B4E",
    300: "#A7C9B6",
    500: "#1F6B4E",
    600: "#185A41",
    700: "#124733",
    ink: "#F7F5F0", // text ON the deep green
    soft: "#E7EFE9",
  },
  // Warm off-white paper, matching the logo background.
  paper: {
    DEFAULT: "#F7F5F0",
    alt: "#EFEBE3",
  },
  // Warm neutral ramp (still keyed `stone` so existing classes just re-tint).
  stone: {
    50: "#F5F3EE",
    100: "#EAE6DE",
    200: "#DAD4C8",
    300: "#C0B8A8",
    400: "#9A9081",
    500: "#6E665A",
    600: "#5A5348",
    700: "#403A31",
    800: "#2B261F",
  },
},
```

In `boxShadow`, replace the `emerald` entry (keep `card`, `lift`, `tight`, re-tinting their rgba ink from `14,21,38` to `26,23,19`):

```ts
boxShadow: {
  card: "0 1px 2px rgba(26,23,19,0.04), 0 14px 34px -20px rgba(26,23,19,0.28)",
  lift: "0 40px 80px -32px rgba(26,23,19,0.45)",
  tight: "0 1px 2px rgba(26,23,19,0.10), 0 2px 10px -4px rgba(26,23,19,0.16)",
  soft: "0 16px 40px -18px rgba(26,23,19,0.35)",
},
```

Note: removing the `emerald` shadow key will break `shadow-emerald` usages in `globals.css` (fixed in Step 3) and components (swept in Task 3).

- [ ] **Step 3: Update `app/globals.css`**

1. Font var fallbacks (`:root`): `--font-display: "Fraunces", Georgia, serif;` (leave `--font-sans` as is).
2. Heading style: serif wants less crush. In the `h1..h4` rule set `font-weight: 600; letter-spacing: -0.01em;`.
3. Focus ring: `:focus-visible { outline: 2.5px solid #1F6B4E; ... }`.
4. Selection: `::selection { background: #1A1713; color: #F7F5F0; }`.
5. Buttons (components layer):

```css
/* Primary: solid ink pill with paper text. Quiet, confident. */
.btn-primary {
  @apply btn bg-ink text-paper shadow-tight hover:bg-ink-700 hover:-translate-y-0.5 active:translate-y-0;
}

/* Secondary on light: ink outline that fills on hover. (unchanged) */
.btn-secondary {
  @apply btn border-2 border-ink/15 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-paper;
}

/* On the dark ink surface: paper pill with ink text. */
.btn-onink {
  @apply btn bg-paper text-ink shadow-soft hover:bg-white hover:-translate-y-0.5 active:translate-y-0;
}
```

(`.btn-ghost-onink` stays as is.)
6. Phone field focus colours: `.fw-phone .PhoneInput--focus, .fw-phone .PhoneInput:focus-within { border-color: #1F6B4E; box-shadow: 0 0 0 2px rgba(31,107,78,0.30); }`. Also re-tint the field's static hexes to the new ramp: border `#DAD4C8`, country divider `#EAE6DE`, input text `#1A1713`, placeholder/arrow `#6E665A`. Error reds stay.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: both pass. If `shadow-emerald` still exists anywhere, build won't fail (unknown class = silently dropped), so also run: `grep -rn "shadow-emerald" app components` and expect **no hits in globals.css** (component hits are OK, Task 3 removes them).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx tailwind.config.ts app/globals.css
git commit -m "feat(brand): serif display font, warm monochrome palette, muted fen-green accent"
```

---

### Task 3: Contrast sweep: fix every place the accent-token meaning changed

The old accent was a bright light green (dark text on it, worked as text on dark navy). The new accent is a deep green (needs light text on it, fails as text on near-black). Sweep every component.

**Files:**
- Modify: `components/PhoneMock.tsx`
- Modify: `components/Demo.tsx`
- Modify: `components/Problem.tsx`
- Modify: `components/HowItWorks.tsx`
- Modify: `components/ContactForm.tsx`
- Modify: `components/Footer.tsx`

**Interfaces:**
- Consumes: Task 2 tokens (`accent-300`, `accent.ink`, `shadow-soft`)
- Produces: nothing new; all components render legibly on the new palette

- [ ] **Step 1: Enumerate every affected class**

Run: `grep -rn "accent\|emerald" components app | grep -v node_modules`

Apply this mapping wherever it matches (exact known instances listed, but trust the grep over this list):

| Pattern (old) | Replace with | Known locations |
|---|---|---|
| `bg-accent` + `text-ink` on the same element (chat bubbles, badges, icon circles) | `bg-accent text-paper` | `Demo.tsx:295` (reply bubble), `Demo.tsx:394` (timer badge), `Demo.tsx:320` + `ContactForm.tsx:78` (success icon circles), `PhoneMock.tsx:46` (reply bubble) |
| `text-accent` on a dark `bg-ink` surface | `text-accent-300` | `Problem.tsx:19` (giant stat value), `Problem.tsx:32` (last stat), `PhoneMock.tsx:29` (avatar letter), `PhoneMock.tsx:56` (badge seconds) |
| `hover:text-accent` on dark footer | `hover:text-accent-300` | `Footer.tsx:29` |
| `text-accent` on light surfaces | keep (deep green on paper passes contrast) | `HowItWorks.tsx:18` (step numbers), `Demo.tsx:307` ("Replied in Ns"), `PhoneMock.tsx:34` |
| `shadow-emerald` | `shadow-soft` | any component hits from Step 1's grep |
| `border-accent-600/30 bg-accent-soft` (Demo stage-two panel) | keep (soft tint + deep border works) | `Demo.tsx:317` |

Also check `Demo.tsx` and `ContactForm.tsx` success-circle inner SVG/checkmark: if it uses `stroke="currentColor"` inside a `text-ink` wrapper, the wrapper becomes `text-paper`.

- [ ] **Step 2: Verify rendered contrast**

Run: `npx next dev -p 3007` then `curl -s http://localhost:3007/ > /tmp/page.html` and check:
- `grep -c "text-accent-300" /tmp/page.html` ≥ 3 (Problem stats + PhoneMock)
- `grep -c "shadow-emerald" /tmp/page.html` = 0

Then eyeball it: open http://localhost:3007 in the browser pane and confirm the Problem (dark) section stats are readable sage-on-ink and chat bubbles are green-with-paper-text. (Avoid screenshots of the Cal.com iframe region; read DOM instead if the tool hangs.)

- [ ] **Step 3: Commit**

```bash
git add components/
git commit -m "fix(brand): contrast sweep for deep-green accent on new palette"
```

---

### Task 4: New logo lockup, wave motif, favicon

Recreate the supplied logo (serif "Fenwright" wordmark with a line-wave-line rule above) as inline SVG + styled text so it scales, inverts for the dark footer, and has no background box. The owner's file is a raster on grey; do NOT embed the raster.

**Files:**
- Modify: `components/Logo.tsx` (full rewrite)
- Modify: `public/favicon.svg` (full rewrite)

**Interfaces:**
- Consumes: Task 2 (`font-display` = Fraunces, `text-ink`/`text-paper`)
- Produces: `Logo({ variant?: "ink" | "paper", className?, showWordmark? })` (same props as today, so `Nav.tsx` and `Footer.tsx` keep working unmodified), plus named export `WaveRule({ className?, variant? })` for reuse as a section divider.

- [ ] **Step 1: Rewrite `components/Logo.tsx`**

```tsx
import { site } from "@/config/site";

type Variant = "ink" | "paper";

type Props = {
  /** color scheme: on light surfaces vs on the dark ink surface */
  variant?: Variant;
  className?: string;
  showWordmark?: boolean;
};

/**
 * The Fenwright rule: thin line, hand-drawn double wave, thin line.
 * Taken from the official wordmark; also used standalone as a section divider.
 */
export function WaveRule({
  className = "",
  variant = "ink",
}: {
  className?: string;
  variant?: Variant;
}) {
  const stroke = variant === "paper" ? "#F7F5F0" : "#1A1713";
  return (
    <svg
      viewBox="0 0 240 16"
      className={className}
      aria-hidden="true"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M6 8h84" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M96 8c4-6 8-6 12 0s8 6 12 0 8-6 12 0 8 6 12 0"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M150 8h84" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Fenwright lockup: wave rule over a serif wordmark, per the official logo.
 * Monochrome by design; inverts via `variant` for the dark footer.
 */
export function Logo({ variant = "ink", className = "", showWordmark = true }: Props) {
  const text = variant === "paper" ? "text-paper" : "text-ink";
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <WaveRule className="h-2.5 w-full max-w-[9.5rem]" variant={variant} />
      {showWordmark && (
        <span className={`font-display text-[1.45rem] font-semibold leading-none tracking-[0.01em] ${text}`}>
          {site.brand.wordmark}
        </span>
      )}
    </span>
  );
}
```

Note: the old `Mark` export (speech bubble + bolt) is deleted; `grep -rn "Mark" components app` first to confirm `Logo.tsx` itself is the only consumer (true as of planning; re-verify).

- [ ] **Step 2: Rewrite `public/favicon.svg`**

Serif "F" on a warm-paper rounded tile (system serif so the favicon needs no font loading):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#F7F5F0"/>
  <path d="M4 6.5h24" stroke="#1A1713" stroke-width="1"/>
  <text x="16" y="25" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="600" font-size="21" fill="#1A1713">F</text>
</svg>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`, then with the dev server up: `curl -s http://localhost:3007/ | grep -o "Fenwright mark"` should be empty (old aria label gone) and `curl -s http://localhost:3007/ | grep -c "M96 8c4-6"` ≥ 2 (nav + footer lockups render the wave). In the browser pane, confirm the nav lockup reads as the logo and the footer variant is paper-on-ink.

- [ ] **Step 4: Commit**

```bash
git add components/Logo.tsx public/favicon.svg
git commit -m "feat(brand): serif wordmark lockup with wave rule, new favicon"
```

---

### Task 5: Repositioning copy rewrite in `config/site.ts` + section rename/reorder

The big one: rewrite every homepage copy block from "AI receptionist product" to "efficiency consultancy". Rename `whatYouGet` → `services` (with component rename), reorder the page, and kill every "60 seconds". Copy below is final; write it verbatim.

**Files:**
- Modify: `config/site.ts`
- Modify: `components/Hero.tsx` (one hardcoded line moves to config)
- Rename: `components/WhatYouGet.tsx` → `components/Services.tsx`
- Modify: `components/Problem.tsx` (verify 2-stat layout)
- Modify: `app/page.tsx` (imports + order)

**Interfaces:**
- Consumes: nothing structural from earlier tasks (copy is token-independent)
- Produces: `site.services` (same shape as old `site.whatYouGet`: `{ kicker, headline, bullets: {title, body}[] }`), `site.hero.note: string`, `Services()` component with section `id="services"`, page order Hero → Problem → Services → Demo → HowItWorks → BookCall → ContactForm (AboutUs slots in during Task 6). Nav links: `#services`, `#demo`, `#how-it-works` (Task 6 adds `#about`).

- [ ] **Step 1: Rewrite the copy blocks in `config/site.ts`**

Replace the listed fields exactly (fields not listed stay untouched; `industries`, `calcom`, `legal`, `demo.sms` consent strings all stay):

```ts
brand: {
  name: "Fenwright",
  wordmark: "Fenwright",
  tagline: "Consulting and systems that give small businesses their time back.",
  email: "contact@fenwright.ie",
},

nav: {
  links: [
    { label: "What we do", href: "#services" },
    { label: "Demo", href: "#demo" },
    { label: "How it works", href: "#how-it-works" },
  ],
  cta: { label: "Book a call", href: "#book" },
},

hero: {
  kicker: "For busy service businesses in Ireland and the UK",
  headline: "You did not start your business to chase paperwork and missed calls.",
  subhead:
    "Fenwright works with clinics, salons and trades to find where the week leaks time and money, then builds the quiet systems that plug it. Enquiries answered, bookings kept, admin handled.",
  primaryCta: { label: "Book a call", href: "#book" },
  secondaryCta: { label: "See a live example", href: "#demo" },
  note: "No jargon, no big-agency retainers. Two people who fix how your week runs.",
  // The mock phone badge (unchanged)
  phone: { ...keep existing object... },
},

problem: {
  kicker: "Where the day goes",
  headline: "Small businesses rarely lose money in big ways. They lose it in minutes.",
  body: "A call missed while you are with a customer. A quote you meant to send on Friday. An evening gone to invoices. None of it looks like a crisis, and together it quietly caps how far your business can grow. The clearest leak of all is the enquiry that never got answered:",
  stats: [
    {
      value: "21x",
      label:
        "more likely to qualify a lead when you respond within 5 minutes versus 30 minutes.",
    },
    {
      value: "40+ hrs",
      label: "the average business response time to a new online enquiry.",
    },
  ],
  source: "...keep existing source line verbatim...",
},

demo: {
  kicker: "Proof, not promises",
  headline: "Try one of our systems right now.",
  subhead:
    "This is a reception system we build for clinics, salons and trades, running live on this page. Pick an industry, send a mock enquiry, and watch the reply come back in seconds. Then have it text your actual phone.",
  ...generateLabel, regenerateLabel, enquiryLabel, sms: keep all existing values...
},

// RENAMED from whatYouGet:
services: {
  kicker: "What we do",
  headline: "We find the leak, then build the fix.",
  bullets: [
    {
      title: "Every enquiry answered",
      body: "Missed calls, website forms and ad enquiries get a warm reply straight away, so the job is yours before anyone else picks up the phone.",
    },
    {
      title: "Bookings that look after themselves",
      body: "Confirmations, reminders and follow-ups go out on time, every time. Fewer no-shows, a fuller diary.",
    },
    {
      title: "Admin off your plate",
      body: "Quotes, invoices and customer records kept tidy automatically, instead of eating your evenings.",
    },
    {
      title: "One clear picture",
      body: "Every lead, job and follow-up logged in one place, so you always know where the money is.",
    },
  ],
},

howItWorks: {
  kicker: "How it works",
  headline: "One short call. A clear plan. Systems that quietly run.",
  steps: [
    {
      title: "Book a call",
      body: "Thirty minutes with Billal about how your week actually runs. No pitch, no jargon, just questions about where the time goes.",
    },
    {
      title: "Get a plain-English plan",
      body: "We come back with the two or three fixes worth doing first, what each one is worth to you, and a fixed price.",
    },
    {
      title: "We build it, you feel it",
      body: "Ammar builds the systems around how you already work. Leads answered, diary fuller, evenings back.",
    },
  ],
},

book: {
  kicker: "Book a call",
  headline: "Tell us how your week runs. We will tell you what we would fix.",
  subhead:
    "A short, no-pressure call. If we cannot see a fix worth paying for, we will say so.",
},

contact: {
  kicker: "Prefer to text?",
  headline: "Prefer we text you first?",
  subhead:
    "Leave your number and a line about what you need, and one of our systems will text you back the same way it would text your customers.",
  ...all remaining contact fields keep existing values...
},

footer: {
  blurb:
    "Fenwright helps small service businesses in Ireland and the UK run faster. Enquiries answered, bookings kept, admin handled.",
  email: "contact@fenwright.ie",
  copyright: `© ${new Date().getFullYear()} Fenwright. All rights reserved.`,
},
```

(The `...keep existing...` notations mean copy those values through unchanged from the current file; they are not literal.)

- [ ] **Step 2: Move Hero's hardcoded trust line into config**

`components/Hero.tsx:34-36` hardcodes "Missed calls, web forms and Facebook or Instagram leads, answered day and night." Replace that JSX text with `{h.note}` (field added in Step 1). No other Hero changes.

- [ ] **Step 3: Rename WhatYouGet → Services**

```bash
git mv components/WhatYouGet.tsx components/Services.tsx
```

Inside `Services.tsx`: rename the exported function `WhatYouGet` → `Services`, change its config read from `site.whatYouGet` to `site.services`, and set the section's `id="services"` (check what id it has today; the nav now points at `#services`).

- [ ] **Step 4: Reorder `app/page.tsx`**

```tsx
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Services } from "@/components/Services";
import { Demo } from "@/components/Demo";
import { HowItWorks } from "@/components/HowItWorks";
import { BookCall } from "@/components/BookCall";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <Services />
        <Demo />
        <HowItWorks />
        <BookCall />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Check Problem's 2-stat layout**

`Problem.tsx` renders `stats[0]` huge and maps the rest; with 2 stats the "rest" is a single item. Read the component; if the remaining-stats grid hardcodes 2 columns, adjust so one item doesn't look orphaned (e.g. the single remaining stat spans full width). Keep the "last stat gets `text-accent-300`" treatment from Task 3 pointing at the `40+ hrs` stat now.

- [ ] **Step 6: Verify the sweep is total**

Run: `npx tsc --noEmit && npm run build`, then with dev server up:

```bash
curl -s http://localhost:3007/ -o /tmp/page.html
grep -ci "60 second\|~60s\|about 60" /tmp/page.html   # expect 0
grep -ci "receptionist that never\|AI receptionist" /tmp/page.html   # expect 0
grep -c "in seconds" /tmp/page.html   # expect exactly 1 (demo subhead)
grep -c 'id="services"' /tmp/page.html   # expect 1
```

Also `grep -rn "whatYouGet" app components config` → 0 hits. Note the `<title>`/OG description update automatically (layout.tsx reads `site.brand.tagline` + `site.hero.subhead`).

- [ ] **Step 7: Commit**

```bash
git add config/site.ts components/Hero.tsx components/Services.tsx components/Problem.tsx app/page.tsx
git commit -m "feat(copy): reposition as efficiency consultancy, demo becomes proof, single speed claim"
```

---

### Task 6: About Us section (Ammar + Billal, monograms, LinkedIn + shared WhatsApp)

New homepage section between HowItWorks and BookCall. Monogram tiles (no photos yet, photos swappable later). Icons render only when their config URL/number is non-empty, so nothing dead ships while the owner gathers links.

**Files:**
- Modify: `config/site.ts` (add `about` block after `howItWorks`)
- Create: `components/AboutUs.tsx`
- Modify: `app/page.tsx` (insert `<AboutUs />` between `<HowItWorks />` and `<BookCall />`)
- Modify: `config/site.ts` nav.links (append About link)

**Interfaces:**
- Consumes: Task 2 tokens, Task 4's `WaveRule` (`import { WaveRule } from "@/components/Logo"`), existing `Reveal` and `SectionHead` components (read `components/SectionHead.tsx` first and match how other sections use it; if its props don't fit, render kicker/headline manually copying the markup pattern from `Services.tsx`).
- Produces: `site.about` config shape (below), `AboutUs()` server component with section `id="about"`.

- [ ] **Step 1: Add the `about` block to `config/site.ts`** (after `howItWorks`)

```ts
about: {
  kicker: "Who you'll work with",
  headline: "Two people. No account managers.",
  subhead:
    "You deal directly with the two of us, from the first call to the day your systems go live.",
  // Shared business WhatsApp in E.164. Empty string hides the buttons.
  whatsapp: "+353899406583",
  whatsappPreset: "Hi Fenwright, I'd like to talk about my business.",
  people: [
    {
      name: "Ammar Bakhet",
      role: "Systems and software",
      initials: "AB",
      bio: "Ammar designs and builds the systems: the reply engines, booking flows and automations that do the work. If it runs on its own, he made it run.",
      // Full profile URL. Empty string hides this person's LinkedIn button.
      linkedin: "https://www.linkedin.com/in/ammar-bakhet-b66b97364",
    },
    {
      name: "Billal Khan",
      role: "Consulting",
      initials: "BK",
      bio: "Billal leads the consulting. He sits down with you, works out where your week leaks time and money, and turns that into a plan worth building.",
      linkedin: "https://www.linkedin.com/in/billal-khan-100505424",
    },
  ],
},
```

Append to `nav.links`: `{ label: "About", href: "#about" }` (after "How it works").

- [ ] **Step 2: Create `components/AboutUs.tsx`**

```tsx
import { site } from "@/config/site";
import { Reveal } from "@/components/Reveal";
import { WaveRule } from "@/components/Logo";

const a = site.about;

function waLink(number: string, preset: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(preset)}`;
}

/** Simple inline brand glyphs so no icon package is added. */
function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.1h4.56V23H.22zM8.4 8.1h4.37v2.03h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 6.99V23h-4.56v-7.24c0-1.73-.03-3.95-2.41-3.95-2.41 0-2.78 1.88-2.78 3.82V23H8.4z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2zm0 18.02a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.06.89.9-2.98-.2-.31a8.12 8.12 0 1 1 6.79 3.71zm4.45-6.08c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.1-.5.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.72 2.62 4.16 3.68.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

export function AboutUs() {
  return (
    <section id="about" className="section bg-paper-alt">
      <div className="container-px py-20 sm:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">{a.kicker}</p>
          <h2 className="mt-4 max-w-2xl text-4xl text-ink sm:text-5xl">{a.headline}</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">{a.subhead}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {a.people.map((p) => (
            <Reveal key={p.name}>
              <article className="flex h-full flex-col rounded-xl2 border border-stone-200 bg-paper p-8 shadow-card">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink">
                  <span className="font-display text-2xl font-semibold text-paper">{p.initials}</span>
                </div>
                <h3 className="mt-6 text-2xl text-ink">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-accent">{p.role}</p>
                <WaveRule className="mt-4 h-2 w-24 self-start" />
                <p className="mt-4 flex-1 leading-relaxed text-stone-600">{p.bio}</p>
                <div className="mt-6 flex gap-3">
                  {p.linkedin && (
                    <a
                      href={p.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${p.name} on LinkedIn`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      <LinkedInIcon />
                    </a>
                  )}
                  {a.whatsapp && (
                    <a
                      href={waLink(a.whatsapp, a.whatsappPreset)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Message ${p.name.split(" ")[0]} on WhatsApp`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      <WhatsAppIcon />
                    </a>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Before writing, read `components/Services.tsx` (post-Task-5) and `components/Reveal.tsx` and match their actual section/heading markup and `Reveal` usage (props, wrapper element) rather than the sketch above if they differ. The `&&` guards are deliberate: they keep the buttons from rendering as dead links if a URL is ever blanked out. All three values are populated, so both icons must render for both people.

- [ ] **Step 3: Insert into `app/page.tsx`**

Add `import { AboutUs } from "@/components/AboutUs";` and place `<AboutUs />` between `<HowItWorks />` and `<BookCall />`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`, then with dev server up:

```bash
curl -s http://localhost:3007/ -o /tmp/page.html
grep -c 'id="about"' /tmp/page.html          # expect 1
grep -c "Ammar Bakhet" /tmp/page.html         # expect >= 1
grep -c "Billal Khan" /tmp/page.html          # expect >= 1
grep -c "wa.me/353899406583" /tmp/page.html   # expect 2 (one per person)
grep -c "linkedin.com/in/ammar-bakhet-b66b97364" /tmp/page.html   # expect 1
grep -c "linkedin.com/in/billal-khan-100505424" /tmp/page.html    # expect 1
grep -c 'href="#about"' /tmp/page.html        # expect >= 2 (nav + footer)
```

- [ ] **Step 5: Commit**

```bash
git add config/site.ts components/AboutUs.tsx app/page.tsx
git commit -m "feat(about): founders section with monograms, LinkedIn and shared WhatsApp links"
```

---

### Task 7: Full-page verification pass and handoff

**Files:**
- Modify: only what the checks below surface

**Interfaces:**
- Consumes: everything above
- Produces: a verified, locally committed rebrand ready for the owner's push-to-deploy decision

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf .next && npm run build
```

Expected: clean build. (If `EINVAL readlink` appears, that IS the OneDrive cache issue; the `rm -rf .next` already handles it, just retry.)

- [ ] **Step 2: Whole-page copy audit against production start**

Run `npx next start -p 3007` (prod build, not dev) and:

```bash
curl -s http://localhost:3007/ -o /tmp/final.html
grep -ci "60 second\|~60s\|about 60" /tmp/final.html      # 0
grep -oc "in seconds" /tmp/final.html                     # 1
grep -ci ">AI<\|AI receptionist\|artificial intelligence" /tmp/final.html   # 0 (word-boundary spot check; then manually skim)
grep -c "Book a call" /tmp/final.html                     # nav pill + hero + section + footer link; confirm nav header region has exactly 1
grep -c 'id="services"\|id="about"\|id="demo"\|id="how-it-works"\|id="book"' /tmp/final.html  # 5 section anchors
```

Then read the full rendered text (`curl -s http://localhost:3007/ | npx html-to-text` or just skim the HTML) top to bottom checking: no em dashes in visitor copy, no leftover receptionist-as-whole-business framing, About bios read correctly.

- [ ] **Step 3: Interactive smoke test in the browser pane**

Open http://localhost:3007: nav anchor links scroll to the right sections; demo still generates a reply (POST `/api/demo-reply` returns 200); contact form renders; Cal.com embed loads (read DOM state, don't screenshot the iframe). Check mobile menu at the mobile viewport lists the new links + single CTA.

- [ ] **Step 4: Verify the outbound contact links resolve**

Confirm both LinkedIn URLs load a real profile and the `wa.me` link opens a chat to the right number. These are the owner's real accounts: check them, do not message anyone.

- [ ] **Step 5: Report to owner, do not push**

All work lives on the `rebrand/consultancy` branch. Summarize what changed and ask for explicit approval before merging to `main` (merging deploys to production via Vercel). Do not push or merge without it.

---

## Explicitly out of scope (YAGNI, or owner's call)

- `/privacy` copy and `site.legal` (owner's settled decisions; the privacy page's factual description of the service still holds).
- OG/social share image, separate About page, photo headshots (monograms are swap-ready when photos exist).
- `lib/receptionist.ts` prompt, all API behavior, rate limits, CSP.
- README/HANDOFF doc updates (internal docs, not visitor-facing).
