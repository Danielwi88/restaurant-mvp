import { useEffect, useState } from "react";
import type { LatLong } from "@/lib/geo";

type GeoState = {
  position: LatLong | null;
  loading: boolean;
  error?: string;
};

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>(() => {
    try {
      const cached = localStorage.getItem("user_geo");
      if (cached) {
        const p = JSON.parse(cached) as { lat?: number; long?: number } | null;
        if (p && typeof p.lat === 'number' && typeof p.long === 'number') {
          return { position: { lat: p.lat, long: p.long }, loading: false };
        }
      }
    } catch {}
    return { position: null, loading: true };
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: 'Geolocation not supported' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = { lat: pos.coords.latitude, long: pos.coords.longitude } as LatLong;
        setState({ position, loading: false });
        try { localStorage.setItem('user_geo', JSON.stringify(position)); } catch {}
      },
      (err) => {
        setState((s) => ({ ...s, loading: false, error: err.message || 'Failed to get location' }));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  return state;
}

