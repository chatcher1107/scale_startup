"use client";

import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { LocationDashboard } from "@/components/LocationDashboard";
import { Badge, PageHeader } from "@/components/ui";

export default function GmHome() {
  const { ctx } = useStore();
  const loc = LOCATIONS.find((l) => l.id === ctx.locationId);
  if (!loc) return null;
  return (
    <div>
      <PageHeader title={loc.name} sub={`${loc.city}, NC · Managed by ${loc.gm}`} right={<Badge tone="navy">Cameron Coffee Co.</Badge>} />
      <LocationDashboard locationId={loc.id} canApprove />
    </div>
  );
}
