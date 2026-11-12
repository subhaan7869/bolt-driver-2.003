import {
  BidJobOffer,
  CampaignQuest,
  CityPreset,
  CompletedTrip,
  DistrictDemandZone,
  DriverDocument,
  LatLng,
  ManeuverStep,
  PaymentMethod,
  RideCategory,
  RideRequest,
  ScheduledRide,
  SurgeZone,
  TaxiRank,
  TripStop,
  Vehicle,
} from '../types/driver';

export const WORLD_CITIES: CityPreset[] = [
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    currency: '£',
    center: { lat: 51.5152, lng: -0.1419 },
    landmarks: [
      { name: 'Oxford Circus, W1B', area: 'West End', lat: 51.5152, lng: -0.1419 },
      { name: "King's Cross St Pancras", area: "King's Cross", lat: 51.5308, lng: -0.1238 },
      { name: '14 Berwick St, Soho', area: 'Soho', lat: 51.5138, lng: -0.1355 },
      { name: 'Liverpool Street Station', area: 'Bishopsgate', lat: 51.5178, lng: -0.0823 },
      { name: 'Waterloo Station, SE1', area: 'Waterloo', lat: 51.5031, lng: -0.1132 },
      { name: 'Paddington Station, W2', area: 'Paddington', lat: 51.5154, lng: -0.1755 },
      { name: 'Canary Wharf, E14', area: 'Docklands', lat: 51.5054, lng: -0.0235 },
      { name: 'Victoria Station, SW1V', area: 'Victoria', lat: 51.4952, lng: -0.1439 },
    ],
    intercityDestinations: [
      { name: 'Oxford City Centre (Carfax)', area: 'Oxford · Out of City', lat: 51.752, lng: -1.2577, distanceKm: 92 },
      { name: 'Cambridge Market Square', area: 'Cambridge · Out of City', lat: 52.2053, lng: 0.1218, distanceKm: 88 },
      { name: 'Brighton Pier & Seafront', area: 'Brighton · Out of City', lat: 50.8225, lng: -0.1372, distanceKm: 84 },
      { name: 'Reading Station Plaza', area: 'Reading · Out of City', lat: 51.4587, lng: -0.9718, distanceKm: 64 },
    ],
    ranks: [
      { id: 'rank-ldn-lhr', name: 'Heathrow Terminal 5 Hub', area: 'Airport Express', lat: 51.5162, lng: -0.1769, hubType: 'airport' },
      { id: 'rank-ldn-kx', name: "King's Cross Eurostar Rank", area: 'St Pancras', lat: 51.5315, lng: -0.1261, hubType: 'station' },
      { id: 'rank-ldn-wem', name: 'Wembley & O2 Event Rank', area: 'Docklands', lat: 51.5048, lng: -0.0195, hubType: 'stadium' },
    ],
  },
  {
    id: 'tallinn',
    name: 'Tallinn',
    country: 'Estonia',
    currency: '€',
    center: { lat: 59.437, lng: 24.7536 },
    landmarks: [
      { name: 'Viru Väljak 4, Kesklinn', area: 'City Centre', lat: 59.4368, lng: 24.7544 },
      { name: 'Telliskivi Creative City', area: 'Kalamaja', lat: 59.4394, lng: 24.7284 },
      { name: 'Tallinn Airport (TLL)', area: 'Ülemiste', lat: 59.4133, lng: 24.8328 },
      { name: 'Rotermann Quarter', area: 'Harju', lat: 59.439, lng: 24.7567 },
      { name: 'Kadriorg Palace Park', area: 'Kadriorg', lat: 59.4385, lng: 24.7909 },
      { name: 'Noblessner Marina', area: 'Põhja-Tallinn', lat: 59.4501, lng: 24.7267 },
    ],
    intercityDestinations: [
      { name: 'Tartu Town Hall Square', area: 'Tartu · Out of City', lat: 58.3806, lng: 26.7251, distanceKm: 185 },
      { name: 'Pärnu Beach Promenade', area: 'Pärnu · Out of City', lat: 58.3749, lng: 24.5042, distanceKm: 128 },
      { name: 'Rakvere Central Square', area: 'Rakvere · Out of City', lat: 59.3464, lng: 26.3558, distanceKm: 98 },
    ],
    ranks: [
      { id: 'rank-tll-air', name: 'Tallinn Airport (TLL) Rank', area: 'Ülemiste', lat: 59.4152, lng: 24.8315, hubType: 'airport' },
      { id: 'rank-tll-port', name: 'Port Terminal A Rank', area: 'Sadama', lat: 59.4442, lng: 24.7642, hubType: 'station' },
      { id: 'rank-tll-arena', name: 'Unibet Arena Event Rank', area: 'Haabersti', lat: 59.4263, lng: 24.6478, hubType: 'stadium' },
    ],
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    currency: '€',
    center: { lat: 52.52, lng: 13.405 },
    landmarks: [
      { name: 'Alexanderplatz, Mitte', area: 'Mitte', lat: 52.5219, lng: 13.4132 },
      { name: 'Berlin Hauptbahnhof', area: 'Moabit', lat: 52.5251, lng: 13.3694 },
      { name: 'Potsdamer Platz', area: 'Tiergarten', lat: 52.5096, lng: 13.3759 },
      { name: 'Kurfürstendamm 26', area: 'Charlottenburg', lat: 52.5036, lng: 13.3304 },
      { name: 'Warschauer Straße', area: 'Friedrichshain', lat: 52.5064, lng: 13.4494 },
      { name: 'Rosenthaler Platz', area: 'Mitte', lat: 52.5298, lng: 13.4014 },
    ],
    intercityDestinations: [
      { name: 'Potsdam Sanssouci Gate', area: 'Potsdam · Out of City', lat: 52.4009, lng: 13.0385, distanceKm: 38 },
      { name: 'BER Airport Terminal 1', area: 'Brandenburg · Out of City', lat: 52.3649, lng: 13.501, distanceKm: 28 },
      { name: 'Leipzig Hauptbahnhof', area: 'Leipzig · Out of City', lat: 51.3455, lng: 12.3818, distanceKm: 189 },
    ],
    ranks: [
      { id: 'rank-ber-hbf', name: 'Hauptbahnhof Taxi Rank', area: 'Moabit', lat: 52.5258, lng: 13.3688, hubType: 'station' },
      { id: 'rank-ber-alex', name: 'Uber Arena / East Hub', area: 'Friedrichshain', lat: 52.5062, lng: 13.4436, hubType: 'stadium' },
      { id: 'rank-ber-ku', name: 'Zoo / Airport Shuttle Rank', area: 'Charlottenburg', lat: 52.5065, lng: 13.3335, hubType: 'airport' },
    ],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    currency: '€',
    center: { lat: 48.8566, lng: 2.3522 },
    landmarks: [
      { name: 'Châtelet - Les Halles', area: '1er', lat: 48.8619, lng: 2.347 },
      { name: 'Gare du Nord', area: '10e', lat: 48.8809, lng: 2.3553 },
      { name: 'Champs-Élysées 68', area: '8e', lat: 48.8706, lng: 2.3065 },
      { name: 'Place de la Bastille', area: '11e', lat: 48.8531, lng: 2.3691 },
      { name: 'Saint-Germain-des-Prés', area: '6e', lat: 48.854, lng: 2.3328 },
      { name: 'Gare de Lyon', area: '12e', lat: 48.8443, lng: 2.3744 },
    ],
    intercityDestinations: [
      { name: 'Château de Versailles', area: 'Versailles · Out of City', lat: 48.8049, lng: 2.1204, distanceKm: 24 },
      { name: 'Disneyland Paris Resort', area: 'Marne-la-Vallée · Out of City', lat: 48.8722, lng: 2.7758, distanceKm: 42 },
      { name: 'CDG Terminal 2E', area: 'Roissy · Out of City', lat: 49.0047, lng: 2.5784, distanceKm: 31 },
    ],
    ranks: [
      { id: 'rank-par-gdn', name: 'Gare du Nord Eurostar Rank', area: '10e', lat: 48.8814, lng: 2.3559, hubType: 'station' },
      { id: 'rank-par-gdl', name: 'Accor Arena / Bercy Rank', area: '12e', lat: 48.8396, lng: 2.3785, hubType: 'stadium' },
      { id: 'rank-par-ch', name: 'CDG / Étoile Airport Rank', area: '8e', lat: 48.8712, lng: 2.3019, hubType: 'airport' },
    ],
  },
  {
    id: 'warsaw',
    name: 'Warsaw',
    country: 'Poland',
    currency: 'zł',
    center: { lat: 52.2297, lng: 21.0122 },
    landmarks: [
      { name: 'Rondo ONZ, Śródmieście', area: 'Centrum', lat: 52.233, lng: 20.9985 },
      { name: 'Warszawa Centralna', area: 'Śródmieście', lat: 52.2289, lng: 21.0033 },
      { name: 'Plac Zbawiciela', area: 'Mokotów', lat: 52.2196, lng: 21.018 },
      { name: 'Krakowskie Przedmieście', area: 'Old Town', lat: 52.2435, lng: 21.0155 },
      { name: 'Hala Koszyki', area: 'Centrum', lat: 52.222, lng: 21.0114 },
    ],
    intercityDestinations: [
      { name: 'Łódź Fabryczna Station', area: 'Łódź · Out of City', lat: 51.7689, lng: 19.4694, distanceKm: 135 },
      { name: 'Modlin Airport Terminal', area: 'Nowy Dwór · Out of City', lat: 52.4511, lng: 20.6518, distanceKm: 39 },
      { name: 'Radom Central Plaza', area: 'Radom · Out of City', lat: 51.4027, lng: 21.1471, distanceKm: 102 },
    ],
    ranks: [
      { id: 'rank-waw-ctr', name: 'Warszawa Centralna Rank', area: 'Śródmieście', lat: 52.2294, lng: 21.0042, hubType: 'station' },
      { id: 'rank-waw-std', name: 'PGE Narodowy Stadium Rank', area: 'Praga', lat: 52.2395, lng: 21.0458, hubType: 'stadium' },
      { id: 'rank-waw-old', name: 'Chopin Airport Express Hub', area: 'Włochy', lat: 52.2336, lng: 20.9992, hubType: 'airport' },
    ],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    currency: 'AED ',
    center: { lat: 25.2048, lng: 55.2708 },
    landmarks: [
      { name: 'DIFC Gate Village', area: 'DIFC', lat: 25.2116, lng: 55.2816 },
      { name: 'Dubai Mall Boulevard', area: 'Downtown', lat: 25.1972, lng: 55.2796 },
      { name: 'Business Bay Metro', area: 'Business Bay', lat: 25.1912, lng: 55.2611 },
      { name: 'City Walk Courtyard', area: 'Al Wasl', lat: 25.2073, lng: 55.2623 },
      { name: 'Jumeirah Beach Residence', area: 'Dubai Marina', lat: 25.0789, lng: 55.1342 },
    ],
    intercityDestinations: [
      { name: 'Abu Dhabi Corniche Tower', area: 'Abu Dhabi · Out of City', lat: 24.4888, lng: 54.3549, distanceKm: 138 },
      { name: 'Sharjah Waterfront Plaza', area: 'Sharjah · Out of City', lat: 25.3463, lng: 55.3895, distanceKm: 29 },
      { name: 'Al Ain Oasis Gate', area: 'Al Ain · Out of City', lat: 24.2194, lng: 55.7644, distanceKm: 145 },
    ],
    ranks: [
      { id: 'rank-dxb-mall', name: 'Dubai Mall VIP Rank', area: 'Downtown', lat: 25.1965, lng: 55.2788, hubType: 'stadium' },
      { id: 'rank-dxb-difc', name: 'DIFC Gate Rank', area: 'DIFC', lat: 25.2121, lng: 55.2809, hubType: 'station' },
      { id: 'rank-dxb-bb', name: 'DXB Terminal Priority Queue', area: 'Airport Corridor', lat: 25.1904, lng: 55.2608, hubType: 'airport' },
    ],
  },
  {
    id: 'new_york',
    name: 'New York',
    country: 'United States',
    currency: '$',
    center: { lat: 40.7549, lng: -73.984 },
    landmarks: [
      { name: 'Bryant Park, 42nd St', area: 'Midtown', lat: 40.7536, lng: -73.9832 },
      { name: 'Grand Central Terminal', area: 'Midtown East', lat: 40.7527, lng: -73.9772 },
      { name: 'SoHo Broadway & Prince', area: 'SoHo', lat: 40.7243, lng: -73.9977 },
      { name: 'Union Square East', area: 'Flatiron', lat: 40.7359, lng: -73.9911 },
      { name: 'Penn Station Plaza', area: 'Chelsea', lat: 40.7506, lng: -73.9935 },
    ],
    intercityDestinations: [
      { name: 'Newark Airport Terminal C', area: 'Newark, NJ · Out of City', lat: 40.6895, lng: -74.1745, distanceKm: 26 },
      { name: 'Stamford Station Plaza', area: 'Stamford, CT · Out of City', lat: 41.0469, lng: -73.5415, distanceKm: 58 },
      { name: 'Philadelphia 30th St', area: 'Philadelphia, PA · Out of City', lat: 39.9566, lng: -75.1817, distanceKm: 152 },
    ],
    ranks: [
      { id: 'rank-nyc-gct', name: 'Grand Central East Rank', area: 'Midtown East', lat: 40.7525, lng: -73.9765, hubType: 'station' },
      { id: 'rank-nyc-msg', name: 'Madison Square Garden Event Rank', area: 'Chelsea', lat: 40.7512, lng: -73.9942, hubType: 'stadium' },
      { id: 'rank-nyc-jfk', name: 'JFK / LaGuardia Express Holding', area: 'SoHo Bridge', lat: 40.7248, lng: -73.9985, hubType: 'airport' },
    ],
  },
];

