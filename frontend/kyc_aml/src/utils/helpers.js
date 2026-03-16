// src/utils/helpers.js

/**
 * Returns a padded transaction ID string, e.g. "TXN007"
 */
export function buildTxnId(index) {
  return `TXN${String(index).padStart(3, "0")}`;
}

/**
 * Derives AML status and score from a random number (0–1).
 * Keeps the scoring logic in one place so it's easy to adjust thresholds.
 */
export function scoreTxn(rawScore) {
  return {
    score:  Math.round(rawScore * 100) / 100,
    status: rawScore > 0.6 ? "flagged" : "safe",
  };
}

/**
 * Formats a JS Date to "HH:MM AM/PM" string.
 */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats a number as Indian locale currency string (no symbol).
 * e.g. 485000 → "4,85,000"
 */
export function formatINR(amount) {
  return Number(amount).toLocaleString("en-IN");
}

/**
 * Returns Tailwind colour classes for a face-match percentage.
 */
export function faceMatchColor(pct) {
  if (pct >= 80) return "#10b981"; // emerald
  if (pct >= 60) return "#f59e0b"; // amber
  return "#f43f5e";                // rose
}
