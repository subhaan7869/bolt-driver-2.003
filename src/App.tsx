import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  Activity,
  AlertTriangle,
  Bell,
  Car,
  Eye,
  EyeOff,
  Map as MapIcon,
  Mic,
  MicOff,
  Moon,
  PhoneCall,
  Shield,
  Sun,
  User,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import { AccountCreationModal } from './components/AccountCreationModal';
import { AccountView } from './components/AccountView';
import { ActivityView } from './components/ActivityView';
import { BidJobsModal } from './components/BidJobsModal';
import { EarningsView } from './components/EarningsView';
import { IncomingRequestModal } from './components/IncomingRequestModal';
import { InsuranceRenewalChat, InsuranceView } from './components/InsuranceView';
import {
  CancelRideModal,
  DestinationModal,
  PreferencesModal,
  RiderChatModal,
  SafetyModal,
} from './components/Overlays';
import { TripPanels } from './components/TripPanels';
import { WorldDriverMap } from './components/WorldDriverMap';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_DOCUMENTS,
  INITIAL_TRIPS,
  INITIAL_VEHICLES,
  WEEKLY_EARNINGS_SERIES,
  calculateBearing,
  fetchRoadRoute,
  generateBidJobsNear,
  generateLiveRideRequest,
  generateSurgeZonesNear,
  getCityById,
  getFutureIsoDate,
  getTodayDayKey,
  haversineKm,
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
  DriverDocument,
  DriverProfile,
  DriverSettings,
  DriverStatus,
  InAppToast,
  InsuranceCoverage,
  LatLng,
  ManeuverStep,
  RideRequest,
  SurgeZone,
  Vehicle,
} from './types/driver';
import {
  VoiceSnapshot,
  dynamicIslandVoiceManager,
} from './utils/dynamicIslandVoiceManager';
import {
  NotificationPermissionState,
  getNotificationPermission,
  requestPushPermission,
} from './utils/notifications';
import { releaseScreenWakeLock, requestScreenWakeLock } from './utils/pwaDevice';
import {
  cancelNavigationSpeech,
  playArrivalChime,
  playBidAcceptedTone,
  playHyperSound,
  playNavigationTurnPing,
  playSuccessTone,
  speakNavigationCue,
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

  // Active request & routing
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [activeRoute, setActiveRoute] = useState<LatLng[]>([]);
  const [previewDropoffRoute, setPreviewDropoffRoute] = useState<LatLng[]>([]);
  const [activeManeuvers, setActiveManeuvers] = useState<ManeuverStep[]>([]);
  const [currentManeuverIndex, setCurrentManeuverIndex] = useState<number>(0);
  const routeIndexRef = useRef<number>(0);
  const gpsWatchIdRef = useRef<number | null>(null);

  // Bid Marketplace
  const [bidJobs, setBidJobs] = useState<BidJobOffer[]>(() =>
    generateBidJobsNear(initialCity.center, initialCity.id, ['Bolt', 'Comfort', 'Bolt Green'])
  );
  const [showBidJobsModal, setShowBidJobsModal] = useState(false);

  // Business State — starts strictly at £0.00 and matches today's earnings
  const [trips, setTrips] = useState<CompletedTrip[]>(INITIAL_TRIPS);
  const [weeklySeries, setWeeklySeries] = useState(WEEKLY_EARNINGS_SERIES);
  const [campaigns, setCampaigns] = useState<CampaignQuest[]>(INITIAL_CAMPAIGNS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
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
  const [callBanner, setCallBanner] = useState<string | null>(null);

  // Notifications & Toasts
  const [toasts, setToasts] = useState<InAppToast[]>([]);
  const [notificationsLog, setNotificationsLog] = useState<string[]>([]);
  const lastNoteRef = useRef<{ title: string; body: string; time: number } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(
    () => getNotificationPermission()
  );
  const [lastBackgroundSync, setLastBackgroundSync] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  });

  // Dynamic Island Voice State
  const [voiceSnap, setVoiceSnap] = useState<VoiceSnapshot>(() =>
    dynamicIslandVoiceManager.getSnapshot()
  );

  // Rider Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Driver Settings
  const [settings, setSettings] = useState<DriverSettings>({
    darkMode: false,
    soundAlerts: true,
    voiceNavigation: true,
    autoAccept: false,
    acceptCash: true,
    allowBidOffers: true,
    minFareFilter: 0,
    maxPickupKm: 6,
    minRiderRating: 0,
    pushNotifications: getNotificationPermission() === 'granted',
    backgroundRefresh: true,
    refreshIntervalSec: 30,
    enabledCategories: ['Bolt', 'Comfort', 'Bolt Green'],
    destinationFilter: {
      enabled: false,
      targetCoords: null,
      targetLabel: null,
    },
  });

  const activeCity = getCityById(currentCityId);
  const activeVehicle = vehicles.find((v) => v.isActive) || vehicles[0];
  const currency = activeCity.currency;
  const isOnline = status !== 'OFFLINE';

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
                  icon: 'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png',
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

  // Register firebase-messaging-sw.js on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
    }
  }, []);

  const lastGpsSyncRef = useRef<number>(0);

  // 1. Firebase Auth & Load User Profile from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        getDoc(doc(db, 'users', fUser.uid))
          .then((userDoc) => {
            if (userDoc.exists()) {
              const userData = { ...userDoc.data(), uid: fUser.uid } as DriverProfile;
              setProfile((prev) => ({
                ...prev,
                ...userData,
                isOnline: false,
                documentExpiries: {
                  ...prev.documentExpiries,
                  ...(userData.documentExpiries || {}),
                },
              }));
              if (userData.cityId) {
                setCurrentCityId(userData.cityId);
              }
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
            },
            { merge: true }
          );
          initializeFCMToken(firebaseUser.uid);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      };
      syncProfile();
    }
  }, [profile, firebaseUser, isProfileLoaded]);

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

  // 3. Instant local backup in localStorage (resets isOnline on stored snapshot)
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

  // Subscribe to Dynamic Island Voice Manager
  useEffect(() => {
    const unsubSnap = dynamicIslandVoiceManager.subscribe((snap) => setVoiceSnap(snap));
    return () => unsubSnap();
  }, []);

  // Shift Start / End with Screen Wake Lock
  const startShift = useCallback(() => {
    requestScreenWakeLock().catch(() => {});
    setStatus('ONLINE_IDLE');
    setProfile((p) => ({ ...p, isOnline: true }));
    playSuccessTone(settings.soundAlerts);
    speakNavigationCue('You are now online. Screen wake lock active.', settings.voiceNavigation);
    addToast('Online', 'Screen wake lock active while driving', 'success');
  }, [settings.soundAlerts, settings.voiceNavigation, addToast]);

  const endShift = useCallback(() => {
    releaseScreenWakeLock().catch(() => {});
    cancelNavigationSpeech();
    setStatus('OFFLINE');
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

  // Browser Geolocation
  const handleRequestLiveGps = useCallback(() => {
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
        setBidJobs(generateBidJobsNear(coords, currentCityId, settings.enabledCategories));
        addToast('Live GPS Locked', 'Dispatch map centered on your real location', 'success');
      },
      () => {
        setGpsLoading(false);
        addToast('GPS Permission Denied', 'Using selected world city dispatch map.', 'info');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );

    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
    }
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (status === 'OFFLINE' || status === 'ONLINE_IDLE') {
          setDriverPos({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }, [currentCityId, settings.enabledCategories, addToast, status]);

  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  const handleSelectCity = useCallback(
    (cityId: string) => {
      const city = getCityById(cityId);
      setIsLiveGps(false);
      setCurrentCityId(city.id);
      setDriverPos(city.center);
      setSurgeZones(generateSurgeZonesNear(city.center, city.id));
      setBidJobs(generateBidJobsNear(city.center, city.id, settings.enabledCategories));
      addToast('City Switched', `Dispatch map moved to ${city.name}, ${city.country}`, 'info');
    },
    [settings.enabledCategories, addToast]
  );

  // Trigger Live Ride Request
  const triggerRideOffer = useCallback(async () => {
    const allowedCats = isInsuranceExpired
      ? (['Delivery'] as const)
      : settings.enabledCategories;

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
    });

    setActiveRequest(req);
    setActiveRoute(req.toPickupRoute);
    setPreviewDropoffRoute(req.toDropoffRoute);
    setStatus('INCOMING_REQUEST');
    setActiveTab('map');

    sendNotification(
      `New ${req.category} Ride · ${req.currency}${req.estimatedFare.toFixed(2)}`,
      `${req.pickupAddress} → ${req.dropoffAddress} (${req.pickupEtaMin} min away)`,
      'alert'
    );
    speakNavigationCue(
      `New ${req.category} ride offer, ${req.currency}${req.estimatedFare.toFixed(0)}`,
      settings.voiceNavigation
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
    settings.voiceNavigation,
    surgeZones,
    sendNotification,
  ]);

  // Auto-dispatch ride requests when Online & Idle
  useEffect(() => {
    if (status !== 'ONLINE_IDLE') return;
    const timer = setTimeout(() => {
      triggerRideOffer();
    }, 5200);
    return () => clearTimeout(timer);
  }, [status, triggerRideOffer]);

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
      setCurrentManeuverIndex(0);
      routeIndexRef.current = 0;
      setChatMessages([]);
      setUnreadChatCount(0);
      setAcceptanceRate((r) => Math.min(100, r + 1));
      setStatus('EN_ROUTE_PICKUP');

      if (customFare !== undefined) {
        playBidAcceptedTone(settings.soundAlerts);
        speakNavigationCue(
          `Bid accepted. Navigate to ${finalReq.pickupAddress}`,
          settings.voiceNavigation
        );
        sendNotification(
          'Bid Accepted',
          `Rider accepted your ${finalReq.currency}${finalReq.estimatedFare.toFixed(2)} offer`,
          'success'
        );
      } else {
        playSuccessTone(settings.soundAlerts);
        speakNavigationCue(
          finalReq.maneuversToPickup[0]?.instruction || `Navigate to ${finalReq.pickupAddress}`,
          settings.voiceNavigation
        );
      }
    },
    [activeRequest, settings.soundAlerts, settings.voiceNavigation, sendNotification]
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
    cancelNavigationSpeech();
    setActiveRequest(null);
    setActiveRoute([]);
    setPreviewDropoffRoute([]);
    setActiveManeuvers([]);
    setAcceptanceRate((r) => Math.max(70, r - 1));
    setStatus('ONLINE_IDLE');
  }, []);

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

  // Smooth GPS movement along OSRM route + spoken turns
  useEffect(() => {
    if (status !== 'EN_ROUTE_PICKUP' && status !== 'IN_PROGRESS') return;
    if (activeRoute.length < 2) return;

    const interval = setInterval(() => {
      const idx = routeIndexRef.current;
      if (idx >= activeRoute.length - 1) return;

      const curr = activeRoute[idx];
      const next = activeRoute[idx + 1];
      const bearing = calculateBearing(curr, next);
      setDriverHeading(bearing);
      setDriverPos(next);
      routeIndexRef.current = idx + 1;

      const nextMan = activeManeuvers[currentManeuverIndex + 1];
      if (nextMan && idx + 1 >= nextMan.pointIndex) {
        setCurrentManeuverIndex((m) => m + 1);
        playNavigationTurnPing(settings.soundAlerts);
        speakNavigationCue(nextMan.instruction, settings.voiceNavigation);
      }
    }, 360);

    return () => clearInterval(interval);
  }, [
    status,
    activeRoute,
    activeManeuvers,
    currentManeuverIndex,
    settings.soundAlerts,
    settings.voiceNavigation,
  ]);

  const handleArrivePickup = useCallback(() => {
    if (!activeRequest) return;
    setDriverPos(activeRequest.pickupCoords);
    setActiveRoute([]);
    setStatus('ARRIVED_PICKUP');
    playArrivalChime(settings.soundAlerts);
    speakNavigationCue(
      `You have arrived at pickup for ${activeRequest.riderName}`,
      settings.voiceNavigation
    );
  }, [activeRequest, settings.soundAlerts, settings.voiceNavigation]);

  const handleStartTrip = useCallback(() => {
    if (!activeRequest) return;
    setActiveRoute(activeRequest.toDropoffRoute);
    setActiveManeuvers(activeRequest.maneuversToDropoff);
    setCurrentManeuverIndex(0);
    routeIndexRef.current = 0;
    setStatus('IN_PROGRESS');
    playSuccessTone(settings.soundAlerts);
    speakNavigationCue(
      activeRequest.maneuversToDropoff[0]?.instruction ||
        `Trip started. Head to ${activeRequest.dropoffAddress}`,
      settings.voiceNavigation
    );
  }, [activeRequest, settings.soundAlerts, settings.voiceNavigation]);

  const handleCompleteTrip = useCallback(() => {
    if (!activeRequest) return;
    setDriverPos(activeRequest.dropoffCoords);
    setActiveRoute([]);
    setActiveManeuvers([]);
    setStatus('TRIP_COMPLETED');
    playSuccessTone(settings.soundAlerts);
    speakNavigationCue('Trip completed. Please rate your rider.', settings.voiceNavigation);
  }, [activeRequest, settings.soundAlerts, settings.voiceNavigation]);

  // Connect Dynamic Island Voice Commands ("accept", "decline", "go online", "go offline", "next", "complete")
  useEffect(() => {
    const unsub = dynamicIslandVoiceManager.onCommand((cmd) => {
      if (cmd === 'accept' && status === 'INCOMING_REQUEST') {
        handleAcceptRequest();
      } else if (cmd === 'decline' && status === 'INCOMING_REQUEST') {
        handleDeclineRequest();
      } else if (cmd === 'go_online' && status === 'OFFLINE') {
        handleGoOnline();
      } else if (cmd === 'go_offline' && status === 'ONLINE_IDLE') {
        endShift();
      } else if (cmd === 'next') {
        if (status === 'EN_ROUTE_PICKUP') handleArrivePickup();
        else if (status === 'ARRIVED_PICKUP') handleStartTrip();
        else if (status === 'IN_PROGRESS') handleCompleteTrip();
      } else if (cmd === 'complete' && status === 'IN_PROGRESS') {
        handleCompleteTrip();
      }
    });
    return () => unsub();
  }, [
    status,
    handleAcceptRequest,
    handleDeclineRequest,
    handleGoOnline,
    endShift,
    handleArrivePickup,
    handleStartTrip,
    handleCompleteTrip,
  ]);

  const handleSubmitRating = (rating: number, tipBonus: number) => {
    if (!activeRequest) return;
    const commission = Number((activeRequest.estimatedFare * 0.15).toFixed(2));
    const netEarnings = Number((activeRequest.estimatedFare - commission + tipBonus).toFixed(2));
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newTrip: CompletedTrip = {
      id: `TR-${9043 + trips.length}`,
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
      boltCommission: commission,
      surgeBonus: activeRequest.surgeBonus,
      tip: tipBonus,
      netEarnings,
      riderRatingGiven: rating,
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

    setActiveRequest(null);
    setStatus('ONLINE_IDLE');
    sendNotification(
      'Trip Paid',
      `${currency}${netEarnings.toFixed(2)} added to today's earnings`,
      'success'
    );
  };

  const handleConfirmCancel = (reason: string) => {
    cancelNavigationSpeech();
    setShowCancelModal(false);
    setActiveRequest(null);
    setActiveRoute([]);
    setPreviewDropoffRoute([]);
    setActiveManeuvers([]);
    setCompletionRate((r) => Math.max(85, r - 1));
    setStatus('ONLINE_IDLE');
    addToast('Ride Cancelled', reason, 'info');
  };

  // Bid Jobs Marketplace handlers
  const handlePlaceMarketplaceBid = (jobId: string, amount: number) => {
    setBidJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, driverBid: amount, bidStatus: 'pending' } : j))
    );

    setTimeout(() => {
      setBidJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          const accepted = amount <= j.suggestedFare * 1.35;
          if (accepted) {
            sendNotification(
              'Bid Accepted!',
              `${j.riderName} accepted your ${j.currency}${amount.toFixed(2)} offer.`,
              'success'
            );
          }
          return { ...j, bidStatus: accepted ? 'accepted' : 'declined' };
        })
      );
    }, 1100);
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
    };

    setBidJobs((prev) => prev.filter((b) => b.id !== job.id));
    setActiveRequest(req);
    setActiveRoute(req.toPickupRoute);
    setPreviewDropoffRoute([]);
    setActiveManeuvers(req.maneuversToPickup);
    setCurrentManeuverIndex(0);
    routeIndexRef.current = 0;
    setStatus('EN_ROUTE_PICKUP');
    setActiveTab('map');
    playSuccessTone(settings.soundAlerts);
    speakNavigationCue(`Starting bid job. Navigate to ${req.pickupAddress}`, settings.voiceNavigation);
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
    setProfile(newProfile);
    setVehicles((prev) => [newVehicle, ...prev.map((v) => ({ ...v, isActive: false }))]);
    setDocuments(newDocs);
    setSettings((s) => ({
      ...s,
      enabledCategories: newVehicle.categories,
    }));

    const city = getCityById(newProfile.cityId);
    setCurrentCityId(city.id);
    setIsLiveGps(false);
    setDriverPos(city.center);
    setSurgeZones(generateSurgeZonesNear(city.center, city.id));
    setBidJobs(generateBidJobsNear(city.center, city.id, newVehicle.categories));
    setShowAccountCreation(false);
    setIsProfileLoaded(true);
    setActiveTab('map');
    playBidAcceptedTone(settings.soundAlerts);
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

  const handleToggleVoiceMic = async () => {
    if (voiceSnap.isMicActive) {
      dynamicIslandVoiceManager.stopMicSession();
      addToast('Voice Mic Off', 'Dynamic Island voice commands paused', 'info');
    } else {
      const ok = await dynamicIslandVoiceManager.startMicSession();
      if (ok) {
        addToast('Voice Mic Active', 'Say "accept", "decline", "go online", or "next"', 'success');
      } else {
        addToast(
          'Microphone Blocked',
          dynamicIslandVoiceManager.permissionError || 'Could not start microphone.',
          'alert'
        );
      }
    }
  };

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
      setUnreadChatCount((c) => (showChat ? 0 : c + 1));
      sendNotification('New Rider Message', 'Rider replied to your message', 'message');
    }, 1300);
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

  // Remaining route ETA & Distance calculation
  const targetCoord =
    status === 'EN_ROUTE_PICKUP' ? activeRequest?.pickupCoords : activeRequest?.dropoffCoords;
  const remainingDistKm = targetCoord
    ? Math.max(0.1, Number((haversineKm(driverPos, targetCoord) * 1.18).toFixed(1)))
    : 0;
  const remainingEtaMin = Math.max(1, Math.round(remainingDistKm * 3.1));

  const isTripActive =
    status === 'INCOMING_REQUEST' ||
    status === 'EN_ROUTE_PICKUP' ||
    status === 'ARRIVED_PICKUP' ||
    status === 'IN_PROGRESS' ||
    status === 'TRIP_COMPLETED';

  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] =
    [
      { id: 'map', label: 'Drive', icon: MapIcon },
      { id: 'earnings', label: 'Earnings', icon: Wallet },
      { id: 'activity', label: 'Activity', icon: Activity },
      { id: 'insurance', label: 'Insurance', icon: Shield },
      { id: 'account', label: 'Account', icon: User },
    ];

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5 z-30">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Bolt
              </span>
              <span className="text-xs font-bold text-[#25B670]">Driver</span>
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
            {navItems.map((item) => {
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
                  {item.id === 'insurance' && isInsuranceExpired && (
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                      Expired
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Direct New Driver Account Creation & Voice Mic Triggers */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAccountCreation(true)}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#25B670]" />
              <span>Register New Account</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoiceMic}
              className={`w-full h-11 px-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-colors ${
                voiceSnap.isMicActive
                  ? 'bg-[#34D186]/15 border-[#34D186] text-slate-950 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {voiceSnap.isMicActive ? (
                  <Mic className="w-4 h-4 text-[#25B670]" />
                ) : (
                  <MicOff className="w-4 h-4 text-slate-400" />
                )}
                <span>Voice Commands</span>
              </span>
              <span className="text-[10px] font-semibold opacity-80">
                {voiceSnap.isMicActive ? 'Listening' : 'Off'}
              </span>
            </button>
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
              {activeVehicle.plate} · {isLiveGps ? 'Live GPS' : activeCity.name}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex-1 h-full overflow-hidden">
        {/* Dynamic Island Live Voice Command Pill */}
        {voiceSnap.isMicActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[460] bg-slate-950 text-white rounded-full px-4 py-2 shadow-2xl border border-white/15 flex items-center gap-3 max-w-[92vw]">
            <div className="flex items-center gap-1 h-4">
              {voiceSnap.levels.map((lvl, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-[#34D186] transition-all duration-75"
                  style={{ height: `${Math.round(4 + lvl * 12)}px` }}
                />
              ))}
            </div>
            <span className="text-xs font-bold truncate max-w-[180px]">
              {voiceSnap.lastTranscript || 'Listening: "accept", "go online"...'}
            </span>
            <button
              type="button"
              onClick={handleToggleVoiceMic}
              aria-label="Stop voice mic"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Global In-App Toasts Stack */}
        {toasts.length > 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[470] flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4">
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
              currentManeuver={activeManeuvers[currentManeuverIndex] || null}
              surgeZones={surgeZones}
              darkMode={settings.darkMode}
              voiceEnabled={settings.voiceNavigation}
              isLiveGps={isLiveGps}
              gpsLoading={gpsLoading}
              currentCityId={currentCityId}
              destinationTarget={settings.destinationFilter.targetCoords}
              onRequestLiveGps={handleRequestLiveGps}
              onSelectCity={handleSelectCity}
              onToggleVoice={() => {
                const next = !settings.voiceNavigation;
                if (!next) cancelNavigationSpeech();
                setSettings((s) => ({ ...s, voiceNavigation: next }));
                addToast(
                  'Voice Navigation',
                  next ? 'Spoken directions enabled' : 'Spoken directions muted',
                  'info'
                );
              }}
              onSelectSurgeZone={(zone: SurgeZone) =>
                addToast(
                  `${zone.label}`,
                  `${zone.multiplier.toFixed(1)}x surge demand active`,
                  'info'
                )
              }
              onOpenSafety={() => setShowSafetyModal(true)}
            />

            {/* Floating Top Bar on Map */}
            {status !== 'EN_ROUTE_PICKUP' && status !== 'IN_PROGRESS' && (
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-[400]">
                <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/92 dark:bg-slate-900/95 text-white rounded-full pl-4 pr-2 py-1.5 shadow-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('earnings')}
                    className="text-left pr-2"
                  >
                    <div className="text-[10px] font-semibold text-slate-400 leading-none">
                      Today ({todayKey}) · {isLiveGps ? 'GPS' : activeCity.name}
                    </div>
                    <div className="text-base font-extrabold font-mono-num leading-tight">
                      {hideEarningsPill
                        ? `${currency}••••`
                        : `${currency}${todayEarnings.toFixed(2)}`}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHideEarningsPill((h) => !h)}
                    aria-label={hideEarningsPill ? 'Show earnings' : 'Hide earnings'}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300"
                  >
                    {hideEarningsPill ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Quick Mobile Actions */}
                <div className="flex items-center gap-2 pointer-events-auto lg:hidden">
                  <button
                    type="button"
                    onClick={handleToggleVoiceMic}
                    aria-label="Toggle voice commands"
                    className={`w-11 h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center ${
                      voiceSnap.isMicActive
                        ? 'bg-[#34D186] text-slate-950 border-[#28B872]'
                        : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {voiceSnap.isMicActive ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <MicOff className="w-5 h-5" />
                    )}
                  </button>

                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      aria-label="Enable push notifications"
                      className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-amber-500"
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAccountCreation(true)}
                    aria-label="Create new driver account"
                    className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-[#25B670]"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* 30-Day / Expired Insurance Warning Banner on Map */}
            {(showInsuranceWarning || isInsuranceExpired) && !isTripActive && (
              <div className="absolute top-20 left-3.5 right-3.5 lg:left-5 lg:right-auto lg:w-[410px] z-[400]">
                <div
                  className={`rounded-2xl p-3.5 shadow-xl border flex items-center justify-between gap-3 ${
                    isInsuranceExpired
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-amber-50 dark:bg-amber-950/95 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="text-xs leading-snug">
                      <div className="font-extrabold">
                        {isInsuranceExpired
                          ? 'Vehicle Insurance Expired'
                          : `Insurance expires in ${insuranceDaysLeft} days`}
                      </div>
                      <div className="opacity-90 truncate">
                        {isInsuranceExpired
                          ? 'Renew Hire & Reward policy to go online'
                          : 'Tap Renew to update your certificate'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsInsuranceRenewalChatOpen(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
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
                        className="p-1 opacity-70 hover:opacity-100"
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
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[450] bg-slate-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold">
                <PhoneCall className="w-4 h-4 text-[#34D186]" />
                <span>{callBanner}</span>
                <button
                  type="button"
                  onClick={() => setCallBanner(null)}
                  className="text-slate-400 hover:text-white"
                  aria-label="End simulated call"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dispatch Bottom Sheet / Docked Card */}
            <div
              className={`absolute left-0 right-0 lg:left-5 lg:right-auto lg:bottom-5 lg:w-[410px] z-[400] transition-all ${
                isTripActive ? 'bottom-0' : 'bottom-16 lg:bottom-5'
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
                  currency={currency}
                  todayEarnings={todayEarnings}
                  todayTripsCount={todayTripsCount}
                  driverScore={driverScore}
                  remainingEtaMin={remainingEtaMin}
                  remainingDistKm={remainingDistKm}
                  destinationLabel={settings.destinationFilter.targetLabel}
                  unreadChatCount={unreadChatCount}
                  openBidJobsCount={bidJobs.length}
                  lastRefreshLabel={lastBackgroundSync}
                  backgroundRefreshEnabled={settings.backgroundRefresh}
                  onGoOnline={handleGoOnline}
                  onGoOffline={endShift}
                  onSimulateRequest={triggerRideOffer}
                  onOpenBidJobs={() => setShowBidJobsModal(true)}
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
                  onStartTrip={handleStartTrip}
                  onCompleteTrip={handleCompleteTrip}
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
                  onSubmitRating={handleSubmitRating}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <EarningsView
            trips={trips}
            weeklySeries={weeklySeries}
            payoutBalance={profile.bankBalance}
            currency={currency}
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
            riderRating={riderRating}
            totalLifetimeTrips={trips.length}
            notificationPermission={notificationPermission}
            lastBackgroundSync={lastBackgroundSync}
            notificationsLog={notificationsLog}
            isMicActive={voiceSnap.isMicActive}
            isInsuranceExpired={isInsuranceExpired}
            onSelectVehicle={handleSelectVehicle}
            onUpdateSettings={(next) => setSettings((s) => ({ ...s, ...next }))}
            onOpenAccountCreation={() => setShowAccountCreation(true)}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            onOpenInsurance={() => setActiveTab('insurance')}
            onToggleVoiceMic={handleToggleVoiceMic}
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[420] h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center h-full min-w-[44px]"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-[#25B670]' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
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
          onPlaceBid={handlePlaceMarketplaceBid}
          onStartWonJob={handleStartWonBidJob}
          onRefreshJobs={() => {
            setBidJobs(generateBidJobsNear(driverPos, currentCityId, settings.enabledCategories));
            addToast('Bid Marketplace', 'Refreshed nearby bid offers', 'info');
          }}
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
          onUpdateSettings={(next) => setSettings((s) => ({ ...s, ...next }))}
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
          onSendMessage={handleSendChat}
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

      {showSafetyModal && <SafetyModal onClose={() => setShowSafetyModal(false)} />}
    </div>
  );
}
