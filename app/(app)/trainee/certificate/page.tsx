"use client";

import { useStore } from "@/lib/store";
import { readiness, statusOf } from "@/lib/stats";
import { Certificate } from "@/components/Certificate";
import { PageHeader } from "@/components/ui";
import { Callout } from "@/components/Callout";

export default function TraineeCertificate() {
  const { me } = useStore();
  if (!me) return null;
  const st = statusOf(me);
  return (
    <div>
      <PageHeader
        title="Your credential"
        sub={
          st === "certified"
            ? "You're certified. This credential is yours to keep and carry between jobs."
            : st === "awaiting"
            ? "Every skill is at 90%+. Your GM just needs to sign off."
            : `This is what you'll earn. You're ${readiness(me)}% of the way there.`
        }
        right={
          <div className="flex items-center gap-2">
            <Callout align="right" title="A credential people carry" moat="when workers want it on a résumé and employers ask for it, it creates demand from both sides.">
              <p>Certification means every skill is at 90% or higher <em>and</em> a manager has signed off. Each certificate has a credential ID, and the goal is a credential that follows workers between jobs, like ServSafe.</p>
            </Callout>
            {st === "certified" && <button className="btn btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>}
          </div>
        }
      />
      <Certificate employee={me} />
    </div>
  );
}