export function getCityById(cityId: string): CityPreset {
  return WORLD_CITIES.find((c) => c.id === cityId) || WORLD_CITIES[0];
}

export function getTodayDayKey(): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

export function getFutureIsoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export function exactDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinLat * sinLat +
          Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            sinLng *
            sinLng
      )
    );
  return R * c;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  return Math.max(0.2, Number(exactDistanceKm(a, b).toFixed(2)));
}

export function minDistanceToRouteMeters(point: LatLng, route: LatLng[]): number {
  if (route.length === 0) return Infinity;
  let bestKm = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = exactDistanceKm(point, route[i]);
    if (d < bestKm) bestKm = d;
  }
  return bestKm * 1000;
}

export function interpolateLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: a.lat + (b.lat - a.lat) * clamped,
    lng: a.lng + (b.lng - a.lng) * clamped,
  };
}

export function calculateBearing(from: LatLng, to: LatLng): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function buildFallbackMultiRoute(waypoints: LatLng[]): {
  points: LatLng[];
  maneuvers: ManeuverStep[];
  distanceKm: number;
} {
  const points: LatLng[] = [];
  let totalKm = 0;

  for (let w = 0; w < waypoints.length - 1; w++) {
    const from = waypoints[w];
    const to = waypoints[w + 1];
    totalKm += exactDistanceKm(from, to) * 1.22;

    const mid1: LatLng = {
      lat: from.lat + (to.lat - from.lat) * 0.45,
      lng: from.lng + (to.lng - from.lng) * 0.18,
    };
    const mid2: LatLng = {
      lat: from.lat + (to.lat - from.lat) * 0.55,
      lng: from.lng + (to.lng - from.lng) * 0.82,
    };

    const anchors = [from, mid1, mid2, to];
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      const steps = 6;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        points.push({
          lat: a.lat + (b.lat - a.lat) * t,
          lng: a.lng + (b.lng - a.lng) * t,
        });
      }
    }
  }
  points.push(waypoints[waypoints.length - 1]);

  const distKm = Math.max(0.6, Number(totalKm.toFixed(1)));
  const maneuvers: ManeuverStep[] = [
    {
      instruction: 'Head along main road toward route corridor',
      streetName: 'Main Avenue',
      distanceMeters: Math.round(distKm * 420),
      direction: 'straight',
      pointIndex: 0,
    },
    {
      instruction: 'Turn right onto connecting boulevard',
      streetName: 'Central Boulevard',
      distanceMeters: Math.round(distKm * 360),
      direction: 'right',
      pointIndex: Math.floor(points.length * 0.36),
    },
    {
      instruction: 'Turn left toward stop / arrival pin',
      streetName: 'Station Approach',
      distanceMeters: Math.round(distKm * 220),
      direction: 'left',
      pointIndex: Math.floor(points.length * 0.72),
    },
  ];

  return { points, maneuvers, distanceKm: distKm };
}

