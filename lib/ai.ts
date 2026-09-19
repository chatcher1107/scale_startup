// Server-only AI helper. Reads OPENAI_API_KEY from .env.local (never sent to the browser).
// If no real key is present, callers fall back to mock mode.

const BASE = () => (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
export const MODEL = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

export function isLive(): boolean {
  const k = process.env.OPENAI_API_KEY;
  return !!k && k.length > 12 && !k.includes("paste-your-key");
}

// Best-effort protection for a public demo link: cap how often one visitor can trigger paid AI calls.
// Over the limit, the routes quietly fall back to mock mode instead of failing.
const hits = new Map<string, number[]>();
export function withinLimit(req: Request, max = 50, windowMs = 10 * 60 * 1000): boolean {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length <= max;
}

export const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n);

export function cleanTranscript<T extends { role: string; text: string }>(t: T[]): T[] {
  return (Array.isArray(t) ? t : []).slice(-24).map((m) => ({ ...m, text: clip(m.text, 700) }));
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: Msg[], opts: { json?: boolean; temperature?: number; maxTokens?: number } = {}): Promise<string> {
  const res = await fetch(`${BASE()}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL(),
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 500,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}
