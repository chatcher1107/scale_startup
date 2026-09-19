"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { HandbookView } from "@/components/HandbookView";
import { SeasonedWordmark } from "@/components/Logos";

// Public, read-only copy of the sheet so anyone browsing the demo can see it
export default function PublicMenu() {
  const { ctx } = useStore();
  return (
    <main className="mx-auto max-w-6xl px-6 pb-10 pt-6">
      <header className="mb-6 flex items-center justify-between print:hidden">
        <SeasonedWordmark />
        <Link href={ctx.role ? `/${ctx.role}` : "/"} className="text-sm font-semibold text-plum-700 hover:underline">
          ← Back to the demo
        </Link>
      </header>
      <HandbookView editable={false} who="Guest" />
    </main>
  );
}