export async function fetchMultiStopRoadRoute(
  waypoints: LatLng[]
): Promise<{ points: LatLng[]; maneuvers: ManeuverStep[]; distanceKm: number; durationMin: number }> {
  if (waypoints.length < 2) {
    return { points: waypoints, maneuvers: [], distanceKm: 0.4, durationMin: 2 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3400);

  try {
    const coordsParam = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('OSRM failed');
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) throw new Error('No route geometry');

    const points: LatLng[] = route.geometry.coordinates.map((c: [number, number]) => ({
      lat: c[1],
      lng: c[0],
    }));

    const stepsRaw = (route.legs || []).flatMap(
      (leg: {
        steps?: {
          name?: string;
          distance?: number;
          maneuver?: { modifier?: string; type?: string; location?: [number, number] };
        }[];
      }) => leg.steps || []
    );

    let searchStart = 0;
    const maneuvers: ManeuverStep[] = stepsRaw.map(
      (
        step: {
          name?: string;
          distance?: number;
          maneuver?: { modifier?: string; type?: string; location?: [number, number] };
        },
        idx: number
      ) => {
        const mod = step.maneuver?.modifier || '';
        const mType = step.maneuver?.type || '';
        const dir: 'left' | 'right' | 'straight' = mod.includes('left')
          ? 'left'
          : mod.includes('right')
          ? 'right'
          : 'straight';
        const streetName = step.name && step.name.trim() ? step.name : 'the road ahead';
        const distM = Math.max(30, Math.round(step.distance || 120));

        let instruction =
          dir === 'left'
            ? `Turn left onto ${streetName}`
            : dir === 'right'
            ? `Turn right onto ${streetName}`
            : `Continue on ${streetName}`;

        if (mType === 'depart') {
          instruction = `Head out onto ${streetName}`;
        } else if (mType === 'roundabout' || mType === 'rotary') {
          instruction = `At the roundabout, exit onto ${streetName}`;
        } else if (mType === 'arrive') {
          instruction = `Arrive at ${streetName === 'the road ahead' ? 'waypoint' : streetName}`;
        }

        let matchedIndex = Math.min(
          points.length - 1,
          Math.floor((idx / Math.max(1, stepsRaw.length)) * points.length)
        );
        const loc = step.maneuver?.location;
        if (loc && loc.length === 2) {
          const target: LatLng = { lat: loc[1], lng: loc[0] };
          let bestDist = Infinity;
          for (let pIdx = searchStart; pIdx < points.length; pIdx++) {
            const d = exactDistanceKm(points[pIdx], target);
            if (d < bestDist) {
              bestDist = d;
              matchedIndex = pIdx;
            }
          }
          searchStart = matchedIndex;
        }

        return {
          instruction,
          streetName,
          distanceMeters: distM,
          direction: dir,
          pointIndex: matchedIndex,
        };
      }
    );

    const distanceKm = Math.max(0.4, Number((route.distance / 1000).toFixed(1)));
    const durationMin = Math.max(2, Math.round(route.duration / 60));
    return { points, maneuvers, distanceKm, durationMin };
  } catch {
    clearTimeout(timeout);
    const fb = buildFallbackMultiRoute(waypoints);
    return {
      ...fb,
      durationMin: Math.max(3, Math.round(fb.distanceKm * 3.1)),
    };
  }
}

