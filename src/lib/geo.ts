export type LatLong = { lat: number; long: number };

// Haversine distance in kilometers
export function distanceKm(a: LatLong, b: LatLong): number {
  const R = 6371; // km
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.long - a.long);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export function formatKm(km?: number): string | undefined {
  if (km == null || Number.isNaN(km)) return undefined;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  const rounded = Math.round(km * 10) / 10;
  return `${rounded} km`;
}

function deg2rad(d: number) { return d * (Math.PI / 180); }

// Read a cached user location from localStorage (if set by the app)
export function getCachedGeo(): LatLong | null {
  try {
    const raw = localStorage.getItem('user_geo');
    if (!raw) return null;
    const p = JSON.parse(raw) as { lat?: number; long?: number } | null;
    if (p && typeof p.lat === 'number' && typeof p.long === 'number') {
      return { lat: p.lat, long: p.long } as LatLong;
    }
  } catch {}
  return null;
}
