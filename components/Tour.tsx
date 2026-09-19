"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCATIONS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { locReadiness, statusOf } from "@/lib/stats";

/* ------------------------------------------------------------------ */
/*  Guided demo: walks through the product story across all three roles */
/* ------------------------------------------------------------------ */

type Who = { topLoc: string; traineeId: string; sessionId: string | null };
type Step = {
  role: "owner" | "gm" | "trainee";
  route: (w: Who) => string | null; // null = skip this step
  target?: string; // data-tour attribute to spotlight
  title: string;
  body: string;
  unique?: string; // why it's hard to copy
};

const STEPS: Step[] = [
  {
    role: "owner",
    route: () => "/owner",
    target: "owner-kpis",
    title: "Welcome to Seasoned",
    body: "You're Michelle, the owner of Cameron Coffee Co.: 8 coffee shops and 60 teammates. This is your command center for readiness, certifications, time-to-ready and trainer hours saved. The next 3 minutes cover the whole product.",
  },
  {
    role: "owner",
    route: () => "/owner",
    target: "outdated-card",
    title: "Policy changes don't slip through",
    body: "The allergy policy was updated. Seasoned knows exactly who hasn't practiced since, and sends them a refresher in one click.",
    unique: "A per-person record of who trained on which version of each policy. After an allergy incident, that record is your proof.",
  },
  {
    role: "owner",
    route: () => "/owner",
    target: "owner-heatmap",
    title: "Every location and skill at a glance",
    body: "Compare all 8 shops across all 6 skills. Red cells are where guests are most likely to have a bad experience. Click any location to drill in.",
    unique: "Cross-location analytics need every location on the same standards. A single-shop tool or a one-off prompt can't produce this.",
  },
  {
    role: "owner",
    route: () => "/owner/impact",
    target: "impact-kpis",
    title: "Proof that practice works",
    body: "Seasoned links each practice score to real outcomes: complaints, guest ratings and comp costs. Better-trained locations get fewer complaints, and you can see it.",
    unique: "This outcome history grows with every shift at every customer. It's data nobody can generate by prompting an AI.",
  },
  {
    role: "owner",
    route: () => "/owner/training",
    target: "send-locations",
    title: "Send training where it's needed",
    body: "Pick a scenario (or describe a new one), tap \"3 lowest\" to target the weakest locations, and send. Each GM is notified, and staff see it on their dashboard.",
  },
  {
    role: "gm",
    route: () => "/gm",
    target: "grades-card",
    title: "Managers keep the final word",
    body: "Every practice is graded by the AI, then checked by a manager. Here, the GM of your top location reviews grades. The AI and managers agree about 9 times in 10.",
    unique: "That agreement rate is what makes a certification credible, and it's tracked per customer.",
  },
  {
    role: "gm",
    route: (w) => (w.sessionId ? `/session/${w.sessionId}` : null),
    target: "review-bar",
    title: "Disagree? Recalculate in seconds",
    body: "Flip any criterion the AI got wrong, add a note, and the score and the teammate's skill update instantly. Corrections are sent back to the grader as examples, so it learns your standards.",
    unique: "Each company's corrections become a private calibration set. The AI gets more like your best manager over time.",
  },
  {
    role: "gm",
    route: () => "/gm/shift",
    target: "shift-table",
    title: "Readiness meets the schedule",
    body: "Each station has skill minimums. Seasoned checks tonight's schedule and flags anyone working a station they're not cleared for, then lets the GM swap someone in or send practice.",
    unique: "Once training controls who can work the register, it's part of daily operations. That makes it hard to rip out.",
  },
  {
    role: "gm",
    route: () => "/gm/feedback",
    target: "feedback-feed",
    title: "Yesterday's complaint becomes tomorrow's practice",
    body: "Guest reviews, manager notes and owner comments all land here. One click turns any of them into a practice scenario built from the exact situation.",
    unique: "It depends on your real reviews and your team's trust, not on a clever prompt.",
  },
  {
    role: "gm",
    route: () => "/handbook",
    target: "handbook-hero",
    title: "One sheet the whole system reads",
    body: "The menu and policy sheet is the source of truth. The AI guests and graders read it, and editing a policy automatically marks the related training out of date.",
    unique: "Your standards live in one place, so switching tools means rebuilding them.",
  },
  {
    role: "trainee",
    route: () => "/trainee",
    target: "readiness-strip",
    title: "One honest number for trainees",
    body: "Now you're a trainee. 100% means every skill is at 90% or higher and the GM has signed off. There's no gaming it with one easy skill.",
  },
  {
    role: "trainee",
    route: () => "/trainee",
    target: "tailored-card",
    title: "Training built from real feedback",
    body: "This scenario was created from a note the GM wrote about this teammate. Click Start practice to talk to an AI guest by voice or text, then get graded on what you actually said.",
    unique: "The scenario, the quote and the grading criteria all come from your own managers.",
  },
  {
    role: "trainee",
    route: () => "/trainee/certificate",
    target: "certificate",
    title: "A credential worth earning",
    body: "Certified teammates get a printable certificate with a verifiable ID. The goal is a credential workers carry between jobs, like ServSafe.",
    unique: "Demand from both workers and employers creates switching costs no internal tool has.",
  },
  {
    role: "owner",
    route: () => "/owner",
    title: "That's Seasoned",
    body: "Capture what your best managers know, simulate real guests, and measure who's ready. What makes it hard to copy: outcome data, the record of policy versions, readiness wired into the schedule, and a credential people carry.",
  },
];

