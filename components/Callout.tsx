"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTour } from "./Tour";

// A small "✦ What's unique" pill that opens a popup explaining why a feature matters.
// Shown across the demo; can be switched off from the ☰ menu.
export function Callout({
  title,
  children,
  moat,
  align = "left",
  label = "✦ What's unique",
}: {
  title: string;
  children: ReactNode;
  moat?: string;
  align?: "left" | "right";
  label?: string;
}) {
  const { calloutsOn } = useTour();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  if (!calloutsOn) return null;

  return (
    <span ref={ref} className="relative inline-block align-middle print:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-full border border-plum-300 bg-plum-50 px-3 py-1 text-xs font-bold text-plum-700 shadow-sm transition hover:bg-plum-100"
      >
        {label}
      </button>
      {open && (
        <div className={`absolute z-50 mt-2 w-80 rounded-2xl border border-plum-200 bg-white p-4 text-left shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>
          <div className="font-display text-lg font-semibold leading-tight text-plum-800">{title}</div>
          <div className="mt-1.5 space-y-1.5 text-sm font-normal leading-relaxed text-ink/85">{children}</div>
          {moat && (
            <div className="mt-3 rounded-xl bg-plum-50 px-3 py-2 text-xs font-normal text-plum-800">
              <strong>Hard to copy:</strong> {moat}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
