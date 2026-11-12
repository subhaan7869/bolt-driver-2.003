import {
  BidJobOffer,
  CampaignQuest,
  CityPreset,
  CompletedTrip,
  DriverDocument,
  LatLng,
  ManeuverStep,
  PaymentMethod,
  RideCategory,
  RideRequest,
  SurgeZone,
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

export function haversineKm(a: LatLng, b: LatLng): number {
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
  return Math.max(0.2, Number((R * c).toFixed(2)));
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

function buildFallbackRoute(from: LatLng, to: LatLng): {
  points: LatLng[];
  maneuvers: ManeuverStep[];
  distanceKm: number;
} {
  const mid1: LatLng = {
    lat: from.lat + (to.lat - from.lat) * 0.45,
    lng: from.lng + (to.lng - from.lng) * 0.15,
  };
  const mid2: LatLng = {
    lat: from.lat + (to.lat - from.lat) * 0.55,
    lng: from.lng + (to.lng - from.lng) * 0.85,
  };

  const anchors = [from, mid1, mid2, to];
  const points: LatLng[] = [];
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
  points.push(to);

  const distKm = Math.max(0.6, Number((haversineKm(from, to) * 1.24).toFixed(1)));
  const maneuvers: ManeuverStep[] = [
    {
      instruction: 'Head along main road toward pickup corridor',
      streetName: 'Main Avenue',
      distanceMeters: Math.round(distKm * 450),
      direction: 'straight',
      pointIndex: 0,
    },
    {
      instruction: 'Turn right onto connecting boulevard',
      streetName: 'Central Boulevard',
      distanceMeters: Math.round(distKm * 350),
      direction: 'right',
      pointIndex: Math.floor(points.length * 0.35),
    },
    {
      instruction: 'Turn left toward arrival pin',
      streetName: 'Station Approach',
      distanceMeters: Math.round(distKm * 200),
      direction: 'left',
      pointIndex: Math.floor(points.length * 0.72),
    },
  ];

  return { points, maneuvers, distanceKm: distKm };
}

export async function fetchRoadRoute(
  from: LatLng,
  to: LatLng
): Promise<{ points: LatLng[]; maneuvers: ManeuverStep[]; distanceKm: number; durationMin: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3200);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
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

    const stepsRaw = route.legs?.[0]?.steps || [];
    const maneuvers: ManeuverStep[] = stepsRaw.slice(0, 8).map(
      (
        step: {
          name?: string;
          distance?: number;
          maneuver?: { modifier?: string };
        },
        idx: number
      ) => {
        const mod = step.maneuver?.modifier || '';
        const dir: 'left' | 'right' | 'straight' = mod.includes('left')
          ? 'left'
          : mod.includes('right')
          ? 'right'
          : 'straight';
        const streetName = step.name && step.name.trim() ? step.name : 'local street';
        const distM = Math.max(40, Math.round(step.distance || 150));
        const instruction =
          dir === 'left'
            ? `Turn left onto ${streetName}`
            : dir === 'right'
            ? `Turn right onto ${streetName}`
            : `Continue on ${streetName}`;

        return {
          instruction,
          streetName,
          distanceMeters: distM,
          direction: dir,
          pointIndex: Math.min(
            points.length - 1,
            Math.floor((idx / Math.max(1, stepsRaw.length)) * points.length)
          ),
        };
      }
    );

    const distanceKm = Math.max(0.4, Number((route.distance / 1000).toFixed(1)));
    const durationMin = Math.max(2, Math.round(route.duration / 60));
    return { points, maneuvers, distanceKm, durationMin };
  } catch {
    clearTimeout(timeout);
    const fb = buildFallbackRoute(from, to);
    return {
      ...fb,
      durationMin: Math.max(3, Math.round(fb.distanceKm * 3.1)),
    };
  }
}

