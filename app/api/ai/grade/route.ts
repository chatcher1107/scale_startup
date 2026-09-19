import { chat, cleanTranscript, clip, isLive, parseJson, withinLimit } from "@/lib/ai";
import type { Scenario } from "@/lib/scenarios";
import type { CriterionResult } from "@/lib/data";

type Msg = { role: "guest" | "employee"; text: string };
type Body = { scenario: Scenario; transcript: Msg[]; handbook?: string; calibration?: { criterion: string; employeeSaid: string; aiSaid: string; managerSaid: string }[] };

function mockGrade(scenario: Scenario, transcript: Msg[]): { results: CriterionResult[]; summary: string } {
  const employeeMsgs = transcript.map((t, i) => ({ ...t, i })).filter((t) => t.role === "employee");
  const results: CriterionResult[] = scenario.criteria.map((c) => {
    const hit = employeeMsgs.find((m) => c.keywords.some((k) => m.text.toLowerCase().includes(k)));
    return hit
      ? { text: c.text, passed: true, evidence: hit.text.length > 140 ? hit.text.slice(0, 137) + "…" : hit.text, turn: hit.i }
      : { text: c.text, passed: false, evidence: "Not demonstrated in this conversation." };
  });
  const passed = results.filter((r) => r.passed).length;
  const summary =
    passed === results.length
      ? "Excellent. Every observable behavior was demonstrated."
      : passed >= results.length / 2
      ? "Good start. A couple of required behaviors were missing. Review the missed criteria and try again."
      : "Several required behaviors were missing. Practice the missed criteria and try the scenario again.";
  return { results, summary };
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { scenario } = body;
  const transcript = cleanTranscript(body.transcript);

  if (isLive() && withinLimit(req)) {
    try {
      const numbered = transcript.map((t, i) => `[${i}] ${t.role === "guest" ? "GUEST" : "EMPLOYEE"}: ${t.text}`).join("\n");
      const criteria = scenario.criteria.map((c, i) => `${i + 1}. ${c.text}`).join("\n");
      const system = `You grade a restaurant employee's practice conversation against criteria the company defined. Judge ONLY observable actions the EMPLOYEE actually said, never personality or tone guesses. A criterion passes only if the employee clearly did it. Be strict but fair.
Return JSON: {"results":[{"passed":boolean,"evidence":string,"turn":number|null}...],"summary":string}
- results must have exactly one entry per criterion, in order.
- evidence: for a pass, a short verbatim quote from the employee; for a fail, one short sentence on what was missing.
- turn: the transcript index [n] of the employee message that best supports the result, or null.
- summary: two sentences of coaching feedback addressed to the employee.${body.handbook ? `

The business's menu and policies (treat these as correct; an employee stating facts that contradict them, or promising something the policies forbid, should not pass the related criterion):
${clip(body.handbook, 6000)}` : ""}${body.calibration?.length ? `

This company's managers have corrected earlier grades. Learn their standards from these examples (they overrule your defaults):
${body.calibration.slice(0, 5).map((c) => `- Criterion "${clip(c.criterion, 160)}": employee said "${clip(c.employeeSaid, 300)}". AI said ${c.aiSaid}; manager ruled ${c.managerSaid}.`).join("\n")}` : ""}`;
      const user = `Scenario: ${scenario.persona}. ${scenario.situation}\n\nCriteria:\n${criteria}\n\nTranscript:\n${numbered}`;
      const out = parseJson<{ results: { passed: boolean; evidence: string; turn: number | null }[]; summary: string }>(
        await chat([{ role: "system", content: system }, { role: "user", content: user }], { json: true, temperature: 0.2, maxTokens: 700 })
      );
      const results: CriterionResult[] = scenario.criteria.map((c, i) => ({
        text: c.text,
        passed: !!out.results?.[i]?.passed,
        evidence: out.results?.[i]?.evidence ?? "",
        turn: typeof out.results?.[i]?.turn === "number" ? out.results[i].turn! : undefined,
      }));
      return Response.json({ results, summary: out.summary, mock: false });
    } catch (e) {
      console.error("grade AI failed, falling back to mock:", e);
    }
  }

  return Response.json({ ...mockGrade(scenario, transcript), mock: true });
}