export async function fetchRoadRoute(
  from: LatLng,
  to: LatLng
): Promise<{ points: LatLng[]; maneuvers: ManeuverStep[]; distanceKm: number; durationMin: number }> {
  return fetchMultiStopRoadRoute([from, to]);
}

export function generateSurgeZonesNear(center: LatLng, cityId: string): SurgeZone[] {
  const city = getCityById(cityId);
  const offsets = [
    { lat: 0.008, lng: -0.011, mult: 2.1, level: 'Peak' as const, radius: 950 },
    { lat: -0.009, lng: 0.014, mult: 1.7, level: 'Peak' as const, radius: 850 },
    { lat: 0.013, lng: 0.016, mult: 1.4, level: 'High' as const, radius: 800 },
  ];

  return offsets.map((o, idx) => ({
    id: `surge-${idx}-${city.id}`,
    label: city.landmarks[idx]?.area || `${city.name} Core`,
    multiplier: o.mult,
    center: { lat: center.lat + o.lat, lng: center.lng + o.lng },
    radiusMeters: o.radius,
    demandLevel: o.level,
  }));
}

export function generateDistrictDemandNear(center: LatLng, cityId: string): DistrictDemandZone[] {
  const city = getCityById(cityId);
  const nowHour = new Date().getHours();
  const templates = [
    {
      offsetLat: 0.004,
      offsetLng: -0.006,
      radiusMeters: 1100,
      peakHours: [8, 9, 17, 18, 19, 20, 22, 23],
      peakWindow: '17:00–21:00',
      busySoonLabel: 'Evening Commute & Theatre Rush',
      forecastOffsetLabel: `Peak around ${((nowHour + 1) % 24).toString().padStart(2, '0')}:00`,
      forecastMultiplier: 1.9,
    },
    {
      offsetLat: 0.015,
      offsetLng: 0.012,
      radiusMeters: 1200,
      peakHours: [6, 7, 8, 9, 16, 17, 18, 19],
      peakWindow: '07:00–10:00 · 16:00–19:00',
      busySoonLabel: 'Express Rail & Airport Arrivals',
      forecastOffsetLabel: '+45m Flight/Rail Wave',
      forecastMultiplier: 1.8,
    },
    {
      offsetLat: -0.011,
      offsetLng: 0.018,
      radiusMeters: 1050,
      peakHours: [19, 20, 21, 22, 23, 0, 1],
      peakWindow: '20:00–01:00',
      busySoonLabel: 'Arena Concert & Nightlife Let-Out',
      forecastOffsetLabel: '+1h 15m Event Exit Surge',
      forecastMultiplier: 2.2,
    },
    {
      offsetLat: -0.008,
      offsetLng: -0.017,
      radiusMeters: 950,
      peakHours: [8, 9, 12, 13, 17, 18],
      peakWindow: '08:00–10:00 · 17:00–19:00',
      busySoonLabel: 'Financial District Office Departures',
      forecastOffsetLabel: '+1h Business Pickup Spike',
      forecastMultiplier: 1.6,
    },
    {
      offsetLat: 0.018,
      offsetLng: -0.014,
      radiusMeters: 1000,
      peakHours: [11, 12, 13, 14, 15, 18, 19, 20],
      peakWindow: '12:00–16:00 · 18:00–20:00',
      busySoonLabel: 'Retail Boulevard & Dining Wave',
      forecastOffsetLabel: '+2h Dinner Reservations',
      forecastMultiplier: 1.5,
    },
    {
      offsetLat: -0.019,
      offsetLng: 0.002,
      radiusMeters: 1150,
      peakHours: [5, 6, 7, 14, 15, 21, 22],
      peakWindow: '05:30–08:00 · 21:00–23:00',
      busySoonLabel: 'Terminal Hub & Late Shift Transfers',
      forecastOffsetLabel: '+1h High-Fare Transfers',
      forecastMultiplier: 1.7,
    },
  ];

  const distToCity = haversineKm(center, city.center);
  return templates.map((tpl, idx) => {
    const landmark = city.landmarks[idx % city.landmarks.length];
    const zoneCenter =
      distToCity < 25 && landmark
        ? { lat: landmark.lat, lng: landmark.lng }
        : { lat: center.lat + tpl.offsetLat, lng: center.lng + tpl.offsetLng };

    const hourlyScores = Array.from({ length: 24 }, (_, hour) => {
      const minDist = Math.min(
        ...tpl.peakHours.map((ph) => {
          const d = Math.abs(ph - hour);
          return Math.min(d, 24 - d);
        })
      );
      const base = minDist === 0 ? 0.92 : minDist === 1 ? 0.68 : minDist === 2 ? 0.44 : 0.22;
      const jitter = ((idx * 7 + hour * 3) % 10) * 0.012;
      return Math.min(1, Number((base + jitter).toFixed(2)));
    });

    return {
      id: `demand-${city.id}-${idx}`,
      district: landmark?.area || `${city.name} District ${idx + 1}`,
      center: zoneCenter,
      radiusMeters: tpl.radiusMeters,
      hourlyScores,
      peakWindow: tpl.peakWindow,
      busySoonLabel: tpl.busySoonLabel,
      forecastOffsetLabel: tpl.forecastOffsetLabel,
      forecastMultiplier: tpl.forecastMultiplier,
    };
  });
}