type TourCtx = { active: boolean; start: () => void; stop: () => void; calloutsOn: boolean; setCalloutsOn: (b: boolean) => void };
const TourContext = createContext<TourCtx>({ active: false, start: () => {}, stop: () => {}, calloutsOn: false, setCalloutsOn: () => {} });
export const useTour = () => useContext(TourContext);

const CALLOUT_KEY = "seasoned-callouts-v2";

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, setCtx, resetDemo } = useStore();
  const [i, setI] = useState<number | null>(null);
  const [calloutsOn, setCalloutsState] = useState(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Feature callouts are off by default; remember the visitor's choice
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      if (localStorage.getItem(CALLOUT_KEY) === "on") setCalloutsState(true);
    } catch {
      /* ignore */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const setCalloutsOn = useCallback((b: boolean) => {
    setCalloutsState(b);
    try {
      localStorage.setItem(CALLOUT_KEY, b ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, []);

  const who = useCallback((): Who => {
    const d = dataRef.current;
    const topLoc = [...LOCATIONS].sort((a, b) => locReadiness(d, b.id) - locReadiness(d, a.id))[0].id;
    const staff = d.employees.filter((e) => e.locationId === topLoc && statusOf(e) !== "certified");
    const withTailored = staff.find((e) => d.assignments.some((a) => a.employeeId === e.id && a.moduleId.startsWith("tl-") && a.status === "assigned"));
    const trainee = withTailored ?? staff[0] ?? d.employees.find((e) => e.locationId === topLoc)!;
    const session = d.sessions.find((s) => !s.review && d.employees.find((e) => e.id === s.employeeId)?.locationId === topLoc) ?? d.sessions.find((s) => !s.review);
    return { topLoc, traineeId: trainee.id, sessionId: session?.id ?? null };
  }, []);

  const go = useCallback(
    (idx: number, dir: 1 | -1) => {
      const w = who();
      let k = idx;
      while (k >= 0 && k < STEPS.length && STEPS[k].route(w) === null) k += dir;
      if (k < 0 || k >= STEPS.length) {
        setI(null);
        return;
      }
      const st = STEPS[k];
      if (st.role === "owner") setCtx({ role: "owner", locationId: null, employeeId: null });
      else if (st.role === "gm") setCtx({ role: "gm", locationId: w.topLoc, employeeId: null });
      else setCtx({ role: "trainee", locationId: w.topLoc, employeeId: w.traineeId });
      const route = st.route(w)!;
      if (window.location.pathname !== route) router.push(route);
      setI(k);
    },
    [router, setCtx, who]
  );

  // The tour always starts from the home screen, on fresh sample data, so the story is the same every time
  const start = useCallback(() => {
    resetDemo();
    go(0, 1);
  }, [go, resetDemo]);
  const stop = useCallback(() => setI(null), []);

  useEffect(() => {
    if (i === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setI(null);
      if (e.key === "ArrowRight") go(i + 1, 1);
      if (e.key === "ArrowLeft" && i > 0) go(i - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  const step = i !== null ? STEPS[i] : null;

  return (
    <TourContext.Provider value={{ active: i !== null, start, stop, calloutsOn, setCalloutsOn }}>
      {children}
      {step && i !== null && (
        <TourCard
          step={step}
          index={i}
          total={STEPS.length}
          onBack={() => go(i - 1, -1)}
          onNext={() => (i === STEPS.length - 1 ? setI(null) : go(i + 1, 1))}
          onRestart={() => go(0, 1)}
          onExit={() => setI(null)}
        />
      )}
    </TourContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Spotlight + card motion. Each step: the highlight closes to a point, the page scrolls to the new
// target, and once the target has stopped moving the highlight opens on it. The card glides to its spot.
// ---------------------------------------------------------------------------
const CARD_W = 400;
const CARD_H = 392;
const MARGIN = 24;

const cornerBoxes = (vw: number, vh: number) => [
  { x: vw - CARD_W - MARGIN, y: vh - CARD_H - MARGIN }, // bottom right
  { x: MARGIN, y: vh - CARD_H - MARGIN }, // bottom left
  { x: vw - CARD_W - MARGIN, y: 90 }, // top right
];

type Spot = { target?: string; rect: DOMRect | null; center: { x: number; y: number }; card: { x: number; y: number }; glide: boolean; missing: boolean };

const sameRect = (a: DOMRect, b: DOMRect) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

function useSpotlight(target?: string) {
  const [s, setS] = useState<Spot>(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    return { rect: null, center: { x: vw / 2, y: vh / 2 }, card: cornerBoxes(vw, vh)[0], glide: true, missing: false };
  });

  useEffect(() => {
    if (!target) return;
    let raf = 0;
    let stage = 0; // 0 waiting for the element, 1 waiting for it to stop moving, 2 tracking
    let misses = 0;
    let stable = 0;
    let last: DOMRect | null = null;
    let glideTimer: ReturnType<typeof setTimeout> | undefined;

    const publish = (r: DOMRect, first: boolean) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      setS((prev) => {
        const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        if (!first) return { ...prev, target, rect: r, center };
        const boxes = cornerBoxes(vw, vh);
        const clash = (b: { x: number; y: number }) => r.right > b.x - 8 && r.left < b.x + CARD_W + 8 && r.bottom > b.y - 8 && r.top < b.y + CARD_H + 8;
        return { target, rect: r, center, card: boxes.find((b) => !clash(b)) ?? boxes[0], glide: true, missing: false };
      });
      if (first) {
        clearTimeout(glideTimer);
        glideTimer = setTimeout(() => setS((p) => (p.target === target ? { ...p, glide: false } : p)), 520);
      }
    };

    const tick = () => {
      const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null;
      const r = el?.getBoundingClientRect();
      const found = !!el && !!r && (r.width > 0 || r.height > 0);
      if (!found) {
        // still loading; if it never shows up, fall back to a centered card
        if (stage === 0 && ++misses > 240) {
          stage = 9;
          setS((p) => ({ ...p, target, rect: null, missing: true, glide: true }));
        }
      } else if (stage === 0) {
        el!.scrollIntoView({ block: "center" });
        stage = 1;
      } else if (stage === 1) {
        stable = last && sameRect(last, r!) ? stable + 1 : 0;
        last = r!;
        if (stable >= 4) {
          stage = 2;
          publish(r!, true);
        }
      } else if (stage === 2 && last && !sameRect(last, r!)) {
        last = r!;
        publish(r!, false);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(glideTimer);
    };
  }, [target]);

  const current = !!target && s.target === target;
  return { rect: current ? s.rect : null, center: s.center, card: s.card, glide: s.glide || !current, missing: current && s.missing };
}

const ROLE_LABEL = { owner: "Viewing as the Owner", gm: "Viewing as a General Manager", trainee: "Viewing as a Trainee" } as const;

function TourCard({ step, index, total, onBack, onNext, onRestart, onExit }: { step: Step; index: number; total: number; onBack: () => void; onNext: () => void; onRestart: () => void; onExit: () => void }) {
  const spot = useSpotlight(step.target);
  const last = index === total - 1;
  const vw = window.innerWidth, vh = window.innerHeight;

  const centered = !step.target || spot.missing;
  const cardPos = centered ? { x: (vw - CARD_W) / 2, y: (vh - CARD_H) / 2 } : spot.card;
  // when there's no target yet the highlight shrinks to a point (the page stays dimmed the whole time)
  const box = spot.rect
    ? { left: spot.rect.left - 8, top: spot.rect.top - 8, width: spot.rect.width + 16, height: spot.rect.height + 16 }
    : { left: spot.center.x, top: spot.center.y, width: 0, height: 0 };

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] print:hidden">
      <div
        className="fixed rounded-2xl border-plum-300"
        style={{
          ...box,
          borderWidth: spot.rect ? 3 : 0,
          boxShadow: "0 0 0 9999px rgba(30, 15, 40, 0.55)",
          transition: spot.glide ? "left 420ms cubic-bezier(0.4, 0, 0.2, 1), top 420ms cubic-bezier(0.4, 0, 0.2, 1), width 420ms cubic-bezier(0.4, 0, 0.2, 1), height 420ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        }}
      />
      <div
        className="pointer-events-auto fixed left-0 top-0 rounded-3xl border border-plum-200 bg-white p-5 shadow-2xl"
        style={{ width: CARD_W, height: CARD_H, transform: `translate(${cardPos.x}px, ${cardPos.y}px)`, transition: "transform 450ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <div className="flex h-full flex-col">
          <div key={index} className="fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span className="text-plum-500">Guided demo · Step {index + 1} of {total}</span>
              <span className="rounded-full bg-cameron-tint px-2.5 py-0.5 normal-case tracking-normal text-cameron-navy">{ROLE_LABEL[step.role]}</span>
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-plum-800">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/85">{step.body}</p>
            {step.unique && (
              <div className="mt-3 rounded-xl bg-plum-50 px-3 py-2.5 text-xs leading-relaxed text-plum-800">
                <strong>✦ Hard to copy:</strong> {step.unique}
              </div>
            )}
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: total }).map((_, k) => (
                <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= index ? "bg-plum-700" : "bg-plum-100"}`} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={onExit} className="text-xs font-semibold text-muted hover:text-ink">Exit tour</button>
              <div className="flex gap-2">
                {last && <button onClick={onRestart} className="btn btn-ghost !py-2">Restart</button>}
                {index > 0 && !last && <button onClick={onBack} className="btn btn-ghost !py-2">← Back</button>}
                <button onClick={onNext} className="btn btn-primary !py-2">{last ? "Finish" : "Next →"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Starts the tour. Only used on the home screen.
export function StartTourButton({ className = "btn btn-primary", children }: { className?: string; children: ReactNode }) {
  const { start } = useTour();
  return (
    <button onClick={start} className={className}>
      {children}
    </button>
  );
}

// Shown inside the app only while a tour is running, so there is always a way out
export function TourButton() {
  const { active, stop } = useTour();
  if (!active) return null;
  return (
    <button onClick={stop} className="btn btn-primary !py-2">
      ✕ Exit tour
    </button>
  );
}

export function TourMenuItems() {
  const { calloutsOn, setCalloutsOn } = useTour();
  return (
    <button onClick={() => setCalloutsOn(!calloutsOn)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-plum-50">
      Feature callouts (✦)
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${calloutsOn ? "bg-good-bg text-good" : "bg-canvas text-muted"}`}>{calloutsOn ? "On" : "Off"}</span>
    </button>
  );
}
