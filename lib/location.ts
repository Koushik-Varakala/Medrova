import type { LocationResult } from "@/types";

// Re-export for convenience
export type { LocationResult };

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
  };
}

/**
 * Search locations using the OpenStreetMap Nominatim API (free, no API key required).
 * Biased toward Hyderabad, Telangana, India.
 */
export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.length < 3) return [];

  const params = new URLSearchParams({
    q: `${query}, Hyderabad, Telangana, India`,
    format: "json",
    limit: "5",
    countrycodes: "in",
    addressdetails: "1"
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { "Accept-Language": "en" } }
    );

    if (!response.ok) return [];

    const data = (await response.json()) as NominatimResult[];

    return data.map((item) => ({
      displayName: item.display_name
        .split(",")
        .slice(0, 3)
        .join(",")
        .trim(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      area: item.address?.suburb ?? item.address?.neighbourhood,
      city: item.address?.city ?? item.address?.town ?? "Hyderabad"
    }));
  } catch {
    return [];
  }
}

/**
 * Reverse-geocode a lat/lng pair to a human-readable LocationResult.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResult;

    return {
      displayName: data.display_name
        .split(",")
        .slice(0, 3)
        .join(",")
        .trim(),
      lat,
      lng,
      area: data.address?.suburb ?? data.address?.neighbourhood,
      city: data.address?.city ?? data.address?.town ?? "Hyderabad"
    };
  } catch {
    return null;
  }
}

/**
 * Calculate the distance between two coordinates in km using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface ScoredShift {
  id: string;
  pay: number;
  isUrgent: boolean;
  createdAt: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  score?: number;
}

/**
 * Score and sort shifts by a composite relevance score:
 *   40% proximity, 30% pay, 20% urgency, 10% recency.
 */
export function scoreShifts<T extends ScoredShift>(
  shifts: T[],
  userLat?: number,
  userLng?: number
): Array<T & { score: number }> {
  const now = Date.now();

  return shifts
    .map((shift) => {
      // Distance score: 1 if co-located, decays to 0 at 50 km away
      let distanceScore = 0.5;
      const shiftLat = shift.lat ?? shift.latitude;
      const shiftLng = shift.lng ?? shift.longitude;
      if (userLat !== undefined && userLng !== undefined && shiftLat !== undefined && shiftLng !== undefined) {
        const distance = calculateDistance(userLat, userLng, shiftLat, shiftLng);
        distanceScore = Math.max(0, 1 - distance / 50);
      }

      const maxPay = 20000;
      const payScore = Math.min(shift.pay / maxPay, 1);
      const urgencyScore = shift.isUrgent ? 1 : 0;
      const ageHours =
        (now - new Date(shift.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - ageHours / 72);

      const totalScore =
        distanceScore * 0.4 +
        payScore * 0.3 +
        urgencyScore * 0.2 +
        recencyScore * 0.1;

      return { ...shift, score: totalScore };
    })
    .sort((a, b) => b.score - a.score);
}
