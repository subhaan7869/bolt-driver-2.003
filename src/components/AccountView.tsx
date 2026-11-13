import React, { useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Car,
  Check,
  ChevronRight,
  Cloud,
  Compass,
  FileCheck2,
  Flame,
  Fuel,
  Gauge,
  HelpCircle,
  LogIn,
  LogOut,
  MapPin,
  Mic,
  Moon,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sun,
  User,
  UserPlus,
  Volume2,
  Wrench,
  X,
} from 'lucide-react';
import { getCityById } from '../data/worldMapData';
import { DriverDocument, DriverProfile, DriverSettings, Vehicle } from '../types/driver';
import { NotificationPermissionState } from '../utils/notifications';
import { AppPermissionsSnapshot } from '../utils/permissions';
import { formatWholeMiles, kmToMi } from '../utils/units';
import { PWAInstallButton } from './PWAInstallButton';

interface AccountViewProps {
  profile: DriverProfile;
  firebaseEmail: string | null;
  vehicles: Vehicle[];
  documents: DriverDocument[];
  settings: DriverSettings;
  currency: string;
  riderRating: number;
  totalLifetimeTrips: number;
  notificationPermission: NotificationPermissionState;
  permissionsSnapshot: AppPermissionsSnapshot;
  lastBackgroundSync: string;
  notificationsLog: string[];
  isInsuranceExpired: boolean;
  onSelectVehicle: (vehicleId: string) => void;
  onRechargeVehicle: (vehicleId: string) => void;
  onServiceVehicle: (vehicleId: string, kind: 'service' | 'tyres') => void;
  onUpdateSettings: (next: Partial<DriverSettings>) => void;
  onOpenAccountCreation: () => void;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onOpenInsurance: () => void;
  onOpenPermissionsModal: () => void;
  onEnablePushNotifications: () => void;
  onSendTestNotification: () => void;
  onRunManualRefresh: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  profile,
  firebaseEmail,
  vehicles,
  documents,
  settings,
  riderRating,
  totalLifetimeTrips,
  notificationPermission,
  permissionsSnapshot,
  lastBackgroundSync,
  notificationsLog,
  isInsuranceExpired,
  onSelectVehicle,
  onRechargeVehicle,
  onServiceVehicle,
  onUpdateSettings,
  onOpenAccountCreation,
  onSignInGoogle,
  onSignOutGoogle,
  onOpenInsurance,
  onOpenPermissionsModal,
  onEnablePushNotifications,
  onSendTestNotification,
  onRunManualRefresh,
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const [carImageError, setCarImageError] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  const activeVehicle = vehicles.find((v) => v.isActive) || vehicles[0];
  const city = getCityById(profile.cityId);

  const rangePct = Math.min(
    100,
    Math.max(0, Math.round((activeVehicle.rangeKm / Math.max(1, activeVehicle.maxRangeKm)) * 100))
  );
  const isLowRange = activeVehicle.rangeKm < 95;
  const kmToService = Math.max(0, activeVehicle.nextServiceKm - activeVehicle.odometerKm);
  const kmToTyres = Math.max(0, activeVehicle.tyreCheckKm - activeVehicle.odometerKm);
  const serviceDueSoon = kmToService <= 500;
  const tyresDueSoon = kmToTyres <= 500;

