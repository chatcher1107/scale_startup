"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed, COMPANY, readinessOf, today, type Audience, type DemoData, type Employee, type FeedbackItem, type Session } from "./data";
import type { Handbook } from "./handbook";
import { CATEGORY_IDS, type CategoryId, type Module } from "./scenarios";
import { audienceTargets, meetsBar } from "./stats";
import type { ShiftEntry } from "./shift";

export type Role = "trainee" | "gm" | "owner";
export type Ctx = { role: Role | null; locationId: string | null; employeeId: string | null };

type Store = {
  ready: boolean;
  data: DemoData;
  ctx: Ctx;
  me: Employee | null;
  setCtx: (c: Partial<Ctx>) => void;
  clearCtx: () => void;
  resetDemo: () => void;
  recordSession: (s: Session, categoryId: string) => void;
  signOff: (employeeId: string) => void;
  convertToTraining: (feedbackId: string, module: Module, employeeIds?: string[]) => void;
  addFeedback: (f: Omit<FeedbackItem, "id" | "date">) => FeedbackItem;
  broadcastTraining: (o: { module: Module; locationIds: string[]; audience: Audience; message: string; by?: string }) => void;
  updateHandbook: (next: { menu?: Handbook["menu"]; policies?: Handbook["policies"] }, who: string, summary: string, affects?: CategoryId[]) => void;
  agreeWithGrade: (sessionId: string, by: string) => void;
  adjustGrade: (sessionId: string, passed: boolean[], note: string, by: string) => void;
  assignModule: (employeeIds: string[], moduleId: string) => void;
  swapShift: (key: string, index: number, employeeId: string) => void;
};

