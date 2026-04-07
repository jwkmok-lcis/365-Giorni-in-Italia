// math.js – Small shared math helpers used across systems and scenes.

/** Clamp a value between min and max. */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b at t in [0, 1]. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Euclidean distance between two points. */
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Wrap an integer index within [0, length). */
export function wrap(index, length) {
  return ((index % length) + length) % length;
}
