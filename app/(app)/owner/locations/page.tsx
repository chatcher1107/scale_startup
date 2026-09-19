"use client";

import Link from "next/link";
import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/scenarios";
import { empsAt, locSummary, trend } from "@/lib/stats";
import { CameronMark } from "@/components/Logos";
import { Badge, PageHeader, ScoreBar, Sparkline } from "@/components/ui";
import { TriangleMap } from "@/components/TriangleMap";

export default function OwnerLocations() {
  const { data } = useStore();
  return (
    <div>
      <PageHeader title="Locations" sub="Select a location to see its team, gaps and approvals." />
      <div className="card mb-6 p-4"><TriangleMap height={280} /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LOCATIONS.map((l) => {
          const s = locSummary(data, l.id);
          const weakest = CATEGORIES.find((c) => c.id === s.weakest)!;
          return (
            <Link key={l.id} href={`/owner/location/${l.id}`} className="card p-5 transition hover:-translate-y-0.5 hover:border-plum-300 hover:shadow-md">
              <div className="flex items-center justify-between"><CameronMark size={28} /><Badge tone="navy">{l.city}</Badge></div>
              <div className="mt-3 font-semibold leading-tight">{l.name}</div>
              <div className="text-xs text-muted">GM {l.gm} · {s.employees} staff</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="font-display text-3xl font-semibold text-plum-800">{s.readiness}%</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted">readiness</div>
                </div>
                <Sparkline values={trend(empsAt(data, l.id))} />
              </div>
              <div className="mt-3"><ScoreBar score={s.readiness} height={6} /></div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <Badge tone="good">{s.certified} certified</Badge>
                {s.awaiting > 0 && <Badge tone="warn">{s.awaiting} awaiting</Badge>}
                <Badge tone="bad">Gap: {weakest.short}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
