"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore, type Role } from "@/lib/store";
import { companyStats, empsAt, locSummary, readiness, statusOf } from "@/lib/stats";
import { CATEGORIES } from "@/lib/scenarios";
import { CameronLockup, CameronMark, SeasonedWordmark } from "@/components/Logos";
import { TriangleMap } from "@/components/TriangleMap";
import { Avatar, Badge, ScoreBar, StatusBadge } from "@/components/ui";
import { StartTourButton } from "@/components/Tour";

const ROLES: { id: Role; title: string; who: string; blurb: string; sees: string[] }[] = [
  {
    id: "trainee",
    title: "Trainee",
    who: "Barista · Cashier · Shift Lead",
    blurb: "Practice the hard moments before they happen with a real guest.",
    sees: ["Your readiness toward certification", "Voice & chat practice scenarios", "Training based on real feedback"],
  },
  {
    id: "gm",
    title: "General Manager",
    who: "Runs one location",
    blurb: "See who is ready, who needs help, and approve certification.",
    sees: ["Team roster with skill gaps", "Customer reviews → training", "Certification sign-off queue"],
  },
  {
    id: "owner",
    title: "Owner",
    who: "All 8 locations",
    blurb: "Compare locations, find company-wide gaps, and see the ROI.",
    sees: ["Location × skill heatmap", "Time-to-ready and hours saved", "Top issues across reviews"],
  },
];