export function generateSurgeZonesNear(center: LatLng, cityId: string): SurgeZone[] {
  const city = getCityById(cityId);
  const offsets = [
    { lat: 0.008, lng: -0.011, mult: 1.7, level: 'Peak' as const, radius: 950 },
    { lat: -0.009, lng: 0.014, mult: 1.5, level: 'High' as const, radius: 850 },
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
}): Promise<RideRequest> {
  const city = getCityById(params.cityId);
  const categories =
    params.enabledCategories.length > 0 ? params.enabledCategories : (['Bolt'] as RideCategory[]);
  const category = categories[Math.floor(Math.random() * categories.length)];

  const distToCity = haversineKm(params.driverLocation, city.center);
  const useCityLandmarks = distToCity < 25 && city.landmarks.length >= 2;

  let pickupCoords: LatLng;
  let pickupAddress: string;
  let pickupArea: string;
  let dropoffCoords: LatLng;
  let dropoffAddress: string;
  let dropoffArea: string;

  if (useCityLandmarks) {
    const sorted = [...city.landmarks].sort(
      (a, b) => haversineKm(params.driverLocation, a) - haversineKm(params.driverLocation, b)
    );
    const withinPickup = sorted.filter(
      (l) => haversineKm(params.driverLocation, l) <= Math.max(2, params.maxPickupKm)
    );
    const pickupPool = withinPickup.length > 0 ? withinPickup : sorted.slice(0, 3);
    const p = pickupPool[Math.floor(Math.random() * pickupPool.length)];
    pickupCoords = { lat: p.lat, lng: p.lng };
    pickupAddress = p.name;
    pickupArea = p.area;

    const dropPool = city.landmarks.filter((l) => l.name !== p.name);
    const d = dropPool[Math.floor(Math.random() * dropPool.length)];
    dropoffCoords = params.destinationTarget || { lat: d.lat, lng: d.lng };
    dropoffAddress = params.destinationTarget ? 'Destination Corridor' : d.name;
    dropoffArea = params.destinationTarget ? 'Target Area' : d.area;
  } else {
    const maxP = Math.min(params.maxPickupKm, 3.2);
    pickupCoords = randomOffsetCoord(params.driverLocation, 0.5, Math.max(1.2, maxP));
    const st1 = LOCAL_STREETS[Math.floor(Math.random() * LOCAL_STREETS.length)];
    const num1 = Math.floor(10 + Math.random() * 140);
    pickupAddress = `${num1} ${st1}`;
    pickupArea = 'Nearby Pickup';

    dropoffCoords = params.destinationTarget || randomOffsetCoord(pickupCoords, 2.5, 7.5);
    const st2 = LOCAL_STREETS[Math.floor(Math.random() * LOCAL_STREETS.length)];
    const num2 = Math.floor(12 + Math.random() * 180);
    dropoffAddress = params.destinationTarget ? 'Your Destination Area' : `${num2} ${st2}`;
    dropoffArea = 'Destination';
  }

  const [toPickup, toDropoff] = await Promise.all([
    fetchRoadRoute(params.driverLocation, pickupCoords),
    fetchRoadRoute(pickupCoords, dropoffCoords),
  ]);

  let surgeMultiplier = 1.0;
  for (const z of params.surgeZones) {
    if (haversineKm(pickupCoords, z.center) * 1000 <= z.radiusMeters + 450) {
      surgeMultiplier = z.multiplier;
      break;
    }
  }

  const categoryRate =
    category === 'Comfort'
      ? 1.28
      : category === 'XL'
      ? 1.42
      : category === 'Bolt Green'
      ? 1.08
      : category === 'Pets'
      ? 1.15
      : category === 'Delivery'
      ? 0.95
      : 1.0;

  const baseFare = 3.2;
  const distanceFare = Number((toDropoff.distanceKm * 1.85 * categoryRate).toFixed(2));
  const timeFare = Number((toDropoff.durationMin * 0.28 * categoryRate).toFixed(2));
  const rawTotal = baseFare + distanceFare + timeFare;
  const minFloor = Math.max(params.minFareFilter, 6.5);
  const adjustedSubtotal = Math.max(rawTotal, minFloor);
  const surgeBonus =
    surgeMultiplier > 1 ? Number((adjustedSubtotal * (surgeMultiplier - 1)).toFixed(2)) : 0;
  const estimatedFare = Number((adjustedSubtotal + surgeBonus).toFixed(2));

  const paymentOptions: PaymentMethod[] = params.acceptCash
    ? ['Card', 'Apple Pay', 'Google Pay', 'Cash']
    : ['Card', 'Apple Pay', 'Google Pay'];

  const minRating = Math.max(4.5, params.minRiderRating);
  const riderRating = Number((minRating + Math.random() * (5.0 - minRating)).toFixed(2));

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
    pickupDistanceKm: toPickup.distanceKm,
    pickupEtaMin: toPickup.durationMin,
    tripDistanceKm: toDropoff.distanceKm,
    tripEtaMin: toDropoff.durationMin,
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
    allowBid: params.allowBid,
    note: Math.random() > 0.55 ? 'Waiting near main glass entrance' : undefined,
  };
}

