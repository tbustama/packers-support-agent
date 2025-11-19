// pages/api/packers-agent.ts
// Secure API endpoint with rate limiting and input validation
// Protects against abuse and reduces API costs by removing expensive fallback retry

import type { NextApiRequest, NextApiResponse } from "next";
import Ajv from "ajv";

// ============================================================================
// RATE LIMITING (In-Memory)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  hourlyCount: number;
  hourlyResetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limits: 10 requests per minute, 100 per hour per IP
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_HOUR = 100;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function getClientIP(req: NextApiRequest): string {
  // Check various headers for IP (handles proxies/load balancers)
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const remoteAddress = req.socket.remoteAddress;

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (typeof realIP === "string") {
    return realIP;
  }
  return remoteAddress || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry) {
    entry = {
      count: 1,
      resetAt: now + MINUTE_MS,
      hourlyCount: 1,
      hourlyResetAt: now + HOUR_MS,
    };
    rateLimitStore.set(ip, entry);
    return { allowed: true };
  }

  // Clean up old entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (val.hourlyResetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  // Check minute limit
  if (entry.resetAt < now) {
    entry.count = 1;
    entry.resetAt = now + MINUTE_MS;
  } else {
    entry.count++;
  }

  // Check hour limit
  if (entry.hourlyResetAt < now) {
    entry.hourlyCount = 1;
    entry.hourlyResetAt = now + HOUR_MS;
  } else {
    entry.hourlyCount++;
  }

  // Enforce limits
  if (entry.count > RATE_LIMIT_PER_MINUTE) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  if (entry.hourlyCount > RATE_LIMIT_PER_HOUR) {
    const retryAfter = Math.ceil((entry.hourlyResetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

const MAX_MESSAGE_LENGTH = 500; // Match frontend limit
const MAX_REQUEST_SIZE = 10 * 1024; // 10KB max request body

function validateInput(message: any, mode: any): { valid: boolean; error?: string } {
  // Message validation
  if (!message || typeof message !== "string") {
    return { valid: false, error: "Request must include `message` string in body" };
  }

  if (message.length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
  }

  // Mode validation (whitelist)
  const validModes = ["Balanced", "Zen", "Dramatic", "Angry", "Copium", "Analyst", "Petty"];
  if (mode !== undefined && mode !== null && !validModes.includes(mode)) {
    return { valid: false, error: `Invalid mode. Must be one of: ${validModes.join(", ")}` };
  }

  return { valid: true };
}

// ============================================================================
// ORIGINAL CODE (with fallback retry removed to save costs)
// ============================================================================

const SYSTEM_PROMPT = `You are "Packers Emotional Support Agent" — an AI agent that provides emotional validation, short tactical analysis, fan-specific humor, and an optimistic close-out for Green Bay Packers fans after frustrating or confusing moments in a game.
You are an expert in Packers football and have a deep understanding of the team and its players. 
You have knowledge of the Packers history and tradition, but have deep knowledge of the past 3 years with Matt LaFleur as the head coach and Jordan Love as the starting quarterback.

Behavior rules:
- Always output only valid JSON matching the provided schema (see schema in instructions). If you cannot fill a field, return an empty string for that field (do not return null).
- Short, clear, and fan-forward language. Keep each field under ~280 characters except tactical_breakdown which may be up to ~600.
- Follow this multi-step pipeline in order inside the JSON:
  1. emotional_read: single-word or short phrase of detected emotion (e.g., "frustration", "coping", "anger", "humor", "resignation").
  2. validation: empathic sentence validating the fan's feeling.
  3. tactical_breakdown: a concise football explanation of what likely happened (scheme, alignment, play concept)—no advanced stats or live data.
  4. reframing: an optimistic reframe explaining why it's not hopeless (player development, matchup changes, coaching adjustments).
  5. humor: a Packers-specific humorous line or mild rivalry jab.
  6. fan_ritual: 1 short actionable "healing ritual" (fun).
  7. closing: short optimistic signoff.

Tone and modes:
- Default mode is "Balanced Fan" (empathetic + analyst + jokey). The API may pass a "mode" parameter: "Zen", "Dramatic", "Angry", "Copium", "Analyst", "Petty". Adjust tone accordingly:
  - Zen: calmer, shorter validation, less sarcasm.
  - Angry: more cathartic language, stronger expletive-light phrasing permitted but avoid profanity.
  - Petty: more rival jabs (Bears/Vikings), short.
  - Analyst: longer tactical_breakdown, fewer jokes.
  - Copium: dramatic optimism, hyperbole.
  - Dramatic: theatrical language, over-the-top metaphor.

Emotional detection:
- Infer emotion from user's text. If uncertain, default to "frustration".

Constraints:
- Never claim live scores, stats, or that you "watched" the game. Use only reasoning from the user's message.
- Avoid medical/mental-health clinical advice. Emotional validation is allowed.
- Maximum JSON keys only as in the schema.

Output: Only the JSON object, nothing else.
`;

const FEW_SHOT_EXAMPLES = [
  {
    role: "user",
    content: "I can't believe that last pass — the DB just looked lost and the WR walked open. This team is hopeless."
  },
  {
    role: "assistant",
    content: JSON.stringify({
      emotional_read: "frustration",
      validation: "Totally brutal — that open throw feels personal.",
      tactical_breakdown:
        "Looks like the defense was in a soft zone and got stretched by a levels concept; linebackers got keyed on run and the nickel had a mismatch vs the slot.",
      reframing:
        "Not all doom — Love and the offense can exploit man matchups next drive, and LaFleur likes to attack those seams.",
      humor: "Deep breath — at least the Bears still exist to make us feel superior.",
      fan_ritual: "Take three slow breaths, then put on your favorite Packers hoodie.",
      closing: "We'll bounce back — it stings, but we'll be watching the W next week."
    })
  }
];

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    emotional_read: { type: "string" },
    validation: { type: "string" },
    tactical_breakdown: { type: "string" },
    reframing: { type: "string" },
    humor: { type: "string" },
    fan_ritual: { type: "string" },
    closing: { type: "string" }
  },
  required: [
    "emotional_read",
    "validation",
    "tactical_breakdown",
    "reframing",
    "humor",
    "fan_ritual",
    "closing"
  ],
  additionalProperties: false
};

const ajv = new Ajv();
const validate = ajv.compile(OUTPUT_SCHEMA);

function extractFirstJsonObject(text: string): any | null {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch (e) {
    return null;
  }
}

async function callModel(messages: Array<{ role: string; content: string }>) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in environment");

  const payload = {
    model: "gpt-5.1",
    messages,
    max_completion_tokens: 500,
    temperature: 0.7
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Model API error: ${resp.status} ${txt}`);
  }
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? "";
  return String(content);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check request size
  const contentLength = req.headers["content-length"];
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return res.status(413).json({ error: "Request too large" });
  }

  // Get client IP and check rate limit
  const clientIP = getClientIP(req);
  const rateLimitCheck = checkRateLimit(clientIP);

  if (!rateLimitCheck.allowed) {
    res.setHeader("Retry-After", rateLimitCheck.retryAfter?.toString() || "60");
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: rateLimitCheck.retryAfter
    });
  }

  try {
    const { message, mode } = req.body ?? {};

    // Validate input
    const inputValidation = validateInput(message, mode);
    if (!inputValidation.valid) {
      return res.status(400).json({ error: inputValidation.error });
    }

    // Build messages
    const systemMessage = { role: "system", content: SYSTEM_PROMPT };
    const userInstruction = {
      role: "user",
      content:
        `User message:${mode ? ` Mode: ${mode}` : ""}\n\n` +
        message +
        `\n\nRespond ONLY with a single JSON object matching the schema. If you cannot produce a field, return an empty string for that field.`
    };

    const messages = [systemMessage, ...FEW_SHOT_EXAMPLES, userInstruction];

    // Call model (ONLY ONCE - removed expensive fallback retry)
    const raw = await callModel(messages);
    let parsed = extractFirstJsonObject(raw);

    // If parsing fails, use safe fallback (NO SECOND API CALL to save costs)
    if (!parsed || typeof parsed !== "object") {
      console.warn(`[${clientIP}] Failed to parse model output, using fallback`);
      parsed = {
        emotional_read: "frustration",
        validation: "",
        tactical_breakdown: "",
        reframing: "",
        humor: "",
        fan_ritual: "",
        closing: ""
      };
    }

    // Coerce missing keys to empty strings
    const requiredKeys = [
      "emotional_read",
      "validation",
      "tactical_breakdown",
      "reframing",
      "humor",
      "fan_ritual",
      "closing"
    ];
    const coerced: Record<string, string> = {};
    for (const k of requiredKeys) {
      coerced[k] = typeof parsed[k] === "string" ? parsed[k] : "";
    }

    // Validate with AJV
    const ok = validate(coerced);
    if (!ok) {
      console.error(`[${clientIP}] Schema validation errors:`, validate.errors);
      return res.status(500).json({
        error: "Model produced output that failed schema validation",
        details: validate.errors,
        output: coerced
      });
    }

    // Log successful request (for monitoring)
    console.log(`[${clientIP}] Request processed successfully`);

    return res.status(200).json(coerced);
  } catch (err: any) {
    console.error(`[${clientIP}] packers-agent error:`, err);
    return res.status(500).json({ error: err?.message ?? "server error" });
  }
}
