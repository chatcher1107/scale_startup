"use client";

import { useState } from "react";
import Link from "next/link";
import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CERT_BAR } from "@/lib/scenarios";
import { clearance, shiftKey, SHIFTS, skillName, STATIONS, type ShiftId, type StationId } from "@/lib/shift";
import { empsAt, readiness } from "@/lib/stats";
import { Avatar, Badge, PageHeader } from "@/components/ui";
import { Callout } from "@/components/Callout";

export default function TonightsShift() {
  const { data, ctx, swapShift, assignModule } = useStore();
  const [shift, setShift] = useState<ShiftId>("tonight");
  const loc = LOCATIONS.find((l) => l.id === ctx.locationId);
  if (!loc) return null;

  const key = shiftKey(loc.id, shift);
  const entries = data.shifts[key] ?? [];
  const staff = empsAt(data, loc.id);
  const scheduledIds = new Set(entries.map((e) => e.employeeId));
  const bench = staff.filter((e) => !scheduledIds.has(e.id));
  const rows = entries.map((en, i) => {
    const emp = data.employees.find((e) => e.id === en.employeeId)!;
    return { i, en, emp, cl: clearance(emp, en.station) };
  });
  const clearedCount = rows.filter((r) => r.cl.cleared).length;
  const gaps = rows.length - clearedCount;
  const meta = SHIFTS.find((s) => s.id === shift)!;
  const hasPractice = (empId: string, cat: string) => data.assignments.some((a) => a.employeeId === empId && a.moduleId === `std-${cat}` && a.status === "assigned");

  return (
    <div>
      <PageHeader
        title="Tonight's shift"
        sub={`${loc.name} · see who is ready for the station they're scheduled on, and fix gaps before the rush`}
        right={
          <Callout align="right" title="Training that runs the schedule" moat="once training decides who can work a station, it's part of daily operations and hard to replace.">
            <p>Most training tools stop at a completion certificate. Seasoned connects readiness to the schedule, so a GM knows before the rush whether the register is covered by someone cleared for it.</p>
          </Callout>
        }
      />

      {/* Plain-English explainer */}
      <div className="card mb-6 border-cameron-navy/25 bg-cameron-tint/50 p-6">
        <h2 className="font-display text-xl font-semibold text-cameron-navy">How this works</h2>
        <ol className="mt-3 grid gap-4 text-sm md:grid-cols-3">
          <li><strong className="text-plum-800">1. Every station has requirements.</strong><br />The register needs allergy, guest and policy skills at a minimum score. The espresso bar needs different ones. You can see them below.</li>
          <li><strong className="text-plum-800">2. Seasoned checks tonight&apos;s schedule.</strong><br />A teammate is <span className="font-semibold text-good">cleared</span> when their practice scores meet their station&apos;s minimums. Anyone below is flagged.</li>
          <li><strong className="text-plum-800">3. You fix it in one click.</strong><br />Swap in a cleared teammate from the bench, or send the flagged person a short practice. Scores update as they practice.</li>
        </ol>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(STATIONS) as StationId[]).map((id) => {
            const st = STATIONS[id];
            const needs = Object.entries(st.needs);
            return (
              <div key={id} className="rounded-xl bg-white p-3 text-xs">
                <div className="text-sm font-semibold">{st.emoji} {st.name}</div>
                <div className="mt-0.5 text-muted">{st.blurb}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {needs.length === 0 ? <Badge tone="gray">No minimums</Badge> : needs.map(([c, n]) => <Badge key={c} tone="navy">{skillName(c as never).split(" ")[0]} ≥ {n}</Badge>)}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">Sample schedule. A real customer&apos;s schedule would sync from their scheduling tool (7shifts, HotSchedules), and new hires would be enrolled on their start date.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-plum-200 bg-white p-1">
          {SHIFTS.map((s) => (
            <button key={s.id} onClick={() => setShift(s.id)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${shift === s.id ? "bg-plum-700 text-white" : "text-plum-700 hover:bg-plum-50"}`}>
              {s.label} <span className="ml-1 text-xs opacity-80">{s.hours}</span>
            </button>
          ))}
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${gaps === 0 ? "bg-good-bg text-good" : "bg-bad-bg text-bad"}`}>
          {gaps === 0 ? `✓ All ${rows.length} scheduled teammates are cleared` : `${clearedCount} of ${rows.length} cleared · ${gaps} need attention`}
        </div>
      </div>

      <div data-tour="shift-table" className="card divide-y divide-line overflow-hidden">
        <div className="bg-canvas px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted">{meta.label} · {meta.hours}</div>
        {rows.map(({ i, en, emp, cl }) => {
          const st = STATIONS[en.station];
          const options = bench.filter((b) => clearance(b, en.station).cleared);
          return (
            <div key={`${en.employeeId}-${i}`} className={`flex flex-wrap items-center gap-4 px-5 py-4 ${cl.cleared ? "" : "bg-bad-bg/30"}`}>
              <div className="w-44 shrink-0">
                <div className="font-semibold">{st.emoji} {st.name}</div>
                <div className="text-xs text-muted">{Object.keys(st.needs).length ? "Needs " + Object.entries(st.needs).map(([c, n]) => `${skillName(c as never).split(" ")[0]} ${n}`).join(" · ") : "No minimums"}</div>
              </div>
              <div className="flex min-w-[200px] flex-1 items-center gap-3">
                <Avatar name={emp.name} />
                <div>
                  <Link href={`/gm/employee/${emp.id}`} className="font-semibold hover:underline">{emp.name}</Link>
                  <div className="text-xs text-muted">{emp.role} · readiness {readiness(emp)}%{emp.weeks < 8 ? " · new hire" : ""}</div>
                </div>
              </div>
              <div className="min-w-[220px] flex-1 text-sm">
                {cl.cleared ? (
                  <Badge tone="good">✓ Cleared for {st.name}</Badge>
                ) : (
                  <div>
                    <Badge tone="bad">Not cleared</Badge>
                    <div className="mt-1 text-xs text-bad">
                      {cl.missing.map((m) => `${skillName(m.cat).split(" ")[0]} ${m.have} (needs ${m.need})`).join(" · ")}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!cl.cleared && (
                  <>
                    {cl.missing.every((m) => hasPractice(emp.id, m.cat)) ? (
                      <Badge tone="good">Practice sent</Badge>
                    ) : (
                      <button className="btn btn-ghost !py-1.5 !text-xs" onClick={() => assignModule([emp.id], `std-${cl.missing[0].cat}`)}>Send practice</button>
                    )}
                    <select
                      className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
                      value=""
                      disabled={options.length === 0}
                      onChange={(e) => e.target.value && swapShift(key, i, e.target.value)}
                    >
                      <option value="">{options.length ? "Swap in…" : "No cleared bench"}</option>
                      {options.map((o) => <option key={o.id} value={o.id}>{o.name} (cleared)</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-display text-xl font-semibold text-plum-800">Bench: not scheduled this shift</h2>
        <p className="mt-0.5 text-xs text-muted">Where each teammate is cleared today. Certified teammates (all skills ≥ {CERT_BAR}%) can work anywhere.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {bench.length === 0 && <p className="text-sm text-muted">Everyone is scheduled.</p>}
          {bench.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm"><Avatar name={b.name} size={28} /><span className="font-semibold">{b.name}</span></span>
              <span className="flex flex-wrap justify-end gap-1">
                {(Object.keys(STATIONS) as StationId[]).filter((s) => s !== "floater").map((s) => (
                  <Badge key={s} tone={clearance(b, s).cleared ? "good" : "gray"}>{clearance(b, s).cleared ? "✓ " : ""}{STATIONS[s].name.split(" ")[0]}</Badge>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
