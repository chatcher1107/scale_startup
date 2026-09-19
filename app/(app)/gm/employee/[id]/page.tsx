"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EmployeeView } from "@/components/EmployeeView";

export default function GmEmployee({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useStore();
  const router = useRouter();
  const e = data.employees.find((x) => x.id === id);
  if (!e) return <p className="text-sm text-muted">Employee not found.</p>;
  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-sm font-semibold text-plum-700 hover:underline">← Back</button>
      <EmployeeView employee={e} viewer="gm" />
    </div>
  );
}
