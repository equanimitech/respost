/**
 * Best-effort haptic tap. No-op when unsupported (desktop, iOS Safari).
 */
export function tapHaptic(intensity: "light" | "medium" = "light") {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  navigator.vibrate(intensity === "light" ? 8 : 14);
}
