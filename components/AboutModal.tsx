"use client";

import { useEffect, useState } from "react";
import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { SeasonedWordmark } from "./Logos";
import { Badge } from "./ui";

type Status = { live: boolean; provider: string; model: string } | null;

export function AboutModal({ onClose }: { onClose: () => void }) {
  const { data } = useStore();
  const [ai, setAi] = useState<Status>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then(setAi)
      .catch(() => setAi({ live: false, provider: "none", model: "" }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div className="card w-full max-w-lg p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <SeasonedWordmark />
        <p className="mt-3 text-sm text-ink/80">
          Seasoned turns a restaurant group&apos;s menus, policies and manager knowledge into realistic guest practice, then measures who is ready.
          You&apos;re viewing a demo with a fictional customer.
        </p>
        <dl className="mt-5 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Company</dt><dd className="font-semibold">{COMPANY.name}</dd>
          <dt className="text-muted">Footprint</dt><dd>{LOCATIONS.length} locations · {data.employees.length} employees · {COMPANY.region}</dd>
          <dt className="text-muted">Certification</dt><dd>Every skill ≥ 90% plus manager sign-off</dd>
          <dt className="text-muted">AI status</dt>
          <dd>
            {!ai ? "Checking…" : ai.live ? <Badge tone="good">Live · {ai.provider} {ai.model}</Badge> : <Badge tone="warn">Mock mode (no API key found)</Badge>}
          </dd>
        </dl>
        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
