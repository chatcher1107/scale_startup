"use client";

import { useState } from "react";
import { COMPANY, LOCATIONS, type Session } from "@/lib/data";
import { CATEGORIES, CERT_BAR, type Module } from "@/lib/scenarios";
import { useStore } from "@/lib/store";
import { agreement, fmtLongDate } from "@/lib/stats";
import { Badge } from "./ui";
import { Callout } from "./Callout";

function ScoreRing({ score }: { score: number }) {
  const r = 46, c = 2 * Math.PI * r;
  const color = score >= CERT_BAR ? "#1c7c54" : score >= 70 ? "#d9a13a" : "#b3261e";
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Score ${score}%`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f5e8f0" strokeWidth="11" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight={700} fill="#3b0f27" fontFamily="var(--font-carlito)">{score}%</text>
      <text x="60" y="76" textAnchor="middle" fontSize="10" fill="#6f6475">this session</text>
    </svg>
  );
}

// Results + transcript playback: highlights the exact employee lines that earned each point.
// GMs and owners can confirm the AI grade or disagree and recalculate it.
export function SessionResult({ session, module }: { session: Session; module: Module }) {
  const { ctx, data, agreeWithGrade, adjustGrade } = useStore();
  const [editing, setEditing] = useState(false);
  const [mask, setMask] = useState<boolean[]>([]);
  const [note, setNote] = useState("");

  const cat = CATEGORIES.find((c) => c.id === module.categoryId)!;
  const canReview = ctx.role === "gm" || ctx.role === "owner";
  const reviewer = ctx.role === "owner" ? COMPANY.owner : LOCATIONS.find((l) => l.id === ctx.locationId)?.gm ?? "Manager";
  const agree = agreement(data);
  const review = session.review;

  const earnedByTurn = new Map<number, string[]>();
  session.results.forEach((r) => {
    if (r.passed && r.turn !== undefined) earnedByTurn.set(r.turn, [...(earnedByTurn.get(r.turn) ?? []), r.text]);
  });
  const passed = session.results.filter((r) => r.passed).length;

  const startEdit = () => {
    setMask(session.results.map((r) => r.passed));
    setNote("");
    setEditing(true);
  };
  const previewScore = Math.round((mask.filter(Boolean).length / (mask.length || 1)) * 100);
  const changed = editing && mask.some((m, i) => m !== session.results[i].passed);

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-6 p-6">
        <ScoreRing score={session.score} />
        <div className="min-w-[260px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="plum">{cat.name}</Badge>
            {module.type === "tailored" && <Badge tone="warn">Tailored</Badge>}
            {session.mock && <Badge tone="gray">Mock AI (no key connected)</Badge>}
            {session.handbookVersion && <Badge tone="navy">Policy sheet v{session.handbookVersion}</Badge>}
            {review?.status === "adjusted" && <Badge tone="warn">Adjusted by manager</Badge>}
            {review?.status === "agreed" && <Badge tone="good">✓ Manager confirmed</Badge>}
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-plum-800">{module.title}</h2>
          <p className="mt-1 text-sm text-muted">{fmtLongDate(session.date)} · {passed} of {session.results.length} required behaviors demonstrated</p>
          <p className="mt-3 text-sm text-ink/85">{session.summary}</p>
          {review?.status === "adjusted" && (
            <p className="mt-3 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
              <strong>{review.by}</strong> adjusted this grade: the AI scored {review.aiScore}%, the final score is {session.score}%.{review.note ? ` “${review.note}”` : ""}
            </p>
          )}
        </div>
      </div>

      {canReview && !review && !editing && (
        <div data-tour="review-bar" className="card flex flex-wrap items-center justify-between gap-4 border-cameron-navy/25 bg-cameron-tint/50 p-5">
          <div>
            <div className="font-semibold text-cameron-navy">Manager check: do you agree with this grade?</div>
            <div className="text-sm text-muted">
              The AI agrees with managers {agree.rate}% of the time ({agree.agreed} of {agree.total} checks). Each correction you make teaches it your standards.
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={startEdit}>I disagree…</button>
            <button className="btn btn-primary" onClick={() => agreeWithGrade(session.id, reviewer)}>Looks right ✓</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="card border-warn/40 bg-warn-bg/40 p-5">
          <div className="font-semibold text-warn">Adjust the grade</div>
          <p className="mt-0.5 text-sm text-ink/80">Flip any behavior below to what actually happened. The score recalculates and the trainee&apos;s skill updates.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional note (e.g. 'She did check the sheet, just not out loud')"
            className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-plum-400"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">New score: <strong className="font-display text-xl text-plum-800">{previewScore}%</strong> <span className="text-muted">(was {session.score}%)</span></div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!changed} onClick={() => { adjustGrade(session.id, mask, note.trim(), reviewer); setEditing(false); }}>
                Recalculate &amp; save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="card p-6">
          <h3 className="font-display text-xl font-semibold text-plum-800">Criteria the company defined</h3>
          <p className="mt-0.5 text-xs text-muted">Scored on observable actions only, not personality.</p>
          <ul className="mt-4 space-y-3">
            {session.results.map((r, i) => {
              const ok = editing ? mask[i] : r.passed;
              const ai = review?.aiResults[i];
              return (
                <li key={i} className={`rounded-xl border p-3.5 ${ok ? "border-good/30 bg-good-bg/50" : "border-bad/25 bg-bad-bg/50"}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ok ? "bg-good" : "bg-bad"}`}>{ok ? "✓" : "✕"}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.text}</div>
                      <div className="mt-1 text-xs text-ink/70">{r.passed ? <>“{r.evidence}”</> : r.evidence}</div>
                      {ai && ai.passed !== r.passed && <div className="mt-1 text-[11px] font-semibold text-warn">AI originally said: {ai.passed ? "demonstrated" : "not demonstrated"}</div>}
                    </div>
                    {editing && (
                      <button className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-plum-700 hover:bg-plum-50" onClick={() => setMask(mask.map((m, k) => (k === i ? !m : m)))}>
                        Mark {mask[i] ? "not demonstrated" : "demonstrated"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-xl font-semibold text-plum-800">Transcript playback <Callout title="Graded on what was said" moat="every score points back to an exact quote, so managers and employees can trust it.">
            <p>Points are awarded for observable actions, like checking the sheet or escalating to a manager. The highlighted lines are the evidence, not a personality score.</p>
          </Callout></h3>
          <p className="mt-0.5 text-xs text-muted">Highlighted lines earned a point.</p>
          <div className="mt-4 space-y-3">
            {session.transcript.map((t, i) => {
              const earned = earnedByTurn.get(i);
              const mine = t.role === "employee";
              return (
                <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? (earned ? "bg-good-bg ring-2 ring-good/50" : "bg-plum-100") : "bg-canvas border border-line"}`}>
                    <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">{mine ? "Employee" : "Guest"}</div>
                    {t.text}
                    {earned && (
                      <div className="mt-2 space-y-1 border-t border-good/25 pt-2">
                        {earned.map((e) => (
                          <div key={e} className="text-xs font-semibold text-good">✓ {e}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
