export type DriverStatus =
  | 'OFFLINE'
  | 'ONLINE_IDLE'
  | 'ON_BREAK'
  | 'INCOMING_REQUEST'
  | 'EN_ROUTE_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'IN_PROGRESS'
  | 'TRIP_COMPLETED';

export type AppTab = 'map' | 'schedule' | 'earnings' | 'activity' | 'account' | 'insurance';

export type RideCategory =
  | 'Bolt'
  | 'Comfort'
  | 'Bolt Green'
  | 'Bolt Flex'
  | 'Bolt City'
  | 'XL'
  | 'Pets'
  | 'Delivery';

export type PaymentMethod = 'Card' | 'Apple Pay' | 'Google Pay' | 'Cash';

export type InsuranceCoverage = 'taxi' | 'food' | 'all';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TripStop {
  id: string;
  address: string;
  area: string;
  coords: LatLng;
  completed?: boolean;
}

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  currency: string;
  center: LatLng;
  landmarks: { name: string; area: string; lat: number; lng: number }[];
  intercityDestinations: {
    name: string;
    area: string;
    lat: number;
    lng: number;
    distanceKm: number;
  }[];
  ranks: {
    id: string;
    name: string;
    area: string;
    lat: number;
    lng: number;
    hubType?: 'airport' | 'stadium' | 'station';
  }[];
}

export interface SurgeZone {
  id: string;
  label: string;
  multiplier: number;
  center: LatLng;
  radiusMeters: number;
  demandLevel: 'High' | 'Peak';
}

export interface DistrictDemandZone {
  id: string;
  district: string;
  center: LatLng;
  radiusMeters: number;
  hourlyScores: number[];
  peakWindow: string;
  busySoonLabel: string;
  forecastOffsetLabel: string;
  forecastMultiplier: number;
}

export interface TaxiRank {
  id: string;
  name: string;
  area: string;
  center: LatLng;
  queueCount: number;
  totalDrivers: number;
  totalQueue?: number;
  estWaitMin: number;
  avgFareBoost: string;
  hubType: 'airport' | 'stadium' | 'station';
  geofenceRadiusMeters: number;
}

export interface ManeuverStep {
  instruction: string;
  streetName: string;
  distanceMeters: number;
  direction: 'left' | 'right' | 'straight';
  pointIndex: number;
}

export interface RideRequest {
  id: string;
  riderName: string;
  riderRating: number;
  riderTrips: number;
  category: RideCategory;
  paymentMethod: PaymentMethod;
  surgeMultiplier: number;
  pickupCoords: LatLng;
  pickupAddress: string;
  pickupArea: string;
  dropoffCoords: LatLng;
  dropoffAddress: string;
  dropoffArea: string;
  stops?: TripStop[];
  pickupPin?: string;
  requiresPin?: boolean;
  waitFeePerMin?: number;
  waitFeeTotal?: number;
  pickupDistanceKm: number;
  pickupEtaMin: number;
  tripDistanceKm: number;
  tripEtaMin: number;
  estimatedFare: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeBonus: number;
  waitFee?: number;
  currency: string;
  toPickupRoute: LatLng[];
  toDropoffRoute: LatLng[];
  maneuversToPickup: ManeuverStep[];
  maneuversToDropoff: ManeuverStep[];
  allowBid: boolean;
  isOutOfCity?: boolean;
  willRiderReply?: boolean;
  note?: string;
  tollOrAirportFee?: number;
  tollLabel?: string;
}

export interface CleanAirZone {
  id: string;
  name: string;
  zoneType: 'Congestion' | 'ULEZ' | 'Clean Air';
  center: LatLng;
  radiusMeters: number;
  dailyFee: number;
  evExempt: boolean;
}

export interface SpeedCamera {
  id: string;
  name: string;
  limitMph: number;
  coords: LatLng;
  cameraType: 'Fixed' | 'Average' | 'Red Light';
}

export interface WeatherForecast {
  tempC: number;
  condition: string;
  isRaining: boolean;
  windKmh: number;
  rainSurgeBoost: number;
  eventSurgeNote?: string;
}

export interface ScheduledRide {
  id: string;
  riderName: string;
  riderRating: number;
  category: RideCategory;
  pickupAddress: string;
  pickupArea: string;
  dropoffAddress: string;
  dropoffArea: string;
  pickupCoords: LatLng;
  dropoffCoords: LatLng;
  pickupTimeIso: string;
  pickupTimeLabel: string;
  tag: string;
  tripDistanceKm: number;
  tripEtaMin: number;
  estimatedFare: number;
  currency: string;
  paymentMethod: PaymentMethod;
  claimed: boolean;
  pickupPin?: string;
  note?: string;
  isAirport?: boolean;
  flightNumber?: string;
}

