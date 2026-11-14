import { getNotificationPermission, requestPushPermission } from './notifications';
import { requestScreenWakeLock } from './pwaDevice';

export type DevicePermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissionsSnapshot {
  location: DevicePermissionStatus;
  microphone: DevicePermissionStatus;
  notifications: DevicePermissionStatus;
  wakeLockSupported: boolean;
}

const mapBrowserPerm = (state: PermissionState | undefined): DevicePermissionStatus => {
  if (state === 'granted' || state === 'denied' || state === 'prompt') return state;
  return 'prompt';
};

export async function queryAllPermissions(): Promise<AppPermissionsSnapshot> {
  const notifPerm = getNotificationPermission();
  const notifications: DevicePermissionStatus =
    notifPerm === 'default' ? 'prompt' : notifPerm;

  let location: DevicePermissionStatus =
    typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unsupported';
  let microphone: DevicePermissionStatus =
    typeof navigator !== 'undefined' && navigator.mediaDevices ? 'prompt' : 'unsupported';

  if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions) {
    try {
      const geoRes = await navigator.permissions.query({ name: 'geolocation' });
      location = mapBrowserPerm(geoRes.state);
    } catch {
      // Keep prompt fallback
    }

    try {
      const micRes = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      microphone = mapBrowserPerm(micRes.state);
    } catch {
      // Keep prompt fallback
    }
  }

  return {
    location,
    microphone,
    notifications,
    wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  };
}

export async function requestLocationPermission(): Promise<{
  status: DevicePermissionStatus;
  coords?: { lat: number; lng: number };
}> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { status: 'unsupported' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          status: 'granted',
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        resolve({ status: err.code === 1 ? 'denied' : 'prompt' });
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 15000 }
    );
  });
}

export async function requestMicrophonePermission(): Promise<DevicePermissionStatus> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return 'unsupported';
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop tracks so browser mic indicator does not stay on
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
    ) {
      return 'denied';
    }
    return 'prompt';
  }
}

export async function requestNotificationPermission(): Promise<DevicePermissionStatus> {
  const res = await requestPushPermission();
  if (res === 'default') return 'prompt';
  return res;
}

export async function requestAllDevicePermissions(): Promise<{
  snapshot: AppPermissionsSnapshot;
  coords?: { lat: number; lng: number };
}> {
  const [locRes, micStatus, notifStatus] = await Promise.all([
    requestLocationPermission(),
    requestMicrophonePermission(),
    requestNotificationPermission(),
  ]);

  // Also check wake lock readiness cleanly without locking indefinitely offline
  requestScreenWakeLock().catch(() => {});

  const current = await queryAllPermissions();
  return {
    snapshot: {
      location: locRes.status === 'granted' ? 'granted' : current.location === 'denied' ? 'denied' : locRes.status,
      microphone: micStatus === 'granted' ? 'granted' : current.microphone === 'denied' ? 'denied' : micStatus,
      notifications: notifStatus === 'granted' ? 'granted' : current.notifications === 'denied' ? 'denied' : notifStatus,
      wakeLockSupported: current.wakeLockSupported,
    },
    coords: locRes.coords,
  };
}
