type MiniMapProps = {
  w?: number;
  h?: number;
  pin?: { x: number; y: number };
  tone?: string;
};

export function MiniMap({
  w = 320,
  h = 160,
  pin = { x: 0.55, y: 0.5 },
  tone = "var(--terra)",
}: MiniMapProps) {
  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, #efe6d2 0%, #e6dac0 100%)",
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <path
          d={`M0 ${h * 0.65} Q ${w * 0.2} ${h * 0.55} ${w * 0.45} ${h * 0.7} T ${w} ${h * 0.55} L${w} ${h} L0 ${h} Z`}
          fill="rgba(74,99,120,.13)"
        />
        <path
          d={`M0 ${h * 0.65} Q ${w * 0.2} ${h * 0.55} ${w * 0.45} ${h * 0.7} T ${w} ${h * 0.55}`}
          stroke="rgba(74,99,120,.35)"
          strokeWidth="0.8"
          fill="none"
        />
        <g stroke="rgba(60,40,20,.18)" strokeWidth="0.8" fill="none">
          <path d={`M0 ${h * 0.3} L${w} ${h * 0.35}`} />
          <path d={`M${w * 0.2} 0 L${w * 0.3} ${h}`} />
          <path d={`M${w * 0.7} 0 L${w * 0.6} ${h * 0.7}`} />
          <path
            d={`M0 ${h * 0.85} L${w * 0.6} ${h * 0.7} L${w} ${h * 0.45}`}
            strokeWidth="1.2"
          />
        </g>
        <g fill="rgba(130,120,107,.10)">
          <rect x={w * 0.08} y={h * 0.10} width={w * 0.10} height={h * 0.16} />
          <rect x={w * 0.25} y={h * 0.08} width={w * 0.08} height={h * 0.18} />
          <rect x={w * 0.40} y={h * 0.12} width={w * 0.14} height={h * 0.14} />
          <rect x={w * 0.62} y={h * 0.06} width={w * 0.10} height={h * 0.20} />
          <rect x={w * 0.10} y={h * 0.40} width={w * 0.12} height={h * 0.12} />
          <rect x={w * 0.30} y={h * 0.42} width={w * 0.10} height={h * 0.14} />
          <rect x={w * 0.50} y={h * 0.40} width={w * 0.16} height={h * 0.12} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${pin.x * 100}%`,
          top: `${pin.y * 100}%`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <svg width="26" height="34" viewBox="0 0 26 34">
          <path
            d="M13 33s11-12 11-20a11 11 0 10-22 0c0 8 11 20 11 20z"
            fill={tone}
            stroke="rgba(60,40,20,.4)"
            strokeWidth="0.8"
          />
          <circle cx="13" cy="13" r="4" fill="var(--paper-light)" />
        </svg>
      </div>
    </div>
  );
}
