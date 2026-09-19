"use client";

import { useMemo, useState } from "react";
import { COMPANY, LOCATIONS, type Audience } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES, CERT_BAR, type CategoryId, type Module } from "@/lib/scenarios";
import { handbookText } from "@/lib/handbook";
import { audienceTargets, empsAt, fmtDate, locCategoryAvg } from "@/lib/stats";
import { Badge, Empty, PageHeader, ScoreBar } from "@/components/ui";
import { Callout } from "@/components/Callout";

const AUDIENCES: { id: Audience; label: string; blurb: string }[] = [
  { id: "below-bar", label: "Anyone below 90% in this skill", blurb: "Targeted. Skips people who are already strong." },
  { id: "outdated", label: "Anyone whose training is out of date", blurb: "After a policy change: only people who haven't practiced since the sheet changed." },
  { id: "new-hires", label: "New hires only (under 8 weeks)", blurb: "Good for onboarding a new skill." },
  { id: "all", label: "Everyone at these locations", blurb: "A company-wide refresher." },
];

export default function SendTraining() {
  const { data, broadcastTraining } = useStore();
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [custom, setCustom] = useState<Module | null>(null);
  const [locs, setLocs] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>("below-bar");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("");
  const [topicCat, setTopicCat] = useState<CategoryId>("guests");
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const library = data.modules.filter((m) => !m.createdFor);
  const mod = custom && custom.id === moduleId ? custom : data.modules.find((m) => m.id === moduleId) ?? null;
  const cat = mod ? CATEGORIES.find((c) => c.id === mod.categoryId)! : null;

  const targets = useMemo(
    () => (mod ? audienceTargets(data, mod.id, mod.categoryId, locs, audience) : []),
    [data, mod, locs, audience]
  );

  const toggleLoc = (id: string) => setLocs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: `own-${Date.now()}`, text: topic.trim(), categoryId: topicCat, source: "Owner", handbook: handbookText(data.handbook) }),
      });
      const { module: m } = await res.json();
      setCustom(m);
      setModuleId(m.id);
    } catch {
      /* keep the form; user can retry */
    }
    setGenerating(false);
  };

  const send = () => {
    if (!mod || !targets.length) return;
    broadcastTraining({ module: mod, locationIds: locs, audience, message: message.trim() });
    setSent(`Sent "${mod.title}" to ${targets.length} people across ${locs.length} location${locs.length === 1 ? "" : "s"}. Each GM has been notified.`);
    setLocs([]);
    setMessage("");
    setModuleId(null);
    setCustom(null);
    setTopic("");
  };

  const lowest = [...LOCATIONS]
    .sort((a, b) => locCategoryAvg(data, a.id, mod?.categoryId ?? "allergy") - locCategoryAvg(data, b.id, mod?.categoryId ?? "allergy"))
    .slice(0, 3)
    .map((l) => l.id);

  return (
    <div>
      <PageHeader
        title="Send training"
        sub="Push a practice scenario to the locations that need it. GMs are notified automatically."
        right={
          <Callout align="right" title="Company-wide training in one click">
            <p>Choose a scenario, target the weakest locations (or only people whose training is out of date), and send. Every GM is notified and progress is tracked below.</p>
          </Callout>
        }
      />

      {sent && <div className="mb-5 rounded-xl bg-good-bg px-4 py-3 text-sm font-medium text-good">✓ {sent}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* 1. Training */}
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold text-plum-800"><span className="mr-2 text-plum-400">1</span>Choose a training</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {custom && (
                <button onClick={() => setModuleId(custom.id)} className={`rounded-xl border-2 p-4 text-left ${moduleId === custom.id ? "border-plum-700 bg-plum-50" : "border-line"}`}>
                  <Badge tone="warn">New · generated</Badge>
                  <div className="mt-2 font-semibold">{custom.title}</div>
                  <div className="mt-1 text-xs text-muted">{custom.scenario.situation.slice(0, 110)}…</div>
                </button>
              )}
              {library.map((m) => (
                <button key={m.id} onClick={() => setModuleId(m.id)} className={`rounded-xl border-2 p-4 text-left transition ${moduleId === m.id ? "border-plum-700 bg-plum-50" : "border-line hover:border-plum-300"}`}>
                  <div className="flex items-center gap-2">
                    <Badge tone="plum">{CATEGORIES.find((c) => c.id === m.categoryId)!.short}</Badge>
                    <span className="text-xs text-muted">{m.minutes} min · {m.difficulty}</span>
                  </div>
                  <div className="mt-2 font-semibold">{m.title}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-canvas p-4">
              <div className="eyebrow">Or describe a new situation</div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                placeholder="e.g. A guest asks for a discount because they're a Scale & Coin member."
                className="mt-2 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-plum-400"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={topicCat} onChange={(e) => setTopicCat(e.target.value as CategoryId)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn-ghost ml-auto" onClick={generate} disabled={generating || !topic.trim()}>
                  {generating ? "Writing scenario…" : "Generate with AI"}
                </button>
              </div>
            </div>
          </section>

          {/* 2. Locations */}
          <section data-tour="send-locations" className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-plum-800"><span className="mr-2 text-plum-400">2</span>Pick locations</h2>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button className="rounded-full bg-plum-100 px-3 py-1 text-plum-700" onClick={() => setLocs(LOCATIONS.map((l) => l.id))}>All 8</button>
                {mod && <button className="rounded-full bg-plum-100 px-3 py-1 text-plum-700" onClick={() => setLocs(lowest)}>3 lowest in {cat!.short}</button>}
                {["Durham", "Chapel Hill", "Raleigh"].map((c) => (
                  <button key={c} className="rounded-full bg-plum-100 px-3 py-1 text-plum-700" onClick={() => setLocs(LOCATIONS.filter((l) => l.city === c).map((l) => l.id))}>{c}</button>
                ))}
                <button className="rounded-full border border-line px-3 py-1 text-muted" onClick={() => setLocs([])}>Clear</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {LOCATIONS.map((l) => {
                const on = locs.includes(l.id);
                const score = locCategoryAvg(data, l.id, mod?.categoryId ?? "guests");
                const below = empsAt(data, l.id).filter((e) => e.scores[mod?.categoryId ?? "guests"] < CERT_BAR).length;
                return (
                  <button key={l.id} onClick={() => toggleLoc(l.id)} className={`rounded-xl border-2 p-3.5 text-left transition ${on ? "border-plum-700 bg-plum-50" : "border-line hover:border-plum-300"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{l.name.replace(" (Brightleaf)", "")}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold ${on ? "border-plum-700 bg-plum-700 text-white" : "border-line"}`}>{on ? "✓" : ""}</span>
                    </div>
                    <div className="text-xs text-muted">{l.city} · GM {l.gm}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1"><ScoreBar score={score} height={6} /></div>
                      <span className="text-xs font-semibold tabular-nums">{score}%</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted">{cat ? `${cat.short} avg` : "Guests avg"} · {below} below the bar</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Audience + note */}
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold text-plum-800"><span className="mr-2 text-plum-400">3</span>Who and why</h2>
            <div className="mt-4 space-y-2">
              {AUDIENCES.map((a) => (
                <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${audience === a.id ? "border-plum-700 bg-plum-50" : "border-line"}`}>
                  <input type="radio" className="mt-1" checked={audience === a.id} onChange={() => setAudience(a.id)} />
                  <span><span className="block text-sm font-semibold">{a.label}</span><span className="text-xs text-muted">{a.blurb}</span></span>
                </label>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a note for your GMs (optional). e.g. Please have your team finish this by Friday."
              className="mt-4 w-full resize-none rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-plum-400"
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="card p-6">
            <div className="eyebrow">Ready to send</div>
            <div className="mt-2 font-display text-xl font-semibold text-plum-800">{mod ? mod.title : "Choose a training"}</div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Skill</dt><dd className="font-semibold">{cat?.name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Locations</dt><dd className="font-semibold">{locs.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Employees who will get it</dt><dd className="font-display text-2xl font-semibold text-plum-700">{targets.length}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Anyone who already has this training open is skipped. Each GM gets a note from {COMPANY.owner.split(" ")[0]} in their feed.</p>
            <button className="btn btn-primary mt-4 w-full py-3" disabled={!mod || !targets.length} onClick={send}>
              Send to {targets.length || "0"} {targets.length === 1 ? "person" : "people"} ➤
            </button>
          </div>
        </aside>
      </div>

      {/* History */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-plum-800">Sent trainings</h2>
        <div className="mt-3 space-y-3">
          {data.broadcasts.length === 0 && <Empty>Nothing sent yet.</Empty>}
          {data.broadcasts.map((b) => {
            const m = data.modules.find((x) => x.id === b.moduleId);
            const done = data.assignments.filter((a) => a.moduleId === b.moduleId && a.status === "completed" && a.assignedOn >= b.date && locsOf(data, a.employeeId, b.locationIds)).length;
            const total = Math.max(b.count, done);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={b.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{m?.title ?? b.moduleId}</div>
                  <span className="text-xs text-muted">{fmtDate(b.date)} · {b.author}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {b.locationIds.map((id) => <Badge key={id} tone="navy">{LOCATIONS.find((l) => l.id === id)?.name.replace(" (Brightleaf)", "")}</Badge>)}
                  <Badge tone="gray">{AUDIENCES.find((a) => a.id === b.audience)?.label}</Badge>
                </div>
                {b.message && <p className="mt-2 text-sm text-ink/80">“{b.message}”</p>}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1"><ScoreBar score={pct} height={7} /></div>
                  <span className="text-xs font-semibold tabular-nums text-muted">{done} of {total} completed</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function locsOf(data: ReturnType<typeof useStore>["data"], employeeId: string, locationIds: string[]) {
  const e = data.employees.find((x) => x.id === employeeId);
  return !!e && locationIds.includes(e.locationId);
}
