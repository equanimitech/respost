import { Location, Granularity, GRANULARITY_LEVELS } from "../types";

/**
 * Create a Location value object.
 * Enforces: name is required, granularity is valid,
 * coordinates required for establishment/neighborhood/city.
 */
export function createLocation(input: {
  name: string;
  latitude?: number;
  longitude?: number;
  granularity: string;
}): Location {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Location name is required");
  }

  if (input.name.length > 200) {
    throw new Error("Location name must be 200 characters or less");
  }

  if (!GRANULARITY_LEVELS.includes(input.granularity as Granularity)) {
    throw new Error(
      `Invalid granularity: ${input.granularity}. Must be one of: ${GRANULARITY_LEVELS.join(", ")}`
    );
  }

  const granularity = input.granularity as Granularity;

  // Coordinates required for fine-grained locations
  const needsCoordinates = ["establishment", "neighborhood", "city"].includes(
    granularity
  );
  if (
    needsCoordinates &&
    (input.latitude === undefined || input.longitude === undefined)
  ) {
    throw new Error(
      `Coordinates required for granularity: ${granularity}`
    );
  }

  return {
    name: input.name.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    granularity,
  };
}

/**
 * Check if a coordinate is within a label's radius.
 * Used for auto-suggesting labels when creating a postcard.
 */
export function isWithinRadius(
  point: { latitude: number; longitude: number },
  center: { latitude: number; longitude: number },
  radiusMeters: number
): boolean {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(center.latitude - point.latitude);
  const dLon = toRad(center.longitude - point.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point.latitude)) *
      Math.cos(toRad(center.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusMeters;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