  const daysUntil = (iso: string): number | null => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return null;
    return Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };
  const motDaysLeft = daysUntil(profile.documentExpiries['Vehicle MOT']);
  const insDaysLeft = daysUntil(profile.documentExpiries['Vehicle Insurance']);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Driver Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
              {!avatarError ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.fullName} driver portrait`}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-slate-500" />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                {profile.fullName}
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {city.name} ({profile.driverType}) · ★ {riderRating.toFixed(2)} ·{' '}
                {totalLifetimeTrips.toLocaleString()} trips
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                {profile.joinedLabel} · {profile.phone}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {firebaseEmail ? (
              <button
                type="button"
                onClick={onSignOutGoogle}
                className="max-w-full min-h-[42px] px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-2"
              >
                <Cloud className="w-4 h-4 text-[#25B670] shrink-0" />
                <span className="truncate">Synced ({firebaseEmail})</span>
                <LogOut className="w-3.5 h-3.5 ml-1 opacity-70 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Sign in with Google (Cloud Sync)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDocsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white inline-flex items-center gap-2 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-[#25B670]" />
              <span>Documents ({documents.length})</span>
            </button>

            <PWAInstallButton variant="account" />

            <button
              type="button"
              onClick={onOpenAccountCreation}
              className="px-4 py-2.5 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-xs font-extrabold text-slate-950 inline-flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Driver Account</span>
            </button>
          </div>
        </div>

        {/* Insurance Quick Entry */}
        <button
          type="button"
          onClick={onOpenInsurance}
          className={`w-full p-5 rounded-3xl border flex items-center justify-between gap-4 text-left transition-colors ${
            isInsuranceExpired
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isInsuranceExpired
                  ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300'
                  : 'bg-[#34D186]/15 text-[#25B670]'
              }`}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                Vehicle Hire &amp; Reward Insurance
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isInsuranceExpired
                  ? 'Expired — Renew to unlock passenger rides'
                  : `Plan: ${profile.insuranceCoverage.toUpperCase()} · Exp ${
                      profile.documentExpiries['Vehicle Insurance']
                    }${insDaysLeft !== null ? ` (${insDaysLeft}d left)` : ''}`}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </button>

        {/* Vehicles & Settings Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicles Switcher + EV/Fuel Range Guard + Maintenance Tracker */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                Fleet, Range &amp; Maintenance
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Active: {activeVehicle.plate}
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3] max-h-44 w-full flex items-center justify-center">
              {!carImageError ? (
                <img
                  src={activeVehicle.imageUrl}
                  alt={activeVehicle.makeModel}
                  referrerPolicy="no-referrer"
                  onError={() => setCarImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Car className="w-10 h-10" />
                  <span className="text-xs font-semibold">{activeVehicle.makeModel}</span>
                </div>
              )}
            </div>

            {/* EV Battery / Fuel Range Guard */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isLowRange
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {activeVehicle.fuelType === 'Electric' ? (
                    <BatteryCharging
                      className={`w-4 h-4 shrink-0 ${
                        isLowRange ? 'text-amber-600' : 'text-[#25B670]'
                      }`}
                    />
                  ) : (
                    <Fuel
                      className={`w-4 h-4 shrink-0 ${
                        isLowRange ? 'text-amber-600' : 'text-[#25B670]'
                      }`}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {activeVehicle.fuelType === 'Electric'
                        ? 'EV Battery Range Guard'
                        : 'Fuel Range Guard'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                      {Math.round(kmToMi(activeVehicle.rangeKm))} / {Math.round(kmToMi(activeVehicle.maxRangeKm))} mi ({rangePct}%)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRechargeVehicle(activeVehicle.id)}
                  className="px-3 h-9 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 text-xs font-extrabold whitespace-nowrap shrink-0"
                >
                  {activeVehicle.fuelType === 'Electric' ? 'Recharge' : 'Refuel'}
                </button>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  style={{ width: `${rangePct}%` }}
                  className={`h-full rounded-full transition-all ${
                    isLowRange ? 'bg-amber-500' : 'bg-[#34D186]'
                  }`}
                />
              </div>
              {isLowRange && (
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  Range under {Math.round(kmToMi(95))} mi — Long-distance Bolt City dispatches paused until topped up.
                </div>
              )}
            </div>

            {/* Vehicle Maintenance & Odometer Reminders */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-[#25B670]" />
                  Odometer &amp; Maintenance
                </span>
                <span className="text-xs font-extrabold font-mono-num text-slate-700 dark:text-slate-200">
                  {formatWholeMiles(activeVehicle.odometerKm)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div
                  className={`p-2.5 rounded-xl border ${
                    serviceDueSoon
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-slate-500 dark:text-slate-400">Next Service</div>
                  <div className="font-extrabold font-mono-num text-slate-950 dark:text-white mt-0.5">
                    {kmToService === 0 ? 'Due now!' : `In ${formatWholeMiles(kmToService)}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => onServiceVehicle(activeVehicle.id, 'service')}
                    className="mt-1.5 text-[10px] font-extrabold text-[#25B670] hover:underline inline-flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    Mark Serviced
                  </button>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    tyresDueSoon
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-slate-500 dark:text-slate-400">Tyre Rotation</div>
                  <div className="font-extrabold font-mono-num text-slate-950 dark:text-white mt-0.5">
                    {kmToTyres === 0 ? 'Inspect now!' : `In ${formatWholeMiles(kmToTyres)}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => onServiceVehicle(activeVehicle.id, 'tyres')}
                    className="mt-1.5 text-[10px] font-extrabold text-[#25B670] hover:underline inline-flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    Reset Tyres
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>
                  MOT expires {profile.documentExpiries['Vehicle MOT']}
                  {motDaysLeft !== null ? ` (${motDaysLeft}d)` : ''}
                </span>
                <span>
                  Insurance {insDaysLeft !== null ? `${insDaysLeft}d left` : 'Active'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {vehicles.map((veh) => (
                <button
                  key={veh.id}
                  type="button"
                  onClick={() => onSelectVehicle(veh.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                    veh.isActive
                      ? 'bg-[#34D186]/12 border-[#34D186]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-950 dark:text-white truncate">
                      {veh.makeModel}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {veh.plate} · {veh.year} {veh.fuelType} · {Math.round(kmToMi(veh.rangeKm))} mi range
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      veh.isActive
                        ? 'bg-[#34D186] text-slate-950'
                        : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {veh.isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* App, Navigation & Background Refresh */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                App, navigation &amp; sync
              </h2>
              <span className="text-[11px] font-bold text-[#25B670]">
                Remembered per driver account
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Heading-Up vs North-Up Nav Mode */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Heading-up navigation
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Rotate map in direction of travel during active trips
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.headingUpNav}
                  onClick={() => onUpdateSettings({ headingUpNav: !settings.headingUpNav })}
                  className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                    settings.headingUpNav ? 'bg-[#34D186]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.headingUpNav ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* D3 Demand Heatmap Default */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      D3 Demand Heatmap overlay
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Show hourly historical peaks &amp; +1–2h hotspots on map
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showHeatmap}
                  onClick={() => onUpdateSettings({ showHeatmap: !settings.showHeatmap })}
                  className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                    settings.showHeatmap ? 'bg-[#34D186]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.showHeatmap ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Device Permissions Manager */}
              <div className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#34D186]/15 flex items-center justify-center text-[#25B670] shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Device permissions
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Location, microphone, alerts &amp; wake lock
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenPermissionsModal}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold shrink-0"
                  >
                    Allow / Manage
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pl-0 sm:pl-13">
                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center gap-1.5 text-[11px] font-bold">
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        permissionsSnapshot.location === 'granted'
                          ? 'text-[#25B670]'
                          : permissionsSnapshot.location === 'denied'
                          ? 'text-rose-500'
                          : 'text-amber-500'
                      }`}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      GPS: {permissionsSnapshot.location === 'granted' ? 'On' : permissionsSnapshot.location === 'denied' ? 'Blocked' : 'Ask'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center gap-1.5 text-[11px] font-bold">
                    <Mic
                      className={`w-3.5 h-3.5 shrink-0 ${
                        permissionsSnapshot.microphone === 'granted'
                          ? 'text-[#25B670]'
                          : permissionsSnapshot.microphone === 'denied'
                          ? 'text-rose-500'
                          : 'text-amber-500'
                      }`}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      Mic: {permissionsSnapshot.microphone === 'granted' ? 'On' : permissionsSnapshot.microphone === 'denied' ? 'Blocked' : 'Ask'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center gap-1.5 text-[11px] font-bold">
                    <Bell
                      className={`w-3.5 h-3.5 shrink-0 ${
                        permissionsSnapshot.notifications === 'granted'
                          ? 'text-[#25B670]'
                          : permissionsSnapshot.notifications === 'denied'
                          ? 'text-rose-500'
                          : 'text-amber-500'
                      }`}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      Push: {permissionsSnapshot.notifications === 'granted' ? 'On' : permissionsSnapshot.notifications === 'denied' ? 'Blocked' : 'Ask'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Push notifications
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Status:{' '}
                        {notificationPermission === 'granted'
                          ? 'Enabled in browser'
                          : notificationPermission === 'denied'
                          ? 'Blocked by browser'
                          : 'Not enabled'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.pushNotifications}
                    onClick={() => {
                      if (!settings.pushNotifications) {
                        onEnablePushNotifications();
                      } else {
                        onUpdateSettings({ pushNotifications: false });
                      }
                    }}
                    className={`w-12 h-7 rounded-full transition-colors p-1 ${
                      settings.pushNotifications ? 'bg-[#34D186]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2 pl-0 sm:pl-13">
                  <button
                    type="button"
                    onClick={onSendTestNotification}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    Send test push notification
                  </button>
                </div>
              </div>

              {/* Background App Refresh */}
              <div className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Background app refresh
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Last sync {lastBackgroundSync}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.backgroundRefresh}
                    onClick={() =>
                      onUpdateSettings({ backgroundRefresh: !settings.backgroundRefresh })
                    }
                    className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                      settings.backgroundRefresh ? 'bg-[#34D186]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.backgroundRefresh ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settings.backgroundRefresh && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pl-0 sm:pl-13">
                    <div className="flex items-center gap-1.5">
                      {([15, 30, 60] as const).map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => onUpdateSettings({ refreshIntervalSec: sec })}
                          className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-bold ${
                            settings.refreshIntervalSec === sec
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={onRunManualRefresh}
                      className="min-h-[38px] px-2 text-xs font-bold text-[#25B670] hover:underline"
                    >
                      Sync now
                    </button>
                  </div>
                )}
              </div>

              {/* Map Theme Toggle */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Night map theme
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Low-glare dark cartography &amp; sheets
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.darkMode}
                  onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
                  className={`w-12 h-7 rounded-full transition-colors p-1 ${
                    settings.darkMode ? 'bg-[#34D186]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Navigation Sound Alerts */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Navigation &amp; dispatch sounds
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Turn pings, arrival chimes, and ride request tones
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.soundAlerts}
                  onClick={() => onUpdateSettings({ soundAlerts: !settings.soundAlerts })}
                  className={`w-12 h-7 rounded-full transition-colors p-1 ${
                    settings.soundAlerts ? 'bg-[#34D186]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Help & Support */}
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full py-4 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Help &amp; Partner Support
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Fare adjustments, lost items, document help
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {notificationsLog.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Recent alerts ({notificationsLog.length})
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {notificationsLog.slice(0, 6).map((n, i) => (
                    <div
                      key={i}
                      className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Driver documents
              </h3>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                aria-label="Close documents"
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {doc.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {doc.subtitle} · Exp{' '}
                      {doc.id === 'doc-ins'
                        ? profile.documentExpiries['Vehicle Insurance']
                        : doc.expiryDate}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      doc.id === 'doc-ins' && isInsuranceExpired
                        ? 'text-rose-600 dark:text-rose-400'
                        : doc.status === 'Verified'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {doc.id === 'doc-ins' && isInsuranceExpired ? 'Expired' : doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partner Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Contact Partner Support
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSupportModal(false);
                  setSupportSent(false);
                }}
                aria-label="Close support"
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supportSent ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#25B670] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Support ticket opened
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Average partner response time is under 8 minutes.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!supportMessage.trim()) return;
                  setSupportSent(true);
                  setSupportMessage('');
                }}
                className="space-y-3"
              >
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe a fare issue, lost item, or document question..."
                  className="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                />
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-sm"
                >
                  Send to Support
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
