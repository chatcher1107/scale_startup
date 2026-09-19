"use client";

import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/scenarios";
import { fmtDate } from "@/lib/stats";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { OwnerNoteBox } from "@/components/OwnerNoteBox";

export default function OwnerNotes() {
  const { data } = useStore();
  const notes = data.feedback.filter((f) => f.source === "Owner note");
  return (
    <div className="max-w-3xl">
      <PageHeader title="Notes to GMs" sub="Leave a comment for any General Manager. It shows up on their dashboard and in their feedback feed, where they can turn it into training." />
      <OwnerNoteBox />
      <h2 className="eyebrow mb-2 mt-8">Sent notes</h2>
      <div className="space-y-3">
        {notes.length === 0 && <Empty>No notes yet.</Empty>}
        {notes.map((n) => {
          const loc = LOCATIONS.find((l) => l.id === n.locationId)!;
          return (
            <div key={n.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="navy">To {loc.gm}</Badge>
                <Badge tone="gray">{loc.name.replace(" (Brightleaf)", "")}</Badge>
                <Badge tone="plum">{CATEGORIES.find((c) => c.id === n.categoryId)!.short}</Badge>
                <span className="ml-auto text-xs text-muted">{fmtDate(n.date)}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">“{n.text}”</p>
              {n.moduleId && <p className="mt-3 border-t border-line pt-2 text-sm font-medium text-good">✓ Includes training · {data.modules.find((m) => m.id === n.moduleId)?.title}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
