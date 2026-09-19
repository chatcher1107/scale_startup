import { isLive, MODEL } from "@/lib/ai";

export async function GET() {
  return Response.json({ live: isLive(), provider: "openai", model: MODEL() });
}
