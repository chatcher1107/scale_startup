"use client";

import { useState } from "react";
import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { outdatedBySkill, fmtLongDate } from "@/lib/stats";
import { Badge } from "./ui";
import { Callout } from "./Callout";

// "The policy changed, and these people haven't practiced since." One click sends the refresher.
export function OutdatedCard({ locationIds, sender }: { locationIds: string[]; sender: "owner" | "gm" | null }) {
  const { data, broadcastTraining } = useStore();
  const [sent, setSent] = useState<string | null>(null);
  const rows = outdatedBySkill(data, locationIds);
  if (rows.length === 0 && !sent) return null;
  const gmName = locationIds.length === 1 ? LOCATIONS.find((l) => l.id === locationIds[0])?.gm : undefined;

  const allSent = (people: { id: string }[], catId: string) =>
    people.every((p) => data.assignments.some((a) => a.employeeId === p.id && a.moduleId === `std-${catId}` && a.status === "assigned"));

  const send = (catId: string, label: string, count: number) => {
    const mod = data.modules.find((m) => m.id === `std-${catId}`);
    if (!mod) return;
    broadcastTraining({
      module: mod,
      locationIds,
      audience: "outdated",
      message: `The policy sheet changed (${label}). Please complete this quick refresher.`,
      by: sender === "gm" ? gmName : COMPANY.owner,
    });
    setSent(`Refresher sent to ${count} ${count === 1 ? "person" : "people"}.`);
  };

  return (
    <div data-tour="outdated-card" className="card border-warn/40 bg-warn-bg/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-semibold text-plum-800">Policy updates: training out of date</h2>
        <Badge tone="warn">Sheet v{data.handbook.version}</Badge>
        <Callout title="A record of who trained on what" moat="a per-person, per-version training history builds up over time and can't be recreated.">
          <p>When a policy changes, Seasoned flags only the people who haven&apos;t practiced since, and sends the refresher in one click.</p>
          <p>After an allergy incident, this audit trail shows your team was trained on the current rules.</p>
        </Callout>
      </div>
      <p className="mt-0.5 text-sm text-muted">These teammates haven&apos;t practiced since the policy sheet changed. Seasoned keeps a record of who trained on which version.</p>
      {sent && <div className="mt-3 rounded-xl bg-good-bg px-4 py-2 text-sm font-medium text-good">✓ {sent}</div>}
      <div className="mt-3 space-y-2">
        {rows.map(({ cat, people, since, change }) => (
          <div key={cat.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
            <div className="min-w-0">
              <div className="font-semibold">{cat.name} <span className="ml-1 text-xs font-normal text-muted">changed in v{since}{change ? ` · ${fmtLongDate(change.date)}` : ""}</span></div>
              <div className="text-xs text-muted">
                {people.length} {people.length === 1 ? "person" : "people"}: {people.slice(0, 4).map((p) => p.name.split(" ")[0]).join(", ")}
                {people.length > 4 ? ` +${people.length - 4} more` : ""}
              </div>
              {change && <div className="mt-0.5 text-xs text-ink/70">{change.text}</div>}
            </div>
            {allSent(people, cat.id) ? (
              <Badge tone="good">Refresher sent</Badge>
            ) : sender ? (
              <button className="btn btn-primary !py-2" onClick={() => send(cat.id, cat.name, people.length)}>Send refresher to {people.length}</button>
            ) : (
              <Badge tone="warn">Awaiting refresher</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
