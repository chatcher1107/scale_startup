"use client";

import Link from "next/link";
import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES, CERT_BAR } from "@/lib/scenarios";
import { companyCategoryAvg, companyStats, empsAt, locCategoryAvg, locReadiness, trend } from "@/lib/stats";
import { Badge, heatColor, PageHeader, ScoreBar, StatCard, TrendChart } from "@/components/ui";
import { OutdatedCard } from "@/components/OutdatedCard";
import { Callout } from "@/components/Callout";

const NETWORK_BENCHMARK = 66; // illustrative aggregated Seasoned network average

export default function OwnerHome() {
  const { data } = useStore();
  const s = companyStats(data);
  const ranked = [...LOCATIONS].sort((a, b) => locReadiness(data, b.id) - locReadiness(data, a.id));
  const t = trend(data.employees);

  const issues = CATEGORIES.map((c) => {
    const items = data.feedback.filter(
      (f) => f.categoryId === c.id && (f.source === "Owner note" || f.source === "GM note" || f.source === "Incident log" || (f.rating ?? 5) <= 3)
    );
    return { c, count: items.length, trained: items.filter((f) => f.moduleId).length };
  })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${COMPANY.name} overview`}
        sub={`${COMPANY.region} · ${s.employees} employees across ${LOCATIONS.length} locations`}
        right={<Badge tone="navy">Owner view · {COMPANY.owner}</Badge>}
      />

      <div data-tour="owner-kpis" className="grid gap-4 md:grid-cols-5">
        <StatCard label="Company readiness" value={`${s.readiness}%`} sub={`${t[11] - t[0] >= 0 ? "+" : ""}${t[11] - t[0]} pts in 12 weeks`} delta="Improving" />
        <StatCard label="Certified" value={`${s.certified}/${s.employees}`} sub={`${s.awaiting} awaiting sign-off`} tone="good" />
        <StatCard label="Time to certified" value={`${s.weeksToCert} wk`} sub={`vs. ${s.baselineWeeks} wk before Seasoned`} tone="good" />
        <StatCard label="Trainer hours saved" value={s.hoursSaved} sub={`≈ $${s.dollarsSaved.toLocaleString()} in manager time`} />
        <StatCard label="At-risk employees" value={s.atRisk} sub="readiness under 45%" tone={s.atRisk ? "bad" : "good"} />
      </div>

      <OutdatedCard locationIds={LOCATIONS.map((l) => l.id)} sender="owner" />

      {/* Heatmap */}
      <div data-tour="owner-heatmap" className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-plum-800">Skill heatmap: locations × competencies <Callout title="See every location at once" moat="it only works when all locations train on the same standards, which is the hard part.">
              <p>Compare 8 shops across 6 skills in one view. A single-location tool or a one-off AI chat can&apos;t show you where the company is exposed.</p>
            </Callout></h2>
            <p className="text-xs text-muted">Average score per skill. Green = at or above the {CERT_BAR}% certification bar. Click a location to drill in.</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted">
            {["#eea59f", "#f5c39a", "#f8e0a8", "#cde9d9", "#7cc6a0"].map((c) => (
              <span key={c} className="h-3 w-6 rounded-sm" style={{ background: c }} />
            ))}
            <span className="ml-1">low → high</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-1 p-4 text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-2 pb-1">Location</th>
                {CATEGORIES.map((c) => (
                  <th key={c.id} className="px-1 pb-1 text-center">{c.short}</th>
                ))}
                <th className="px-1 pb-1 text-center">Readiness</th>
                <th className="px-1 pb-1 text-center">Certified</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((l) => {
                const emps = empsAt(data, l.id);
                const cert = emps.filter((e) => e.signedOff).length;
                return (
                  <tr key={l.id}>
                    <td className="px-2 py-1">
                      <Link href={`/owner/location/${l.id}`} className="font-semibold hover:underline">{l.name.replace(" (Brightleaf)", "")}</Link>
                      <div className="text-[11px] text-muted">{l.city} · {emps.length} staff</div>
                    </td>
                    {CATEGORIES.map((c) => {
                      const v = locCategoryAvg(data, l.id, c.id);
                      const col = heatColor(v);
                      return (
                        <td key={c.id} className="rounded-lg text-center font-semibold tabular-nums" style={{ background: col.bg, color: col.fg }} title={`${l.name} · ${c.name}: ${v}%`}>
                          {v}
                        </td>
                      );
                    })}
                    <td className="px-1 text-center"><span className="font-display text-lg font-semibold text-plum-800">{locReadiness(data, l.id)}%</span></td>
                    <td className="px-1 text-center text-muted">{cert}/{emps.length}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="px-2 pt-2 font-semibold">Company average</td>
                {CATEGORIES.map((c) => (
                  <td key={c.id} className="pt-2 text-center font-bold tabular-nums text-plum-800">{companyCategoryAvg(data, c.id)}</td>
                ))}
                <td className="pt-2 text-center font-display text-lg font-semibold text-plum-800">{s.readiness}%</td>
                <td className="pt-2 text-center text-muted">{s.certified}/{s.employees}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-plum-800">Location leaderboard</h2>
          <ol className="mt-4 space-y-3">
            {ranked.map((l, i) => {
              const r = locReadiness(data, l.id);
              return (
                <li key={l.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span><span className="mr-2 text-muted">{i + 1}</span>{l.name.replace(" (Brightleaf)", "")}</span>
                    <strong className="tabular-nums">{r}%</strong>
                  </div>
                  <ScoreBar score={r} height={7} />
                </li>
              );
            })}
          </ol>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-plum-800">Company readiness, 12 weeks</h2>
          <div className="mt-3"><TrendChart values={t} /></div>
          <div className="mt-3 rounded-xl bg-plum-50 p-3 text-xs text-plum-800">
            <strong>Network benchmark (illustrative):</strong> Your average is {s.readiness}% vs. {NETWORK_BENCHMARK}% across the Seasoned network of restaurant groups. Permissioned, aggregated data.
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-plum-800">Top issues from guests &amp; managers</h2>
          <p className="text-xs text-muted">Reviews ≤ 3★ and manager notes, by skill</p>
          <ul className="mt-4 space-y-3">
            {issues.map(({ c, count, trained }) => (
              <li key={c.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between"><span className="font-semibold">{c.name}</span><Badge tone="bad">{count} items</Badge></div>
                <div className="mt-1 text-xs text-muted">{trained} of {count} turned into practice ({count ? Math.round((trained / count) * 100) : 0}%)</div>
                <div className="mt-2"><ScoreBar score={count ? Math.round((trained / count) * 100) : 0} height={5} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