export default function Intro() {
  const router = useRouter();
  const { data, ready, setCtx } = useStore();
  const [role, setRole] = useState<Role | null>(null);
  const [locId, setLocId] = useState<string | null>(null);
  const stats = companyStats(data);

  const chooseRole = (r: Role) => {
    if (r === "owner") {
      setCtx({ role: "owner", locationId: null, employeeId: null });
      router.push("/owner");
      return;
    }
    setRole(r);
    setLocId(null);
  };

  const chooseLocation = (id: string) => {
    if (role === "gm") {
      setCtx({ role: "gm", locationId: id, employeeId: null });
      router.push("/gm");
    } else {
      setLocId(id);
    }
  };

  const chooseTrainee = (empId: string) => {
    setCtx({ role: "trainee", locationId: locId, employeeId: empId });
    router.push("/trainee");
  };

  const back = () => (locId ? setLocId(null) : setRole(null));

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-6">
      <header className="mb-8 flex items-center justify-between">
        <SeasonedWordmark />
        <div className="flex items-center gap-4">
          <Link href="/menu" className="text-sm font-semibold text-plum-700 hover:underline">☕ Menu &amp; policy sheet</Link>
          <StartTourButton className="btn btn-primary !py-2">▶ Guided demo</StartTourButton>
          <Badge tone="plum">Interactive demo · sample company</Badge>
        </div>
      </header>

      {/* Company hero */}
      <section className="rise overflow-hidden rounded-3xl bg-cameron-navy text-white shadow-lg">
        <div className="grid gap-8 p-8 md:grid-cols-[1.05fr_1fr] md:p-10">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">You&apos;re exploring Seasoned as</div>
              <CameronLockup size={64} dark />
              <p className="mt-5 max-w-md font-display text-2xl leading-snug text-white/95">{COMPANY.tagline}</p>
              <p className="mt-2 max-w-md text-sm text-white/70">
                A regional coffee group serving {COMPANY.region.replace(/ · /g, ", ")}. Founded by {COMPANY.owner} in {COMPANY.founded}.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                [String(LOCATIONS.length), "Locations"],
                [String(stats.employees), "Employees"],
                ["3", "Cities"],
                [`${stats.certified}`, "Certified"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-white/10 px-3 py-3">
                  <div className="font-display text-3xl font-semibold leading-none">{v}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-white/65">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <TriangleMap tone="dark" height={300} selectedId={locId} />
            <div className="mt-2 text-center text-[11px] text-white/50">8 locations across Durham, Chapel Hill and Raleigh (not to scale)</div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/15 px-10 py-3 text-xs text-white/60">
          Cameron Coffee Co. is a fictional company with sample data, created to show how Seasoned works. Nothing here is a real customer.
        </div>
      </section>

      {/* Steps */}
      <section className="mt-10">
        {!role && (
          <>
            <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 border-plum-300 bg-plum-50/60 p-5">
              <div>
                <div className="font-display text-xl font-semibold text-plum-800">New here? Take the guided demo</div>
                <div className="text-sm text-muted">A 3-minute walkthrough of the whole product, from the owner&apos;s view to the manager&apos;s to a trainee&apos;s. It starts from fresh sample data.</div>
              </div>
              <StartTourButton className="btn btn-primary px-6 py-3 text-base">▶ Start guided demo</StartTourButton>
            </div>
            <h2 className="font-display text-2xl font-semibold text-plum-800">Choose how you&apos;d like to explore</h2>
            <p className="mt-1 text-sm text-muted">You can switch roles at any time from the menu in the top right.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => chooseRole(r.id)}
                  disabled={!ready}
                  className="card group rise p-6 text-left transition hover:-translate-y-0.5 hover:border-plum-300 hover:shadow-md"
                >
                  <div className="eyebrow">{r.who}</div>
                  <div className="mt-1 font-display text-2xl font-semibold text-plum-700">{r.title}</div>
                  <p className="mt-2 text-sm text-ink/80">{r.blurb}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted">
                    {r.sees.map((s) => (
                      <li key={s} className="flex gap-2"><span className="text-plum-500">✓</span>{s}</li>
                    ))}
                  </ul>
                  <div className="mt-5 text-sm font-semibold text-plum-700 group-hover:underline">
                    {r.id === "owner" ? "Enter as Owner →" : `Continue as ${r.title} →`}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {role && !locId && (
          <>
            <button onClick={back} className="mb-3 text-sm font-semibold text-plum-700 hover:underline">← Back</button>
            <h2 className="font-display text-2xl font-semibold text-plum-800">Which location{role === "gm" ? " do you manage" : " do you work at"}?</h2>
            <p className="mt-1 text-sm text-muted">{role === "gm" ? "You'll see that location's team, feedback and approvals." : "Then you'll pick which trainee you are."}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LOCATIONS.map((l) => {
                const s = locSummary(data, l.id);
                return (
                  <button key={l.id} onClick={() => chooseLocation(l.id)} className="card rise p-5 text-left transition hover:-translate-y-0.5 hover:border-plum-300 hover:shadow-md">
                    <div className="flex items-center gap-2">
                      <CameronMark size={26} />
                      <Badge tone="navy">{l.city}</Badge>
                    </div>
                    <div className="mt-3 font-semibold leading-tight text-ink">{l.name}</div>
                    <div className="mt-0.5 text-xs text-muted">GM: {l.gm} · {s.employees} employees</div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs"><span className="text-muted">Team readiness</span><span className="font-semibold">{s.readiness}%</span></div>
                      <ScoreBar score={s.readiness} height={6} />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {role === "trainee" && locId && (
          <TraineePicker locId={locId} onBack={back} onPick={chooseTrainee} />
        )}
      </section>
    </main>
  );
}

function TraineePicker({ locId, onBack, onPick }: { locId: string; onBack: () => void; onPick: (id: string) => void }) {
  const { data } = useStore();
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const list = empsAt(data, locId)
    .filter((e) => statusOf(e) !== "certified")
    .map((e) => ({ e, tailored: data.assignments.some((a) => a.employeeId === e.id && a.moduleId.startsWith("tl-") && a.status === "assigned") }))
    .sort((a, b) => Number(b.tailored) - Number(a.tailored));
  return (
    <>
      <button onClick={onBack} className="mb-3 text-sm font-semibold text-plum-700 hover:underline">← Back</button>
      <h2 className="font-display text-2xl font-semibold text-plum-800">Who are you at {loc.name}?</h2>
      <p className="mt-1 text-sm text-muted">Pick a trainee profile. Team members already certified are managed by your GM.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ e, tailored }) => (
          <button key={e.id} onClick={() => onPick(e.id)} className="card rise p-5 text-left transition hover:-translate-y-0.5 hover:border-plum-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <Avatar name={e.name} size={42} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{e.name}</div>
                <div className="text-xs text-muted">{e.role} · {e.weeks} weeks</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs"><span className="text-muted">Readiness</span><span className="font-semibold">{readiness(e)}%</span></div>
              <ScoreBar score={readiness(e)} height={6} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusBadge status={statusOf(e)} />
              {tailored && <Badge tone="warn">New GM feedback</Badge>}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Skills tracked: {CATEGORIES.map((c) => c.name).join(" · ")}</p>
    </>
  );
}
