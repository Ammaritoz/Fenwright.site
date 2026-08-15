/**
 * Push a persona to Vapi. The repo is the source of truth for assistant
 * configuration; the dashboard is a view of it.
 *
 * Field names verified against Vapi's live docs and API, not assumed from the
 * original plan text:
 * - model.provider "anthropic" / model.model "claude-sonnet-5" confirmed.
 * - Tool calls arrive at ONE server URL for the whole assistant with a batch
 *   in the body (lib/voice/vapi.ts), not one URL per tool.
 * - Tools are NOT inlined into the assistant. Each is its own resource
 *   created via POST /tool, carrying its own server config, and the
 *   assistant references them by id via model.toolIds. Confirmed by reading
 *   Vapi's docs rather than assumed; getting this one wrong would mean the
 *   model has no way to call our functions at all.
 * - Vapi does not compute a per-request HMAC. The shared secret is sent back
 *   as a static header, configured on the tool's own server.headers.
 * - Turn-taking fields are startSpeakingPlan.waitSeconds and
 *   stopSpeakingPlan.numWords/backoffSeconds, not the flat shape the original
 *   plan sketched.
 *
 * Idempotent: re-running for the same persona updates the existing tools and
 * assistant (matched by name) rather than creating duplicates, so the repo
 * can be synced repeatedly as the persona changes.
 *
 * Usage: npm run voice:sync -- electrician
 */
import { personas } from "../config/personas";
import { composeSystemPrompt } from "../lib/voice/prompt";

const PLACEHOLDER_DESTINATION = "+353000000000";
const API_BASE = "https://api.vapi.ai";
// Must match VAPI_SECRET_HEADER in lib/voice/vapi.ts. Not imported directly:
// that module carries "import server-only", which throws under plain tsx
// (no Next.js request context), and this script needs nothing else from it.
const VAPI_SECRET_HEADER = "x-vapi-secret";

type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

async function main() {
  const personaId = process.argv[2];
  if (!personaId) {
    throw new Error("Usage: npm run voice:sync -- <personaId>");
  }

  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    throw new Error(`Unknown persona: ${personaId}`);
  }

  const apiKey = process.env.VAPI_PRIVATE_KEY;
  const baseUrl = process.env.VOICE_PUBLIC_BASE_URL;
  const secret = process.env.VOICE_WEBHOOK_SECRET;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!apiKey) throw new Error("VAPI_PRIVATE_KEY is not set");
  if (!baseUrl) throw new Error("VOICE_PUBLIC_BASE_URL is not set");
  if (!secret) throw new Error("VOICE_WEBHOOK_SECRET is not set");

  if (persona.escalation.destination === PLACEHOLDER_DESTINATION) {
    throw new Error(
      `${personaId} still has the placeholder transfer number. Set a real mobile before syncing.`
    );
  }
  if (!persona.identity.voiceId) {
    throw new Error(`${personaId} has no voiceId set. Pick a voice before syncing.`);
  }

  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const toolServer = { url: `${baseUrl}/api/voice/tools`, headers: { [VAPI_SECRET_HEADER]: secret } };

  console.log("Syncing tools...");
  const toolIds: string[] = [];
  for (const def of buildToolDefinitions()) {
    const id = await upsertTool(headers, def, toolServer);
    console.log(`  ${def.function.name} -> ${id}`);
    toolIds.push(id);
  }

  const { turnTaking } = persona;
  const name = `${persona.identity.businessName} (${persona.id})`;

  const body = {
    name,
    firstMessage: persona.greeting,
    model: {
      provider: "anthropic",
      model: "claude-sonnet-5",
      messages: [{ role: "system", content: composeSystemPrompt(persona) }],
      toolIds,
    },
    voice: { provider: "vapi", voiceId: persona.identity.voiceId },
    server: { url: `${baseUrl}/api/voice/webhook`, headers: { [VAPI_SECRET_HEADER]: secret } },
    startSpeakingPlan: { waitSeconds: turnTaking.endpointingMs / 1000 },
    stopSpeakingPlan: {
      numWords: turnTaking.interruptWords,
      backoffSeconds: turnTaking.responseDelayMs / 1000,
    },
    metadata: { personaId: persona.id },
  };

  console.log("Syncing assistant...");
  const existing = await findByName(headers, `${API_BASE}/assistant`, name);
  const res = await fetch(
    existing ? `${API_BASE}/assistant/${existing.id}` : `${API_BASE}/assistant`,
    { method: existing ? "PATCH" : "POST", headers, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    throw new Error(`Vapi assistant sync failed: ${res.status} ${await res.text()}`);
  }

  const created = (await res.json()) as { id?: string };
  if (!created.id) {
    throw new Error("Vapi did not return an assistant id.");
  }
  console.log(`Synced ${persona.id} -> assistant ${created.id}`);

  if (phoneNumberId) {
    // A phone number is inert without this: it is a separate resource, and
    // Vapi does not know which assistant should answer it until told.
    const attachRes = await fetch(`${API_BASE}/phone-number/${phoneNumberId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ assistantId: created.id }),
    });
    if (!attachRes.ok) {
      throw new Error(
        `Assistant created (${created.id}) but attaching it to the phone number failed: ` +
          `${attachRes.status} ${await attachRes.text()}`
      );
    }
    console.log(`Attached assistant ${created.id} to phone number ${phoneNumberId}`);
  } else {
    console.log("VAPI_PHONE_NUMBER_ID not set; assistant created but not attached to a number.");
  }
}

/** Find an existing resource on a Vapi list endpoint by exact name match. */
async function findByName(
  headers: Record<string, string>,
  listUrl: string,
  name: string
): Promise<{ id: string } | null> {
  const res = await fetch(listUrl, { headers });
  if (!res.ok) return null;
  const list = (await res.json()) as Array<{ id: string; name?: string; function?: { name: string } }>;
  const match = list.find((item) => item.name === name || item.function?.name === name);
  return match ? { id: match.id } : null;
}

/**
 * Create or update a tool by function name, so re-running the sync script
 * converges on one tool per name rather than accumulating duplicates.
 */
async function upsertTool(
  headers: Record<string, string>,
  def: ToolDefinition,
  server: { url: string; headers: Record<string, string> }
): Promise<string> {
  const existing = await findByName(headers, `${API_BASE}/tool`, def.function.name);
  const body = { ...def, server };

  const res = await fetch(existing ? `${API_BASE}/tool/${existing.id}` : `${API_BASE}/tool`, {
    method: existing ? "PATCH" : "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Vapi tool sync failed for ${def.function.name}: ${res.status} ${await res.text()}`);
  }

  const result = (await res.json()) as { id: string };
  return result.id;
}

