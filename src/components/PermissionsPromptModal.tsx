import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  MapPin,
  Mic,
  ShieldCheck,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react';
import {
  AppPermissionsSnapshot,
  DevicePermissionStatus,
  requestAllDevicePermissions,
  requestLocationPermission,
  requestMicrophonePermission,
  requestNotificationPermission,
} from '../utils/permissions';

interface PermissionsPromptModalProps {
  permissions: AppPermissionsSnapshot;
  onUpdatePermissions: (
    next: AppPermissionsSnapshot,
    coords?: { lat: number; lng: number }
  ) => void;
  onClose: () => void;
}

export const PermissionsPromptModal: React.FC<PermissionsPromptModalProps> = ({
  permissions,
  onUpdatePermissions,
  onClose,
}) => {
  const [requesting, setRequesting] = useState(false);

  const renderBadge = (state: DevicePermissionStatus) => {
    if (state === 'granted') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#25B670]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Allowed
        </span>
      );
    }
    if (state === 'denied') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
          <XCircle className="w-3.5 h-3.5" />
          Blocked
        </span>
      );
    }
    if (state === 'unsupported') {
      return <span className="text-[11px] font-semibold text-slate-400">Unavailable</span>;
    }
    return <span className="text-[11px] font-bold text-amber-500">Tap to allow</span>;
  };

  const handleAllowAll = async () => {
    setRequesting(true);
    try {
      const { snapshot, coords } = await requestAllDevicePermissions();
      onUpdatePermissions(snapshot, coords);
      if (
        snapshot.location === 'granted' &&
        snapshot.microphone === 'granted' &&
        snapshot.notifications === 'granted'
      ) {
        onClose();
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleSingleLocation = async () => {
    const res = await requestLocationPermission();
    onUpdatePermissions({ ...permissions, location: res.status }, res.coords);
  };

  const handleSingleMic = async () => {
    const status = await requestMicrophonePermission();
    onUpdatePermissions({ ...permissions, microphone: status });
  };

  const handleSingleNotif = async () => {
    const status = await requestNotificationPermission();
    onUpdatePermissions({ ...permissions, notifications: status });
  };

  return (
    <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[78dvh]">
        <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#34D186]/15 text-[#25B670] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white leading-tight">
                Driver App Permissions
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Required for live map, calls &amp; ride alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip permissions"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 space-y-2 overflow-y-auto">
          <button
            type="button"
            onClick={handleSingleLocation}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2.5 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Live Location (GPS)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Navigation, pickups &amp; nearby surges
                </div>
              </div>
            </div>
            <div className="shrink-0">{renderBadge(permissions.location)}</div>
          </button>

          <button
            type="button"
            onClick={handleSingleMic}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2.5 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#25B670] flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Microphone
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Masked rider calls &amp; safety audio
                </div>
              </div>
            </div>
            <div className="shrink-0">{renderBadge(permissions.microphone)}</div>
          </button>

          <button
            type="button"
            onClick={handleSingleNotif}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2.5 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Push Notifications
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Incoming ride &amp; Bolt Flex bid alerts
                </div>
              </div>
            </div>
            <div className="shrink-0">{renderBadge(permissions.notifications)}</div>
          </button>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Screen Wake Lock &amp; Sync
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Keeps screen active while online
                </div>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-[#25B670] shrink-0">Ready</span>
          </div>
        </div>

        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 shrink-0">
          <button
            type="button"
            disabled={requesting}
            onClick={handleAllowAll}
            className="w-full h-10 rounded-xl bg-[#34D186] hover:bg-[#29BE77] disabled:opacity-60 text-slate-950 font-extrabold text-xs transition-colors"
          >
            {requesting ? 'Requesting Permissions...' : 'Allow All Permissions'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-8 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Continue without all permissions
          </button>
        </div>
      </div>
    </div>
  );
};
