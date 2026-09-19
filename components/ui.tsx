import type { ReactNode } from "react";
import { CATEGORIES, CERT_BAR, type CategoryId } from "@/lib/scenarios";
import { scoreTone, STATUS_LABEL, type Status } from "@/lib/stats";

export function PageHeader({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-plum-800">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({ label, value, sub, tone, delta }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "good" | "warn" | "bad"; delta?: string }) {
  const color = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-plum-800";
  return (
    <div className="card rise p-5">
      <div className="eyebrow">{label}</div>
      <div className={`mt-2 font-display text-4xl font-semibold leading-none ${color}`}>{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        {delta && <span className="whitespace-nowrap rounded-full bg-good-bg px-2 py-0.5 font-semibold text-good">{delta}</span>}
        {sub}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "plum" }: { children: ReactNode; tone?: "plum" | "good" | "warn" | "bad" | "navy" | "gray" }) {
  const map = {
    plum: "bg-plum-100 text-plum-700",
    good: "bg-good-bg text-good",
    warn: "bg-warn-bg text-warn",
    bad: "bg-bad-bg text-bad",
    navy: "bg-cameron-tint text-cameron-navy",
    gray: "bg-canvas text-muted border border-line",
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: Status }) {
  const tone = status === "certified" ? "good" : status === "awaiting" ? "warn" : status === "new" ? "gray" : "plum";
  return <Badge tone={tone}>{status === "certified" ? "✓ " : ""}{STATUS_LABEL[status]}</Badge>;
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-plum-100 font-semibold text-plum-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

const toneBar = { good: "bg-good", warn: "bg-[#d9a13a]", bad: "bg-bad" };

// Category bar with a marker for the 90% certification bar
export function ScoreBar({ score, height = 8 }: { score: number; height?: number }) {
  const tone = scoreTone(score);
  return (
    <div className="relative w-full rounded-full bg-plum-100" style={{ height }}>
      <div className={`h-full rounded-full ${toneBar[tone]}`} style={{ width: `${score}%` }} />
      <div className="absolute top-[-2px] bottom-[-2px] w-[2px] rounded bg-plum-700/60" style={{ left: `${CERT_BAR}%` }} title="Certification bar (90%)" />
    </div>
  );
}

export function CategoryBars({ scores, compact = false }: { scores: Record<CategoryId, number>; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3.5"}>
      {CATEGORIES.map((c) => (
        <div key={c.id}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{c.name}</span>
            <span className={`font-semibold tabular-nums ${scores[c.id] >= CERT_BAR ? "text-good" : "text-ink"}`}>{scores[c.id]}%</span>
          </div>
          <ScoreBar score={scores[c.id]} />
        </div>
      ))}
    </div>
  );
}

// Tiny inline bars (one per category) for roster rows
export function MiniBars({ scores }: { scores: Record<CategoryId, number> }) {
  return (
    <div className="flex items-end gap-[3px]" title={CATEGORIES.map((c) => `${c.short} ${scores[c.id]}%`).join(" · ")}>
      {CATEGORIES.map((c) => {
        const s = scores[c.id];
        const color = s >= CERT_BAR ? "bg-good" : s >= 70 ? "bg-[#d9a13a]" : "bg-bad";
        return <span key={c.id} className={`w-[7px] rounded-sm ${color}`} style={{ height: Math.max(4, s * 0.22) }} />;
      })}
    </div>
  );
}

export function Sparkline({ values, width = 120, height = 34, stroke = "#681a43" }: { values: number[]; width?: number; height?: number; stroke?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 4 - ((v - min) / span) * (height - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill={stroke} />
    </svg>
  );
}

export function TrendChart({ values, height = 160, labelEvery = 3 }: { values: number[]; height?: number; labelEvery?: number }) {
  const w = 520, padL = 30, padB = 22, padT = 8;
  const min = 0, max = 100;
  const x = (i: number) => padL + (i / (values.length - 1)) * (w - padL - 8);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (height - padT - padB);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Readiness trend over 12 weeks">
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={padL} x2={w - 8} y1={y(g)} y2={y(g)} stroke="#e9e3ec" />
          <text x={padL - 6} y={y(g) + 4} textAnchor="end" fontSize="10" fill="#6f6475">{g}%</text>
        </g>
      ))}
      <path d={area} fill="#681a43" opacity={0.08} />
      <path d={line} fill="none" stroke="#681a43" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4 : 2.5} fill="#681a43" />
          {(i % labelEvery === 0 || i === values.length - 1) && (
            <text x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="#6f6475">
              {i === values.length - 1 ? "Now" : `W-${values.length - 1 - i}`}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// Radar chart with the 90% certification ring
export function Radar({ scores, size = 300 }: { scores: Record<CategoryId, number>; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 46;
  const n = CATEGORIES.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * (v / 100), cy + Math.sin(a) * r * (v / 100)] as const;
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[340px]" role="img" aria-label="Category radar">
      {[25, 50, 75, 100].map((g) => (
        <polygon key={g} points={poly(CATEGORIES.map(() => g))} fill="none" stroke="#e9e3ec" />
      ))}
      <polygon points={poly(CATEGORIES.map(() => CERT_BAR))} fill="none" stroke="#681a43" strokeDasharray="4 4" strokeOpacity={0.55} />
      {CATEGORIES.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e9e3ec" />;
      })}
      <polygon points={poly(CATEGORIES.map((c) => scores[c.id]))} fill="#681a43" fillOpacity={0.18} stroke="#681a43" strokeWidth={2.5} strokeLinejoin="round" />
      {CATEGORIES.map((c, i) => {
        const [x, y] = pt(i, scores[c.id]);
        const [lx, ly] = pt(i, 122);
        return (
          <g key={c.id}>
            <circle cx={x} cy={y} r={4} fill={scores[c.id] >= CERT_BAR ? "#1c7c54" : "#681a43"} />
            <text x={lx} y={ly} textAnchor="middle" fontSize="11" fontWeight={600} fill="#1e1521">{c.short}</text>
            <text x={lx} y={ly + 13} textAnchor="middle" fontSize="11" fill="#6f6475">{scores[c.id]}%</text>
          </g>
        );
      })}
    </svg>
  );
}

export function heatColor(score: number) {
  if (score >= CERT_BAR) return { bg: "#7cc6a0", fg: "#0d3b27" };
  if (score >= 78) return { bg: "#cdE9d9", fg: "#164a32" };
  if (score >= 66) return { bg: "#f8e0a8", fg: "#5c3d00" };
  if (score >= 54) return { bg: "#f5c39a", fg: "#5a2b06" };
  return { bg: "#eea59f", fg: "#5a0f0a" };
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="text-[#d9a13a]" aria-label={`${n} of 5 stars`}>
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>;
}