export function generateBidJobsNear(
  driverLocation: LatLng,
  cityId: string,
  enabledCategories: RideCategory[]
): BidJobOffer[] {
  const city = getCityById(cityId);
  const categories =
    enabledCategories.length > 0 ? enabledCategories : (['Bolt'] as RideCategory[]);

  const schedules = ['Now (ASAP)', 'In 20 min', 'Today 16:30', 'Today 18:15'];
  const jobs: BidJobOffer[] = [];

  for (let i = 0; i < 4; i++) {
    const pickupCoords =
      city.landmarks[i] && haversineKm(driverLocation, city.center) < 25
        ? { lat: city.landmarks[i].lat, lng: city.landmarks[i].lng }
        : randomOffsetCoord(driverLocation, 0.8, 3.5);
    const dropCoords =
      city.landmarks[(i + 2) % city.landmarks.length] &&
      haversineKm(driverLocation, city.center) < 25
        ? {
            lat: city.landmarks[(i + 2) % city.landmarks.length].lat,
            lng: city.landmarks[(i + 2) % city.landmarks.length].lng,
          }
        : randomOffsetCoord(pickupCoords, 4.0, 11.5);

    const pickupDistanceKm = Number(haversineKm(driverLocation, pickupCoords).toFixed(1));
    const tripDistanceKm = Number(
      Math.max(3.2, haversineKm(pickupCoords, dropCoords) * 1.25).toFixed(1)
    );
    const tripEtaMin = Math.max(9, Math.round(tripDistanceKm * 2.9));
    const suggestedFare = Number((4.0 + tripDistanceKm * 1.95 + tripEtaMin * 0.25).toFixed(2));
    const cat = categories[i % categories.length];

    jobs.push({
      id: `bid-${Date.now()}-${i}`,
      riderName: RIDER_NAMES[(i + 3) % RIDER_NAMES.length],
      riderRating: Number((4.82 + (i % 3) * 0.05).toFixed(2)),
      category: cat,
      pickupAddress:
        city.landmarks[i] && haversineKm(driverLocation, city.center) < 25
          ? city.landmarks[i].name
          : `${20 + i * 17} ${LOCAL_STREETS[i % LOCAL_STREETS.length]}`,
      dropoffAddress:
        city.landmarks[(i + 2) % city.landmarks.length] &&
        haversineKm(driverLocation, city.center) < 25
          ? city.landmarks[(i + 2) % city.landmarks.length].name
          : `${44 + i * 19} ${LOCAL_STREETS[(i + 3) % LOCAL_STREETS.length]}`,
      pickupCoords,
      dropoffCoords: dropCoords,
      pickupDistanceKm,
      tripDistanceKm,
      tripEtaMin,
      suggestedFare,
      minBid: Math.max(6, Math.round(suggestedFare * 0.85)),
      maxBid: Math.round(suggestedFare * 1.55),
      currency: city.currency,
      scheduledFor: schedules[i],
      paymentMethod: i === 2 ? 'Apple Pay' : 'Card',
      surgeMultiplier: i === 0 ? 1.4 : 1.0,
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
    categories: ['Bolt', 'Comfort', 'Bolt Green', 'Pets', 'Delivery'],
    imageUrl: '/src/assets/images/vehicle_sedan_1794515087800.jpg',
    isActive: true,
  },
  {
    id: 'veh-corolla',
    makeModel: 'Toyota Corolla Touring Hybrid',
    plate: 'YK23 VRN',
    color: 'Silver Metallic',
    year: 2023,
    fuelType: 'Hybrid',
    categories: ['Bolt', 'Bolt Green', 'XL', 'Delivery'],
    imageUrl: '/src/assets/images/vehicle_sedan_1794515087800.jpg',
    isActive: false,
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
