// pages/api/packers-agent.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Ajv from "ajv";

const SYSTEM_PROMPT = `You are "Packers Fan Companion" — an AI agent that provides emotional validation, short tactical analysis, fan-specific humor, and an optimistic close-out for Green Bay Packers fans after frustrating or confusing moments in a game.

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

// Few-shot example assistant content (keeps the model guided)
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
      closing: "We’ll bounce back — it stings, but we’ll be watching the W next week."
    })
  }
];

// Output schema for AJV
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

// Utility: extract first JSON object from possibly prosy assistant output
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
  // defensive: handle a few possible shapes
  const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? "";
  return String(content);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, mode } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Request must include `message` string in body" });
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

    // Primary call
    const raw = await callModel(messages);

    // Try to extract JSON
    let parsed = extractFirstJsonObject(raw);

    // If not parsed, ask the model to extract JSON from its own output (fallback)
    if (!parsed) {
      const followup = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Please extract and return only the JSON object from the following assistant output. If impossible, return an object with empty strings for each field.\n\nAssistant output:\n" +
            raw
        }
      ];
      const raw2 = await callModel(followup);
      parsed = extractFirstJsonObject(raw2);
    }

    // Final fallback: safe empty object with default emotional_read
    if (!parsed || typeof parsed !== "object") {
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
      // If invalid, return schema errors and the coerced object for debug (server log)
      console.error("Schema validation errors:", validate.errors);
      return res.status(500).json({
        error: "Model produced output that failed schema validation",
        details: validate.errors,
        output: coerced
      });
    }

    return res.status(200).json(coerced);
  } catch (err: any) {
    console.error("packers-agent error:", err);
    return res.status(500).json({ error: err?.message ?? "server error" });
  }
}
