// src/components/shared/CircleProgress.jsx

import { faceMatchColor } from "../../utils/helpers";

export default function CircleProgress({ value, size = 48 }) {
  const r      = 18;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color  = faceMatchColor(value);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span
        className="absolute text-[10px] font-bold font-mono"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
}
