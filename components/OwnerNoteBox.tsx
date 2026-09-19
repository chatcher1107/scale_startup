"use client";

import { useState } from "react";
import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES, type CategoryId } from "@/lib/scenarios";

const QUICK = [
  "Great work this month. Keep it up!",
  "Please prioritize practice on this skill before the weekend rush.",
  "Can you tell me what's behind the recent guest complaints?",
];

// Owner writes a note that lands in the chosen GM's feedback feed
export function OwnerNoteBox({ locationId: fixed, onSent }: { locationId?: string; onSent?: () => void }) {
  const { addFeedback } = useStore();
  const [locId, setLocId] = useState(fixed ?? LOCATIONS[0].id);
  const [cat, setCat] = useState<CategoryId>("guests");
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const loc = LOCATIONS.find((l) => l.id === locId)!;

  const send = () => {
    if (!text.trim()) return;
    addFeedback({ locationId: locId, source: "Owner note", text: text.trim(), author: COMPANY.owner, categoryId: cat });
    setText("");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    onSent?.();
  };

  return (
    <div className="card p-5">
      <div className="eyebrow">{fixed ? `Leave a note for ${loc.gm}` : "Write a note"}</div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!fixed && (
          <select value={locId} onChange={(e) => setLocId(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.gm} · {l.name.replace(" (Brightleaf)", "")}</option>)}
          </select>
        )}
        <select value={cat} onChange={(e) => setCat(e.target.value as CategoryId)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>About: {c.name}</option>)}
        </select>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={`Write to ${loc.gm}…`}
        className="mt-3 w-full resize-none rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-plum-400"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q} onClick={() => setText(q)} className="rounded-full bg-plum-50 px-3 py-1 text-xs text-plum-700 hover:bg-plum-100">{q}</button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {done && <span className="text-sm font-medium text-good">✓ Sent to {loc.gm}</span>}
        <button className="btn btn-primary" disabled={!text.trim()} onClick={send}>Send note</button>
      </div>
    </div>
  );
}
