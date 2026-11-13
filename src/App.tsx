import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarClock,
  Car,
  Eye,
  EyeOff,
  Map as MapIcon,
  Moon,
  PhoneCall,
  Shield,
  Sun,
  User,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AccountCreationModal } from './components/AccountCreationModal';
import { AccountView } from './components/AccountView';
import { ActivityView } from './components/ActivityView';
import { BidJobsModal } from './components/BidJobsModal';
import { BootScreen } from './components/BootScreen';
import { EarningsView } from './components/EarningsView';
import { IncomingRequestModal } from './components/IncomingRequestModal';
import { InsuranceRenewalChat, InsuranceView } from './components/InsuranceView';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  CancelRideModal,
  DestinationModal,
  PreferencesModal,
  RiderChatModal,
  SafetyModal,
} from './components/Overlays';
import { PermissionsPromptModal } from './components/PermissionsPromptModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ScheduledRidesView } from './components/ScheduledRidesView';
import { TripPanels } from './components/TripPanels';
import { WorldDriverMap } from './components/WorldDriverMap';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_DOCUMENTS,
  INITIAL_TRIPS,
  INITIAL_VEHICLES,
  WEEKLY_EARNINGS_SERIES,
  calculateBearing,
  exactDistanceKm,
  fetchMultiStopRoadRoute,
  fetchRoadRoute,
  generateBidJobsNear,
  generateDistrictDemandNear,
  generateLiveRideRequest,
  generateRanksNear,
  generateScheduledRidesNear,
  generateSurgeZonesNear,
  getCityById,
  getFutureIsoDate,
  getTodayDayKey,
  interpolateLatLng,
  minDistanceToRouteMeters,
} from './data/worldMapData';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  initializeFCMToken,
} from './firebase';
import {
  AppTab,
  BidJobOffer,
  CampaignQuest,
  ChatMessage,
  CompletedTrip,
  DistrictDemandZone,
  DriverDocument,
  DriverProfile,
  DriverSettings,
  DriverStatus,
  ExpenseRecord,
  InAppToast,
  IncidentReport,
  InsuranceCoverage,
  LatLng,
  ManeuverStep,
  RideCategory,
  RideRequest,
  ScheduledRide,
  SurgeZone,
  TaxiRank,
  Vehicle,
} from './types/driver';
import {
  NotificationPermissionState,
  getNotificationPermission,
  requestPushPermission,
} from './utils/notifications';
import {
  AppPermissionsSnapshot,
  queryAllPermissions,
  requestAllDevicePermissions,
} from './utils/permissions';
import { releaseScreenWakeLock, requestScreenWakeLock } from './utils/pwaDevice';
import {
  playArrivalChime,
  playBidAcceptedTone,
  playHyperSound,
  playNavigationTurnPing,
  playSuccessTone,
} from './utils/sound';

const DEFAULT_PROFILE: DriverProfile = {
  id: 'drv-default',
  fullName: 'Marcus Vance',
  email: 'marcus.vance@boltpartner.co',
  phone: '+44 7700 900182',
  cityId: 'london',
  driverType: 'Independent',
  avatarUrl: '/src/assets/images/driver_avatar_1794515088292.jpg',
  isVerified: true,
  joinedLabel: 'Verified TfL Private Hire Driver',
  isOnline: false,
  bankBalance: 0,
  insuranceCoverage: 'taxi',
  documentExpiries: {
    'Vehicle Insurance': getFutureIsoDate(18),
    'PHV Licence': '2028-09-14',
    'Driving Licence': '2031-11-08',
    'Vehicle MOT': '2027-05-20',
  },
  insuredVehiclePlate: 'LR74 BLT',
  insuredVehicleModel: 'Tesla Model 3 Long Range',
  additionalDrivers: [],
  documentsUploaded: true,
  faceVerified: true,
};

const DEFAULT_SETTINGS: DriverSettings = {
  darkMode: false,
  soundAlerts: true,
  autoAccept: false,
  acceptCash: true,
  allowBidOffers: true,
  dispatchWaitSec: 0,
  minFareFilter: 0,
  maxPickupKm: 6,
  minRiderRating: 0,
  pushNotifications: false,
  backgroundRefresh: true,
  refreshIntervalSec: 30,
  enabledCategories: ['Bolt', 'Comfort', 'Bolt Green', 'Bolt Flex', 'Bolt City'],
  dailyGoal: 150,
  headingUpNav: false,
  showHeatmap: false,
  destinationFilter: {
    enabled: false,
    targetCoords: null,
    targetLabel: null,
  },
};

const resolveDispatchWaitSeconds = (settingSec: 0 | 60 | 120 | 180 | 300): number =>
  settingSec === 0 ? 60 + Math.floor(Math.random() * 241) : settingSec;

const SETTINGS_STORAGE_PREFIX = 'bolt_driver_settings_v1_';
const VEHICLE_STORAGE_PREFIX = 'bolt_driver_vehicle_v1_';
const VEHICLE_STATES_PREFIX = 'bolt_driver_vehicle_states_v1_';
const EXPENSES_STORAGE_PREFIX = 'bolt_driver_expenses_v1_';
const INCIDENTS_STORAGE_PREFIX = 'bolt_driver_incidents_v1_';
const BOOT_PERMS_DONE_KEY = 'bolt_boot_permissions_done_v1';

const getUserScopeKey = (
  p: Pick<DriverProfile, 'uid' | 'id' | 'email'>,
  fUser?: FirebaseUser | null
): string => {
  const raw = fUser?.uid || p.uid || p.email || p.id || 'default';
  return raw.toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
};

const sanitizeSettingsForFirestore = (s: DriverSettings): DriverSettings => {
  const validDispatch = ([0, 60, 120, 180, 300] as const).includes(s.dispatchWaitSec)
    ? s.dispatchWaitSec
    : 0;
  const validRefresh = ([15, 30, 60] as const).includes(s.refreshIntervalSec)
    ? s.refreshIntervalSec
    : 30;
  const cleanCategories = Array.isArray(s.enabledCategories)
    ? s.enabledCategories.filter((c): c is typeof s.enabledCategories[number] => typeof c === 'string' && c.length > 0).slice(0, 10)
    : [];

  return {
    darkMode: Boolean(s.darkMode),
    soundAlerts: Boolean(s.soundAlerts),
    autoAccept: Boolean(s.autoAccept),
    acceptCash: Boolean(s.acceptCash),
    allowBidOffers: Boolean(s.allowBidOffers),
    dispatchWaitSec: validDispatch,
    minFareFilter: Math.min(1000, Math.max(0, Number(s.minFareFilter) || 0)),
    maxPickupKm: Math.min(100, Math.max(1, Number(s.maxPickupKm) || 6)),
    minRiderRating: Math.min(5, Math.max(0, Number(s.minRiderRating) || 0)),
    pushNotifications: Boolean(s.pushNotifications),
    backgroundRefresh: Boolean(s.backgroundRefresh),
    refreshIntervalSec: validRefresh,
    enabledCategories: cleanCategories.length > 0 ? cleanCategories : ['Bolt'],
    dailyGoal: Math.min(2000, Math.max(20, Number(s.dailyGoal) || 150)),
    headingUpNav: Boolean(s.headingUpNav),
    showHeatmap: Boolean(s.showHeatmap),
    destinationFilter: {
      enabled: Boolean(s.destinationFilter?.enabled),
      targetCoords:
        s.destinationFilter?.targetCoords &&
        typeof s.destinationFilter.targetCoords.lat === 'number' &&
        typeof s.destinationFilter.targetCoords.lng === 'number'
          ? {
              lat: Number(s.destinationFilter.targetCoords.lat),
              lng: Number(s.destinationFilter.targetCoords.lng),
            }
          : null,
      targetLabel:
        typeof s.destinationFilter?.targetLabel === 'string' &&
        s.destinationFilter.targetLabel.trim().length > 0
          ? s.destinationFilter.targetLabel.slice(0, 120)
          : null,
    },
  };
};

const mergeLoadedSettings = (saved?: Partial<DriverSettings> | null): DriverSettings => {
  const notifGranted = getNotificationPermission() === 'granted';
  if (!saved) {
    return {
      ...DEFAULT_SETTINGS,
      pushNotifications: notifGranted,
    };
  }
  return sanitizeSettingsForFirestore({
    ...DEFAULT_SETTINGS,
    ...saved,
    pushNotifications:
      saved.pushNotifications !== undefined ? Boolean(saved.pushNotifications) : notifGranted,
    destinationFilter: {
      ...DEFAULT_SETTINGS.destinationFilter,
      ...(saved.destinationFilter || {}),
    },
  });
};

const loadUserSettings = (scopeKey: string): DriverSettings => {
  try {
    const raw = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${scopeKey}`);
    if (raw) {
      return mergeLoadedSettings(JSON.parse(raw) as Partial<DriverSettings>);
    }
  } catch {
    // Ignore storage errors
  }
  return mergeLoadedSettings(null);
};

const saveUserSettings = (scopeKey: string, s: DriverSettings): void => {
  try {
    localStorage.setItem(
      `${SETTINGS_STORAGE_PREFIX}${scopeKey}`,
      JSON.stringify(sanitizeSettingsForFirestore(s))
    );
  } catch {
    // Ignore storage errors
  }
};

const loadUserVehicleId = (scopeKey: string): string | null => {
  try {
    return localStorage.getItem(`${VEHICLE_STORAGE_PREFIX}${scopeKey}`);
  } catch {
    return null;
  }
};

const saveUserVehicleId = (scopeKey: string, vehicleId: string): void => {
  try {
    localStorage.setItem(`${VEHICLE_STORAGE_PREFIX}${scopeKey}`, vehicleId);
  } catch {
    // Ignore storage errors
  }
};

const loadScopedJson = <T,>(prefix: string, scopeKey: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`${prefix}${scopeKey}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Ignore storage errors
  }
  return fallback;
};

