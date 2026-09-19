"use client";

import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { AddNote, FeedbackFeed } from "@/components/FeedbackFeed";

export default function GmFeedback() {
  const { data, ctx } = useStore();
  const loc = LOCATIONS.find((l) => l.id === ctx.locationId);
  if (!loc) return null;
  const items = data.feedback.filter((f) => f.locationId === loc.id);
  const open = items.filter((f) => !f.moduleId).length;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Reviews & feedback" sub={`${loc.name} · ${items.length} items · ${open} not yet turned into training. Yesterday's complaint becomes tomorrow's practice.`} />
      <div className="mb-5"><AddNote locationId={loc.id} author={loc.gm} /></div>
      <FeedbackFeed items={items} mode="gm" />
    </div>
  );
}