export function generateRanksNear(center: LatLng, cityId: string): TaxiRank[] {
  const city = getCityById(cityId);
  const distToCity = haversineKm(center, city.center);
  if (distToCity < 25 && city.ranks.length > 0) {
    return city.ranks.map((r, idx) => {
      const total = r.hubType === 'airport' ? 38 : r.hubType === 'stadium' ? 28 : 19;
      const queue = r.hubType === 'airport' ? 14 : r.hubType === 'stadium' ? 11 : 6;
      return {
        id: r.id,
        name: r.name,
        area: r.area,
        center: { lat: r.lat, lng: r.lng },
        queueCount: queue,
        totalDrivers: total,
        estWaitMin: r.hubType === 'airport' ? 11 : 5 + idx * 2,
        avgFareBoost:
          r.hubType === 'airport'
            ? '+35% Airport Priority'
            : r.hubType === 'stadium'
            ? '+30% Stadium Event Boost'
            : '+22% Station Priority',
        hubType: r.hubType || 'station',
        geofenceRadiusMeters: r.hubType === 'airport' ? 750 : 520,
      };
    });
  }

  return [
    {
      id: 'rank-local-airport',
      name: 'Airport Express Holding Hub',
      area: 'Terminal Geofence',
      center: { lat: center.lat + 0.008, lng: center.lng + 0.009 },
      queueCount: 14,
      totalDrivers: 38,
      estWaitMin: 11,
      avgFareBoost: '+35% Airport Priority',
      hubType: 'airport',
      geofenceRadiusMeters: 750,
    },
    {
      id: 'rank-local-stadium',
      name: 'Arena & Stadium Event Rank',
      area: 'South Gate',
      center: { lat: center.lat - 0.007, lng: center.lng - 0.008 },
      queueCount: 9,
      totalDrivers: 24,
      estWaitMin: 7,
      avgFareBoost: '+28% Event Hub Boost',
      hubType: 'stadium',
      geofenceRadiusMeters: 550,
    },
  ];
}

const RIDER_NAMES = [
  'Amelia K.',
  'Oliver T.',
  'Sofia M.',
  'Lucas R.',
  'Chloe W.',
  'Noah B.',
  'Hannah S.',
  'Liam P.',
  'Maya D.',
  'Ethan C.',
];

const LOCAL_STREETS = [
  'High Street',
  'Victoria Avenue',
  'Station Road',
  'Park Lane',
  'Central Square',
  'Market Street',
  'King Boulevard',
  'Harbour Way',
];

function randomOffsetCoord(base: LatLng, minKm: number, maxKm: number): LatLng {
  const distKm = minKm + Math.random() * (maxKm - minKm);
  const angle = Math.random() * Math.PI * 2;
  const dLat = (distKm / 111.32) * Math.cos(angle);
  const dLng =
    (distKm / (111.32 * Math.cos((base.lat * Math.PI) / 180))) * Math.sin(angle);
  return {
    lat: Number((base.lat + dLat).toFixed(5)),
    lng: Number((base.lng + dLng).toFixed(5)),
  };
}

