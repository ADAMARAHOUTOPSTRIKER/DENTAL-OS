"use client";

// Hand-drawn SVG stand-ins for dental imagery (no external assets required).

export function XrayArt({ className = "" }: { className?: string }) {
  const teeth = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="Radiographie panoramique">
      <rect width="320" height="180" rx="10" fill="#0b1720" />
      <rect width="320" height="180" rx="10" fill="url(#xg)" />
      <defs>
        <radialGradient id="xg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1c3a44" />
          <stop offset="100%" stopColor="#0b1720" />
        </radialGradient>
        <linearGradient id="tooth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f6f2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8fb7b0" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* jaw curves */}
      <path d="M40 70 Q160 20 280 70" fill="none" stroke="#4d7c78" strokeWidth="1" opacity="0.5" />
      <path d="M40 120 Q160 170 280 120" fill="none" stroke="#4d7c78" strokeWidth="1" opacity="0.5" />
      {/* upper teeth */}
      {teeth.map((_, i) => {
        const x = 60 + i * 25;
        const y = 62 - Math.sin((i / 7) * Math.PI) * 22;
        return <rect key={`u${i}`} x={x} y={y} width="16" height="26" rx="6" fill="url(#tooth)" />;
      })}
      {/* lower teeth */}
      {teeth.map((_, i) => {
        const x = 60 + i * 25;
        const y = 96 + Math.sin((i / 7) * Math.PI) * 22;
        return <rect key={`l${i}`} x={x} y={y} width="16" height="24" rx="6" fill="url(#tooth)" />;
      })}
      <circle cx="250" cy="60" r="9" fill="none" stroke="#ffcf99" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

export function SmileArt({ bright = false, className = "" }: { bright?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 220 140" className={className} role="img" aria-label="Sourire">
      <defs>
        <linearGradient id={bright ? "lipB" : "lipA"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e79a9a" />
          <stop offset="100%" stopColor="#c96f6f" />
        </linearGradient>
      </defs>
      <rect width="220" height="140" rx="12" fill={bright ? "#fff6f2" : "#f6efe9"} />
      {/* mouth */}
      <path d="M40 70 Q110 20 180 70 Q110 120 40 70 Z" fill={`url(#${bright ? "lipB" : "lipA"})`} />
      {/* teeth row */}
      <clipPath id={bright ? "mB" : "mA"}>
        <path d="M48 70 Q110 30 172 70 Q110 104 48 70 Z" />
      </clipPath>
      <g clipPath={`url(#${bright ? "mB" : "mA"})`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={50 + i * 14}
            y={44}
            width="12"
            height="30"
            rx="3"
            fill={bright ? "#ffffff" : "#e8ddc9"}
            stroke={bright ? "#eaf6f3" : "#d8c9ad"}
            strokeWidth="0.6"
          />
        ))}
      </g>
    </svg>
  );
}
