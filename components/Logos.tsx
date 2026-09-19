/* Seasoned uses the supplied logo; Cameron Coffee Co. is an original mark (no Duke trademarks). */

export function SeasonedLogo({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/seasoned-logo.png"
      alt="Seasoned"
      width={size}
      height={size}
      style={{ width: size, height: size, mixBlendMode: "multiply", objectFit: "contain" }}
    />
  );
}

export function SeasonedWordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <SeasonedLogo size={size} />
      <span className="font-brand text-xl font-semibold tracking-tight text-plum-700">Seasoned</span>
    </span>
  );
}

export function CameronMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Cameron Coffee Co.">
      <circle cx="50" cy="50" r="48" fill="#012169" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      {/* stadium arch */}
      <path d="M22 44 Q50 12 78 44" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 44 Q50 22 70 44" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      {/* cup */}
      <path d="M32 50h34l-3.5 22a7 7 0 0 1-7 6H42.5a7 7 0 0 1-7-6z" fill="#fff" />
      <path d="M66 55h3a6 6 0 0 1 0 12h-4" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M41 46c-2-3 2-4 0-7M49 46c-2-3 2-4 0-7M57 46c-2-3 2-4 0-7" fill="none" stroke="#7fa1ff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CameronLockup({ size = 44, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <CameronMark size={size} />
      <span className="leading-tight">
        <span className={`block font-display font-semibold ${dark ? "text-white" : "text-cameron-navy"}`} style={{ fontSize: size * 0.4 }}>
          Cameron Coffee Co.
        </span>
        <span className={`block text-[11px] tracking-wide ${dark ? "text-white/70" : "text-muted"}`}>Triangle, NC · Est. 2016</span>
      </span>
    </span>
  );
}
