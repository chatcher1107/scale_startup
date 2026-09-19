"use client";

import { LOCATIONS } from "@/lib/data";

// Stylized (not to scale) map of the 8 Cameron Coffee Co. locations across the Triangle.
export function TriangleMap({
  selectedId,
  onSelect,
  height = 300,
  tone = "light",
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const W = 600, H = 340;
  const px = (v: number) => (v / 100) * W;
  const py = (v: number) => (v / 100) * H;
  const bg = dark ? "rgba(255,255,255,0.06)" : "#f1ecf4";
  const road = dark ? "rgba(255,255,255,0.18)" : "#d9cfe0";
  const cityFill = dark ? "rgba(255,255,255,0.35)" : "#b9a9c4";
  const txt = dark ? "#ffffff" : "#1e1521";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ height }} className="w-full" role="img" aria-label="Map of the 8 Cameron Coffee Co. locations">
      <rect width={W} height={H} rx={18} fill={bg} />
      {/* stylized highways */}
      <path d={`M${px(6)} ${py(78)} C ${px(30)} ${py(60)}, ${px(45)} ${py(45)}, ${px(94)} ${py(30)}`} fill="none" stroke={road} strokeWidth={5} strokeLinecap="round" />
      <path d={`M${px(52)} ${py(6)} C ${px(56)} ${py(30)}, ${px(58)} ${py(50)}, ${px(84)} ${py(94)}`} fill="none" stroke={road} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 9" />
      {/* city labels */}
      <text x={px(4)} y={py(93)} fontSize="15" fontWeight={700} letterSpacing="3" fill={cityFill}>CHAPEL HILL</text>
      <text x={px(24)} y={py(12)} fontSize="15" fontWeight={700} letterSpacing="3" fill={cityFill}>DURHAM</text>
      <text x={px(72)} y={py(52)} fontSize="15" fontWeight={700} letterSpacing="3" fill={cityFill}>RALEIGH</text>
      {LOCATIONS.map((l) => {
        const x = px(l.map.x), y = py(l.map.y);
        const sel = selectedId === l.id;
        const short = l.name.replace(" (Brightleaf)", "");
        const anchor = l.map.label === "l" ? "end" : l.map.label === "r" ? "start" : "middle";
        const lx = l.map.label === "l" ? x - 13 : l.map.label === "r" ? x + 13 : x;
        const ly = l.map.label === "t" ? y - 14 : l.map.label === "b" ? y + 24 : y + 4;
        return (
          <g key={l.id} onClick={onSelect ? () => onSelect(l.id) : undefined} style={{ cursor: onSelect ? "pointer" : "default" }}>
            <circle cx={x} cy={y} r={sel ? 15 : 11} fill={sel ? "#681a43" : dark ? "#ffffff" : "#012169"} opacity={0.18} />
            <circle cx={x} cy={y} r={sel ? 8 : 6.5} fill={sel ? "#681a43" : dark ? "#ffffff" : "#012169"} stroke={dark ? "#012169" : "#fff"} strokeWidth={2} />
            <text x={lx} y={ly} textAnchor={anchor} fontSize="12" fontWeight={sel ? 700 : 600} fill={txt}>{short}</text>
          </g>
        );
      })}
    </svg>
  );
}