/**
 * The four tool functions the model can call. Names match runTool's switch in
 * lib/voice/tools.ts exactly; a mismatch here means the model calls a tool
 * name our dispatcher does not recognise, which returns a speakable apology
 * rather than failing loudly, so this list is worth getting right.
 */
function buildToolDefinitions(): ToolDefinition[] {
  return [
    {
      type: "function",
      function: {
        name: "check_availability",
        description: "Check real appointment availability before offering a time to the caller.",
        parameters: {
          type: "object",
          properties: {
            personaId: { type: "string" },
            preferredDate: {
              type: "string",
              description: "ISO 8601 date-time, if the caller named a day",
            },
            partOfDay: { type: "string", enum: ["morning", "afternoon", "evening", "any"] },
          },
          required: ["personaId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Book a real appointment once the caller has agreed a specific time.",
        parameters: {
          type: "object",
          properties: {
            personaId: { type: "string" },
            slotStart: { type: "string", description: "ISO 8601 date-time of the agreed slot" },
            name: { type: "string" },
            phone: { type: "string", description: "E.164 format" },
            notes: { type: "string" },
          },
          required: ["personaId", "slotStart", "name", "phone"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "capture_lead",
        description: "Record the caller's details when there is no booking to make yet.",
        parameters: {
          type: "object",
          properties: {
            personaId: { type: "string" },
            name: { type: "string" },
            phone: { type: "string", description: "E.164 format" },
            intent: { type: "string" },
            summary: { type: "string" },
            urgency: { type: "string", enum: ["emergency", "soon", "routine"] },
          },
          required: ["personaId", "name", "phone", "intent", "summary", "urgency"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "send_recap_sms",
        description: "Text the caller a confirmation of what was just agreed.",
        parameters: {
          type: "object",
          properties: {
            personaId: { type: "string" },
            phone: { type: "string", description: "E.164 format" },
            kind: { type: "string", enum: ["booking", "callback"] },
            name: { type: "string" },
            spokenTime: { type: "string" },
          },
          required: ["personaId", "phone", "kind", "name"],
        },
      },
    },
  ];
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
