"use client";

import { useState } from "react";
import Link from "next/link";
import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES, CERT_BAR } from "@/lib/scenarios";
import { agreement, avg, companyCategoryAvg, daysSince, empsAt, fmtDate, locCategoryAvg, locSummary, readiness, statusOf, trend } from "@/lib/stats";
import { COMPANY } from "@/lib/data";
import { OutdatedCard } from "./OutdatedCard";
import { Callout } from "./Callout";
import { Avatar, Badge, MiniBars, ScoreBar, StatCard, StatusBadge, TrendChart } from "./ui";

type SortKey = "readiness" | "name" | "practiced";

export function LocationDashboard({ locationId, canApprove }: { locationId: string; canApprove: boolean }) {
  const { data, signOff } = useStore();
  const loc = LOCATIONS.find((l) => l.id === locationId)!;
  const emps = empsAt(data, locationId);
  const sum = locSummary(data, locationId);
  const [sort, setSort] = useState<SortKey>("readiness");
  const [asc, setAsc] = useState(true);

  const queue = emps.filter((e) => statusOf(e) === "awaiting");
  const weeksList = emps.filter((e) => e.weeksToCert).map((e) => e.weeksToCert!);
  const rows = [...emps].sort((a, b) => {
    const d = sort === "readiness" ? readiness(a) - readiness(b) : sort === "name" ? a.name.localeCompare(b.name) : a.lastPracticed.localeCompare(b.lastPracticed);
    return asc ? d : -d;
  });
  const setSortKey = (k: SortKey) => { if (k === sort) setAsc(!asc); else { setSort(k); setAsc(k !== "practiced" ? true : true); } };
  const arrow = (k: SortKey) => (sort === k ? (asc ? " ↑" : " ↓") : "");

  const gaps = CATEGORIES.map((c) => ({ c, mine: locCategoryAvg(data, locationId, c.id), co: companyCategoryAvg(data, c.id) })).sort((a, b) => a.mine - b.mine);
  const locTrend = trend(emps);
  const compTrend = trend(data.employees);
  const ownerNotes = canApprove ? data.feedback.filter((f) => f.locationId === locationId && f.source === "Owner note").slice(0, 2) : [];
  const toReview = data.sessions.filter((s) => !s.review && data.employees.find((e) => e.id === s.employeeId)?.locationId === locationId);
  const agree = agreement(data);
  const feedbackOpen = data.feedback.filter((f) => f.locationId === locationId && !f.moduleId).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Team readiness" value={`${sum.readiness}%`} sub={`Company avg ${Math.round(avg(data.employees.map(readiness)))}%`} delta={sum.readiness >= Math.round(avg(data.employees.map(readiness))) ? "Above avg" : undefined} tone={sum.readiness < 55 ? "bad" : undefined} />
        <StatCard label="Certified" value={`${sum.certified}/${sum.employees}`} sub="all skills ≥ 90% + sign-off" tone="good" />
        <StatCard label="Awaiting sign-off" value={sum.awaiting} sub={sum.awaiting ? "ready for your approval" : "none right now"} tone={sum.awaiting ? "warn" : undefined} />
        <StatCard label="At risk" value={sum.atRisk} sub="readiness under 45%" tone={sum.atRisk ? "bad" : "good"} />
        <StatCard label="Time to certified" value={weeksList.length ? `${(avg(weeksList)).toFixed(1)} wk` : "n/a"} sub="vs. 9 wk before Seasoned" />
      </div>

      {ownerNotes.length > 0 && (
        <div className="card border-cameron-navy/25 bg-cameron-tint/60 p-5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-cameron-navy">From {COMPANY.owner}</h2>
            <Badge tone="navy">Owner</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {ownerNotes.map((n) => (
              <div key={n.id} className="rounded-xl bg-white px-4 py-3 text-sm">
                <p>“{n.text}”</p>
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                  <span>{fmtDate(n.date)}{n.moduleId ? " · includes assigned training" : ""}</span>
                  <Link href="/gm/feedback" className="font-semibold text-plum-700 hover:underline">Open in feedback →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <OutdatedCard locationIds={[locationId]} sender={canApprove ? "gm" : "owner"} />

      <div data-tour="grades-card" className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-plum-800">Grades to review</h2>
            <Callout title="Managers have the final word" moat="the agreement rate makes certification credible, and each company's corrections are its own private data.">
              <p>The AI grades every practice from what the employee actually said. A manager confirms it or corrects it, and the AI learns the company&apos;s standards from those corrections.</p>
            </Callout>
            <Badge tone={toReview.length ? "warn" : "good"}>{toReview.length} waiting</Badge>
          </div>
          <div className="text-xs text-muted">AI and managers agree <strong className="text-plum-800">{agree.rate}%</strong> of the time · {agree.total} grades checked</div>
        </div>
        <p className="mt-0.5 text-sm text-muted">The AI grades every practice. You have the final word: confirm it, or disagree and recalculate.</p>
        {toReview.length === 0 ? (
          <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-muted">All caught up. New practice sessions will appear here.</p>
        ) : (
          <div className="mt-3 divide-y divide-line rounded-xl border border-line">
            {toReview.slice(0, 4).map((s) => {
              const e = data.employees.find((x) => x.id === s.employeeId)!;
              const m = data.modules.find((x) => x.id === s.moduleId);
              return (
                <Link key={s.id} href={`/session/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-plum-50">
                  <span className="flex items-center gap-2"><Avatar name={e.name} size={26} /><span><strong>{e.name}</strong> <span className="text-muted">· {m?.title}</span></span></span>
                  <span className="flex items-center gap-3"><Badge tone={s.score >= CERT_BAR ? "good" : s.score >= 70 ? "warn" : "bad"}>AI: {s.score}%</Badge><span className="font-semibold text-plum-700">Review →</span></span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div className="card border-warn/40 bg-warn-bg/40 p-5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-plum-800">Certification approvals</h2>
            <Badge tone="warn">{queue.length} waiting</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted">These team members are at {CERT_BAR}%+ in every skill. Your sign-off makes it official.</p>
          <div className="mt-3 space-y-2">
            {queue.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} />
                  <div>
                    <Link href={`/gm/employee/${e.id}`} className="font-semibold hover:underline">{e.name}</Link>
                    <div className="text-xs text-muted">{e.role} · {e.sessions} practice sessions</div>
                  </div>
                </div>
                {canApprove ? <button className="btn btn-primary" onClick={() => signOff(e.id)}>Approve certification ✓</button> : <Badge tone="warn">Awaiting GM</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-plum-800">Skill gaps at {loc.name.replace(" (Brightleaf)", "")}</h2>
            <span className="text-xs text-muted">▏= company average</span>
          </div>
          <div className="mt-4 space-y-3.5">
            {gaps.map(({ c, mine, co }) => (
              <div key={c.id}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular-nums">
                    <strong className={mine >= CERT_BAR ? "text-good" : ""}>{mine}%</strong>
                    <span className={`ml-2 text-xs ${mine >= co ? "text-good" : "text-bad"}`}>{mine >= co ? "+" : ""}{mine - co} vs co.</span>
                  </span>
                </div>
                <div className="relative">
                  <ScoreBar score={mine} />
                  <div className="absolute top-[-3px] bottom-[-3px] w-[3px] rounded bg-cameron-navy/70" style={{ left: `${co}%` }} title={`Company average ${co}%`} />
                </div>
              </div>
            ))}
          </div>
          {gaps[0].mine < CERT_BAR && (
            <p className="mt-4 rounded-xl bg-plum-50 p-3 text-sm text-plum-800">
              <strong>Biggest gap: {gaps[0].c.name}.</strong> {feedbackOpen > 0 ? `${feedbackOpen} guest comments haven't been turned into practice yet.` : "Assign a refresher from the feedback tab."}{" "}
              {canApprove && <Link href="/gm/feedback" className="font-semibold underline">Review feedback →</Link>}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-plum-800">Team readiness trend</h2>
          <div className="mt-3"><TrendChart values={locTrend} /></div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-plum-700" />{loc.name.replace(" (Brightleaf)", "")}: {locTrend[11]}%</span>
            <span>Company avg today: {compTrend[11]}% · 12 weeks ago: {compTrend[0]}%</span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-plum-800">Team roster</h2>
          <span className="text-xs text-muted">Bars: {CATEGORIES.map((c) => c.short).join(" · ")}</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="cursor-pointer px-6 py-2.5" onClick={() => setSortKey("name")}>Employee{arrow("name")}</th>
              <th className="cursor-pointer px-3 py-2.5" onClick={() => setSortKey("readiness")}>Readiness{arrow("readiness")}</th>
              <th className="px-3 py-2.5">Skills</th>
              <th className="px-3 py-2.5">Weakest</th>
              <th className="cursor-pointer px-3 py-2.5" onClick={() => setSortKey("practiced")}>Last practice{arrow("practiced")}</th>
              <th className="px-6 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((e) => {
              const st = statusOf(e);
              const weakest = [...CATEGORIES].sort((a, b) => e.scores[a.id] - e.scores[b.id])[0];
              const stale = daysSince(e.lastPracticed) > 14;
              return (
                <tr key={e.id} className="hover:bg-plum-50/50">
                  <td className="px-6 py-3">
                    <Link href={`/gm/employee/${e.id}`} className="flex items-center gap-3">
                      <Avatar name={e.name} size={32} />
                      <span><span className="font-semibold text-ink hover:underline">{e.name}</span><span className="block text-xs text-muted">{e.role} · {e.weeks} wk</span></span>
                    </Link>
                  </td>
                  <td className="w-48 px-3 py-3">
                    <div className="flex items-center gap-2"><div className="flex-1"><ScoreBar score={readiness(e)} height={7} /></div><span className="w-9 text-right font-semibold tabular-nums">{readiness(e)}%</span></div>
                  </td>
                  <td className="px-3 py-3"><MiniBars scores={e.scores} /></td>
                  <td className="px-3 py-3 text-muted">{st === "certified" ? "n/a" : weakest.short}</td>
                  <td className={`px-3 py-3 ${stale && st !== "certified" ? "font-semibold text-bad" : "text-muted"}`}>{fmtDate(e.lastPracticed)}{stale && st !== "certified" ? " ⚠" : ""}</td>
                  <td className="px-6 py-3"><StatusBadge status={st} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
