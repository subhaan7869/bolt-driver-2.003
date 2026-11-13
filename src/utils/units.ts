export const KM_TO_MI = 0.621371;
export const M_TO_YD = 1.09361;

export function kmToMi(km: number): number {
  return km * KM_TO_MI;
}

export function kmhToMph(kmh: number): number {
  return Math.round(kmh * KM_TO_MI);
}

export function formatMiles(km: number, decimals = 1): string {
  return `${(km * KM_TO_MI).toFixed(decimals)} mi`;
}

export function formatWholeMiles(km: number): string {
  return `${Math.round(km * KM_TO_MI).toLocaleString()} mi`;
}

export function formatTurnDistanceImperial(meters: number): string {
  if (meters >= 322) {
    return `${((meters / 1000) * KM_TO_MI).toFixed(1)} mi`;
  }
  const yards = Math.max(10, Math.round((meters * M_TO_YD) / 10) * 10);
  return `${yards} yd`;
}
