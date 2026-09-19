"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Certificate } from "@/components/Certificate";

export default function GmCertificate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useStore();
  const router = useRouter();
  const e = data.employees.find((x) => x.id === id);
  if (!e) return null;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-semibold text-plum-700 hover:underline">← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
      <Certificate employee={e} />
    </div>
  );
}