export async function generateLiveRideRequest(params: {
  driverLocation: LatLng;
  cityId: string;
  enabledCategories: RideCategory[];
  acceptCash: boolean;
  allowBid: boolean;
  maxPickupKm: number;
  minFareFilter: number;
  minRiderRating: number;
  destinationTarget: LatLng | null;
  surgeZones: SurgeZone[];
  preferredRankArea?: string | null;
  originOverride?: LatLng | null;
  maxVehicleRangeKm?: number;
}): Promise<RideRequest> {
  const city = getCityById(params.cityId);
  const routeStart = params.originOverride || params.driverLocation;

  let categories =
    params.enabledCategories.length > 0 ? params.enabledCategories : (['Bolt'] as RideCategory[]);

  // EV Battery / Fuel Range Guard: filter out Bolt City out-of-city trips if range is insufficient
  if (params.maxVehicleRangeKm !== undefined && params.maxVehicleRangeKm < 95) {
    const cityFiltered = categories.filter((c) => c !== 'Bolt City');
    if (cityFiltered.length > 0) {
      categories = cityFiltered;
    }
  }

  const category = categories[Math.floor(Math.random() * categories.length)];
  const isOutOfCity = category === 'Bolt City';
  const isFlex = category === 'Bolt Flex';

  const distToCity = haversineKm(routeStart, city.center);
  const useCityLandmarks = distToCity < 25 && city.landmarks.length >= 3;

  let pickupCoords: LatLng;
  let pickupAddress: string;
  let pickupArea: string;
  let dropoffCoords: LatLng;
  let dropoffAddress: string;
  let dropoffArea: string;
  let outOfCityKmOverride: number | null = null;
  const stops: TripStop[] = [];

  if (useCityLandmarks) {
    const sorted = [...city.landmarks].sort(
      (a, b) => haversineKm(routeStart, a) - haversineKm(routeStart, b)
    );
    const withinPickup = sorted.filter(
      (l) => haversineKm(routeStart, l) <= Math.max(2, params.maxPickupKm)
    );
    const pickupPool = withinPickup.length > 0 ? withinPickup : sorted.slice(0, 3);
    const p = pickupPool[Math.floor(Math.random() * pickupPool.length)];
    pickupCoords = { lat: p.lat, lng: p.lng };
    pickupAddress = params.preferredRankArea ? `${params.preferredRankArea} Pickup Bay` : p.name;
    pickupArea = params.preferredRankArea || p.area;

    if (isOutOfCity && city.intercityDestinations.length > 0) {
      const affordableInter =
        params.maxVehicleRangeKm !== undefined
          ? city.intercityDestinations.filter((d) => d.distanceKm <= params.maxVehicleRangeKm! - 15)
          : city.intercityDestinations;
      const interPool = affordableInter.length > 0 ? affordableInter : city.intercityDestinations;
      const inter = interPool[Math.floor(Math.random() * interPool.length)];
      dropoffCoords = { lat: inter.lat, lng: inter.lng };
      dropoffAddress = inter.name;
      dropoffArea = inter.area;
      outOfCityKmOverride = inter.distanceKm;
    } else {
      const dropPool = city.landmarks.filter((l) => l.name !== p.name);
      const d = dropPool[Math.floor(Math.random() * dropPool.length)];
      dropoffCoords = params.destinationTarget || { lat: d.lat, lng: d.lng };
      dropoffAddress = params.destinationTarget ? 'Destination Corridor' : d.name;
      dropoffArea = params.destinationTarget ? 'Target Area' : d.area;

      // Multistop Trips (~35% chance on standard city rides)
      const remainingStops = dropPool.filter((l) => l.name !== d.name);
      if (remainingStops.length >= 1 && Math.random() < 0.36) {
        const stopCount = remainingStops.length >= 2 && Math.random() < 0.35 ? 2 : 1;
        for (let s = 0; s < stopCount; s++) {
          const lm = remainingStops[s];
          stops.push({
            id: `stop-${s + 1}-${Date.now()}`,
            address: lm.name,
            area: lm.area,
            coords: { lat: lm.lat, lng: lm.lng },
          });
        }
      }
    }
  } else {
    const maxP = Math.min(params.maxPickupKm, 3.2);
    pickupCoords = randomOffsetCoord(routeStart, 0.4, Math.max(1.1, maxP));
    const st1 = LOCAL_STREETS[Math.floor(Math.random() * LOCAL_STREETS.length)];
    const num1 = Math.floor(10 + Math.random() * 140);
    pickupAddress = params.preferredRankArea
      ? `${params.preferredRankArea} Pickup Bay`
      : `${num1} ${st1}`;
    pickupArea = params.preferredRankArea || 'Nearby Pickup';

    if (isOutOfCity) {
      dropoffCoords = randomOffsetCoord(pickupCoords, 42, 85);
      dropoffAddress = 'Intercity Regional Terminal';
      dropoffArea = 'Out of City';
      outOfCityKmOverride = Number(haversineKm(pickupCoords, dropoffCoords).toFixed(1));
    } else {
      dropoffCoords = params.destinationTarget || randomOffsetCoord(pickupCoords, 2.5, 7.5);
      const st2 = LOCAL_STREETS[Math.floor(Math.random() * LOCAL_STREETS.length)];
      const num2 = Math.floor(12 + Math.random() * 180);
      dropoffAddress = params.destinationTarget ? 'Your Destination Area' : `${num2} ${st2}`;
      dropoffArea = 'Destination';

      if (Math.random() < 0.34) {
        const stopCoord = interpolateLatLng(pickupCoords, dropoffCoords, 0.45);
        const stStop = LOCAL_STREETS[(Math.floor(Math.random() * LOCAL_STREETS.length) + 2) % LOCAL_STREETS.length];
        stops.push({
          id: `stop-1-${Date.now()}`,
          address: `${Math.floor(15 + Math.random() * 90)} ${stStop}`,
          area: 'Mid-Trip Stop',
          coords: stopCoord,
        });
      }
    }
  }

  const dropoffWaypoints = [pickupCoords, ...stops.map((s) => s.coords), dropoffCoords];
  const [toPickup, toDropoff] = await Promise.all([
    fetchRoadRoute(routeStart, pickupCoords),
    fetchMultiStopRoadRoute(dropoffWaypoints),
  ]);

  let surgeMultiplier = 1.0;
  for (const z of params.surgeZones) {
    if (haversineKm(pickupCoords, z.center) * 1000 <= z.radiusMeters + 500) {
      surgeMultiplier = z.multiplier;
      break;
    }
  }
  if (isOutOfCity && surgeMultiplier < 1.25) {
    surgeMultiplier = 1.25;
  }

  const tripDistanceKm = outOfCityKmOverride || toDropoff.distanceKm;
  const tripEtaMin = outOfCityKmOverride
    ? Math.max(35, Math.round(outOfCityKmOverride * 1.12))
    : toDropoff.durationMin;

  const categoryRate =
    category === 'Bolt City'
      ? 1.55
      : category === 'Comfort'
      ? 1.28
      : category === 'XL'
      ? 1.42
      : category === 'Bolt Flex'
      ? 1.12
      : category === 'Bolt Green'
      ? 1.08
      : category === 'Pets'
      ? 1.15
      : category === 'Delivery'
      ? 0.95
      : 1.0;

  const baseFare = isOutOfCity ? 12.0 : 3.2;
  const stopBonus = stops.length * 2.5;
  const distanceFare = Number((tripDistanceKm * 1.85 * categoryRate + stopBonus).toFixed(2));
  const timeFare = Number((tripEtaMin * 0.28 * categoryRate).toFixed(2));
  const rawTotal = baseFare + distanceFare + timeFare;
  const minFloor = Math.max(params.minFareFilter, isOutOfCity ? 78 : 6.5);
  const adjustedSubtotal = Math.max(rawTotal, minFloor);
  const surgeBonus =
    surgeMultiplier > 1 ? Number((adjustedSubtotal * (surgeMultiplier - 1)).toFixed(2)) : 0;
  const estimatedFare = Number((adjustedSubtotal + surgeBonus).toFixed(2));

  const paymentOptions: PaymentMethod[] = params.acceptCash
    ? ['Card', 'Apple Pay', 'Google Pay', 'Cash']
    : ['Card', 'Apple Pay', 'Google Pay'];

  const minRating = Math.max(4.5, params.minRiderRating);
  const riderRating = Number((minRating + Math.random() * (5.0 - minRating)).toFixed(2));

  const requiresPin =
    isOutOfCity || Boolean(params.preferredRankArea) || estimatedFare >= 20 || Math.random() < 0.45;
  const pickupPin = requiresPin
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : undefined;

  return {
    id: `req-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    riderName: RIDER_NAMES[Math.floor(Math.random() * RIDER_NAMES.length)],
    riderRating,
    riderTrips: Math.floor(15 + Math.random() * 240),
    category,
    paymentMethod: paymentOptions[Math.floor(Math.random() * paymentOptions.length)],
    surgeMultiplier,
    pickupCoords,
    pickupAddress,
    pickupArea,
    dropoffCoords,
    dropoffAddress,
    dropoffArea,
    stops: stops.length > 0 ? stops : undefined,
    pickupPin,
    waitFeePerMin: 0.45,
    waitFeeTotal: 0,
    pickupDistanceKm: toPickup.distanceKm,
    pickupEtaMin: toPickup.durationMin,
    tripDistanceKm,
    tripEtaMin,
    estimatedFare,
    baseFare,
    distanceFare,
    timeFare,
    surgeBonus,
    currency: city.currency,
    toPickupRoute: toPickup.points,
    toDropoffRoute: toDropoff.points,
    maneuversToPickup: toPickup.maneuvers,
    maneuversToDropoff: toDropoff.maneuvers,
    allowBid: isFlex || params.allowBid,
    isOutOfCity,
    willRiderReply: Math.random() > 0.42,
    note: isOutOfCity
      ? 'Intercity long-distance booking with luggage'
      : stops.length > 0
      ? `Includes ${stops.length} quick stop${stops.length > 1 ? 's' : ''} along the way`
      : Math.random() > 0.55
      ? 'Waiting near main glass entrance'
      : undefined,
  };
}

export function generateScheduledRidesNear(
  driverLocation: LatLng,
  cityId: string
): ScheduledRide[] {
  const city = getCityById(cityId);
  const distToCity = haversineKm(driverLocation, city.center);
  const useCity = distToCity < 25 && city.landmarks.length >= 3;

  const slots = [
    { offsetMin: 12, tag: 'Airport Transfer' as const, cat: 'Comfort' as RideCategory },
    { offsetMin: 28, tag: 'Station Express' as const, cat: 'Bolt' as RideCategory },
    { offsetMin: 55, tag: 'VIP Business' as const, cat: 'Bolt Green' as RideCategory },
    { offsetMin: 95, tag: 'Morning Commute' as const, cat: 'XL' as RideCategory },
    { offsetMin: 145, tag: 'Airport Transfer' as const, cat: 'Bolt City' as RideCategory },
  ];

  return slots.map((slot, i) => {
    const pickupDate = new Date(Date.now() + slot.offsetMin * 60 * 1000);
    const label = `${pickupDate.getHours().toString().padStart(2, '0')}:${pickupDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const lmA = useCity ? city.landmarks[i % city.landmarks.length] : null;
    const inter =
      slot.cat === 'Bolt City' && city.intercityDestinations.length > 0
        ? city.intercityDestinations[0]
        : null;
    const lmB = inter
      ? null
      : useCity
      ? city.landmarks[(i + 2) % city.landmarks.length]
      : null;

    const pickupCoords = lmA
      ? { lat: lmA.lat, lng: lmA.lng }
      : randomOffsetCoord(driverLocation, 0.8, 2.8);
    const dropoffCoords = inter
      ? { lat: inter.lat, lng: inter.lng }
      : lmB
      ? { lat: lmB.lat, lng: lmB.lng }
      : randomOffsetCoord(pickupCoords, 5.5, 16);

    const tripDistanceKm = inter
      ? inter.distanceKm
      : Number(Math.max(4.8, haversineKm(pickupCoords, dropoffCoords) * 1.25).toFixed(1));
    const tripEtaMin = inter
      ? Math.max(42, Math.round(inter.distanceKm * 1.1))
      : Math.max(12, Math.round(tripDistanceKm * 2.6));
    const estimatedFare = inter
      ? Number((16 + tripDistanceKm * 1.9).toFixed(2))
      : Number((6.5 + tripDistanceKm * 2.15 + tripEtaMin * 0.25).toFixed(2));

    return {
      id: `sched-${city.id}-${i}`,
      riderName: RIDER_NAMES[(i + 2) % RIDER_NAMES.length],
      riderRating: Number((4.86 + (i % 3) * 0.04).toFixed(2)),
      category: slot.cat,
      pickupAddress: lmA ? lmA.name : `${18 + i * 11} ${LOCAL_STREETS[i % LOCAL_STREETS.length]}`,
      pickupArea: lmA ? lmA.area : 'City Pickup',
      dropoffAddress: inter
        ? inter.name
        : lmB
        ? lmB.name
        : `${62 + i * 15} ${LOCAL_STREETS[(i + 3) % LOCAL_STREETS.length]}`,
      dropoffArea: inter ? inter.area : lmB ? lmB.area : 'Terminal Dropoff',
      pickupCoords,
      dropoffCoords,
      pickupTimeIso: pickupDate.toISOString(),
      pickupTimeLabel: label,
      tag: slot.tag,
      tripDistanceKm,
      tripEtaMin,
      estimatedFare,
      currency: city.currency,
      paymentMethod: i % 2 === 0 ? 'Card' : 'Apple Pay',
      claimed: false,
      pickupPin: `${2400 + i * 137}`,
      note:
        slot.tag === 'Airport Transfer'
          ? '2 large suitcases · Terminal departures'
          : 'Pre-booked executive pickup',
    };
  });
}