const KEY = "seasoned-demo-v10";
const EMPTY_CTX: Ctx = { role: null, locationId: null, employeeId: null };

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(() => buildSeed());
  const [ctx, setCtxState] = useState<Ctx>(EMPTY_CTX);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount (SSR renders the seed first, so this must run in an effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { data: DemoData; ctx: Ctx };
        if (saved.data?.employees?.length) {
          const fresh = buildSeed();
          setData({ ...saved.data, broadcasts: saved.data.broadcasts ?? fresh.broadcasts, handbook: saved.data.handbook ?? fresh.handbook });
        }
        if (saved.ctx) setCtxState(saved.ctx);
      }
    } catch {
      /* storage unavailable: run from the seed */
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ data, ctx }));
    } catch {
      /* ignore */
    }
  }, [data, ctx, ready]);

  const setCtx = useCallback((c: Partial<Ctx>) => setCtxState((prev) => ({ ...prev, ...c })), []);
  const clearCtx = useCallback(() => setCtxState(EMPTY_CTX), []);
  const resetDemo = useCallback(() => setData(buildSeed()), []);

  const recordSession = useCallback((s: Session, categoryId: string) => {
    setData((d) => {
      const employees = d.employees.map((e) => {
        if (e.id !== s.employeeId) return e;
        const cat = categoryId as (typeof CATEGORY_IDS)[number];
        // Move the category score halfway toward this session's score
        const next = Math.round(e.scores[cat] + (s.score - e.scores[cat]) * 0.5);
        const scores = { ...e.scores, [cat]: Math.max(0, Math.min(100, next)) };
        const now = readinessOf(scores);
        return {
          ...e,
          scores,
          sessions: e.sessions + 1,
          lastPracticed: today(),
          history: [...e.history.slice(0, 11), now],
          trained: { ...e.trained, [cat]: d.handbook.version },
        };
      });
      let done = false;
      const assignments = d.assignments.map((a) => {
        if (!done && a.employeeId === s.employeeId && a.moduleId === s.moduleId && a.status === "assigned") {
          done = true;
          return { ...a, status: "completed" as const, score: s.score };
        }
        return a;
      });
      return { ...d, employees, assignments, sessions: [{ ...s, handbookVersion: d.handbook.version }, ...d.sessions] };
    });
  }, []);

  const signOff = useCallback((employeeId: string) => {
    setData((d) => ({
      ...d,
      employees: d.employees.map((e) =>
        e.id === employeeId && meetsBar(e)
          ? { ...e, signedOff: true, signedOffOn: today(), certId: `SEA-26-${String(41000 + Number(e.id.slice(1)) * 37).padStart(5, "0")}`, weeksToCert: e.weeksToCert ?? Math.min(e.weeks, 8) }
          : e
      ),
    }));
  }, []);

  const convertToTraining = useCallback((feedbackId: string, module: Module, employeeIds?: string[]) => {
    setData((d) => {
      const fb = d.feedback.find((f) => f.id === feedbackId);
      if (!fb) return d;
      const targets =
        employeeIds ??
        d.employees
          .filter((e) => e.locationId === fb.locationId && e.scores[module.categoryId] < 90)
          .map((e) => e.id);
      const existing = d.modules.some((m) => m.id === module.id);
      return {
        ...d,
        modules: existing ? d.modules : [...d.modules, module],
        feedback: d.feedback.map((f) => (f.id === feedbackId ? { ...f, moduleId: module.id } : f)),
        assignments: [
          ...d.assignments,
          ...targets.map((id, i) => ({
            id: `a-${Date.now()}-${i}`,
            employeeId: id,
            moduleId: module.id,
            status: "assigned" as const,
            assignedOn: today(),
          })),
        ],
      };
    });
  }, []);

  const addFeedback = useCallback((f: Omit<FeedbackItem, "id" | "date">) => {
    const item: FeedbackItem = { ...f, id: `f-${Date.now()}`, date: today() };
    setData((d) => ({ ...d, feedback: [item, ...d.feedback] }));
    return item;
  }, []);

  const broadcastTraining = useCallback((o: { module: Module; locationIds: string[]; audience: Audience; message: string; by?: string }) => {
    setData((d) => {
      const targets = audienceTargets(d, o.module.id, o.module.categoryId, o.locationIds, o.audience);
      const stamp = Date.now();
      return {
        ...d,
        modules: d.modules.some((m) => m.id === o.module.id) ? d.modules : [...d.modules, o.module],
        assignments: [
          ...d.assignments,
          ...targets.map((e, i) => ({ id: `a-${stamp}-${i}`, employeeId: e.id, moduleId: o.module.id, status: "assigned" as const, assignedOn: today() })),
        ],
        broadcasts: [
          { id: `b-${stamp}`, moduleId: o.module.id, locationIds: o.locationIds, audience: o.audience, message: o.message, author: o.by ?? COMPANY.owner, date: today(), count: targets.length },
          ...d.broadcasts,
        ],
        // GMs see it in their feed as a note from the owner
        feedback: [
          ...o.locationIds.map((locationId, i) => ({
            id: `f-${stamp}-${i}`,
            locationId,
            source: (o.by && o.by !== COMPANY.owner ? "GM note" : "Owner note") as "GM note" | "Owner note",
            text: o.message || `Assigned "${o.module.title}" to your team.`,
            author: o.by ?? COMPANY.owner,
            date: today(),
            categoryId: o.module.categoryId,
            moduleId: o.module.id,
          })),
          ...d.feedback,
        ],
      };
    });
  }, []);

  const updateHandbook = useCallback((next: { menu?: Handbook["menu"]; policies?: Handbook["policies"] }, who: string, summary: string, affects: CategoryId[] = []) => {
    setData((d) => {
      const version = d.handbook.version + 1;
      const catVersion = { ...d.handbook.catVersion };
      affects.forEach((c) => (catVersion[c] = version));
      return {
        ...d,
        handbook: {
          ...d.handbook,
          ...next,
          version,
          catVersion,
          updatedOn: today(),
          updatedBy: who,
          log: [{ id: `l-${Date.now()}`, date: today(), who, text: summary, affects }, ...d.handbook.log],
        },
      };
    });
  }, []);

  const agreeWithGrade = useCallback((sessionId: string, by: string) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) =>
        s.id === sessionId && !s.review ? { ...s, review: { status: "agreed" as const, by, date: today(), aiScore: s.score, aiResults: s.results } } : s
      ),
    }));
  }, []);

  // Manager disagrees: recalculate the score from their pass/fail calls and move the skill score accordingly
  const adjustGrade = useCallback((sessionId: string, passed: boolean[], note: string, by: string) => {
    setData((d) => {
      const s = d.sessions.find((x) => x.id === sessionId);
      const mod = s && d.modules.find((m) => m.id === s.moduleId);
      if (!s || !mod) return d;
      const aiResults = s.review?.aiResults ?? s.results;
      const aiScore = s.review?.aiScore ?? s.score;
      const results = aiResults.map((r, i) =>
        passed[i] === r.passed
          ? r
          : { ...r, passed: passed[i], evidence: passed[i] ? `Marked as demonstrated by ${by}.` : `Marked as not demonstrated by ${by}.`, turn: passed[i] ? r.turn : undefined }
      );
      const score = Math.round((results.filter((r) => r.passed).length / results.length) * 100);
      const delta = Math.round((score - s.score) * 0.5);
      return {
        ...d,
        employees: d.employees.map((e) => {
          if (e.id !== s.employeeId) return e;
          const scores = { ...e.scores, [mod.categoryId]: Math.max(0, Math.min(100, e.scores[mod.categoryId] + delta)) };
          return { ...e, scores, history: [...e.history.slice(0, 11), readinessOf(scores)] };
        }),
        sessions: d.sessions.map((x) =>
          x.id === sessionId ? { ...x, score, results, review: { status: "adjusted" as const, by, date: today(), note: note || undefined, aiScore, aiResults } } : x
        ),
      };
    });
  }, []);

  const assignModule = useCallback((employeeIds: string[], moduleId: string) => {
    setData((d) => {
      const stamp = Date.now();
      const fresh = employeeIds.filter((id) => !d.assignments.some((a) => a.employeeId === id && a.moduleId === moduleId && a.status === "assigned"));
      return {
        ...d,
        assignments: [...d.assignments, ...fresh.map((id, i) => ({ id: `a-${stamp}-${i}`, employeeId: id, moduleId, status: "assigned" as const, assignedOn: today() }))],
      };
    });
  }, []);

  const swapShift = useCallback((key: string, index: number, employeeId: string) => {
    setData((d) => {
      const entries = (d.shifts[key] ?? []) as ShiftEntry[];
      return { ...d, shifts: { ...d.shifts, [key]: entries.map((en, i) => (i === index ? { ...en, employeeId } : en)) } };
    });
  }, []);

  const me = useMemo(() => data.employees.find((e) => e.id === ctx.employeeId) ?? null, [data, ctx.employeeId]);

  const value: Store = { ready, data, ctx, me, setCtx, clearCtx, resetDemo, recordSession, signOff, convertToTraining, addFeedback, broadcastTraining, updateHandbook, agreeWithGrade, adjustGrade, assignModule, swapShift };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}

