"use client";

import { useState } from "react";
import { COMPANY } from "@/lib/data";
import { useStore } from "@/lib/store";
import { ALLERGENS, MENU_SECTIONS, type Allergen, type MenuItem, type MenuSectionId, type Policy } from "@/lib/handbook";
import { fmtLongDate } from "@/lib/stats";
import { CATEGORIES, type CategoryId } from "@/lib/scenarios";
import { OutdatedCard } from "./OutdatedCard";
import { Callout } from "./Callout";

/* ---------- little illustrations ---------- */
function Bean({ className = "", size = 18 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(35 12 12)" fill="currentColor" />
      <path d="M8 6c4 3 4 9 8 12" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" transform="rotate(0 12 12)" opacity="0.85" />
    </svg>
  );
}

function CupMascot() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <path d="M40 18c-4-6 4-8 0-14M56 18c-4-6 4-8 0-14M72 18c-4-6 4-8 0-14" stroke="#fff" strokeOpacity="0.8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M24 32h64l-6 56a16 16 0 0 1-16 14H46a16 16 0 0 1-16-14z" fill="#fff" />
      <path d="M88 44h6a14 14 0 0 1 0 28h-10" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <rect x="20" y="28" width="72" height="12" rx="6" fill="#f5e8f0" />
      <circle cx="46" cy="66" r="4.5" fill="#012169" />
      <circle cx="70" cy="66" r="4.5" fill="#012169" />
      <path d="M52 76c3 5 11 5 14 0" stroke="#012169" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="76" r="5" fill="#f3b6d2" opacity="0.8" />
      <circle cx="78" cy="76" r="5" fill="#f3b6d2" opacity="0.8" />
    </svg>
  );
}

function AllergenChip({ id, dim }: { id: Allergen; dim?: boolean }) {
  const a = ALLERGENS.find((x) => x.id === id)!;
  return (
    <span title={a.label} className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${dim ? "bg-cameron-100 text-cameron-700" : "bg-cameron-700 text-white"}`}>
      {a.short}
    </span>
  );
}

/* ---------- editors ---------- */
function ItemForm({ item, onSave, onCancel }: { item: MenuItem; onSave: (i: MenuItem) => void; onCancel: () => void }) {
  const [f, setF] = useState(item);
  const toggle = (a: Allergen) => setF((p) => ({ ...p, allergens: p.allergens.includes(a) ? p.allergens.filter((x) => x !== a) : [...p.allergens, a] }));
  const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-cameron-400";
  return (
    <div className="rounded-2xl border-2 border-dashed border-cameron-300 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Item name" />
        <input className={input} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="Price (e.g. S 3.25 · M 3.75)" />
      </div>
      <textarea className={`${input} mt-3 resize-none`} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">Contains:</span>
        {ALLERGENS.map((a) => (
          <button key={a.id} type="button" onClick={() => toggle(a.id)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${f.allergens.includes(a.id) ? "border-cameron-700 bg-cameron-700 text-white" : "border-line bg-white text-muted"}`}>
            {a.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted">
          <input type="checkbox" checked={!!f.seasonal} onChange={(e) => setF({ ...f, seasonal: e.target.checked })} /> Seasonal
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-ghost-navy !py-1.5" onClick={onCancel}>Cancel</button>
        <button className="btn btn-navy !py-1.5" disabled={!f.name.trim()} onClick={() => onSave({ ...f, name: f.name.trim() })}>Save item</button>
      </div>
    </div>
  );
}

function PolicyForm({ policy, onSave, onCancel }: { policy: Policy; onSave: (p: Policy) => void; onCancel: () => void }) {
  const [f, setF] = useState(policy);
  const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-cameron-400";
  return (
    <div className="rounded-2xl border-2 border-dashed border-cameron-300 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[70px_1fr]">
        <input className={`${input} text-center text-lg`} value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} aria-label="Emoji" />
        <input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Policy title" />
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted">
        Related skill (editing this policy will flag that skill&apos;s training as out of date):
        <select className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-normal text-ink" value={f.category ?? ""} onChange={(e) => setF({ ...f, category: (e.target.value || undefined) as CategoryId | undefined })}>
          <option value="">None</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <textarea className={`${input} mt-3`} rows={7} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder={"One point per line. Start a line with '- ' to make it a bullet."} />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-ghost-navy !py-1.5" onClick={onCancel}>Cancel</button>
        <button className="btn btn-navy !py-1.5" disabled={!f.title.trim()} onClick={() => onSave({ ...f, title: f.title.trim() })}>Save policy</button>
      </div>
    </div>
  );
}

