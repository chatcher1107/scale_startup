"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { COMPANY, LOCATIONS } from "@/lib/data";
import { useStore, type Role } from "@/lib/store";
import { readiness, statusOf, STATUS_LABEL, empsAt } from "@/lib/stats";
import { CERT_BAR } from "@/lib/scenarios";
import { CameronLockup, SeasonedLogo } from "@/components/Logos";
import { Avatar, Badge } from "@/components/ui";
import { AboutModal } from "@/components/AboutModal";
import { TourButton, TourMenuItems } from "@/components/Tour";
import { Callout } from "@/components/Callout";

const NAV: Record<Role, { href: string; label: string; icon: string }[]> = {
  trainee: [
    { href: "/trainee", label: "My progress", icon: "◔" },
    { href: "/trainee/feedback", label: "Feedback", icon: "✎" },
    { href: "/trainee/certificate", label: "Certificate", icon: "✦" },
    { href: "/handbook", label: "Menu & policies", icon: "☕" },
  ],
  gm: [
    { href: "/gm", label: "Team overview", icon: "▦" },
    { href: "/gm/shift", label: "Tonight's shift", icon: "◷" },
    { href: "/gm/feedback", label: "Reviews & feedback", icon: "✎" },
    { href: "/handbook", label: "Menu & policies", icon: "☕" },
  ],
  owner: [
    { href: "/owner", label: "Company overview", icon: "▦" },
    { href: "/owner/locations", label: "Locations", icon: "⌖" },
    { href: "/owner/impact", label: "Impact", icon: "↗" },
    { href: "/owner/training", label: "Send training", icon: "➤" },
    { href: "/owner/notes", label: "Notes to GMs", icon: "✉" },
    { href: "/handbook", label: "Menu & policies", icon: "☕" },
  ],
};

const ROLE_LABEL: Record<Role, string> = { trainee: "Trainee", gm: "General Manager", owner: "Owner" };

export default function AppLayout({ children }: { children: ReactNode }) {
  const { ready, ctx, me, data, setCtx, resetDemo } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [about, setAbout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !ctx.role) router.replace("/");
  }, [ready, ctx.role, router]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!ready || !ctx.role) return <div className="p-10 text-sm text-muted">Loading…</div>;

  const role = ctx.role;
  const loc = LOCATIONS.find((l) => l.id === ctx.locationId) ?? null;
  const gmUser = loc ? loc.gm : COMPANY.owner;
  const who = role === "trainee" && me ? me.name : role === "gm" ? gmUser : COMPANY.owner;
  const sub = role === "owner" ? `${COMPANY.ownerTitle} · All locations` : `${ROLE_LABEL[role]} · ${loc?.name}`;

  const switchRole = (r: Role) => {
    setMenu(false);
    if (r === "owner") {
      setCtx({ role: "owner" });
      router.push("/owner");
    } else if (r === "gm") {
      setCtx({ role: "gm", locationId: ctx.locationId ?? "duke-west" });
      router.push("/gm");
    } else {
      const locId = ctx.locationId ?? "duke-west";
      const first = me && me.locationId === locId ? me : empsAt(data, locId).find((e) => statusOf(e) !== "certified") ?? empsAt(data, locId)[0];
      setCtx({ role: "trainee", locationId: locId, employeeId: first.id });
      router.push("/trainee");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 print:hidden hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white p-5 lg:flex">
        <CameronLockup size={40} />
        <nav className="mt-8 space-y-1">
          {NAV[role].map((n) => {
            const active = n.href === pathname || (n.href !== `/${role}` && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-plum-100 text-plum-800" : "text-muted hover:bg-plum-50 hover:text-plum-700"}`}
              >
                <span className="w-4 text-center text-base">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-canvas p-3">
          <div className="flex items-center gap-2">
            <SeasonedLogo size={30} />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-muted">Powered by</div>
              <div className="font-brand text-base font-semibold text-plum-700">Seasoned</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 print:hidden border-b border-line bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-8 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={who} size={38} />
              <div className="leading-tight">
                <div className="text-sm font-semibold">{who}</div>
                <div className="text-xs text-muted">{sub}</div>
              </div>
              {role === "owner" && <Badge tone="navy">{data.employees.length} employees · {LOCATIONS.length} locations</Badge>}
            </div>
            <div className="flex items-center gap-3">
            <TourButton />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((m) => !m)}
                aria-label="Menu"
                aria-expanded={menu}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-lg text-plum-700 hover:bg-plum-50"
              >
                ☰
              </button>
              {menu && (
                <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-line bg-white p-2 shadow-xl">
                  <div className="eyebrow px-3 pb-1 pt-2">Switch view</div>
                  {(["trainee", "gm", "owner"] as Role[]).map((r) => (
                    <button key={r} onClick={() => switchRole(r)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-plum-50 ${role === r ? "font-semibold text-plum-700" : ""}`}>
                      {ROLE_LABEL[r]}
                      {role === r && <span className="text-plum-500">●</span>}
                    </button>
                  ))}
                  <button onClick={() => { setMenu(false); router.push("/"); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-plum-50">
                    Change location or person…
                  </button>
                  <div className="my-2 border-t border-line" />
                  <div className="eyebrow px-3 pb-1">Demo</div>
                  <TourMenuItems />
                  <button onClick={() => { setMenu(false); setAbout(true); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-plum-50">About this demo</button>
                  <button
                    onClick={() => {
                      if (confirm("Reset all demo data back to its starting point?")) { resetDemo(); setMenu(false); }
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-bad hover:bg-bad-bg"
                  >
                    Reset demo data
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
          {role === "trainee" && me && <ReadinessStrip />}
        </header>

        <main className="px-8 py-8">{children}</main>
      </div>
      {about && <AboutModal onClose={() => setAbout(false)} />}
    </div>
  );
}

// Persistent readiness strip: 100% == every category ≥ 90% (then GM sign-off)
function ReadinessStrip() {
  const { me } = useStore();
  if (!me) return null;
  const r = readiness(me);
  const st = statusOf(me);
  return (
    <div data-tour="readiness-strip" className="border-t border-line bg-plum-50/70 px-8 py-2.5">
      <div className="flex items-center gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-plum-700">Readiness</div>
        <Callout title="One honest number" moat="a definition of 'ready' your managers set, not a vague score.">
          <p>100% only happens when <strong>every skill is at 90% or higher</strong> and the GM signs off. One easy skill can&apos;t carry the score.</p>
        </Callout>
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-plum-100">
          <div className="h-full rounded-full bg-gradient-to-r from-plum-500 to-plum-700 transition-all duration-700" style={{ width: `${r}%` }} />
        </div>
        <div className="w-14 text-right font-display text-xl font-semibold text-plum-800">{r}%</div>
        <div className="hidden w-52 text-xs text-muted md:block">
          {st === "certified" ? "Certified ✓" : st === "awaiting" ? "All categories ≥ 90% · awaiting GM sign-off" : `Certification at 100% (every skill ≥ ${CERT_BAR}%)`}
        </div>
        <Badge tone={st === "certified" ? "good" : st === "awaiting" ? "warn" : "plum"}>{STATUS_LABEL[st]}</Badge>
      </div>
    </div>
  );
}