export interface BidJobOffer {
  id: string;
  riderName: string;
  riderRating: number;
  category: RideCategory;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords: LatLng;
  dropoffCoords: LatLng;
  pickupDistanceKm: number;
  tripDistanceKm: number;
  tripEtaMin: number;
  suggestedFare: number;
  minBid: number;
  maxBid: number;
  currency: string;
  scheduledFor: string;
  paymentMethod: PaymentMethod;
  surgeMultiplier: number;
  driverBid?: number;
  customerCounterFare?: number;
  bidStatus:
    | 'open'
    | 'pending'
    | 'countered'
    | 'accepted'
    | 'taken_by_other'
    | 'cancelled'
    | 'declined';
  statusNote?: string;
}

export interface CompletedTrip {
  id: string;
  riderName: string;
  category: RideCategory;
  paymentMethod: PaymentMethod;
  pickupAddress: string;
  dropoffAddress: string;
  stopsCount?: number;
  pickupPinVerified?: boolean;
  completedAt: string;
  dayKey: string;
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitFee: number;
  tollFee?: number;
  tollLabel?: string;
  surgeMultiplier?: number;
  grossFare: number;
  boltCommission: number;
  surgeBonus: number;
  tip: number;
  netEarnings: number;
  riderRatingGiven?: number;
  incidentNote?: string;
  hasAudioClip?: boolean;
  lostItemReport?: {
    item: string;
    reportedAt: string;
    returnFeeCredited?: number;
  };
  cleaningFeeClaim?: {
    amount: number;
    reason: string;
    status: 'submitted' | 'approved';
    submittedAt: string;
  };
}

export type ExpenseCategory = 'EV Charging' | 'Fuel' | 'Car Wash' | 'Toll' | 'Parking';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  dateIso: string;
  dayKey: string;
  createdAtMs: number;
}

export type DriverExpense = ExpenseRecord;

export interface IncidentReport {
  id: string;
  tripId?: string;
  riderName?: string;
  type: 'Vehicle / Dashcam' | 'Rider Safety' | 'Traffic Incident' | 'SOS / Emergency';
  summary: string;
  hasAudioNote: boolean;
  audioDurationSec?: number;
  coords: LatLng;
  vehiclePlate: string;
  createdAtLabel: string;
  createdAtMs: number;
}

export interface ChatMessage {
  id: string;
  sender: 'driver' | 'rider';
  text: string;
  timestamp: string;
}

export interface DriverProfile {
  uid?: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cityId: string;
  driverType: 'Independent' | 'Fleet';
  avatarUrl: string;
  isVerified: boolean;
  joinedLabel: string;
  isOnline?: boolean;
  bankBalance: number;
  insuranceCoverage: InsuranceCoverage;
  documentExpiries: {
    'Vehicle Insurance': string;
    'PHV Licence': string;
    'Driving Licence': string;
    'Vehicle MOT': string;
  };
  insuredVehiclePlate: string;
  insuredVehicleModel: string;
  additionalDrivers: string[];
  documentsUploaded: boolean;
  faceVerified: boolean;
  activeVehicleId?: string;
  settings?: Partial<DriverSettings>;
}

export interface Vehicle {
  id: string;
  makeModel: string;
  plate: string;
  color: string;
  year: number;
  fuelType: 'Electric' | 'Hybrid' | 'Petrol';
  categories: RideCategory[];
  imageUrl: string;
  isActive: boolean;
  rangeKm: number;
  maxRangeKm: number;
  odometerKm: number;
  nextServiceKm: number;
  tyreCheckKm: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  type: 'Ultra-Rapid EV' | 'Fuel & EV Hub';
  distanceKm: number;
  priceLabel: string;
  powerKw?: number;
  coords: LatLng;
}

export interface DriverDocument {
  id: string;
  title: string;
  subtitle: string;
  expiryDate: string;
  status: 'Verified' | 'Pending Review' | 'Expiring Soon' | 'Expired';
  fileName?: string;
}

export interface CampaignQuest {
  id: string;
  title: string;
  subtitle: string;
  completedTrips: number;
  targetTrips: number;
  rewardAmount: number;
  endsIn: string;
}

export interface DriverSettings {
  darkMode: boolean;
  autoNightMode?: boolean;
  soundAlerts: boolean;
  voiceGuidance?: boolean;
  autoAccept: boolean;
  acceptCash: boolean;
  allowBidOffers: boolean;
  dispatchWaitSec: 0 | 60 | 120 | 180 | 300;
  minFareFilter: number;
  maxPickupKm: number;
  minRiderRating: number;
  pushNotifications: boolean;
  backgroundRefresh: boolean;
  refreshIntervalSec: 15 | 30 | 60;
  enabledCategories: RideCategory[];
  dailyGoal: number;
  headingUpNav: boolean;
  showHeatmap: boolean;
  destinationFilter: {
    enabled: boolean;
    targetCoords: LatLng | null;
    targetLabel: string | null;
  };
}

export interface InAppToast {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'alert' | 'message';
}
