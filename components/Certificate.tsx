"use client";

import { COMPANY, LOCATIONS, type Employee } from "@/lib/data";
import { CATEGORIES, CERT_BAR } from "@/lib/scenarios";
import { fmtLongDate, readiness, statusOf } from "@/lib/stats";
import { SeasonedLogo } from "./Logos";

function Seal() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
      <circle cx="55" cy="55" r="52" fill="#681a43" />
      <circle cx="55" cy="55" r="45" fill="none" stroke="#f5e8f0" strokeWidth="1.5" strokeDasharray="2 3" />
      <circle cx="55" cy="55" r="37" fill="none" stroke="#f5e8f0" strokeWidth="1" />
      <text x="55" y="50" textAnchor="middle" fontSize="10.5" fill="#f5e8f0" fontFamily="var(--font-fraunces)" fontWeight="600" letterSpacing="0.6">SEASONED</text>
      <text x="55" y="66" textAnchor="middle" fontSize="9" fill="#e7c9db" letterSpacing="2">CERTIFIED</text>
      <text x="55" y="82" textAnchor="middle" fontSize="12" fill="#f5e8f0">✦</text>
    </svg>
  );
}

export function Certificate({ employee }: { employee: Employee }) {
  const loc = LOCATIONS.find((l) => l.id === employee.locationId)!;
  const certified = statusOf(employee) === "certified";
  const issued = employee.signedOffOn ?? new Date().toISOString().slice(0, 10);
  const certId = employee.certId ?? "SEA-26-PENDING";

  return (
    <div data-tour="certificate" className="print-area relative mx-auto w-full max-w-[980px] overflow-hidden rounded-sm bg-white shadow-xl" style={{ aspectRatio: "11 / 8.5" }}>
      <div className="absolute inset-3 border-[3px] border-plum-700" />
      <div className="absolute inset-[18px] border border-plum-300" />
      <div className="relative flex h-full flex-col items-center px-14 py-12 text-center">
        <div className="flex items-center gap-2">
          <SeasonedLogo size={44} />
          <span className="font-brand text-2xl font-semibold tracking-tight text-plum-700">Seasoned</span>
        </div>
        <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.35em] text-plum-500">Certificate of Frontline Readiness</div>
        <div className="my-auto flex flex-col items-center">
        <div className="text-sm text-muted">This certifies that</div>
        <div className="mt-1 font-display text-5xl font-semibold text-plum-800">{employee.name}</div>
        <div className="mx-auto mt-1 h-px w-64 bg-plum-300" />
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
          has demonstrated readiness to serve guests independently by scoring {CERT_BAR}% or higher in all six frontline competencies through
          realistic guest simulations, and has been approved by their General Manager.
        </p>

        <div className="mt-5 grid w-full max-w-2xl grid-cols-3 gap-x-6 gap-y-1.5 text-left text-xs">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-line py-1">
              <span className="text-ink/80">{c.name}</span>
              <span className="font-bold text-plum-700">{employee.scores[c.id]}%</span>
            </div>
          ))}
        </div>
        <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-plum-500">
          {COMPANY.name} · {loc.name.replace(" (Brightleaf)", "")}
        </div>
        </div>

        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-6">
          <div className="text-left">
            <div className="font-display text-xl italic text-plum-800">{loc.gm}</div>
            <div className="mt-0.5 h-px w-44 bg-ink/40" />
            <div className="mt-1 text-[11px] text-muted">General Manager · {COMPANY.name}, {loc.name.replace(" (Brightleaf)", "")}</div>
          </div>
          <Seal />
          <div className="text-right">
            <div className="text-sm font-semibold">{certified ? fmtLongDate(issued) : "Pending sign-off"}</div>
            <div className="mt-0.5 ml-auto h-px w-44 bg-ink/40" />
            <div className="mt-1 text-[11px] text-muted">Date issued</div>
          </div>
        </div>
        <div className="mt-4 text-[10px] tracking-wider text-muted">
          Credential ID {certId} · Verify at seasoned.app/verify/{certId} · Portable across employers
        </div>
      </div>

      {!certified && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/55">
          <div className="-rotate-12 rounded-2xl border-4 border-plum-700/70 px-10 py-4 text-center text-plum-700/80">
            <div className="font-display text-5xl font-bold tracking-widest">PREVIEW</div>
            <div className="mt-1 text-sm font-semibold">{readiness(employee)}% of the way to certification</div>
          </div>
        </div>
      )}
    </div>
  );
}
