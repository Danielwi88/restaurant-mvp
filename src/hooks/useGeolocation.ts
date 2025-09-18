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
    } catch { void 0; }
    return { position: null, loading: true };
  });

  useEffect(() => {
    let aborted = false;
    const finish = (next: Partial<GeoState>) => {
      if (!aborted) setState((s) => ({ ...s, ...next }));
    };

    // Only attempt in secure contexts (https or localhost)
    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost');
    if (!isSecure) {
      finish({ loading: false, error: 'Location requires HTTPS (or localhost)' });
      return () => { aborted = true; };
    }

    if (!navigator.geolocation) {
      finish({ loading: false, error: 'Geolocation not supported' });
      return () => { aborted = true; };
    }

    const getOnce = (retry = false) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = { lat: pos.coords.latitude, long: pos.coords.longitude } as LatLong;
          finish({ position, loading: false, error: undefined });
          try { localStorage.setItem('user_geo', JSON.stringify(position)); } catch { void 0; }
        },
        (err) => {
          // Retry once for transient errors 
          const transient = (err.code === err.POSITION_UNAVAILABLE || err.code === err.TIMEOUT);
          if (!retry && transient) {
            setTimeout(() => { if (!aborted) getOnce(true); }, 1000);
          } else {
            finish({ loading: false, error: err.message || 'Failed to get location' });
          }
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
      );
    };

    
    try {
      type PermissionState = 'granted' | 'denied' | 'prompt';
      type PermissionsLike = { query?: (x: { name: 'geolocation' } | PermissionDescriptor) => Promise<{ state: PermissionState }> };
      const navWithMaybePerms = navigator as Navigator & { permissions?: unknown };
      const permsUnknown: unknown = navWithMaybePerms.permissions;
      const navPerms = (permsUnknown && typeof permsUnknown === 'object')
        ? (permsUnknown as PermissionsLike)
        : undefined;
      if (navPerms?.query) {
        navPerms.query({ name: 'geolocation' }).then((p) => {
          if (p.state === 'denied') finish({ loading: false, error: 'Location permission denied' });
          else getOnce();
        }).catch(() => getOnce());
      } else getOnce();
    } catch { getOnce(); }

    return () => { aborted = true; };
  }, []);

  return state;
}
