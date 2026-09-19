"use client";

import { useState } from "react";
import { LOCATIONS, type FeedbackItem } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES, type CategoryId } from "@/lib/scenarios";
import { handbookText } from "@/lib/handbook";
import { fmtDate } from "@/lib/stats";
import { Badge, Empty, Stars } from "./ui";

const SOURCE_TONE: Record<FeedbackItem["source"], "navy" | "plum" | "warn" | "gray"> = {
  Google: "navy",
  Yelp: "navy",
  Instagram: "navy",
  "GM note": "plum",
  "Owner note": "plum",
  "Incident log": "warn",
};

export function FeedbackFeed({ items, mode, showLocation = false }: { items: FeedbackItem[]; mode: "gm" | "trainee"; showLocation?: boolean }) {
  const { data, convertToTraining } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const convert = async (f: FeedbackItem) => {
    setBusy(f.id);
    try {
      const emp = f.employeeId ? data.employees.find((e) => e.id === f.employeeId) : undefined;
      const res = await fetch("/api/ai/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: f.id, text: f.text, categoryId: f.categoryId, source: f.source, employeeName: emp?.name.split(" ")[0], handbook: handbookText(data.handbook) }),
      });
      const { module, mock } = await res.json();
      if (emp) module.createdFor = emp.id;
      convertToTraining(f.id, module, emp ? [emp.id] : undefined);
      setNote(`Training created${mock ? " (mock AI)" : ""} and assigned. Trainees will see it on their dashboard.`);
    } catch {
      setNote("Couldn't generate the training. Please try again.");
    }
    setBusy(null);
  };

  if (!items.length) return <Empty>No feedback yet.</Empty>;

  return (
    <div data-tour="feedback-feed" className="space-y-3">
      {note && <div className="rounded-xl bg-good-bg px-4 py-2.5 text-sm font-medium text-good">{note}</div>}
      {items.map((f) => {
        const cat = CATEGORIES.find((c) => c.id === f.categoryId)!;
        const emp = f.employeeId ? data.employees.find((e) => e.id === f.employeeId) : null;
        const assigned = f.moduleId ? data.assignments.filter((a) => a.moduleId === f.moduleId).length : 0;
        const loc = LOCATIONS.find((l) => l.id === f.locationId);
        const positive = (f.rating ?? 0) >= 4;
        return (
          <div key={f.id} className="card rise p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={SOURCE_TONE[f.source]}>{f.source}</Badge>
              {f.rating && <Stars n={f.rating} />}
              {showLocation && loc && <Badge tone="gray">{loc.name.replace(" (Brightleaf)", "")}</Badge>}
              <Badge tone="plum">{cat.short}</Badge>
              {emp && mode === "gm" && <Badge tone="warn">About {emp.name}</Badge>}
              <span className="ml-auto text-xs text-muted">{f.author} · {fmtDate(f.date)}</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">“{f.text}”</p>
            {mode === "gm" && (
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                {f.moduleId ? (
                  <span className="text-sm font-medium text-good">✓ Turned into training · {assigned} assigned</span>
                ) : positive ? (
                  <span className="text-xs text-muted">Positive feedback. Nothing to fix; share it with the team.</span>
                ) : (
                  <span className="text-xs text-muted">Not yet used for training</span>
                )}
                {!f.moduleId && !positive && (
                  <button onClick={() => convert(f)} disabled={busy === f.id} className="btn btn-primary !py-2">
                    {busy === f.id ? "Building scenario…" : "Turn into training"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AddNote({ locationId, author }: { locationId: string; author: string }) {
  const { data, addFeedback } = useStore();
  const [text, setText] = useState("");
  const [cat, setCat] = useState<CategoryId>("guests");
  const [empId, setEmpId] = useState("");
  const emps = data.employees.filter((e) => e.locationId === locationId);

  const submit = () => {
    if (!text.trim()) return;
    addFeedback({ locationId, source: "GM note", text: text.trim(), author, categoryId: cat, employeeId: empId || undefined });
    setText("");
  };

  return (
    <div className="card p-5">
      <div className="eyebrow">Add a note or incident</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="e.g. Heard Maya tell a guest 'I think that has nuts'. Needs to check the sheet and escalate."
        className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-plum-400"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select value={cat} onChange={(e) => setCat(e.target.value as CategoryId)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={empId} onChange={(e) => setEmpId(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <option value="">About the whole team</option>
          {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <button onClick={submit} disabled={!text.trim()} className="btn btn-primary ml-auto">Add note</button>
      </div>
    </div>
  );
}
