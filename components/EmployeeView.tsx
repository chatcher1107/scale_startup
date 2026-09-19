"use client";

import Link from "next/link";
import { LOCATIONS, type Employee } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES, CERT_BAR } from "@/lib/scenarios";
import { daysSince, fmtDate, fmtLongDate, outdatedCats, rankOf, readiness, statusOf } from "@/lib/stats";
import { Callout } from "./Callout";
import { Avatar, Badge, CategoryBars, Empty, Radar, StatCard, StatusBadge, TrendChart } from "./ui";

export function EmployeeView({ employee, viewer }: { employee: Employee; viewer: "trainee" | "gm" }) {
  const { data, signOff } = useStore();
  const loc = LOCATIONS.find((l) => l.id === employee.locationId)!;
  const st = statusOf(employee);
  const rank = rankOf(data, employee);
  const days = daysSince(employee.lastPracticed);
  const assigned = data.assignments
    .filter((a) => a.employeeId === employee.id && a.status === "assigned")
    .map((a) => ({ a, m: data.modules.find((m) => m.id === a.moduleId)! }))
    .filter((x) => x.m)
    .sort((x, y) => Number(y.m.type === "tailored") - Number(x.m.type === "tailored"));
  const sessions = data.sessions.filter((s) => s.employeeId === employee.id);
  const past = data.assignments.filter((a) => a.employeeId === employee.id && a.status === "completed");
  const stale = outdatedCats(data, employee);
  const gaps = CATEGORIES.filter((c) => employee.scores[c.id] < CERT_BAR).sort((a, b) => employee.scores[a.id] - employee.scores[b.id]);

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={employee.name} size={60} />
          <div>
            <h1 className="font-display text-3xl font-semibold text-plum-800">{viewer === "trainee" ? `Welcome back, ${employee.name.split(" ")[0]}` : employee.name}</h1>
            <p className="text-sm text-muted">{employee.role} · {loc.name} · {employee.weeks} weeks with Cameron Coffee Co.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={st} />
          {viewer === "gm" && st === "awaiting" && (
            <button className="btn btn-primary" onClick={() => signOff(employee.id)}>Approve certification ✓</button>
          )}
          {st === "certified" && employee.certId && (
            <Link href={viewer === "trainee" ? "/trainee/certificate" : `/gm/employee/${employee.id}/certificate`} className="btn btn-ghost">View certificate</Link>
          )}
        </div>
      </div>

      {stale.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/40 bg-warn-bg/50 px-5 py-4">
          <div>
            <div className="font-semibold text-warn">Policy update: quick refresher needed</div>
            <div className="text-sm text-ink/80">
              The policy sheet changed for {stale.map((c) => CATEGORIES.find((x) => x.id === c)!.name).join(", ")} (now v{data.handbook.version}). Practice once to be up to date.
            </div>
          </div>
          {viewer === "trainee" && <Link href={`/trainee/train/std-${stale[0]}`} className="btn btn-primary">Start refresher →</Link>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Readiness" value={`${readiness(employee)}%`} sub={st === "certified" ? "Certified" : `${gaps.length} skill${gaps.length === 1 ? "" : "s"} below ${CERT_BAR}%`} tone={readiness(employee) >= 100 ? "good" : undefined} />
        <StatCard label="Rank at location" value={`#${rank.atLocation}`} sub={`of ${rank.locationSize} at ${loc.name.replace(" (Brightleaf)", "")}`} />
        <StatCard label="Company rank" value={`#${rank.company}`} sub={`of ${rank.companySize} employees`} />
        <StatCard label="Practice sessions" value={employee.sessions + sessions.length} sub={days === 0 ? "Practiced today" : `Last practice ${days} day${days === 1 ? "" : "s"} ago`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-plum-800">Skill profile</h2>
            <span className="text-xs text-muted">Dashed line = {CERT_BAR}% certification bar</span>
          </div>
          <Radar scores={employee.scores} />
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-plum-800">Skills toward certification</h2>
            <Badge tone="gray">Bar: {CERT_BAR}%</Badge>
          </div>
          <CategoryBars scores={employee.scores} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-plum-800">{viewer === "trainee" ? "Your training" : "Assigned training"} <Callout title="Yesterday's complaint, tomorrow's practice" moat="it relies on your real reviews and your managers' trust, not a clever prompt.">
            <p>The tailored scenario was built from a real note a manager wrote. It recreates the exact situation, so practice targets the mistake that actually happened.</p>
          </Callout></h2>
          <div className="mt-4 space-y-3">
            {assigned.length === 0 && <Empty>{st === "certified" ? "All caught up. Nothing assigned." : "No training assigned right now."}</Empty>}
            {assigned.map(({ a, m }) => {
              const src = m.sourceReviewId ? data.feedback.find((f) => f.id === m.sourceReviewId) : null;
              const cat = CATEGORIES.find((c) => c.id === m.categoryId)!;
              return (
                <div key={a.id} data-tour={m.type === "tailored" && assigned.find((x) => x.m.type === "tailored")?.a.id === a.id ? "tailored-card" : undefined} className={`rounded-xl border p-4 ${m.type === "tailored" ? "border-plum-300 bg-plum-50/60" : "border-line"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {m.type === "tailored" ? <Badge tone="warn">Tailored for you</Badge> : <Badge tone="gray">Standard</Badge>}
                    <Badge tone="plum">{cat.name}</Badge>
                    <span className="text-xs text-muted">{m.minutes} min · {m.difficulty}</span>
                  </div>
                  <div className="mt-2 font-semibold">{m.title}</div>
                  {src && (
                    <blockquote className="mt-2 border-l-2 border-plum-300 pl-3 text-sm text-ink/80">
                      “{src.text}”
                      <footer className="mt-1 text-xs text-muted">{src.author} · {src.source} · {fmtLongDate(src.date)}</footer>
                    </blockquote>
                  )}
                  {viewer === "trainee" && (
                    <div className="mt-3"><Link href={`/trainee/train/${m.id}`} className="btn btn-primary">Start practice →</Link></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-plum-800">Readiness, last 12 weeks</h2>
            <div className="mt-3"><TrendChart values={employee.history} /></div>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-plum-800">Recent practice</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {sessions.slice(0, 4).map((s) => {
                const m = data.modules.find((x) => x.id === s.moduleId);
                return (
                  <li key={s.id} className="flex items-center justify-between py-2.5">
                    <Link href={`/session/${s.id}`} className="font-medium text-plum-700 hover:underline">{m?.title ?? "Session"}{s.handbookVersion ? <span className="ml-2 text-xs font-normal text-muted">sheet v{s.handbookVersion}</span> : null}</Link>
                    <span className="flex items-center gap-3 text-muted">{fmtDate(s.date)}<Badge tone={s.score >= CERT_BAR ? "good" : s.score >= 70 ? "warn" : "bad"}>{s.score}%</Badge></span>
                  </li>
                );
              })}
              {past.slice(0, 4 - Math.min(4, sessions.length)).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-muted">
                  <span>{data.modules.find((m) => m.id === a.moduleId)?.title}</span>
                  <span className="flex items-center gap-3">{fmtDate(a.assignedOn)}<Badge tone={(a.score ?? 0) >= CERT_BAR ? "good" : (a.score ?? 0) >= 70 ? "warn" : "bad"}>{a.score}%</Badge></span>
                </li>
              ))}
              {sessions.length === 0 && past.length === 0 && <li className="py-2 text-muted">No sessions yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
