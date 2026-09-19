"use client";

import { use, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { today, type CriterionResult, type Session } from "@/lib/data";
import { CATEGORIES } from "@/lib/scenarios";
import { handbookText } from "@/lib/handbook";
import { calibrationExamples } from "@/lib/stats";
import { Badge } from "@/components/ui";
import { SessionResult } from "@/components/SessionResult";

type Msg = { role: "guest" | "employee"; text: string };
const MAX_TURNS = 8;

/* eslint-disable @typescript-eslint/no-explicit-any */
function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return R ? new R() : null;
}

export default function TrainPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const { data, me, recordSession } = useStore();
  const mod = data.modules.find((m) => m.id === moduleId);

  const [phase, setPhase] = useState<"intro" | "call" | "grading" | "done">("intro");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voice, setVoice] = useState(true);
  const [listening, setListening] = useState(false);
  const [hints, setHints] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const canListen = useSyncExternalStore(() => () => {}, () => !!getRecognition(), () => false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); recRef.current?.stop?.(); }, []);

  if (!mod || !me) return <p className="text-sm text-muted">Training not found.</p>;
  const cat = CATEGORIES.find((c) => c.id === mod.categoryId)!;
  const sc = mod.scenario;
  const employeeTurns = messages.filter((m) => m.role === "employee").length;

  const speak = (text: string) => {
    if (!voice || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const start = () => {
    setMessages([{ role: "guest", text: sc.openingLine }]);
    setPhase("call");
    speak(sc.openingLine);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    recRef.current?.stop?.();
    setInput("");
    const next: Msg[] = [...messages, { role: "employee", text }];
    setMessages(next);
    if (next.filter((m) => m.role === "employee").length >= MAX_TURNS) return finish(next);
    setThinking(true);
    try {
      const res = await fetch("/api/ai/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: sc, categoryId: mod.categoryId, transcript: next, handbook: handbookText(data.handbook) }),
      });
      const { reply } = await res.json();
      setMessages([...next, { role: "guest", text: reply }]);
      speak(reply);
    } catch {
      setError("The guest lost connection. You can still end the session for feedback.");
    }
    setThinking(false);
  };

  const finish = async (transcript: Msg[] = messages) => {
    window.speechSynthesis?.cancel();
    recRef.current?.stop?.();
    setPhase("grading");
    let results: CriterionResult[] = [];
    let summary = "";
    let mock = true;
    try {
      const res = await fetch("/api/ai/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: sc, transcript, handbook: handbookText(data.handbook), calibration: calibrationExamples(data) }),
      });
      const out = await res.json();
      results = out.results;
      summary = out.summary;
      mock = out.mock;
    } catch {
      setError("Grading failed. Please try again.");
      setPhase("call");
      return;
    }
    const score = Math.round((results.filter((r) => r.passed).length / results.length) * 100);
    const s: Session = {
      id: `s-${Date.now()}`,
      employeeId: me.id,
      moduleId: mod.id,
      date: today(),
      score,
      results,
      transcript,
      summary,
      mock,
    };
    recordSession(s, mod.categoryId);
    setSession(s);
    setPhase("done");
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input ? input + " " : "";
    rec.onresult = (e: any) => setInput(base + Array.from(e.results).map((r: any) => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    window.speechSynthesis?.cancel();
    rec.start();
    setListening(true);
  };

  // ---------- INTRO ----------
  if (phase === "intro")
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/trainee" className="mb-4 inline-block text-sm font-semibold text-plum-700 hover:underline">← Back to my progress</Link>
        <div className="card rise p-8">
          <div className="flex flex-wrap items-center gap-2">
            {mod.type === "tailored" ? <Badge tone="warn">Tailored for you</Badge> : <Badge tone="gray">Standard</Badge>}
            <Badge tone="plum">{cat.name}</Badge>
            <span className="text-xs text-muted">{mod.minutes} min · {mod.difficulty}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-plum-800">{mod.title}</h1>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-canvas p-4">
              <div className="eyebrow">The guest</div>
              <p className="mt-1 text-sm">{sc.persona}</p>
            </div>
            <div className="rounded-xl bg-canvas p-4">
              <div className="eyebrow">The situation</div>
              <p className="mt-1 text-sm">{sc.situation}</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted">
            You&apos;ll be scored on <strong className="text-ink">{sc.criteria.length} observable behaviors</strong> the company defined. Speak (or type) exactly as you would at the counter. You can ask for hints, but there&apos;s no going back once you start.
          </p>
          <button onClick={start} className="btn btn-primary mt-6 px-6 py-3 text-base">Start conversation</button>
        </div>
      </div>
    );

  // ---------- GRADING ----------
  if (phase === "grading")
    return (
      <div className="mx-auto mt-20 max-w-md text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-plum-100 border-t-plum-700" />
        <p className="mt-6 font-display text-2xl text-plum-800">Reviewing your conversation…</p>
        <p className="mt-1 text-sm text-muted">Checking each required behavior against what you actually said.</p>
      </div>
    );

  // ---------- RESULTS ----------
  if (phase === "done" && session)
    return (
      <div>
        <SessionResult session={session} module={mod} />
        <div className="mt-6 flex gap-3">
          <Link href="/trainee" className="btn btn-primary">Back to my progress</Link>
          <button className="btn btn-ghost" onClick={() => { setMessages([]); setSession(null); setHints(0); setPhase("intro"); }}>Try again</button>
        </div>
      </div>
    );

  // ---------- CALL ----------
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="eyebrow">{cat.name}</div>
          <h1 className="font-display text-2xl font-semibold text-plum-800">{mod.title}</h1>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={voice} onChange={(e) => { setVoice(e.target.checked); if (!e.target.checked) window.speechSynthesis?.cancel(); }} />
          Guest voice
        </label>
      </div>

      <div className="card flex h-[56vh] flex-col overflow-hidden">
        <div className="border-b border-line bg-canvas px-5 py-2.5 text-xs text-muted">
          <strong className="text-ink">Guest:</strong> {sc.persona}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "employee" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "employee" ? "bg-plum-700 text-white" : "border border-line bg-canvas"}`}>{m.text}</div>
            </div>
          ))}
          {thinking && <div className="text-xs text-muted">Guest is responding…</div>}
          <div ref={endRef} />
        </div>
        <div className="border-t border-line p-4">
          {error && <div className="mb-2 text-xs text-bad">{error}</div>}
          <div className="flex items-end gap-2">
            {canListen && (
              <button onClick={toggleMic} className={`btn ${listening ? "btn-primary" : "btn-ghost"} h-11 w-11 !p-0`} aria-label="Speak" title="Speak your reply">
                {listening ? "●" : "🎤"}
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={2}
              placeholder={listening ? "Listening…" : "Type or speak your reply. Press Enter to send."}
              className="min-h-11 flex-1 resize-none rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-plum-400"
            />
            <button onClick={send} disabled={!input.trim() || thinking} className="btn btn-primary h-11">Send</button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>Turn {employeeTurns} of {MAX_TURNS}{!canListen && " · voice input needs Chrome or Edge"}</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setHints((h) => Math.min(h + 1, sc.criteria.length))} disabled={hints >= sc.criteria.length}>Hint</button>
              <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" disabled={employeeTurns < 2 || thinking} onClick={() => finish()}>End &amp; get feedback</button>
            </div>
          </div>
        </div>
      </div>
      {hints > 0 && (
        <div className="mt-3 rounded-xl border border-warn/30 bg-warn-bg p-3 text-sm text-warn">
          <strong>Think about:</strong> {sc.criteria.slice(0, hints).map((c) => c.text).join(" · ")}
        </div>
      )}
    </div>
  );
}
