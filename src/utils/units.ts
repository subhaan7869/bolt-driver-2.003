export function kmToMi(km: number): number {
  return km * 0.621371;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function formatMiles(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatWholeMiles(miles: number): string {
  return `${Math.round(miles)} mi`;
}

export function formatTurnDistanceImmetric(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    return `${Math.round(meters * 3.28084)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatTurnDistanceImperial(meters: number): string {
  return formatTurnDistanceImmetric(meters);
}