const saveScopedJson = <T,>(prefix: string, scopeKey: string, value: T): void => {
  try {
    localStorage.setItem(`${prefix}${scopeKey}`, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('map');
  const [status, setStatus] = useState<DriverStatus>('OFFLINE');

  // Firebase Auth + Firestore Profile Sync
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState<boolean>(false);

  const [profile, setProfile] = useState<DriverProfile>(() => {
    try {
      const saved = localStorage.getItem('hyper_driver_eats_user');
      if (saved) {
        const parsed = JSON.parse(saved) as DriverProfile;
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          isOnline: false,
          documentExpiries: {
            ...DEFAULT_PROFILE.documentExpiries,
            ...(parsed.documentExpiries || {}),
          },
        };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PROFILE;
  });

  // Live World Map Location State
  const initialCity = getCityById(profile.cityId);
  const [currentCityId, setCurrentCityId] = useState<string>(profile.cityId);
  const [driverPos, setDriverPos] = useState<LatLng>(initialCity.center);
  const [driverHeading, setDriverHeading] = useState<number>(45);
  const [isLiveGps, setIsLiveGps] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>(() =>
    generateSurgeZonesNear(initialCity.center, initialCity.id)
  );
  const [districtDemandZones, setDistrictDemandZones] = useState<DistrictDemandZone[]>(() =>
    generateDistrictDemandNear(initialCity.center, initialCity.id)
  );
  const [ranks, setRanks] = useState<TaxiRank[]>(() =>
    generateRanksNear(initialCity.center, initialCity.id)
  );
  const [activeRankId, setActiveRankId] = useState<string | null>(null);
  const [rankQueuePos, setRankQueuePos] = useState<number | null>(null);

  // Active request, routing & smart back-to-back queue
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [queuedOffer, setQueuedOffer] = useState<RideRequest | null>(null);
  const [queuedAccepted, setQueuedAccepted] = useState<boolean>(false);
  const queuedOfferedForTripRef = useRef<string | null>(null);
  const lastTripWaitFeeRef = useRef<number>(0);
  const lastTripPinVerifiedRef = useRef<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<LatLng[]>([]);
  const [previewDropoffRoute, setPreviewDropoffRoute] = useState<LatLng[]>([]);
  const [activeManeuvers, setActiveManeuvers] = useState<ManeuverStep[]>([]);
  const [currentManeuverIndex, setCurrentManeuverIndex] = useState<number>(0);
  const [currentRouteIndex, setCurrentRouteIndex] = useState<number>(0);
  const [navSpeedKmh, setNavSpeedKmh] = useState<number>(38);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);
  const lastRerouteAtRef = useRef<number>(0);
  const routeProgressRef = useRef<{ index: number; progress: number }>({ index: 0, progress: 0 });
  const currentManeuverIndexRef = useRef<number>(0);
  const smoothHeadingRef = useRef<number>(45);
  const smoothSpeedRef = useRef<number>(38);
  const soundAlertsRef = useRef<boolean>(true);
  const gpsWatchIdRef = useRef<number | null>(null);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micTranscript, setMicTranscript] = useState<string | null>(null);
  const voiceRecRef = useRef<{ stop: () => void } | null>(null);

  // Bid Marketplace (Bolt Flex) & Scheduled Rides Queue
  const [bidJobs, setBidJobs] = useState<BidJobOffer[]>(() =>
    generateBidJobsNear(initialCity.center, initialCity.id, [
      'Bolt',
      'Comfort',
      'Bolt Green',
      'Bolt Flex',
      'Bolt City',
    ])
  );
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>(() =>
    generateScheduledRidesNear(initialCity.center, initialCity.id)
  );
  const remindedScheduleIdsRef = useRef<Set<string>>(new Set());
  const [showBidJobsModal, setShowBidJobsModal] = useState(false);

  // Business State — starts strictly at £0.00 and matches today's earnings
  const [trips, setTrips] = useState<CompletedTrip[]>(INITIAL_TRIPS);
  const [weeklySeries, setWeeklySeries] = useState(WEEKLY_EARNINGS_SERIES);
  const [campaigns, setCampaigns] = useState<CampaignQuest[]>(INITIAL_CAMPAIGNS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() =>
    loadScopedJson<ExpenseRecord[]>(EXPENSES_STORAGE_PREFIX, getUserScopeKey(profile), [])
  );
  const [incidents, setIncidents] = useState<IncidentReport[]>(() =>
    loadScopedJson<IncidentReport[]>(INCIDENTS_STORAGE_PREFIX, getUserScopeKey(profile), [])
  );
  const [shiftElapsedSec, setShiftElapsedSec] = useState<number>(0);
  const [shiftDistanceKm, setShiftDistanceKm] = useState<number>(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const scope = getUserScopeKey(profile);
    const savedStates = loadScopedJson<Vehicle[] | null>(VEHICLE_STATES_PREFIX, scope, null);
    if (savedStates && Array.isArray(savedStates) && savedStates.length > 0) {
      return savedStates;
    }
    const savedVehId = loadUserVehicleId(scope);
    if (savedVehId && INITIAL_VEHICLES.some((v) => v.id === savedVehId)) {
      return INITIAL_VEHICLES.map((v) => ({ ...v, isActive: v.id === savedVehId }));
    }
    return INITIAL_VEHICLES;
  });
  const [documents, setDocuments] = useState<DriverDocument[]>(INITIAL_DOCUMENTS);
  const [acceptanceRate, setAcceptanceRate] = useState<number>(100);
  const [completionRate, setCompletionRate] = useState<number>(100);
  const [riderRating] = useState<number>(4.96);

  // Insurance Renewal & Dismissed Warnings
  const [dismissedExpiries, setDismissedExpiries] = useState<string[]>([]);
  const [isInsuranceRenewalChatOpen, setIsInsuranceRenewalChatOpen] = useState(false);

  // UI & Modals
  const [hideEarningsPill, setHideEarningsPill] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showDestination, setShowDestination] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [callBanner, setCallBanner] = useState<string | null>(null);

  // Notifications & Device Permissions
  const [toasts, setToasts] = useState<InAppToast[]>([]);
  const [notificationsLog, setNotificationsLog] = useState<string[]>([]);
  const lastNoteRef = useRef<{ title: string; body: string; time: number } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(
    () => getNotificationPermission()
  );
  const [permissionsSnapshot, setPermissionsSnapshot] = useState<AppPermissionsSnapshot>(() => {
    const perm = getNotificationPermission();
    return {
      location: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unsupported',
      microphone: typeof navigator !== 'undefined' && navigator.mediaDevices ? 'prompt' : 'unsupported',
      notifications: perm === 'default' ? 'prompt' : perm,
      wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    };
  });
  const [lastBackgroundSync, setLastBackgroundSync] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  });

  // Rider Chat & 2-Minute No-Response Timer
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [awaitingRiderReply, setAwaitingRiderReply] = useState(false);
  const [riderNoResponseSec, setRiderNoResponseSec] = useState(0);
  // Driver Settings (Remembered per user)
  const [settings, setSettings] = useState<DriverSettings>(() =>
    loadUserSettings(getUserScopeKey(profile))
  );
  const [nextRequestWaitLeft, setNextRequestWaitLeft] = useState<number>(() =>
    resolveDispatchWaitSeconds(loadUserSettings(getUserScopeKey(profile)).dispatchWaitSec)
  );
  const dispatchTriggeredRef = useRef<boolean>(false);
  const activeUserScopeKey = useMemo(
    () => getUserScopeKey(profile, firebaseUser),
    [profile.uid, profile.id, profile.email, firebaseUser]
  );
  const lastSavedScopeRef = useRef<string>(activeUserScopeKey);

  const activeCity = getCityById(currentCityId);
  const activeVehicle = vehicles.find((v) => v.isActive) || vehicles[0];
  const activeRank = ranks.find((r) => r.id === activeRankId) || null;
  const currency = activeCity.currency;
  const isOnline = status !== 'OFFLINE';
  const nextClaimedScheduled = useMemo(
    () =>
      scheduledRides
        .filter((r) => r.claimed)
        .sort((a, b) => new Date(a.pickupTimeIso).getTime() - new Date(b.pickupTimeIso).getTime())[0] ||
      null,
    [scheduledRides]
  );

  // Insurance Expiry Computation
  const insuranceExpiry = profile.documentExpiries?.['Vehicle Insurance'];

  const insuranceDaysLeft = useMemo(() => {
    if (!insuranceExpiry) return null;
    const expiryDate = new Date(insuranceExpiry);
    if (Number.isNaN(expiryDate.getTime())) return null;
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [insuranceExpiry]);

  const showInsuranceWarning =
    insuranceDaysLeft !== null &&
    insuranceDaysLeft <= 30 &&
    !dismissedExpiries.includes('Vehicle Insurance');

  const isInsuranceExpired = insuranceDaysLeft !== null && insuranceDaysLeft <= 0;

  // Today's Earnings computed directly from completed trips matching today's dayKey
  const todayKey = getTodayDayKey();
  const todayTrips = trips.filter((t) => t.dayKey === todayKey);
  const todayEarnings = Number(
    todayTrips.reduce((sum, t) => sum + t.netEarnings, 0).toFixed(2)
  );
  const todayTripsCount = todayTrips.length;
  const driverScore = Math.round((acceptanceRate + completionRate + riderRating * 20) / 3);

  const addToast = useCallback(
    (title: string, body: string, type: 'info' | 'success' | 'alert' | 'message' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [{ id, title, body, type }, ...prev.slice(0, 2)]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  // Unified In-App + Browser/PWA Notification Dispatcher (matches exact spec)
  const sendNotification = useCallback(
    (
      title: string,
      body: string,
      type: 'info' | 'success' | 'alert' | 'message' = 'info'
    ) => {
      const now = Date.now();
      if (
        lastNoteRef.current &&
        lastNoteRef.current.title === title &&
        lastNoteRef.current.body === body &&
        now - lastNoteRef.current.time < 1000
      ) {
        return;
      }
      lastNoteRef.current = { title, body, time: now };

      if (isOnline && 'Notification' in window && Notification.permission === 'granted') {
        try {
          if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then((registration) => {
              registration
                .showNotification(title, {
                  body,
                  icon: '/assets/aistudio/image_adf30014.png',
                  vibrate: [200, 100, 200],
                  tag: title,
                  renotify: true,
                  silent: false,
                } as NotificationOptions)
                .catch(() => {
                  new Notification(title, { body, tag: title });
                });
            });
          } else {
            new Notification(title, { body, tag: title });
          }
        } catch {
          try {
            new Notification(title, { body, tag: title });
          } catch {
            // Ignore
          }
        }
      }

      if (type === 'success') playHyperSound('complete', settings.soundAlerts);
      if (type === 'alert') playHyperSound('order', settings.soundAlerts);
      if (type === 'message') playHyperSound('message', settings.soundAlerts);

      addToast(title, body, type);
      setNotificationsLog((prev) => [`${title}: ${body}`, ...prev.slice(0, 49)]);
    },
    [isOnline, settings.soundAlerts, addToast]
  );

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings.darkMode]);

  // Register firebase-messaging-sw.js & query initial permission statuses on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
    }
    queryAllPermissions()
      .then((snap) => setPermissionsSnapshot(snap))
      .catch(() => {});
  }, []);

  const lastGpsSyncRef = useRef<number>(0);

  // 1. Firebase Auth & Load User Profile + Remembered Settings from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        getDoc(doc(db, 'users', fUser.uid))
          .then((userDoc) => {
            if (userDoc.exists()) {
              const userData = { ...userDoc.data(), uid: fUser.uid } as DriverProfile;
              const nextScope = getUserScopeKey(userData, fUser);
              const localSettings = loadUserSettings(nextScope);
              const restoredSettings = mergeLoadedSettings({
                ...localSettings,
                ...(userData.settings || {}),
              });
              const restoredVehicleId = userData.activeVehicleId || loadUserVehicleId(nextScope);

              setProfile((prev) => ({
                ...prev,
                ...userData,
                isOnline: false,
                documentExpiries: {
                  ...prev.documentExpiries,
                  ...(userData.documentExpiries || {}),
                },
              }));
              setSettings(restoredSettings);
              setNextRequestWaitLeft(resolveDispatchWaitSeconds(restoredSettings.dispatchWaitSec));
              saveUserSettings(nextScope, restoredSettings);

              if (restoredVehicleId) {
                setVehicles((prev) =>
                  prev.some((v) => v.id === restoredVehicleId)
                    ? prev.map((v) => ({ ...v, isActive: v.id === restoredVehicleId }))
                    : prev
                );
                saveUserVehicleId(nextScope, restoredVehicleId);
              }

              if (userData.cityId) {
                setCurrentCityId(userData.cityId);
                const c = getCityById(userData.cityId);
                setDistrictDemandZones(generateDistrictDemandNear(c.center, c.id));
                setScheduledRides(generateScheduledRidesNear(c.center, c.id));
              }
              setExpenses(loadScopedJson<ExpenseRecord[]>(EXPENSES_STORAGE_PREFIX, nextScope, []));
              setIncidents(loadScopedJson<IncidentReport[]>(INCIDENTS_STORAGE_PREFIX, nextScope, []));

              // Sync expenses & incidents subcollections from Firestore
              getDocs(
                query(
                  collection(db, 'users', fUser.uid, 'expenses'),
                  where('uid', '==', fUser.uid),
                  limit(100)
                )
              )
                .then((snap) => {
                  const remoteExps = snap.docs
                    .map((d) => d.data() as ExpenseRecord)
                    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
                  if (remoteExps.length > 0) {
                    setExpenses(remoteExps);
                    saveScopedJson(EXPENSES_STORAGE_PREFIX, nextScope, remoteExps);
                  }
                })
                .catch((error) => {
                  handleFirestoreError(
                    error,
                    OperationType.LIST,
                    `users/${fUser.uid}/expenses`
                  );
                });

              getDocs(
                query(
                  collection(db, 'users', fUser.uid, 'incidents'),
                  where('uid', '==', fUser.uid),
                  limit(60)
                )
              )
                .then((snap) => {
                  const remoteIncs = snap.docs
                    .map((d) => d.data() as IncidentReport)
                    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
                  if (remoteIncs.length > 0) {
                    setIncidents(remoteIncs);
                    saveScopedJson(INCIDENTS_STORAGE_PREFIX, nextScope, remoteIncs);
                  }
                })
                .catch((error) => {
                  handleFirestoreError(
                    error,
                    OperationType.LIST,
                    `users/${fUser.uid}/incidents`
                  );
                });

              setShowAccountCreation(false);
              setIsProfileLoaded(true);
              initializeFCMToken(fUser.uid);
            } else {
              // Hold Firestore writes until onboarding creates the user document
              setIsProfileLoaded(false);
              setShowAccountCreation(true);
            }
          })
          .catch(() => {
            setIsProfileLoaded(true);
          });
      } else {
        setIsProfileLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Auto-save every profile update back to Firestore (users/{uid})
  useEffect(() => {
    if (firebaseUser && profile.fullName && isProfileLoaded) {
      const syncProfile = async () => {
        try {
          await setDoc(
            doc(db, 'users', firebaseUser.uid),
            {
              uid: firebaseUser.uid,
              fullName: profile.fullName.slice(0, 120),
              email: (firebaseUser.email || profile.email).slice(0, 160),
              phone: profile.phone.slice(0, 40),
              cityId: profile.cityId.slice(0, 40),
              driverType: profile.driverType,
              avatarUrl: profile.avatarUrl,
              isVerified: profile.isVerified,
              joinedLabel: profile.joinedLabel,
              isOnline,
              latitude: driverPos.lat,
              longitude: driverPos.lng,
              heading: driverHeading,
              todayEarnings,
              todayTripsCount,
              bankBalance: profile.bankBalance,
              insuranceCoverage: profile.insuranceCoverage,
              insuranceExpiry: profile.documentExpiries['Vehicle Insurance'],
              documentExpiries: profile.documentExpiries,
              insuredVehiclePlate: profile.insuredVehiclePlate,
              insuredVehicleModel: profile.insuredVehicleModel,
              additionalDrivers: profile.additionalDrivers.slice(0, 10),
              documentsUploaded: profile.documentsUploaded,
              faceVerified: profile.faceVerified,
              activeVehicleId: activeVehicle.id,
              settings: sanitizeSettingsForFirestore(settings),
            },
            { merge: true }
          );
          initializeFCMToken(firebaseUser.uid);
        } catch (error) {
          if (typeof navigator === 'undefined' || navigator.onLine) {
            handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
          }
        }
      };
      syncProfile();
    }
  }, [profile, firebaseUser, isProfileLoaded]);

  // 2b. Debounced sync of per-user settings & activeVehicleId to Firestore
  useEffect(() => {
    if (!firebaseUser || !isProfileLoaded) return;
    const timer = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          activeVehicleId: activeVehicle.id,
          settings: sanitizeSettingsForFirestore(settings),
        });
      } catch (error) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [settings, activeVehicle.id, firebaseUser, isProfileLoaded]);

  // Live GPS presence & daily earnings sync to Firestore (throttled for GPS ticks)
  useEffect(() => {
    if (!firebaseUser || !isProfileLoaded) return;
    const now = Date.now();
    const delay = now - lastGpsSyncRef.current > 4000 ? 0 : 4000;
    const timer = setTimeout(() => {
      lastGpsSyncRef.current = Date.now();
      updateDoc(doc(db, 'users', firebaseUser.uid), {
        latitude: driverPos.lat,
        longitude: driverPos.lng,
        heading: driverHeading,
        isOnline,
        todayEarnings,
        todayTripsCount,
      }).catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [firebaseUser, isProfileLoaded, driverPos.lat, driverPos.lng, driverHeading, isOnline, todayEarnings, todayTripsCount]);

  // 3. Instant local backup in localStorage + per-user settings/vehicle persistence
  useEffect(() => {
    try {
      localStorage.setItem(
        'hyper_driver_eats_user',
        JSON.stringify({
          ...profile,
          isOnline: false,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [profile]);

  useEffect(() => {
    if (lastSavedScopeRef.current !== activeUserScopeKey) {
      lastSavedScopeRef.current = activeUserScopeKey;
      return;
    }
    saveUserSettings(activeUserScopeKey, settings);
    saveUserVehicleId(activeUserScopeKey, activeVehicle.id);
    saveScopedJson(VEHICLE_STATES_PREFIX, activeUserScopeKey, vehicles);
  }, [settings, activeVehicle.id, vehicles, activeUserScopeKey]);

  // 2-Minute Customer No-Response Timer
  useEffect(() => {
    if (
      !awaitingRiderReply ||
      (status !== 'EN_ROUTE_PICKUP' && status !== 'ARRIVED_PICKUP')
    ) {
      return;
    }
    const timer = setInterval(() => {
      setRiderNoResponseSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [awaitingRiderReply, status]);

  // Live Shift Elapsed Time Tracker (counts while online and not on break)
  useEffect(() => {
    if (status === 'OFFLINE' || status === 'ON_BREAK') return;
    const timer = setInterval(() => {
      setShiftElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Taxi Rank Geofenced Auto-Detection & Queue Progression
  useEffect(() => {
    if (status !== 'ONLINE_IDLE') return;
    if (!activeRankId) {
      const entered = ranks.find(
        (r) => exactDistanceKm(driverPos, r.center) * 1000 <= r.geofenceRadiusMeters
      );
      if (entered) {
        setActiveRankId(entered.id);
        setRankQueuePos(entered.queueCount + 1);
        addToast(
          'Geofenced Queue Joined',
          `Spot #${entered.queueCount + 1} of ${entered.totalDrivers} at ${entered.name}`,
          'info'
        );
      }
    }
  }, [status, activeRankId, driverPos, ranks, addToast]);

  useEffect(() => {
    if (!activeRankId || status !== 'ONLINE_IDLE') return;
    const timer = setInterval(() => {
      setRankQueuePos((pos) => (pos && pos > 1 ? pos - 1 : 1));
    }, 8000);
    return () => clearInterval(timer);
  }, [activeRankId, status]);

  // Scheduled Ride Reminder Countdown Notifier
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      scheduledRides.forEach((ride) => {
        if (!ride.claimed) return;
        const msLeft = new Date(ride.pickupTimeIso).getTime() - now;
        const key5m = `${ride.id}-5m`;
        const keyReady = `${ride.id}-ready`;
        if (msLeft <= 0 && !remindedScheduleIdsRef.current.has(keyReady)) {
          remindedScheduleIdsRef.current.add(keyReady);
          sendNotification(
            'Scheduled Pickup Ready',
            `${ride.riderName} (${ride.pickupAddress}) is ready to launch now.`,
            'alert'
          );
        } else if (msLeft > 0 && msLeft <= 5 * 60 * 1000 && !remindedScheduleIdsRef.current.has(key5m)) {
          remindedScheduleIdsRef.current.add(key5m);
          sendNotification(
            'Upcoming Pre-Booked Ride',
            `${ride.tag} pickup in under 5 min at ${ride.pickupAddress}`,
            'info'
          );
        }
      });
    };
    const timer = setInterval(checkReminders, 15000);
    return () => clearInterval(timer);
  }, [scheduledRides, sendNotification]);

  // Shift Start / Break / End with Screen Wake Lock
  const startShift = useCallback(() => {
    requestScreenWakeLock().catch(() => {});
    dispatchTriggeredRef.current = false;
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(settings.dispatchWaitSec));
    setStatus('ONLINE_IDLE');
    setProfile((p) => ({ ...p, isOnline: true }));
    playSuccessTone(settings.soundAlerts);
    addToast('Online', 'Screen wake lock active while driving', 'success');
  }, [settings.soundAlerts, settings.dispatchWaitSec, addToast]);

  const handleStartBreak = useCallback(() => {
    setStatus('ON_BREAK');
    addToast('On Break', 'Ride requests paused without affecting your score', 'info');
  }, [addToast]);

  const handleResumeFromBreak = useCallback(() => {
    dispatchTriggeredRef.current = false;
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(settings.dispatchWaitSec));
    setStatus('ONLINE_IDLE');
    playSuccessTone(settings.soundAlerts);
    addToast('Back Online', 'Accepting nearby rides & surges again', 'success');
  }, [settings.soundAlerts, settings.dispatchWaitSec, addToast]);

  const endShift = useCallback(() => {
    releaseScreenWakeLock().catch(() => {});
    setStatus('OFFLINE');
    setActiveRankId(null);
    setRankQueuePos(null);
    setProfile((p) => ({ ...p, isOnline: false }));
    addToast('Offline', 'Shift ended and screen wake lock released', 'info');
  }, [addToast]);

  // Gated Go Online (checks Insurance Expiry first)
  const handleGoOnline = useCallback(() => {
    if (isInsuranceExpired) {
      setIsInsuranceRenewalChatOpen(true);
      sendNotification(
        'Action Required',
        'Your vehicle insurance has expired. You must renew to go online.',
        'alert'
      );
      return;
    }
    startShift();
  }, [isInsuranceExpired, startShift, sendNotification]);

  // Browser Geolocation: Live Phone GPS Mode vs Simulated Drive + Auto OSRM Reroute
  const stopLiveGpsWatch = useCallback(() => {
    if (gpsWatchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  }, []);

  const handleToggleLiveGps = useCallback(() => {
    if (isLiveGps) {
      stopLiveGpsWatch();
      setIsLiveGps(false);
      setIsRerouting(false);
      addToast('Simulated Drive Mode', 'Switched back to smooth simulated road navigation.', 'info');
      return;
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      addToast('GPS Unavailable', 'Browser geolocation is unavailable on this device.', 'alert');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LatLng = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setDriverPos(coords);
        if (pos.coords.heading && !Number.isNaN(pos.coords.heading)) {
          setDriverHeading(pos.coords.heading);
        }
        setIsLiveGps(true);
        setGpsLoading(false);
        setSurgeZones(generateSurgeZonesNear(coords, currentCityId));
        setDistrictDemandZones(generateDistrictDemandNear(coords, currentCityId));
        setRanks(generateRanksNear(coords, currentCityId));
        setScheduledRides(generateScheduledRidesNear(coords, currentCityId));
        setBidJobs(generateBidJobsNear(coords, currentCityId, settings.enabledCategories));
        addToast('Live Phone GPS Active', 'Tracking live coordinates with auto OSRM rerouting', 'success');
      },
      () => {
        setGpsLoading(false);
        addToast('GPS Permission Denied', 'Staying on simulated world city drive map.', 'info');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, [isLiveGps, stopLiveGpsWatch, currentCityId, settings.enabledCategories, addToast]);

  // Live Phone GPS watchPosition & Off-Route OSRM Auto-Rerouting
  useEffect(() => {
    if (!isLiveGps || typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      stopLiveGpsWatch();
      return;
    }

    stopLiveGpsWatch();
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: LatLng = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setDriverPos((prev) => {
          const distMovedKm = exactDistanceKm(prev, coords);
          if (pos.coords.heading !== null && !Number.isNaN(pos.coords.heading)) {
            setDriverHeading(pos.coords.heading);
          } else if (distMovedKm > 0.005) {
            setDriverHeading(calculateBearing(prev, coords));
          }
          return coords;
        });

        if (pos.coords.speed !== null && !Number.isNaN(pos.coords.speed)) {
          setNavSpeedKmh(Math.max(0, Math.round(pos.coords.speed * 3.6)));
        }

        if (
          (status === 'EN_ROUTE_PICKUP' || status === 'IN_PROGRESS') &&
          activeRequest &&
          activeRoute.length > 1
        ) {
          // Track closest vertex along route for live GPS maneuver countdown & route trimming
          let bestIdx = routeProgressRef.current.index;
          let bestDist = Infinity;
          for (let i = 0; i < activeRoute.length; i++) {
            const d = exactDistanceKm(coords, activeRoute[i]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          }
          if (bestIdx !== routeProgressRef.current.index) {
            routeProgressRef.current = { index: bestIdx, progress: 0 };
            setCurrentRouteIndex(bestIdx);
            let matchedManIdx = currentManeuverIndexRef.current;
            for (let m = matchedManIdx + 1; m < activeManeuvers.length; m++) {
              if (bestIdx >= activeManeuvers[m].pointIndex) {
                matchedManIdx = m;
              } else {
                break;
              }
            }
            if (matchedManIdx > currentManeuverIndexRef.current) {
              currentManeuverIndexRef.current = matchedManIdx;
              setCurrentManeuverIndex(matchedManIdx);
              playNavigationTurnPing(soundAlertsRef.current);
            }
          }

          const offRouteMeters = minDistanceToRouteMeters(coords, activeRoute);
          const now = Date.now();
          if (offRouteMeters > 85 && now - lastRerouteAtRef.current > 10000) {
            lastRerouteAtRef.current = now;
            setIsRerouting(true);
            const routePromise =
              status === 'EN_ROUTE_PICKUP'
                ? fetchRoadRoute(coords, activeRequest.pickupCoords)
                : fetchMultiStopRoadRoute([
                    coords,
                    ...(activeRequest.stops || []).map((s) => s.coords),
                    activeRequest.dropoffCoords,
                  ]);

            routePromise
              .then((rerouted) => {
                setActiveRoute(rerouted.points);
                setActiveManeuvers(rerouted.maneuvers);
                setCurrentRouteIndex(0);
                currentManeuverIndexRef.current = 0;
                setCurrentManeuverIndex(0);
                routeProgressRef.current = { index: 0, progress: 0 };
                setIsRerouting(false);
                addToast('Route Recalculated', 'OSRM updated turn-by-turn path from GPS', 'info');
              })
              .catch(() => setIsRerouting(false));
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 4000 }
    );

    return () => stopLiveGpsWatch();
  }, [isLiveGps, status, activeRequest, activeRoute, activeManeuvers, stopLiveGpsWatch, addToast]);

  const handleSelectCity = useCallback(
    (cityId: string) => {
      const city = getCityById(cityId);
      setIsLiveGps(false);
      setIsRerouting(false);
      setCurrentCityId(city.id);
      setDriverPos(city.center);
      setActiveRankId(null);
      setRankQueuePos(null);
      setSurgeZones(generateSurgeZonesNear(city.center, city.id));
      setDistrictDemandZones(generateDistrictDemandNear(city.center, city.id));
      setRanks(generateRanksNear(city.center, city.id));
      setScheduledRides(generateScheduledRidesNear(city.center, city.id));
      setBidJobs(generateBidJobsNear(city.center, city.id, settings.enabledCategories));
      addToast('City Switched', `Dispatch map moved to ${city.name}, ${city.country}`, 'info');
    },
    [settings.enabledCategories, addToast]
  );

  // Trigger Live Ride Request (with EV/Fuel Range Guard)
  const triggerRideOffer = useCallback(async () => {
    const allowedCats: RideCategory[] = isInsuranceExpired
      ? ['Delivery']
      : settings.enabledCategories;

    if (activeVehicle.rangeKm < 95 && allowedCats.includes('Bolt City')) {
      addToast(
        'EV / Fuel Range Guard',
        `Only ${activeVehicle.rangeKm.toFixed(0)} km range left — Bolt City trips filtered out.`,
        'info'
      );
    }

    const req = await generateLiveRideRequest({
      driverLocation: driverPos,
      cityId: currentCityId,
      enabledCategories: [...allowedCats],
      acceptCash: settings.acceptCash,
      allowBid: settings.allowBidOffers,
      maxPickupKm: settings.maxPickupKm,
      minFareFilter: settings.minFareFilter,
      minRiderRating: settings.minRiderRating,
      destinationTarget: settings.destinationFilter.targetCoords,
      surgeZones,
      preferredRankArea: activeRank ? activeRank.area : null,
      maxVehicleRangeKm: activeVehicle.rangeKm,
    });

    setActiveRequest(req);
    setActiveRoute(req.toPickupRoute);
    setPreviewDropoffRoute(req.toDropoffRoute);
    setQueuedOffer(null);
    setQueuedAccepted(false);
    queuedOfferedForTripRef.current = null;
    setStatus('INCOMING_REQUEST');
    setActiveTab('map');

    sendNotification(
      `New ${req.category} Ride · ${req.currency}${req.estimatedFare.toFixed(2)}`,
      `${req.pickupAddress} → ${req.dropoffAddress} (${req.pickupEtaMin} min away)`,
      'alert'
    );
  }, [
    isInsuranceExpired,
    driverPos,
    currentCityId,
    settings.enabledCategories,
    settings.acceptCash,
    settings.allowBidOffers,
    settings.maxPickupKm,
    settings.minFareFilter,
    settings.minRiderRating,
    settings.destinationFilter.targetCoords,
    surgeZones,
    activeRank,
    activeVehicle.rangeKm,
    addToast,
    sendNotification,
  ]);

  // 1–5 min wait countdown between completing/declining a job and receiving the next request
  useEffect(() => {
    if (status !== 'ONLINE_IDLE') return;
    const timer = setInterval(() => {
      setNextRequestWaitLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Dispatch ride offer once the wait timer hits 0 (paused when ON_BREAK)
  useEffect(() => {
    if (status !== 'ONLINE_IDLE') {
      dispatchTriggeredRef.current = false;
      return;
    }
    if (nextRequestWaitLeft === 0 && !dispatchTriggeredRef.current) {
      dispatchTriggeredRef.current = true;
      triggerRideOffer();
    }
  }, [status, nextRequestWaitLeft, triggerRideOffer]);

  // Background App Refresh Engine
  const runBackgroundSync = useCallback(() => {
    const now = new Date();
    const stamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLastBackgroundSync(stamp);

    if (status === 'OFFLINE' || status === 'ONLINE_IDLE') {
      setBidJobs(generateBidJobsNear(driverPos, currentCityId, settings.enabledCategories));
      if (document.hidden && status === 'ONLINE_IDLE') {
        sendNotification(
          'Bolt Background Refresh',
          `Surge active in ${activeCity.name} · Open bid offers updated.`,
          'info'
        );
      }
    }
  }, [
    status,
    driverPos,
    currentCityId,
    settings.enabledCategories,
    activeCity.name,
    sendNotification,
  ]);

  useEffect(() => {
    if (!settings.backgroundRefresh) return;
    const interval = setInterval(() => {
      runBackgroundSync();
    }, settings.refreshIntervalSec * 1000);

    const onVisibility = () => {
      if (!document.hidden) runBackgroundSync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [settings.backgroundRefresh, settings.refreshIntervalSec, runBackgroundSync]);

  // Accept / Decline Handlers
  const handleAcceptRequest = useCallback(
    (customFare?: number) => {
      if (!activeRequest) return;
      const finalReq =
        customFare !== undefined
          ? { ...activeRequest, estimatedFare: Number(customFare.toFixed(2)) }
          : activeRequest;

      setActiveRequest(finalReq);
      setActiveRoute(finalReq.toPickupRoute);
      setPreviewDropoffRoute([]);
      setActiveManeuvers(finalReq.maneuversToPickup);
      currentManeuverIndexRef.current = 0;
      setCurrentManeuverIndex(0);
      setCurrentRouteIndex(0);
      routeProgressRef.current = { index: 0, progress: 0 };
      if (finalReq.toPickupRoute.length > 1) {
        const initHeading = calculateBearing(finalReq.toPickupRoute[0], finalReq.toPickupRoute[1]);
        smoothHeadingRef.current = initHeading;
        setDriverHeading(initHeading);
      }
      setChatMessages([]);
      setUnreadChatCount(0);
      setAwaitingRiderReply(false);
      setRiderNoResponseSec(0);
      setAcceptanceRate((r) => Math.min(100, r + 1));
      setStatus('EN_ROUTE_PICKUP');

      if (customFare !== undefined) {
        playBidAcceptedTone(settings.soundAlerts);
        sendNotification(
          'Bid Accepted',
          `Rider accepted your ${finalReq.currency}${finalReq.estimatedFare.toFixed(2)} offer`,
          'success'
        );
      } else {
        playSuccessTone(settings.soundAlerts);
      }
    },
    [activeRequest, settings.soundAlerts, sendNotification]
  );

  useEffect(() => {
    if (status === 'INCOMING_REQUEST' && settings.autoAccept) {
      const t = setTimeout(() => {
        handleAcceptRequest();
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [status, settings.autoAccept, handleAcceptRequest]);

  const handleDeclineRequest = useCallback(() => {
    setActiveRequest(null);
    setActiveRoute([]);
    setPreviewDropoffRoute([]);
    setActiveManeuvers([]);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    setAwaitingRiderReply(false);
    setRiderNoResponseSec(0);
    setAcceptanceRate((r) => Math.max(70, r - 1));
    dispatchTriggeredRef.current = false;
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(settings.dispatchWaitSec));
    setStatus('ONLINE_IDLE');
  }, [settings.dispatchWaitSec]);

  // Service Worker Background Notification Action Callback (Accept / Decline buttons)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAction = params.get('action');
    if (urlAction === 'accept' && status === 'INCOMING_REQUEST') {
      handleAcceptRequest();
      window.history.replaceState({}, '', '/');
    } else if (urlAction === 'decline' && status === 'INCOMING_REQUEST') {
      handleDeclineRequest();
      window.history.replaceState({}, '', '/');
    }

    if (!('serviceWorker' in navigator)) return;
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CALLBACK') {
        if (event.data.action === 'accept' && status === 'INCOMING_REQUEST') {
          handleAcceptRequest();
        } else if (event.data.action === 'decline' && status === 'INCOMING_REQUEST') {
          handleDeclineRequest();
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [status, handleAcceptRequest, handleDeclineRequest]);

  useEffect(() => {
    soundAlertsRef.current = settings.soundAlerts;
  }, [settings.soundAlerts]);

  // Silky 60fps delta-time simulated navigation with look-ahead cornering & turn-aware speed easing
  useEffect(() => {
    if (isLiveGps) return;
    if (status !== 'EN_ROUTE_PICKUP' && status !== 'IN_PROGRESS') return;
    if (activeRoute.length < 2) return;

    let rafId = 0;
    let lastTime = performance.now();
    let lastSpeedInt = Math.round(smoothSpeedRef.current);
    let lastRouteIdx = routeProgressRef.current.index;

    // Helper: sample a look-ahead point ~N meters down the polyline for smooth curve anticipation
    const getLookAheadPoint = (startIdx: number, startPos: LatLng, lookAheadKm: number): LatLng => {
      let remaining = lookAheadKm;
      let prev = startPos;
      for (let i = startIdx + 1; i < activeRoute.length; i++) {
        const next = activeRoute[i];
        const seg = exactDistanceKm(prev, next);
        if (seg >= remaining && seg > 0.0001) {
          return interpolateLatLng(prev, next, remaining / seg);
        }
        remaining -= seg;
        prev = next;
      }
      return activeRoute[activeRoute.length - 1];
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      let { index, progress } = routeProgressRef.current;
      if (index >= activeRoute.length - 1) return;

      const currPt = activeRoute[index];
      const nextPt = activeRoute[index + 1];
      const segKm = exactDistanceKm(currPt, nextPt);
      const interpolatedPos =
        segKm < 0.0005 ? currPt : interpolateLatLng(currPt, nextPt, Math.min(1, Math.max(0, progress)));

      // Measure upcoming corner sharpness 38m ahead to gently ease speed into turns
      const nearLookAhead = getLookAheadPoint(index, interpolatedPos, 0.038);
      const immediateBearing = segKm > 0.0002 ? calculateBearing(currPt, nextPt) : smoothHeadingRef.current;
      const aheadBearing = calculateBearing(interpolatedPos, nearLookAhead);
      const turnSharpnessDeg = Math.abs(((aheadBearing - immediateBearing + 540) % 360) - 180);

      const baseTargetKmh = turnSharpnessDeg > 42 ? 26 : turnSharpnessDeg > 18 ? 36 : segKm > 0.055 ? 50 : 42;
      smoothSpeedRef.current += (baseTargetKmh - smoothSpeedRef.current) * (1 - Math.exp(-3.4 * dt));

      const travelKm = ((smoothSpeedRef.current / 3600) * dt) * 2.25;

      if (segKm < 0.0005) {
        index += 1;
        progress = 0;
      } else {
        progress += travelKm / segKm;
        while (progress >= 1 && index < activeRoute.length - 1) {
          const remainingRatio = progress - 1;
          const prevSegKm = exactDistanceKm(activeRoute[index], activeRoute[index + 1]);
          index += 1;
          if (index >= activeRoute.length - 1) {
            progress = 0;
            break;
          }
          const nextSegKm = exactDistanceKm(activeRoute[index], activeRoute[index + 1]);
          progress = nextSegKm > 0.0005 ? (remainingRatio * prevSegKm) / nextSegKm : 0;
        }
      }

      routeProgressRef.current = { index, progress };

      if (index !== lastRouteIdx) {
        lastRouteIdx = index;
        setCurrentRouteIndex(index);
      }

      const roundedSpeed = Math.round(smoothSpeedRef.current);
      if (roundedSpeed !== lastSpeedInt) {
        lastSpeedInt = roundedSpeed;
        setNavSpeedKmh(roundedSpeed);
      }

      if (index >= activeRoute.length - 1) {
        setDriverPos(activeRoute[activeRoute.length - 1]);
        return;
      }

      const a = activeRoute[index];
      const b = activeRoute[index + 1];
      const nextPos = interpolateLatLng(a, b, progress);
      const curveTargetPt = getLookAheadPoint(index, nextPos, 0.028);
      const targetBearing =
        exactDistanceKm(nextPos, curveTargetPt) > 0.001
          ? calculateBearing(nextPos, curveTargetPt)
          : calculateBearing(a, b);

      // Exponential shortest-angle damping eliminates jerky snaps on vertices
      const shortestDelta = ((targetBearing - smoothHeadingRef.current + 540) % 360) - 180;
      const turnAlpha = 1 - Math.exp(-9.0 * dt);
      const nextHeading = (smoothHeadingRef.current + shortestDelta * turnAlpha + 360) % 360;
      smoothHeadingRef.current = nextHeading;

      setDriverPos(nextPos);
      setDriverHeading(nextHeading);

      let matchedManIdx = currentManeuverIndexRef.current;
      for (let m = matchedManIdx + 1; m < activeManeuvers.length; m++) {
        if (index >= activeManeuvers[m].pointIndex) {
          matchedManIdx = m;
        } else {
          break;
        }
      }
      if (matchedManIdx > currentManeuverIndexRef.current) {
        currentManeuverIndexRef.current = matchedManIdx;
        setCurrentManeuverIndex(matchedManIdx);
        playNavigationTurnPing(soundAlertsRef.current);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isLiveGps, status, activeRoute, activeManeuvers]);

  // Smart Back-to-Back Queued Ride Offer when ~1–2 min from current dropoff
  useEffect(() => {
    if (status !== 'IN_PROGRESS' || !activeRequest || activeRoute.length < 4) return;
    const progressRatio = currentRouteIndex / (activeRoute.length - 1);
    if (
      progressRatio >= 0.72 &&
      !queuedOffer &&
      queuedOfferedForTripRef.current !== activeRequest.id
    ) {
      queuedOfferedForTripRef.current = activeRequest.id;
      const allowedCats = isInsuranceExpired ? (['Delivery'] as const) : settings.enabledCategories;
      generateLiveRideRequest({
        driverLocation: activeRequest.dropoffCoords,
        originOverride: activeRequest.dropoffCoords,
        cityId: currentCityId,
        enabledCategories: [...allowedCats],
        acceptCash: settings.acceptCash,
        allowBid: false,
        maxPickupKm: Math.max(2, settings.maxPickupKm),
        minFareFilter: settings.minFareFilter,
        minRiderRating: settings.minRiderRating,
        destinationTarget: settings.destinationFilter.targetCoords,
        surgeZones,
        maxVehicleRangeKm: activeVehicle.rangeKm,
      }).then((nextReq) => {
        setQueuedOffer(nextReq);
        playHyperSound('order', settings.soundAlerts);
        addToast(
          'Next Back-to-Back Offer',
          `Pickup near dropoff · ${nextReq.currency}${nextReq.estimatedFare.toFixed(2)}`,
          'info'
        );
      });
    }
  }, [
    status,
    activeRequest,
    activeRoute.length,
    currentRouteIndex,
    queuedOffer,
    isInsuranceExpired,
    settings.enabledCategories,
    settings.acceptCash,
    settings.maxPickupKm,
    settings.minFareFilter,
    settings.minRiderRating,
    settings.destinationFilter.targetCoords,
    settings.soundAlerts,
    currentCityId,
    surgeZones,
    activeVehicle.rangeKm,
    addToast,
  ]);

  const handleArrivePickup = useCallback(() => {
    if (!activeRequest) return;
    setDriverPos(activeRequest.pickupCoords);
    setActiveRoute([]);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    lastTripWaitFeeRef.current = 0;
    lastTripPinVerifiedRef.current = false;
    setStatus('ARRIVED_PICKUP');
    playArrivalChime(settings.soundAlerts);
    // Start 2-minute customer response watch if rider hasn't replied yet
    if (chatMessages.every((m) => m.sender !== 'rider')) {
      setAwaitingRiderReply(true);
      setRiderNoResponseSec(0);
    }
  }, [activeRequest, settings.soundAlerts, chatMessages]);

  const handleStartTrip = useCallback(
    (waitFeeAccrued: number = 0, pinVerified: boolean = false) => {
      if (!activeRequest) return;
      lastTripWaitFeeRef.current = Number(waitFeeAccrued.toFixed(2));
      lastTripPinVerifiedRef.current = pinVerified;
      const updatedReq: RideRequest =
        waitFeeAccrued > 0
          ? {
              ...activeRequest,
              waitFeeTotal: Number(waitFeeAccrued.toFixed(2)),
              estimatedFare: Number((activeRequest.estimatedFare + waitFeeAccrued).toFixed(2)),
            }
          : activeRequest;
      setActiveRequest(updatedReq);
      setActiveRoute(updatedReq.toDropoffRoute);
      setActiveManeuvers(updatedReq.maneuversToDropoff);
      currentManeuverIndexRef.current = 0;
      setCurrentManeuverIndex(0);
      setCurrentRouteIndex(0);
      routeProgressRef.current = { index: 0, progress: 0 };
      if (updatedReq.toDropoffRoute.length > 1) {
        const initHeading = calculateBearing(updatedReq.toDropoffRoute[0], updatedReq.toDropoffRoute[1]);
        smoothHeadingRef.current = initHeading;
        setDriverHeading(initHeading);
      }
      setAwaitingRiderReply(false);
      setRiderNoResponseSec(0);
      setStatus('IN_PROGRESS');
      playSuccessTone(settings.soundAlerts);
    },
    [activeRequest, settings.soundAlerts]
  );

  const handleCompleteTrip = useCallback(() => {
    if (!activeRequest) return;
    setDriverPos(activeRequest.dropoffCoords);
    setActiveRoute([]);
    setActiveManeuvers([]);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    setAwaitingRiderReply(false);
    setRiderNoResponseSec(0);

    // Update EV/Fuel Range & Odometer Mileage + Alert if low range / service due
    const drivenKm = Math.max(1, Math.round(activeRequest.tripDistanceKm));
    setShiftDistanceKm((km) => Number((km + activeRequest.tripDistanceKm).toFixed(1)));
    setVehicles((prev) =>
      prev.map((v) => {
        if (!v.isActive) return v;
        const nextRange = Math.max(0, Number((v.rangeKm - activeRequest.tripDistanceKm).toFixed(1)));
        const nextOdo = v.odometerKm + drivenKm;
        if (nextRange < 80) {
          addToast(
            v.fuelType === 'Electric' ? 'Low EV Battery Range' : 'Low Fuel Range',
            `${nextRange.toFixed(0)} km left — consider recharging in Account -> Fleet.`,
            'alert'
          );
        } else if (v.nextServiceKm - nextOdo <= 400) {
          addToast(
            'Maintenance Reminder',
            `Vehicle service due in ${Math.max(0, v.nextServiceKm - nextOdo)} km.`,
            'info'
          );
        }
        return { ...v, rangeKm: nextRange, odometerKm: nextOdo };
      })
    );

    setStatus('TRIP_COMPLETED');
    playSuccessTone(settings.soundAlerts);
  }, [activeRequest, settings.soundAlerts, addToast]);

  const handleToggleMic = useCallback(async () => {
    if (isMicListening) {
      voiceRecRef.current?.stop();
      setIsMicListening(false);
      setMicTranscript(null);
      return;
    }

    const executeVoicePhrase = (phrase: string) => {
      const lower = phrase.toLowerCase();
      setMicTranscript(phrase);
      setTimeout(() => setMicTranscript(null), 2600);

      if (lower.includes('online') || lower.includes('start shift')) {
        if (status === 'OFFLINE') handleGoOnline();
        else if (status === 'ON_BREAK') handleResumeFromBreak();
      } else if (lower.includes('offline') || lower.includes('end shift')) {
        if (status === 'ONLINE_IDLE' || status === 'ON_BREAK') endShift();
      } else if (lower.includes('break') || lower.includes('pause')) {
        if (status === 'ONLINE_IDLE') handleStartBreak();
      } else if (lower.includes('accept') || lower.includes('take')) {
        if (status === 'INCOMING_REQUEST') handleAcceptRequest();
      } else if (lower.includes('decline') || lower.includes('reject')) {
        if (status === 'INCOMING_REQUEST') handleDeclineRequest();
      } else if (lower.includes('arrived')) {
        if (status === 'EN_ROUTE_PICKUP') handleArrivePickup();
      } else if (lower.includes('start') && status === 'ARRIVED_PICKUP' && !activeRequest?.requiresPin) {
        handleStartTrip(0, false);
      } else if (lower.includes('complete') || lower.includes('finish')) {
        if (status === 'IN_PROGRESS') handleCompleteTrip();
      } else if (lower.includes('heatmap')) {
        setSettings((s) => ({ ...s, showHeatmap: !s.showHeatmap }));
      } else if (lower.includes('safety') || lower.includes('sos') || lower.includes('emergency')) {
        setShowSafetyModal(true);
      } else if (lower.includes('gps')) {
        handleToggleLiveGps();
      } else {
        addToast('Voice Note Captured', `“${phrase}”`, 'info');
      }
    };

    const SpeechRec =
      (window as unknown as {
        SpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
      }).SpeechRecognition ||
      (window as unknown as {
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
      }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.lang = 'en-GB';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (event) => {
          const spoken = event.results?.[0]?.[0]?.transcript?.trim();
          if (spoken) executeVoicePhrase(spoken);
        };
        rec.onerror = () => setIsMicListening(false);
        rec.onend = () => setIsMicListening(false);
        voiceRecRef.current = rec;
        setIsMicListening(true);
        setMicTranscript(null);
        rec.start();
        return;
      } catch {
        setIsMicListening(false);
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        setIsMicListening(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicTranscript('Recording voice memo...');
        setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop());
          setIsMicListening(false);
          setMicTranscript(null);
          addToast('Voice Clip Saved', '2s driver mic check / voice note ready.', 'success');
        }, 2000);
        return;
      } catch {
        setIsMicListening(false);
        setMicTranscript(null);
        addToast('Microphone Blocked', 'Allow microphone access in site settings to use voice controls.', 'alert');
        return;
      }
    }

    addToast('Microphone Unavailable', 'Voice controls require a browser with audio mic access.', 'info');
  }, [
    isMicListening,
    status,
    activeRequest,
    handleGoOnline,
    handleResumeFromBreak,
    endShift,
    handleStartBreak,
    handleAcceptRequest,
    handleDeclineRequest,
    handleArrivePickup,
    handleStartTrip,
    handleCompleteTrip,
    handleToggleLiveGps,
    addToast,
  ]);

  const handleSubmitRating = (rating: number, tipBonus: number) => {
    if (!activeRequest) return;
    const waitFee = lastTripWaitFeeRef.current || activeRequest.waitFeeTotal || 0;
    const commission = Number((activeRequest.estimatedFare * 0.15).toFixed(2));
    const netEarnings = Number((activeRequest.estimatedFare - commission + tipBonus).toFixed(2));
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const tripId = `TR-${9043 + trips.length}`;
    const matchedInc = incidents.find((i) => i.tripId === activeRequest.id);

    const newTrip: CompletedTrip = {
      id: tripId,
      riderName: activeRequest.riderName,
      category: activeRequest.category,
      paymentMethod: activeRequest.paymentMethod,
      pickupAddress: activeRequest.pickupAddress,
      dropoffAddress: activeRequest.dropoffAddress,
      completedAt: timeStr,
      dayKey: todayKey,
      distanceKm: activeRequest.tripDistanceKm,
      durationMin: activeRequest.tripEtaMin,
      grossFare: activeRequest.estimatedFare,
      baseFare: activeRequest.baseFare,
      distanceFare: activeRequest.distanceFare,
      timeFare: activeRequest.timeFare,
      waitFee,
      boltCommission: commission,
      surgeBonus: activeRequest.surgeBonus,
      tip: tipBonus,
      netEarnings,
      riderRatingGiven: rating,
      stopsCount: activeRequest.stops?.length || 0,
      pickupPinVerified: lastTripPinVerifiedRef.current,
      incidentNote: matchedInc?.summary,
    };

    setTrips((prev) => [newTrip, ...prev]);
    setProfile((p) => ({
      ...p,
      bankBalance: Number((p.bankBalance + netEarnings).toFixed(2)),
    }));
    setWeeklySeries((prev) =>
      prev.map((d) =>
        d.day === todayKey
          ? {
              ...d,
              amount: Number((d.amount + netEarnings).toFixed(2)),
              trips: d.trips + 1,
              hours: Number((d.hours + activeRequest.tripEtaMin / 60).toFixed(1)),
            }
          : d
      )
    );
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === 'quest-ev' && activeRequest.category !== 'Bolt Green') return c;
        return { ...c, completedTrips: Math.min(c.targetTrips, c.completedTrips + 1) };
      })
    );

    sendNotification(
      'Trip Paid',
      `${currency}${netEarnings.toFixed(2)} added to today's earnings`,
      'success'
    );

    // Transition straight into accepted back-to-back queued ride if present
    if (queuedOffer && queuedAccepted) {
      const nextReq = queuedOffer;
      setQueuedOffer(null);
      setQueuedAccepted(false);
      queuedOfferedForTripRef.current = null;
      setActiveRequest(nextReq);
      setActiveRoute(nextReq.toPickupRoute);
      setPreviewDropoffRoute([]);
      setActiveManeuvers(nextReq.maneuversToPickup);
      setCurrentManeuverIndex(0);
      setCurrentRouteIndex(0);
      routeProgressRef.current = { index: 0, progress: 0 };
      setChatMessages([]);
      setUnreadChatCount(0);
      setAwaitingRiderReply(false);
      setRiderNoResponseSec(0);
      setStatus('EN_ROUTE_PICKUP');
      addToast('Queued Ride Started', `Navigating to ${nextReq.pickupAddress}`, 'success');
      return;
    }

    setQueuedOffer(null);
    setQueuedAccepted(false);
    queuedOfferedForTripRef.current = null;
    setActiveRequest(null);
    dispatchTriggeredRef.current = false;
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(settings.dispatchWaitSec));
    setStatus('ONLINE_IDLE');
  };

  const handleConfirmCancel = (reason: string) => {
    setShowCancelModal(false);
    setActiveRequest(null);
    setQueuedOffer(null);
    setQueuedAccepted(false);
    queuedOfferedForTripRef.current = null;
    setActiveRoute([]);
    setPreviewDropoffRoute([]);
    setActiveManeuvers([]);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    setAwaitingRiderReply(false);
    setRiderNoResponseSec(0);
    setCompletionRate((r) => Math.max(85, r - 1));
    dispatchTriggeredRef.current = false;
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(settings.dispatchWaitSec));
    setStatus('ONLINE_IDLE');
    addToast('Ride Cancelled', reason, 'info');
  };

  // Bolt Flex Bid Jobs Marketplace handlers (Accept / Counter-bid / Cancel / Taken by other driver)
  const handlePlaceMarketplaceBid = (jobId: string, amount: number) => {
    setBidJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, driverBid: amount, customerCounterFare: undefined, bidStatus: 'pending' }
          : j
      )
    );

    setTimeout(() => {
      setBidJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId || j.bidStatus !== 'pending') return j;
          const ratio = amount / j.suggestedFare;
          if (ratio <= 1.2) {
            sendNotification(
              'Bolt Flex Bid Accepted!',
              `${j.riderName} accepted your ${j.currency}${amount.toFixed(2)} offer.`,
              'success'
            );
            return { ...j, bidStatus: 'accepted' };
          }
          if (ratio <= 1.45) {
            const counter = Number(((j.suggestedFare + amount) / 2).toFixed(2));
            sendNotification(
              'Customer Counter-Bid',
              `${j.riderName} countered with ${j.currency}${counter.toFixed(2)}.`,
              'info'
            );
            return { ...j, customerCounterFare: counter, bidStatus: 'countered' };
          }
          return {
            ...j,
            bidStatus: 'taken_by_other',
            statusNote: 'Another driver accepted a lower fare before confirmation.',
          };
        })
      );
    }, 1800);
  };

  const handleCancelMarketplaceBid = (jobId: string) => {
    setBidJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, bidStatus: 'cancelled' } : j))
    );
    addToast('Bid Cancelled', 'Your Bolt Flex bid was withdrawn', 'info');
  };

  const handleAcceptCounterBid = (jobId: string) => {
    setBidJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId || j.customerCounterFare === undefined) return j;
        sendNotification(
          'Counter-Bid Accepted',
          `Ride locked in at ${j.currency}${j.customerCounterFare.toFixed(2)}.`,
          'success'
        );
        return { ...j, driverBid: j.customerCounterFare, bidStatus: 'accepted' };
      })
    );
  };

  const handleStartWonBidJob = async (job: BidJobOffer) => {
    setShowBidJobsModal(false);
    const [toPickup, toDropoff] = await Promise.all([
      fetchRoadRoute(driverPos, job.pickupCoords),
      fetchRoadRoute(job.pickupCoords, job.dropoffCoords),
    ]);
    const fare = job.driverBid || job.suggestedFare;
    const req: RideRequest = {
      id: job.id,
      riderName: job.riderName,
      riderRating: job.riderRating,
      riderTrips: 64,
      category: job.category,
      paymentMethod: job.paymentMethod,
      surgeMultiplier: job.surgeMultiplier,
      pickupCoords: job.pickupCoords,
      pickupAddress: job.pickupAddress,
      pickupArea: 'Bid Pickup',
      dropoffCoords: job.dropoffCoords,
      dropoffAddress: job.dropoffAddress,
      dropoffArea: 'Destination',
      pickupDistanceKm: toPickup.distanceKm,
      pickupEtaMin: toPickup.durationMin,
      tripDistanceKm: toDropoff.distanceKm,
      tripEtaMin: toDropoff.durationMin,
      estimatedFare: fare,
      baseFare: 3.2,
      distanceFare: Number((fare * 0.7).toFixed(2)),
      timeFare: Number((fare * 0.3 - 3.2).toFixed(2)),
      surgeBonus: 0,
      currency: job.currency,
      toPickupRoute: toPickup.points,
      toDropoffRoute: toDropoff.points,
      maneuversToPickup: toPickup.maneuvers,
      maneuversToDropoff: toDropoff.maneuvers,
      allowBid: false,
      isOutOfCity: job.category === 'Bolt City',
      willRiderReply: Math.random() > 0.5,
    };

    setBidJobs((prev) => prev.filter((b) => b.id !== job.id));
    setActiveRequest(req);
    setActiveRoute(req.toPickupRoute);
    setPreviewDropoffRoute([]);
    setActiveManeuvers(req.maneuversToPickup);
    setCurrentManeuverIndex(0);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    setChatMessages([]);
    setUnreadChatCount(0);
    setAwaitingRiderReply(false);
    setRiderNoResponseSec(0);
    setStatus('EN_ROUTE_PICKUP');
    setActiveTab('map');
    playSuccessTone(settings.soundAlerts);
  };

  // New Account Registration completion
  const handleCompleteRegistration = ({
    profile: newProfile,
    vehicle: newVehicle,
    documents: newDocs,
  }: {
    profile: DriverProfile;
    vehicle: Vehicle;
    documents: DriverDocument[];
  }) => {
    const newScopeKey = getUserScopeKey(newProfile, firebaseUser);
    const existingSavedForUser = loadUserSettings(newScopeKey);
    const nextSettings: DriverSettings = {
      ...existingSavedForUser,
      enabledCategories: newVehicle.categories,
    };

    saveUserSettings(newScopeKey, nextSettings);
    saveUserVehicleId(newScopeKey, newVehicle.id);

    setProfile(newProfile);
    setVehicles((prev) => [newVehicle, ...prev.map((v) => ({ ...v, isActive: false }))]);
    setDocuments(newDocs);
    setSettings(nextSettings);
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(nextSettings.dispatchWaitSec));

    const city = getCityById(newProfile.cityId);
    setCurrentCityId(city.id);
    setIsLiveGps(false);
    setDriverPos(city.center);
    setSurgeZones(generateSurgeZonesNear(city.center, city.id));
    setBidJobs(generateBidJobsNear(city.center, city.id, newVehicle.categories));
    setShowAccountCreation(false);
    setIsProfileLoaded(true);
    setActiveTab('map');
    playBidAcceptedTone(nextSettings.soundAlerts);
    addToast('Account Active', `Welcome ${newProfile.fullName}!`, 'success');
  };

  // Insurance Actions
  const handleChangeCoverage = (cov: InsuranceCoverage) => {
    setProfile((p) => ({ ...p, insuranceCoverage: cov }));
    addToast('Coverage Updated', `Switched policy coverage to ${cov.toUpperCase()}`, 'success');
  };

  const handleSaveInsuredVehicle = (model: string, plate: string) => {
    setProfile((p) => ({ ...p, insuredVehicleModel: model, insuredVehiclePlate: plate }));
    addToast('Vehicle Updated', `${model} (${plate}) insured on policy`, 'success');
  };

  const handleCancelInsurancePlan = () => {
    setProfile((p) => ({
      ...p,
      documentExpiries: {
        ...p.documentExpiries,
        'Vehicle Insurance': '2020-01-01',
      },
      documentsUploaded: false,
      faceVerified: false,
    }));
    setSettings((s) => ({
      ...s,
      enabledCategories: s.enabledCategories.filter((c) => c === 'Delivery'),
    }));
    if (status === 'ONLINE_IDLE') endShift();
    sendNotification(
      'Insurance Cancelled',
      'Vehicle Insurance expired. Passenger rides are disabled until renewed.',
      'alert'
    );
  };

  const handleCompleteInsuranceRenewal = (
    plan: 'monthly' | 'yearly',
    cost: number,
    payWithBalance: boolean
  ) => {
    const days = plan === 'monthly' ? 30 : 365;
    const newExpiry = getFutureIsoDate(days);
    setProfile((p) => ({
      ...p,
      bankBalance: payWithBalance ? Math.max(0, Number((p.bankBalance - cost).toFixed(2))) : p.bankBalance,
      documentExpiries: {
        ...p.documentExpiries,
        'Vehicle Insurance': newExpiry,
      },
      documentsUploaded: true,
      faceVerified: true,
    }));
    setDismissedExpiries((prev) => prev.filter((d) => d !== 'Vehicle Insurance'));
    sendNotification(
      'Insurance Renewed',
      `Valid through ${newExpiry}. Passenger rides unlocked!`,
      'success'
    );
  };

  // Auth & Push Permission Handlers
  const handleSignInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      addToast('Signed In', 'Driver profile synced to Firebase Firestore', 'success');
    } catch {
      addToast('Sign-In Cancelled', 'Continuing with local driver profile.', 'info');
    }
  };

  const handleSignOutGoogle = async () => {
    await signOut(auth);
    addToast('Signed Out', 'Switched back to local profile mode', 'info');
  };

  const handleEnablePush = async () => {
    const perm = await requestPushPermission();
    setNotificationPermission(perm);
    setPermissionsSnapshot((prev) => ({
      ...prev,
      notifications: perm === 'default' ? 'prompt' : perm,
    }));
    if (perm === 'granted') {
      setSettings((s) => ({ ...s, pushNotifications: true }));
      if (firebaseUser) initializeFCMToken(firebaseUser.uid);
      sendNotification(
        'Bolt Driver Alerts Enabled',
        'Live ride offers & background notifications are now active.',
        'success'
      );
    } else {
      addToast('Permission Denied', 'Browser blocked push notifications.', 'alert');
    }
  };

  const applyPermissionResult = useCallback(
    (snapshot: AppPermissionsSnapshot, coords?: { lat: number; lng: number }) => {
      setPermissionsSnapshot(snapshot);
      const nextNotif: NotificationPermissionState =
        snapshot.notifications === 'granted'
          ? 'granted'
          : snapshot.notifications === 'denied'
          ? 'denied'
          : 'default';
      setNotificationPermission(nextNotif);

      if (snapshot.notifications === 'granted') {
        setSettings((s) => (s.pushNotifications ? s : { ...s, pushNotifications: true }));
        if (firebaseUser) initializeFCMToken(firebaseUser.uid);
      }

      if (coords) {
        const rounded: LatLng = {
          lat: Number(coords.lat.toFixed(6)),
          lng: Number(coords.lng.toFixed(6)),
        };
        setDriverPos(rounded);
        setIsLiveGps(true);
        setSurgeZones(generateSurgeZonesNear(rounded, currentCityId));
        setRanks(generateRanksNear(rounded, currentCityId));
        setBidJobs(generateBidJobsNear(rounded, currentCityId, settings.enabledCategories));
      }
    },
    [firebaseUser, currentCityId, settings.enabledCategories]
  );

  const handleBootComplete = useCallback(async () => {
    setShowBootScreen(false);
    try {
      const current = await queryAllPermissions();
      setPermissionsSnapshot(current);

      const bootDone = localStorage.getItem(BOOT_PERMS_DONE_KEY) === 'true';
      const hasPending =
        current.location === 'prompt' ||
        current.microphone === 'prompt' ||
        current.notifications === 'prompt';

      if (!bootDone || hasPending) {
        localStorage.setItem(BOOT_PERMS_DONE_KEY, 'true');
        const { snapshot, coords } = await requestAllDevicePermissions();
        applyPermissionResult(snapshot, coords);

        if (
          snapshot.location === 'prompt' ||
          snapshot.microphone === 'prompt' ||
          snapshot.notifications === 'prompt'
        ) {
          setShowPermissionsModal(true);
        }
      }
    } catch {
      setShowPermissionsModal(true);
    }
  }, [applyPermissionResult]);

  const handleSendChat = (text: string) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, sender: 'driver', text, timestamp: ts },
    ]);

    if (status === 'EN_ROUTE_PICKUP' || status === 'ARRIVED_PICKUP') {
      setAwaitingRiderReply(true);
      setRiderNoResponseSec(0);
    }

    if (activeRequest?.willRiderReply) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `r-${Date.now()}`,
            sender: 'rider',
            text: "Thanks! I'm standing right outside by the main entrance.",
            timestamp: ts,
          },
        ]);
        setAwaitingRiderReply(false);
        setRiderNoResponseSec(0);
        setUnreadChatCount((c) => (showChat ? 0 : c + 1));
        sendNotification('New Rider Message', 'Rider replied to your message', 'message');
      }, 2200);
    }
  };

  const noResponseFeeAmount = activeRequest
    ? Math.max(3.0, Number((activeRequest.estimatedFare * 0.2).toFixed(2)))
    : 3.0;

  const handleWaitLongerNoResponse = () => {
    setRiderNoResponseSec(0);
    addToast('Waiting Longer', 'Extended 2-minute customer wait timer', 'info');
  };

  const handleCancelNoResponseCollectFee = () => {
    if (!activeRequest) return;
    const fee = noResponseFeeAmount;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const feeEntry: CompletedTrip = {
      id: `FEE-${9043 + trips.length}`,
      riderName: `${activeRequest.riderName} (No-Show Fee)`,
      category: activeRequest.category,
      paymentMethod: activeRequest.paymentMethod,
      pickupAddress: activeRequest.pickupAddress,
      dropoffAddress: 'Cancelled after 2m no-response',
      completedAt: timeStr,
      dayKey: todayKey,
      distanceKm: activeRequest.pickupDistanceKm,
      durationMin: 2,
      baseFare: fee,
      distanceFare: 0,
      timeFare: 0,
      waitFee: 0,
      grossFare: fee,
      boltCommission: 0,
      surgeBonus: 0,
      tip: 0,
      netEarnings: fee,
    };

    setTrips((prev) => [feeEntry, ...prev]);
    setProfile((p) => ({
      ...p,
      bankBalance: Number((p.bankBalance + fee).toFixed(2)),
    }));
    setWeeklySeries((prev) =>
      prev.map((d) =>
        d.day === todayKey
          ? {
              ...d,
              amount: Number((d.amount + fee).toFixed(2)),
              trips: d.trips + 1,
            }
          : d
      )
    );

    setShowChat(false);
    setActiveRequest(null);
    setActiveRoute([]);
    setPreviewDropoffRoute([]);
    setActiveManeuvers([]);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    setAwaitingRiderReply(false);
    setRiderNoResponseSec(0);
    dispatchTriggeredRef.current = false;
    setNextRequestWaitLeft(resolveDispatchWaitSeconds(settings.dispatchWaitSec));
    setStatus('ONLINE_IDLE');
    sendNotification(
      'Cancellation Fee Credited',
      `Customer didn't respond within 2:00. ${currency}${fee.toFixed(2)} added to earnings.`,
      'success'
    );
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.map((v) => ({ ...v, isActive: v.id === vehicleId })));
    const chosen = vehicles.find((v) => v.id === vehicleId);
    if (chosen) {
      setSettings((s) => ({
        ...s,
        enabledCategories: s.enabledCategories.filter((c) => chosen.categories.includes(c))
          .length
          ? s.enabledCategories.filter((c) => chosen.categories.includes(c))
          : [chosen.categories[0]],
      }));
      addToast('Vehicle Switched', `Active vehicle: ${chosen.makeModel}`, 'info');
    }
  };

  const handleRechargeVehicle = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId) || activeVehicle;
    setVehicles((prev) =>
      prev.map((v) => (v.id === target.id ? { ...v, rangeKm: v.maxRangeKm } : v))
    );
    addToast(
      target.fuelType === 'Electric' ? 'Battery Recharged' : 'Tank Refuelled',
      `${target.makeModel} topped up to ${target.maxRangeKm} km range.`,
      'success'
    );
  };

  const handleServiceVehicle = (vehicleId: string, kind: 'service' | 'tyres') => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        if (kind === 'service') return { ...v, nextServiceKm: v.odometerKm + 10000 };
        return { ...v, tyreCheckKm: v.odometerKm + 6000 };
      })
    );
    addToast(
      'Maintenance Logged',
      kind === 'service'
        ? 'Full vehicle service reset (+10,000 km).'
        : 'Tyre check & rotation reset (+6,000 km).',
      'success'
    );
  };

  const handleAddExpense = async (
    exp: Omit<ExpenseRecord, 'id' | 'dateIso' | 'dayKey' | 'createdAtMs'>
  ) => {
    const now = Date.now();
    const record: ExpenseRecord = {
      id: `exp-${now}-${Math.floor(Math.random() * 999)}`,
      category: exp.category,
      amount: exp.amount,
      note: exp.note,
      dateIso: new Date().toISOString().slice(0, 10),
      dayKey: todayKey,
      createdAtMs: now,
    };
    const nextList = [record, ...expenses];
    setExpenses(nextList);
    saveScopedJson(EXPENSES_STORAGE_PREFIX, activeUserScopeKey, nextList);
    addToast('Expense Logged', `${currency}${record.amount.toFixed(2)} for ${record.category}`, 'info');

    if (firebaseUser && isProfileLoaded) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'expenses', record.id), {
          id: record.id,
          uid: firebaseUser.uid,
          category: record.category,
          amount: record.amount,
          ...(record.note ? { note: record.note } : {}),
          dateIso: record.dateIso,
          dayKey: record.dayKey,
          createdAtMs: record.createdAtMs,
        });
      } catch (error) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          handleFirestoreError(
            error,
            OperationType.CREATE,
            `users/${firebaseUser.uid}/expenses/${record.id}`
          );
        }
      }
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const nextList = expenses.filter((e) => e.id !== expenseId);
    setExpenses(nextList);
    saveScopedJson(EXPENSES_STORAGE_PREFIX, activeUserScopeKey, nextList);

    if (firebaseUser && isProfileLoaded) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'expenses', expenseId));
      } catch (error) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          handleFirestoreError(
            error,
            OperationType.DELETE,
            `users/${firebaseUser.uid}/expenses/${expenseId}`
          );
        }
      }
    }
  };

  const handleSaveIncident = async (
    inc: Omit<IncidentReport, 'id' | 'createdAtLabel' | 'createdAtMs'>
  ) => {
    const now = Date.now();
    const nowDate = new Date();
    const label = `${todayKey} ${nowDate.getHours().toString().padStart(2, '0')}:${nowDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const record: IncidentReport = {
      ...inc,
      id: `inc-${now}-${Math.floor(Math.random() * 999)}`,
      createdAtLabel: label,
      createdAtMs: now,
    };
    const nextList = [record, ...incidents];
    setIncidents(nextList);
    saveScopedJson(INCIDENTS_STORAGE_PREFIX, activeUserScopeKey, nextList);
    sendNotification('Safety Incident Saved', `${record.type} attached to shift record.`, 'info');

    if (firebaseUser && isProfileLoaded) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'incidents', record.id), {
          id: record.id,
          uid: firebaseUser.uid,
          type: record.type,
          summary: record.summary,
          hasAudioNote: record.hasAudioNote,
          ...(record.audioDurationSec !== undefined
            ? { audioDurationSec: record.audioDurationSec }
            : {}),
          coords: record.coords,
          ...(record.tripId ? { tripId: record.tripId } : {}),
          ...(record.riderName ? { riderName: record.riderName } : {}),
          vehiclePlate: record.vehiclePlate,
          createdAtLabel: record.createdAtLabel,
          createdAtMs: record.createdAtMs,
        });
      } catch (error) {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          handleFirestoreError(
            error,
            OperationType.CREATE,
            `users/${firebaseUser.uid}/incidents/${record.id}`
          );
        }
      }
    }
  };

  const handleToggleClaimScheduled = (rideId: string) => {
    setScheduledRides((prev) =>
      prev.map((r) => {
        if (r.id !== rideId) return r;
        const nextClaimed = !r.claimed;
        addToast(
          nextClaimed ? 'Reservation Claimed' : 'Reservation Released',
          nextClaimed
            ? `${r.tag} at ${r.pickupTimeLabel} added to your queue.`
            : `${r.tag} returned to marketplace.`,
          nextClaimed ? 'success' : 'info'
        );
        return { ...r, claimed: nextClaimed };
      })
    );
  };

  const handleStartScheduledRide = async (ride: ScheduledRide) => {
    const [toPickup, toDropoff] = await Promise.all([
      fetchRoadRoute(driverPos, ride.pickupCoords),
      fetchRoadRoute(ride.pickupCoords, ride.dropoffCoords),
    ]);
    const req: RideRequest = {
      id: ride.id,
      riderName: ride.riderName,
      riderRating: ride.riderRating,
      riderTrips: 92,
      category: ride.category,
      paymentMethod: ride.paymentMethod,
      surgeMultiplier: 1.0,
      pickupCoords: ride.pickupCoords,
      pickupAddress: ride.pickupAddress,
      pickupArea: ride.pickupArea,
      dropoffCoords: ride.dropoffCoords,
      dropoffAddress: ride.dropoffAddress,
      dropoffArea: ride.dropoffArea,
      pickupPin: ride.pickupPin,
      waitFeePerMin: 0.45,
      waitFeeTotal: 0,
      pickupDistanceKm: toPickup.distanceKm,
      pickupEtaMin: toPickup.durationMin,
      tripDistanceKm: ride.tripDistanceKm,
      tripEtaMin: ride.tripEtaMin,
      estimatedFare: ride.estimatedFare,
      baseFare: 4.5,
      distanceFare: Number((ride.estimatedFare * 0.65).toFixed(2)),
      timeFare: Number((ride.estimatedFare * 0.35 - 4.5).toFixed(2)),
      surgeBonus: 0,
      currency: ride.currency,
      toPickupRoute: toPickup.points,
      toDropoffRoute: toDropoff.points,
      maneuversToPickup: toPickup.maneuvers,
      maneuversToDropoff: toDropoff.maneuvers,
      allowBid: false,
      isOutOfCity: ride.category === 'Bolt City',
      willRiderReply: true,
      note: ride.note,
    };

    setScheduledRides((prev) => prev.filter((r) => r.id !== ride.id));
    setActiveRequest(req);
    setActiveRoute(req.toPickupRoute);
    setPreviewDropoffRoute([]);
    setActiveManeuvers(req.maneuversToPickup);
    setCurrentManeuverIndex(0);
    setCurrentRouteIndex(0);
    routeProgressRef.current = { index: 0, progress: 0 };
    setChatMessages([]);
    setUnreadChatCount(0);
    setAwaitingRiderReply(false);
    setRiderNoResponseSec(0);
    setStatus('EN_ROUTE_PICKUP');
    setActiveTab('map');
    playSuccessTone(settings.soundAlerts);
    addToast('Scheduled Ride Active', `Navigating to ${ride.pickupAddress}`, 'success');
  };

  const handleRequestPinInChat = () => {
    if (!activeRequest?.pickupPin) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const pin = activeRequest.pickupPin;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: 'driver',
        text: 'Hi! Please share your 4-digit Bolt pickup PIN when you get to the car.',
        timestamp: ts,
      },
    ]);
    setShowChat(true);
    setUnreadChatCount(0);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `r-pin-${Date.now()}`,
          sender: 'rider',
          text: `Sure — my 4-digit pickup PIN is ${pin}. See you in a moment!`,
          timestamp: ts,
        },
      ]);
      sendNotification('Pickup PIN Received', `${activeRequest.riderName} sent PIN: ${pin}`, 'message');
    }, 1100);
  };

  // Remaining route ETA & Distance calculation along remaining polyline segments
  const targetCoord =
    status === 'EN_ROUTE_PICKUP' ? activeRequest?.pickupCoords : activeRequest?.dropoffCoords;
  const remainingDistKm = useMemo(() => {
    if (activeRoute.length > 1 && (status === 'EN_ROUTE_PICKUP' || status === 'IN_PROGRESS')) {
      let totalKm = exactDistanceKm(
        driverPos,
        activeRoute[Math.min(activeRoute.length - 1, currentRouteIndex + 1)]
      );
      for (let i = currentRouteIndex + 1; i < activeRoute.length - 1; i++) {
        totalKm += exactDistanceKm(activeRoute[i], activeRoute[i + 1]);
      }
      return Math.max(0.1, Number(totalKm.toFixed(1)));
    }
    return targetCoord
      ? Math.max(0.1, Number((exactDistanceKm(driverPos, targetCoord) * 1.18).toFixed(1)))
      : 0;
  }, [activeRoute, currentRouteIndex, driverPos, targetCoord, status]);
  const remainingEtaMin = Math.max(1, Math.round((remainingDistKm / Math.max(20, navSpeedKmh)) * 60));

  const isTripActive =
    status === 'INCOMING_REQUEST' ||
    status === 'EN_ROUTE_PICKUP' ||
    status === 'ARRIVED_PICKUP' ||
    status === 'IN_PROGRESS' ||
    status === 'TRIP_COMPLETED';

  const desktopNavItems: {
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'map', label: 'Drive', icon: MapIcon },
    { id: 'schedule', label: 'Schedule', icon: CalendarClock },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
  ];

  const mobileNavItems = desktopNavItems.filter((item) => item.id !== 'insurance');
  const claimedScheduleCount = scheduledRides.filter((r) => r.claimed).length;

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white">
      {/* Desktop Left Navigation Rail */}
      <aside className="no-print hidden lg:flex flex-col justify-between w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5 z-30">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/image_adf30014.png"
                alt="Bolt Driver logo"
                className="w-9 h-9 rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Bolt
                </span>
                <span className="text-xs font-bold text-[#25B670]">Driver</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
              aria-label="Toggle night mode"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full h-11 px-3.5 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors ${
                    active
                      ? 'bg-[#34D186]/15 text-slate-950 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        active ? 'text-[#25B670]' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'schedule' && claimedScheduleCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#34D186] text-slate-950 text-[10px] font-extrabold">
                      {claimedScheduleCount}
                    </span>
                  )}
                  {item.id === 'insurance' && isInsuranceExpired && (
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                      Expired
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Direct New Driver Account Creation & PWA Install */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAccountCreation(true)}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#25B670]" />
              <span>Register New Account</span>
            </button>
            <PWAInstallButton variant="sidebar" />
          </div>
        </div>

        {/* Active Vehicle & City Footer Summary */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Car className="w-4 h-4 text-[#25B670]" />
              <span className="truncate">{activeVehicle.makeModel}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {activeVehicle.plate} · {Math.round(activeVehicle.rangeKm)} km ·{' '}
              {isLiveGps ? 'Live GPS' : activeCity.name}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex-1 h-full overflow-hidden">
        {/* Global In-App Toasts Stack */}
        {toasts.length > 0 && (
          <div className="no-print absolute top-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] left-1/2 -translate-x-1/2 z-[470] flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`w-full pointer-events-auto rounded-2xl px-4 py-3 shadow-xl border text-xs ${
                  t.type === 'alert'
                    ? 'bg-rose-950 text-white border-rose-700'
                    : t.type === 'success'
                    ? 'bg-slate-950 text-white border-[#34D186]/60'
                    : 'bg-slate-900 text-white border-white/10'
                }`}
              >
                <div className="font-extrabold">{t.title}</div>
                <div className="text-slate-300 mt-0.5">{t.body}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="relative w-full h-full">
            <WorldDriverMap
              driverPos={driverPos}
              driverHeading={driverHeading}
              status={status}
              activeRequest={activeRequest}
              activeRoute={activeRoute}
              previewDropoffRoute={previewDropoffRoute}
              currentRouteIndex={currentRouteIndex}
              currentManeuver={activeManeuvers[currentManeuverIndex] || null}
              nextManeuver={activeManeuvers[currentManeuverIndex + 1] || null}
              navSpeedKmh={navSpeedKmh}
              remainingEtaMin={remainingEtaMin}
              remainingDistKm={remainingDistKm}
              surgeZones={surgeZones}
              districtDemandZones={districtDemandZones}
              showHeatmap={settings.showHeatmap}
              headingUpNav={settings.headingUpNav}
              ranks={ranks}
              activeRankId={activeRankId}
              rankQueuePos={rankQueuePos}
              activeVehicle={activeVehicle}
              darkMode={settings.darkMode}
              soundEnabled={settings.soundAlerts}
              isLiveGps={isLiveGps}
              gpsLoading={gpsLoading}
              isRerouting={isRerouting}
              isMicListening={isMicListening}
              micTranscript={micTranscript}
              currentCityId={currentCityId}
              destinationTarget={settings.destinationFilter.targetCoords}
              onToggleLiveGps={handleToggleLiveGps}
              onToggleMic={handleToggleMic}
              onToggleHeatmap={() =>
                setSettings((s) => {
                  const next = !s.showHeatmap;
                  addToast(
                    'D3 Demand Heatmap',
                    next ? 'Hourly & +1–2h demand overlay visible' : 'Heatmap overlay hidden',
                    'info'
                  );
                  return { ...s, showHeatmap: next };
                })
              }
              onToggleHeadingUp={() =>
                setSettings((s) => {
                  const next = !s.headingUpNav;
                  addToast(
                    next ? 'Heading-Up Mode' : 'North-Up 2D Mode',
                    next ? 'Map rotates in direction of travel' : 'Map locked North-Up',
                    'info'
                  );
                  return { ...s, headingUpNav: next };
                })
              }
              onRefuelOrCharge={() => handleRechargeVehicle(activeVehicle.id)}
              onSelectCity={handleSelectCity}
              onToggleSound={() => {
                const next = !settings.soundAlerts;
                setSettings((s) => ({ ...s, soundAlerts: next }));
                addToast(
                  'Navigation Sounds',
                  next ? 'Turn chimes & alert tones enabled' : 'Navigation sounds muted',
                  'info'
                );
              }}
              onSelectSurgeZone={(zone: SurgeZone) =>
                addToast(
                  `${zone.label} Surge`,
                  `${zone.multiplier.toFixed(1)}x multiplier active in ${zone.label}`,
                  'info'
                )
              }
              onSelectRank={(rank: TaxiRank) => {
                if (activeRankId === rank.id) {
                  setActiveRankId(null);
                  setRankQueuePos(null);
                  addToast('Left Rank', `Exited queue at ${rank.name}`, 'info');
                } else {
                  setActiveRankId(rank.id);
                  setRankQueuePos(rank.queueCount + 1);
                  addToast(
                    'Joined Rank Queue',
                    `${rank.name} · Spot #${rank.queueCount + 1} of ${rank.totalDrivers} (${rank.avgFareBoost})`,
                    'success'
                  );
                }
              }}
              onOpenSafety={() => setShowSafetyModal(true)}
            />

            {/* Floating Top Bar on Map — non-overlapping alignment */}
            {status !== 'EN_ROUTE_PICKUP' && status !== 'IN_PROGRESS' && (
              <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-2.5 right-2.5 lg:left-3.5 lg:right-20 flex items-center justify-between pointer-events-none z-[400]">
                <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-slate-950/92 dark:bg-slate-900/95 text-white rounded-full pl-1 pr-1 py-0.5 sm:py-1 shadow-xl border border-white/10 max-w-[calc(100%-5.5rem)] sm:max-w-none">
                  <img
                    src="/assets/aistudio/image_adf30014.png"
                    alt="Bolt Driver"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/15 shrink-0 lg:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveTab('earnings')}
                    className="text-left pl-0 lg:pl-2 pr-1 min-w-0"
                  >
                    <div className="text-[10px] font-semibold text-slate-400 leading-none truncate">
                      Today ({todayKey}) · {isLiveGps ? 'GPS' : activeCity.name}
                    </div>
                    <div className="text-xs sm:text-base font-extrabold font-mono-num leading-tight">
                      {hideEarningsPill
                        ? `${currency}••••`
                        : `${currency}${todayEarnings.toFixed(2)}`}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHideEarningsPill((h) => !h)}
                    aria-label={hideEarningsPill ? 'Show earnings' : 'Hide earnings'}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 shrink-0"
                  >
                    {hideEarningsPill ? (
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>

                {/* Quick Mobile Actions (kept inside top row, clear of right map rail below) */}
                <div className="flex items-center gap-1.5 pointer-events-auto lg:hidden shrink-0">
                  <PWAInstallButton variant="icon" />

                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      aria-label="Enable push notifications"
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-amber-500 active:scale-95 transition-transform"
                    >
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAccountCreation(true)}
                    aria-label="Create new driver account"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-[#25B670] active:scale-95 transition-transform"
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* 30-Day / Expired Insurance Warning Banner on Map (clears right rail buttons) */}
            {(showInsuranceWarning || isInsuranceExpired) && !isTripActive && (
              <div className="absolute top-[max(3.75rem,calc(env(safe-area-inset-top)+3rem))] left-2.5 right-[52px] sm:right-[66px] lg:left-5 lg:right-auto lg:w-[410px] z-[400]">
                <div
                  className={`rounded-2xl p-2.5 sm:p-3 shadow-xl border flex items-center justify-between gap-2 ${
                    isInsuranceExpired
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-amber-50 dark:bg-amber-950/95 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="text-xs leading-snug min-w-0">
                      <div className="font-extrabold truncate">
                        {isInsuranceExpired
                          ? 'Vehicle Insurance Expired'
                          : `Insurance expires in ${insuranceDaysLeft} days`}
                      </div>
                      <div className="opacity-90 truncate">
                        {isInsuranceExpired
                          ? 'Renew cover to go online'
                          : 'Tap Renew to update policy'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsInsuranceRenewalChatOpen(true)}
                      className={`px-3 min-h-[36px] rounded-xl text-xs font-extrabold ${
                        isInsuranceExpired
                          ? 'bg-white text-rose-700'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      }`}
                    >
                      Renew
                    </button>
                    {!isInsuranceExpired && (
                      <button
                        type="button"
                        onClick={() =>
                          setDismissedExpiries((prev) => [...prev, 'Vehicle Insurance'])
                        }
                        aria-label="Dismiss insurance warning"
                        className="w-9 h-9 rounded-lg flex items-center justify-center opacity-75 hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Masked Call Toast Banner */}
            {callBanner && (
              <div className="absolute top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] left-1/2 -translate-x-1/2 z-[450] bg-slate-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold max-w-[90vw]">
                <PhoneCall className="w-4 h-4 text-[#34D186] shrink-0" />
                <span className="truncate">{callBanner}</span>
                <button
                  type="button"
                  onClick={() => setCallBanner(null)}
                  className="text-slate-400 hover:text-white p-1 shrink-0"
                  aria-label="End simulated call"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dispatch Bottom Sheet / Docked Card */}
            <div
              className={`absolute left-0 right-0 lg:left-5 lg:right-auto lg:bottom-5 lg:w-[410px] z-[400] transition-all ${
                isTripActive
                  ? 'bottom-0'
                  : 'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:bottom-5'
              }`}
            >
              {status === 'INCOMING_REQUEST' && activeRequest ? (
                <IncomingRequestModal
                  request={activeRequest}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                />
              ) : (
                <TripPanels
                  status={status}
                  activeRequest={activeRequest}
                  queuedOffer={queuedOffer}
                  queuedAccepted={queuedAccepted}
                  currency={currency}
                  todayEarnings={todayEarnings}
                  dailyGoal={settings.dailyGoal}
                  todayTripsCount={todayTripsCount}
                  shiftElapsedSec={shiftElapsedSec}
                  shiftDistanceKm={shiftDistanceKm}
                  driverScore={driverScore}
                  remainingEtaMin={remainingEtaMin}
                  remainingDistKm={remainingDistKm}
                  destinationLabel={settings.destinationFilter.targetLabel}
                  unreadChatCount={unreadChatCount}
                  openBidJobsCount={bidJobs.length}
                  claimedScheduledRide={nextClaimedScheduled}
                  lastRefreshLabel={lastBackgroundSync}
                  backgroundRefreshEnabled={settings.backgroundRefresh}
                  nextRequestWaitLeft={nextRequestWaitLeft}
                  isRandomWait={settings.dispatchWaitSec === 0}
                  autoAccept={settings.autoAccept}
                  activeRank={activeRank}
                  rankQueuePos={rankQueuePos}
                  awaitingRiderReply={awaitingRiderReply}
                  riderNoResponseSec={riderNoResponseSec}
                  noResponseFeeAmount={noResponseFeeAmount}
                  onGoOnline={handleGoOnline}
                  onGoOffline={endShift}
                  onStartBreak={handleStartBreak}
                  onResumeFromBreak={handleResumeFromBreak}
                  onToggleAutoAccept={() =>
                    setSettings((s) => ({ ...s, autoAccept: !s.autoAccept }))
                  }
                  onLeaveRank={() => {
                    setActiveRankId(null);
                    setRankQueuePos(null);
                  }}
                  onOpenBidJobs={() => setShowBidJobsModal(true)}
                  onOpenSchedule={() => setActiveTab('schedule')}
                  onOpenPreferences={() => setShowPrefs(true)}
                  onOpenDestination={() => setShowDestination(true)}
                  onClearDestination={() =>
                    setSettings((s) => ({
                      ...s,
                      destinationFilter: {
                        enabled: false,
                        targetCoords: null,
                        targetLabel: null,
                      },
                    }))
                  }
                  onArrivePickup={handleArrivePickup}
                  onRequestPinInChat={handleRequestPinInChat}
                  onStartTrip={handleStartTrip}
                  onCompleteTrip={handleCompleteTrip}
                  onAcceptQueuedOffer={() => {
                    setQueuedAccepted(true);
                    playBidAcceptedTone(settings.soundAlerts);
                    addToast(
                      'Next Ride Queued',
                      'Starts automatically right after finishing this dropoff.',
                      'success'
                    );
                  }}
                  onDeclineQueuedOffer={() => setQueuedOffer(null)}
                  onOpenChat={() => {
                    setShowChat(true);
                    setUnreadChatCount(0);
                  }}
                  onCallRider={() => {
                    if (!activeRequest) return;
                    setCallBanner(`Calling ${activeRequest.riderName} via masked Bolt line...`);
                    setTimeout(() => setCallBanner(null), 4000);
                  }}
                  onOpenCancelModal={() => setShowCancelModal(true)}
                  onWaitLongerNoResponse={handleWaitLongerNoResponse}
                  onCancelNoResponseCollectFee={handleCancelNoResponseCollectFee}
                  onSubmitRating={handleSubmitRating}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <ScheduledRidesView
            rides={scheduledRides}
            onToggleClaim={handleToggleClaimScheduled}
            onStartScheduledRide={handleStartScheduledRide}
            onRefreshSchedule={() => {
              setScheduledRides(generateScheduledRidesNear(driverPos, currentCityId));
              addToast('Schedule Refreshed', 'Updated upcoming airport & morning slots.', 'info');
            }}
          />
        )}

        {activeTab === 'earnings' && (
          <EarningsView
            trips={trips}
            weeklySeries={weeklySeries}
            payoutBalance={profile.bankBalance}
            currency={currency}
            dailyGoal={settings.dailyGoal}
            onUpdateDailyGoal={(goal) => setSettings((s) => ({ ...s, dailyGoal: goal }))}
            shiftElapsedSec={shiftElapsedSec}
            shiftDistanceKm={shiftDistanceKm}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            incidents={incidents}
            driverName={profile.fullName}
            vehicleLabel={activeVehicle.makeModel}
            vehiclePlate={activeVehicle.plate}
            onCashOut={(amt) =>
              setProfile((p) => ({
                ...p,
                bankBalance: Math.max(0, Number((p.bankBalance - amt).toFixed(2))),
              }))
            }
          />
        )}

        {activeTab === 'activity' && (
          <ActivityView
            driverScore={driverScore}
            acceptanceRate={acceptanceRate}
            completionRate={completionRate}
            riderRating={riderRating}
            campaigns={campaigns}
          />
        )}

        {activeTab === 'insurance' && (
          <InsuranceView
            profile={profile}
            currency={currency}
            insuranceDaysLeft={insuranceDaysLeft}
            isInsuranceExpired={isInsuranceExpired}
            onChangeCoverage={handleChangeCoverage}
            onSaveVehicle={handleSaveInsuredVehicle}
            onAddDriver={(name) =>
              setProfile((p) => ({
                ...p,
                additionalDrivers: [...p.additionalDrivers, name],
              }))
            }
            onRemoveDriver={(name) =>
              setProfile((p) => ({
                ...p,
                additionalDrivers: p.additionalDrivers.filter((d) => d !== name),
              }))
            }
            onOpenRenewalChat={() => setIsInsuranceRenewalChatOpen(true)}
            onCancelPlan={handleCancelInsurancePlan}
          />
        )}

        {activeTab === 'account' && (
          <AccountView
            profile={profile}
            firebaseEmail={firebaseUser?.email || null}
            vehicles={vehicles}
            documents={documents}
            settings={settings}
            currency={currency}
            riderRating={riderRating}
            totalLifetimeTrips={trips.length}
            notificationPermission={notificationPermission}
            permissionsSnapshot={permissionsSnapshot}
            lastBackgroundSync={lastBackgroundSync}
            notificationsLog={notificationsLog}
            isInsuranceExpired={isInsuranceExpired}
            onSelectVehicle={handleSelectVehicle}
            onRechargeVehicle={handleRechargeVehicle}
            onServiceVehicle={handleServiceVehicle}
            onUpdateSettings={(next) => setSettings((s) => ({ ...s, ...next }))}
            onOpenAccountCreation={() => setShowAccountCreation(true)}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            onOpenInsurance={() => setActiveTab('insurance')}
            onOpenPermissionsModal={() => setShowPermissionsModal(true)}
            onEnablePushNotifications={handleEnablePush}
            onSendTestNotification={() => {
              if (notificationPermission !== 'granted') {
                handleEnablePush();
              } else {
                sendNotification(
                  'Bolt Driver · High Demand',
                  `1.7x surge active in ${activeCity.name}. Tap to go online.`,
                  'alert'
                );
              }
            }}
            onRunManualRefresh={() => {
              runBackgroundSync();
              addToast('Background Sync', 'Surge zones & bid jobs refreshed', 'info');
            }}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (5 tabs) */}
      {!(activeTab === 'map' && isTripActive) && (
        <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-[420] pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
          <div className="h-16 grid grid-cols-5 items-center">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex flex-col items-center justify-center h-full min-w-[44px] active:scale-95 transition-transform"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-[#25B670]' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  {item.id === 'schedule' && claimedScheduleCount > 0 && (
                    <span className="absolute top-2 right-3 w-4 h-4 rounded-full bg-[#34D186] text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                      {claimedScheduleCount}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold mt-1 ${
                      active
                        ? 'text-slate-950 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Modals & Drawers */}
      {showAccountCreation && (
        <AccountCreationModal
          initialName={firebaseUser?.displayName || ''}
          initialEmail={firebaseUser?.email || ''}
          initialUid={firebaseUser?.uid}
          onCompleteRegistration={handleCompleteRegistration}
          onClose={() => {
            setShowAccountCreation(false);
            if (firebaseUser) setIsProfileLoaded(true);
          }}
        />
      )}

      {isInsuranceRenewalChatOpen && (
        <InsuranceRenewalChat
          profile={profile}
          currency={currency}
          bankBalance={profile.bankBalance}
          onCompleteRenewal={handleCompleteInsuranceRenewal}
          onClose={() => setIsInsuranceRenewalChatOpen(false)}
        />
      )}

      {showBidJobsModal && (
        <BidJobsModal
          jobs={bidJobs}
          boltFlexEnabled={settings.enabledCategories.includes('Bolt Flex')}
          onPlaceBid={handlePlaceMarketplaceBid}
          onCancelBid={handleCancelMarketplaceBid}
          onAcceptCounterBid={handleAcceptCounterBid}
          onStartWonJob={handleStartWonBidJob}
          onRefreshJobs={() => {
            setBidJobs(generateBidJobsNear(driverPos, currentCityId, settings.enabledCategories));
            addToast('Bolt Flex', 'Refreshed nearby bid offers', 'info');
          }}
          onOpenPreferences={() => setShowPrefs(true)}
          onClose={() => setShowBidJobsModal(false)}
        />
      )}

      {showPrefs && (
        <PreferencesModal
          settings={settings}
          currency={currency}
          availableCategories={activeVehicle.categories}
          isInsuranceExpired={isInsuranceExpired}
          onOpenInsuranceRenewal={() => setIsInsuranceRenewalChatOpen(true)}
          onUpdateSettings={(next) => {
            setSettings((s) => ({ ...s, ...next }));
            if (next.dispatchWaitSec !== undefined) {
              dispatchTriggeredRef.current = false;
              setNextRequestWaitLeft(resolveDispatchWaitSeconds(next.dispatchWaitSec));
            }
          }}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {showDestination && (
        <DestinationModal
          cityId={currentCityId}
          currentTargetLabel={settings.destinationFilter.targetLabel}
          onSelect={(coords, label) => {
            setSettings((s) => ({
              ...s,
              destinationFilter: {
                enabled: true,
                targetCoords: coords,
                targetLabel: label,
              },
            }));
            addToast('Destination Set', `Matching rides toward ${label}`, 'info');
          }}
          onClear={() =>
            setSettings((s) => ({
              ...s,
              destinationFilter: {
                enabled: false,
                targetCoords: null,
                targetLabel: null,
              },
            }))
          }
          onClose={() => setShowDestination(false)}
        />
      )}

      {showChat && activeRequest && (
        <RiderChatModal
          riderName={activeRequest.riderName}
          messages={chatMessages}
          currency={currency}
          awaitingRiderReply={awaitingRiderReply}
          riderNoResponseSec={riderNoResponseSec}
          noResponseFeeAmount={noResponseFeeAmount}
          onSendMessage={handleSendChat}
          onWaitLonger={handleWaitLongerNoResponse}
          onCancelCollectFee={handleCancelNoResponseCollectFee}
          onClose={() => setShowChat(false)}
        />
      )}

      {showCancelModal && (
        <CancelRideModal
          isInProgress={status === 'IN_PROGRESS'}
          onConfirmCancel={handleConfirmCancel}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showSafetyModal && (
        <SafetyModal
          driverPos={driverPos}
          vehicleLabel={activeVehicle.makeModel}
          vehiclePlate={activeVehicle.plate}
          activeTripLabel={
            activeRequest
              ? `${activeRequest.pickupAddress} → ${activeRequest.dropoffAddress}`
              : undefined
          }
          activeTripId={activeRequest?.id}
          riderName={activeRequest?.riderName}
          incidents={incidents}
          onSaveIncident={handleSaveIncident}
          onClose={() => setShowSafetyModal(false)}
        />
      )}

      {showPermissionsModal && (
        <PermissionsPromptModal
          permissions={permissionsSnapshot}
          onUpdatePermissions={applyPermissionResult}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}

      <OfflineIndicator />

      <BootScreen isVisible={showBootScreen} onComplete={handleBootComplete} />
    </div>
  );
}
