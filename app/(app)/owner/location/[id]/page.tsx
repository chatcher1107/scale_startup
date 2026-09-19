"use client";

import { use } from "react";
import Link from "next/link";
import { LOCATIONS } from "@/lib/data";
import { LocationDashboard } from "@/components/LocationDashboard";
import { Badge, PageHeader } from "@/components/ui";
import { OwnerNoteBox } from "@/components/OwnerNoteBox";

export default function OwnerLocation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const loc = LOCATIONS.find((l) => l.id === id);
  if (!loc) return null;
  return (
    <div>
      <Link href="/owner/locations" className="mb-3 inline-block text-sm font-semibold text-plum-700 hover:underline">← All locations</Link>
      <PageHeader title={loc.name} sub={`${loc.city}, NC · GM ${loc.gm}`} right={<Badge tone="gray">Owner view (approvals belong to the GM)</Badge>} />
      <div className="mb-6"><OwnerNoteBox locationId={loc.id} /></div>
      <LocationDashboard locationId={loc.id} canApprove={false} />
    </div>
  );
}
