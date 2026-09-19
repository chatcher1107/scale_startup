"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { SessionResult } from "@/components/SessionResult";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, ctx } = useStore();
  const router = useRouter();
  const s = data.sessions.find((x) => x.id === id);
  const m = s && data.modules.find((x) => x.id === s.moduleId);
  if (!s || !m) return <p className="text-sm text-muted">Session not found.</p>;
  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-sm font-semibold text-plum-700 hover:underline">← Back</button>
      <SessionResult session={s} module={m} />
      {ctx.role === "trainee" && (
        <div className="mt-6"><Link href="/trainee" className="btn btn-primary">Back to my progress</Link></div>
      )}
    </div>
  );
}
