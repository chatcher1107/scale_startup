"use client";

import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { HandbookView } from "@/components/HandbookView";

export default function HandbookPage() {
  const { ctx, me } = useStore();
  const loc = LOCATIONS.find((l) => l.id === ctx.locationId);
  const who = ctx.role === "owner" ? COMPANY.owner : ctx.role === "gm" ? loc?.gm ?? "GM" : me?.name ?? "Team member";
  const scope = ctx.role === "owner" ? LOCATIONS.map((l) => l.id) : loc ? [loc.id] : [];
  const sender = ctx.role === "owner" ? "owner" : ctx.role === "gm" ? "gm" : null;
  return <HandbookView editable={ctx.role === "owner" || ctx.role === "gm"} who={who} outdatedScope={scope} sender={sender} />;
}
