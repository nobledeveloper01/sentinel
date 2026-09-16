/**
 * The reach engine works in metres on a flat plane; the phone has degrees.
 * An equirectangular projection around Lagos is accurate to well under a
 * metre per kilometre at these latitudes, which is far inside the 500 m
 * the rules are written in. The origin is a constant so every phone and
 * the server agree on the plane.
 */
export const ORIGIN = { lat: 6.5, lon: 3.4 };
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LON = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

export function toXY(p: { lat: number; lon: number }): { x: number; y: number } {
  return { x: (p.lon - ORIGIN.lon) * M_PER_DEG_LON, y: (p.lat - ORIGIN.lat) * M_PER_DEG_LAT };
}

export function metresBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const p = toXY(a);
  const q = toXY(b);
  return Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
}