export function generateBidJobsNear(
  driverLocation: LatLng,
  cityId: string,
  enabledCategories: RideCategory[]
): BidJobOffer[] {
  const city = getCityById(cityId);
  const categories =
    enabledCategories.length > 0 ? enabledCategories : (['Bolt Flex'] as RideCategory[]);

  const schedules = ['Now (ASAP)', 'In 20 min', 'Today 16:30', 'Today 18:15'];
  const jobs: BidJobOffer[] = [];

  for (let i = 0; i < 4; i++) {
    const isCityJob =
      i === 1 && categories.includes('Bolt City') && city.intercityDestinations.length > 0;
    const pickupCoords =
      city.landmarks[i] && haversineKm(driverLocation, city.center) < 25
        ? { lat: city.landmarks[i].lat, lng: city.landmarks[i].lng }
        : randomOffsetCoord(driverLocation, 0.8, 3.5);

    const interDest = isCityJob
      ? city.intercityDestinations[i % city.intercityDestinations.length]
      : null;

    const dropCoords = interDest
      ? { lat: interDest.lat, lng: interDest.lng }
      : city.landmarks[(i + 2) % city.landmarks.length] &&
        haversineKm(driverLocation, city.center) < 25
      ? {
          lat: city.landmarks[(i + 2) % city.landmarks.length].lat,
          lng: city.landmarks[(i + 2) % city.landmarks.length].lng,
        }
      : randomOffsetCoord(pickupCoords, 4.0, 11.5);

    const pickupDistanceKm = Number(haversineKm(driverLocation, pickupCoords).toFixed(1));
    const tripDistanceKm = interDest
      ? interDest.distanceKm
      : Number(Math.max(3.2, haversineKm(pickupCoords, dropCoords) * 1.25).toFixed(1));
    const tripEtaMin = interDest
      ? Math.max(40, Math.round(interDest.distanceKm * 1.15))
      : Math.max(9, Math.round(tripDistanceKm * 2.9));
    const suggestedFare = interDest
      ? Number((15 + tripDistanceKm * 1.85).toFixed(2))
      : Number((4.0 + tripDistanceKm * 1.95 + tripEtaMin * 0.25).toFixed(2));
    const cat: RideCategory = isCityJob
      ? 'Bolt City'
      : categories.includes('Bolt Flex')
      ? 'Bolt Flex'
      : categories[i % categories.length];

    jobs.push({
      id: `bid-${Date.now()}-${i}`,
      riderName: RIDER_NAMES[(i + 3) % RIDER_NAMES.length],
      riderRating: Number((4.82 + (i % 3) * 0.05).toFixed(2)),
      category: cat,
      pickupAddress:
        city.landmarks[i] && haversineKm(driverLocation, city.center) < 25
          ? city.landmarks[i].name
          : `${20 + i * 17} ${LOCAL_STREETS[i % LOCAL_STREETS.length]}`,
      dropoffAddress: interDest
        ? interDest.name
        : city.landmarks[(i + 2) % city.landmarks.length] &&
          haversineKm(driverLocation, city.center) < 25
        ? city.landmarks[(i + 2) % city.landmarks.length].name
        : `${44 + i * 19} ${LOCAL_STREETS[(i + 3) % LOCAL_STREETS.length]}`,
      pickupCoords,
      dropoffCoords: dropCoords,
      pickupDistanceKm,
      tripDistanceKm,
      tripEtaMin,
      suggestedFare,
      minBid: Math.max(6, Math.round(suggestedFare * 0.82)),
      maxBid: Math.round(suggestedFare * 1.65),
      currency: city.currency,
      scheduledFor: schedules[i],
      paymentMethod: i === 2 ? 'Apple Pay' : 'Card',
      surgeMultiplier: isCityJob ? 1.5 : i === 0 ? 1.6 : 1.0,
      bidStatus: 'open',
    });
  }

  return jobs;
}