/* ---------- main view ---------- */
export function HandbookView({ editable, who, outdatedScope, sender = null }: { editable: boolean; who: string; outdatedScope?: string[]; sender?: "owner" | "gm" | null }) {
  const { data, updateHandbook } = useStore();
  const hb = data.handbook;
  const [tab, setTab] = useState<"menu" | "policies" | "log">("menu");
  const [editing, setEditing] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null); // item/policy id or "new-<section>"
  const [avoid, setAvoid] = useState<Allergen[]>([]);
  const canEdit = editable && editing;

  const toggleAvoid = (a: Allergen) => setAvoid((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  const saveItem = (draft: MenuItem) => {
    const item = draft.id ? draft : { ...draft, id: `m-${Date.now()}` };
    const before = hb.menu.find((m) => m.id === item.id);
    const exists = !!before;
    const allergensChanged = !before || before.allergens.join() !== item.allergens.join();
    const affects: CategoryId[] = allergensChanged && item.allergens.length + (before?.allergens.length ?? 0) > 0 ? ["menu", "allergy"] : ["menu"];
    updateHandbook({ menu: exists ? hb.menu.map((m) => (m.id === item.id ? item : m)) : [...hb.menu, item] }, who, `${exists ? "Updated" : "Added"} menu item: ${item.name}.`, affects);
    setOpenForm(null);
  };
  const deleteItem = (item: MenuItem) => {
    if (!confirm(`Remove ${item.name} from the menu?`)) return;
    updateHandbook({ menu: hb.menu.filter((m) => m.id !== item.id) }, who, `Removed menu item: ${item.name}.`, ["menu"]);
  };
  const savePolicy = (draft: Policy) => {
    const p = draft.id ? draft : { ...draft, id: `p-${Date.now()}` };
    const exists = hb.policies.some((x) => x.id === p.id);
    updateHandbook({ policies: exists ? hb.policies.map((x) => (x.id === p.id ? p : x)) : [...hb.policies, p] }, who, `${exists ? "Updated" : "Added"} policy: ${p.title}.`, p.category ? [p.category] : []);
    setOpenForm(null);
  };
  const deletePolicy = (p: Policy) => {
    if (!confirm(`Remove the "${p.title}" policy?`)) return;
    updateHandbook({ policies: hb.policies.filter((x) => x.id !== p.id) }, who, `Removed policy: ${p.title}.`, p.category ? [p.category] : []);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <div
        data-tour="handbook-hero"
        className="relative overflow-hidden rounded-[2rem] bg-cameron-700 px-8 py-8 text-white shadow-lg"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 2px, transparent 2px)", backgroundSize: "22px 22px" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
              <Bean size={14} /> {COMPANY.name}
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">Menu &amp; Policy Sheet</h1>
            <p className="mt-2 text-lg text-cameron-100">Sip happens. Here&apos;s how we handle it with a smile.</p>
            <p className="mt-4 text-xs text-cameron-200">
              Version {hb.version}.0 · Updated {fmtLongDate(hb.updatedOn)} by {hb.updatedBy}
            </p>
          </div>
          <CupMascot />
        </div>
      </div>

      {/* Controls */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="inline-flex rounded-full border border-cameron-200 bg-white p-1">
          {(["menu", "policies", ...(editable ? ["log"] : [])] as ("menu" | "policies" | "log")[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t ? "bg-cameron-700 text-white" : "text-cameron-700 hover:bg-cameron-50"}`}>
              {t === "menu" ? "☕ Menu" : t === "policies" ? "💜 Policies" : "🕘 Change log"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {editable && (
          <Callout align="right" title="The AI reads the same sheet your team does" moat="your standards live in one place, so switching tools means rebuilding them.">
            <p>Guests, grading and new scenarios are all based on this sheet. Edit a policy and the related training is automatically marked out of date.</p>
          </Callout>
          )}
          <button className="btn btn-ghost-navy" onClick={() => window.print()}>Print / Save as PDF</button>
          {editable && (
            <button className={`btn ${editing ? "btn-navy" : "btn-ghost-navy"}`} onClick={() => { setEditing(!editing); setOpenForm(null); }}>
              {editing ? "✓ Done editing" : "✎ Edit sheet"}
            </button>
          )}
        </div>
      </div>
      {editable && outdatedScope && <div className="mt-4 print:hidden"><OutdatedCard locationIds={outdatedScope} sender={sender} /></div>}
      {editable && editing && (
        <p className="mt-3 rounded-xl bg-warn-bg px-4 py-2.5 text-sm text-warn print:hidden">
          Edit mode is on. Changes save instantly, and the AI guest and grader use your latest version.
        </p>
      )}

      {/* MENU */}
      {tab === "menu" && (
        <div className="mt-6 space-y-8">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-cameron-50 px-4 py-3 print:hidden">
            <span className="text-sm font-semibold text-cameron-800">Allergen finder:</span>
            <span className="text-xs text-muted">tap what a guest needs to avoid</span>
            {ALLERGENS.map((a) => (
              <button key={a.id} onClick={() => toggleAvoid(a.id)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${avoid.includes(a.id) ? "border-cameron-700 bg-cameron-700 text-white" : "border-cameron-200 bg-white text-cameron-700"}`}>
                No {a.label.toLowerCase()}
              </button>
            ))}
            {avoid.length > 0 && <button className="text-xs font-semibold text-cameron-700 underline" onClick={() => setAvoid([])}>clear</button>}
          </div>

          {MENU_SECTIONS.map((sec) => {
            const items = hb.menu.filter((i) => i.section === sec.id);
            return (
              <section key={sec.id} className="break-inside-avoid">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cameron-100 text-2xl">{sec.emoji}</span>
                  <h2 className="font-display text-2xl font-semibold text-cameron-800">{sec.title}</h2>
                  <span className="h-px flex-1 border-t-2 border-dotted border-cameron-200" />
                  {canEdit && <button className="btn btn-ghost-navy !py-1.5" onClick={() => setOpenForm(`new-${sec.id}`)}>+ Add item</button>}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {openForm === `new-${sec.id}` && (
                    <div className="md:col-span-2">
                      <ItemForm item={{ id: "", section: sec.id as MenuSectionId, name: "", description: "", price: "", allergens: [] }} onSave={saveItem} onCancel={() => setOpenForm(null)} />
                    </div>
                  )}
                  {items.map((i) => {
                    const blocked = i.allergens.some((a) => avoid.includes(a));
                    if (openForm === i.id) return <div key={i.id} className="md:col-span-2"><ItemForm item={i} onSave={saveItem} onCancel={() => setOpenForm(null)} /></div>;
                    return (
                      <div key={i.id} className={`relative rounded-2xl border bg-white p-4 transition ${blocked ? "border-line opacity-35" : "border-cameron-100 hover:border-cameron-300"}`}>
                        {i.seasonal && <span className="absolute -top-2 right-3 rotate-3 rounded-full bg-cameron-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">Seasonal ✦</span>}
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-semibold text-ink">{i.name}</h3>
                          <span className="whitespace-nowrap text-sm font-semibold text-cameron-700">{i.price}</span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-ink/75">{i.description}</p>
                        <div className="mt-2 flex min-h-5 items-center gap-1.5">
                          {i.allergens.length === 0 ? <span className="text-[11px] text-muted">No top allergens</span> : i.allergens.map((a) => <AllergenChip key={a} id={a} dim={!avoid.includes(a)} />)}
                          {blocked && <span className="text-[11px] font-semibold text-bad">contains what they avoid</span>}
                          {canEdit && (
                            <span className="ml-auto flex gap-1 print:hidden">
                              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-cameron-700 hover:bg-cameron-50" onClick={() => setOpenForm(i.id)}>Edit</button>
                              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-bad hover:bg-bad-bg" onClick={() => deleteItem(i)}>Remove</button>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <p className="text-center text-xs text-muted">
            Allergen key: {ALLERGENS.map((a) => `${a.short} = ${a.label}`).join(" · ")}. Always check with the guest and a manager for severe allergies.
          </p>
        </div>
      )}

      {/* POLICIES */}
      {tab === "policies" && (
        <div className="mt-6 space-y-4">
          {canEdit && <button className="btn btn-ghost-navy print:hidden" onClick={() => setOpenForm("new-policy")}>+ Add policy</button>}
          {openForm === "new-policy" && <PolicyForm policy={{ id: "", title: "", emoji: "✨", body: "" }} onSave={savePolicy} onCancel={() => setOpenForm(null)} />}
          <div className="grid gap-4 md:grid-cols-2">
            {hb.policies.map((p, idx) => {
              if (openForm === p.id) return <div key={p.id} className="md:col-span-2"><PolicyForm policy={p} onSave={savePolicy} onCancel={() => setOpenForm(null)} /></div>;
              const lines = p.body.split("\n").filter(Boolean);
              return (
                <div key={p.id} className={`break-inside-avoid rounded-3xl border p-5 ${p.noAi ? "border-dashed border-cameron-300 bg-cameron-50" : "border-cameron-100 bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cameron-100 text-2xl">{p.emoji}</span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-cameron-500">Policy {idx + 1}</div>
                      <h2 className="font-display text-xl font-semibold text-cameron-800">{p.title}</h2>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/85">
                    {lines.map((l, k) => (
                      <li key={k} className="flex gap-2">
                        {l.startsWith("- ") ? <Bean className="mt-1 shrink-0 text-cameron-400" size={12} /> : null}
                        <span>{l.replace(/^- /, "")}</span>
                      </li>
                    ))}
                  </ul>
                  {canEdit && (
                    <div className="mt-3 flex justify-end gap-1 print:hidden">
                      <button className="rounded-lg px-2 py-1 text-xs font-semibold text-cameron-700 hover:bg-cameron-50" onClick={() => setOpenForm(p.id)}>Edit</button>
                      <button className="rounded-lg px-2 py-1 text-xs font-semibold text-bad hover:bg-bad-bg" onClick={() => deletePolicy(p)}>Remove</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHANGE LOG */}
      {tab === "log" && editable && (
        <div className="card mt-6 divide-y divide-line">
          {hb.log.map((l) => (
            <div key={l.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cameron-500" />
              <div className="flex-1">
                {l.text}
                {l.affects && l.affects.length > 0 && <span className="ml-2 text-xs text-warn">flags training out of date: {l.affects.map((c) => CATEGORIES.find((x) => x.id === c)?.short).join(", ")}</span>}
              </div>
              <div className="whitespace-nowrap text-xs text-muted">{l.who} · {fmtLongDate(l.date)}</div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 pb-6 text-center text-xs text-muted">
        {COMPANY.name} · Made with love and a little too much espresso ☕
      </p>
    </div>
  );
}