// Money starts from £0.00 and grows directly from completed trips today
export const INITIAL_TRIPS: CompletedTrip[] = [];

export const WEEKLY_EARNINGS_SERIES = [
  { day: 'Mon', amount: 0, trips: 0, hours: 0 },
  { day: 'Tue', amount: 0, trips: 0, hours: 0 },
  { day: 'Wed', amount: 0, trips: 0, hours: 0 },
  { day: 'Thu', amount: 0, trips: 0, hours: 0 },
  { day: 'Fri', amount: 0, trips: 0, hours: 0 },
  { day: 'Sat', amount: 0, trips: 0, hours: 0 },
  { day: 'Sun', amount: 0, trips: 0, hours: 0 },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-tesla',
    makeModel: 'Tesla Model 3 Long Range',
    plate: 'LR74 BLT',
    color: 'Pearl White',
    year: 2024,
    fuelType: 'Electric',
    categories: ['Bolt', 'Comfort', 'Bolt Green', 'Bolt Flex', 'Bolt City', 'Pets', 'Delivery'],
    imageUrl: '/src/assets/images/vehicle_sedan_1794515087800.jpg',
    isActive: true,
    rangeKm: 365,
    maxRangeKm: 420,
    odometerKm: 28410,
    nextServiceKm: 30000,
    tyreCheckKm: 29500,
  },
  {
    id: 'veh-corolla',
    makeModel: 'Toyota Corolla Touring Hybrid',
    plate: 'YK23 VRN',
    color: 'Silver Metallic',
    year: 2023,
    fuelType: 'Hybrid',
    categories: ['Bolt', 'Bolt Green', 'Bolt Flex', 'Bolt City', 'XL', 'Delivery'],
    imageUrl: '/src/assets/images/vehicle_sedan_1794515087800.jpg',
    isActive: false,
    rangeKm: 540,
    maxRangeKm: 680,
    odometerKm: 44820,
    nextServiceKm: 45500,
    tyreCheckKm: 46000,
  },
];

export const INITIAL_DOCUMENTS: DriverDocument[] = [
  {
    id: 'doc-phv',
    title: 'TfL Private Hire Driver Licence',
    subtitle: 'Badge #PHV-884129',
    expiryDate: '2028-09-14',
    status: 'Verified',
  },
  {
    id: 'doc-ins',
    title: 'Hire & Reward Insurance Certificate',
    subtitle: 'Zego Comprehensive Fleet',
    expiryDate: getFutureIsoDate(18),
    status: 'Expiring Soon',
  },
  {
    id: 'doc-mot',
    title: 'Vehicle MOT & PHV Inspection',
    subtitle: 'LR74 BLT · Passed 6-month check',
    expiryDate: '2027-05-20',
    status: 'Verified',
  },
  {
    id: 'doc-dl',
    title: 'UK Full Driving Licence',
    subtitle: 'DVLA Verified',
    expiryDate: '2031-11-08',
    status: 'Verified',
  },
];

export const INITIAL_CAMPAIGNS: CampaignQuest[] = [
  {
    id: 'quest-weekday',
    title: 'Daily Starter Bonus Quest',
    subtitle: 'Complete 5 trips today to earn a bonus',
    completedTrips: 0,
    targetTrips: 5,
    rewardAmount: 25,
    endsIn: 'Today 23:59',
  },
  {
    id: 'quest-ev',
    title: 'Zero-Emission EV Boost',
    subtitle: 'Complete 10 Bolt Green trips this week',
    completedTrips: 0,
    targetTrips: 10,
    rewardAmount: 30,
    endsIn: 'This Sunday',
  },
];
