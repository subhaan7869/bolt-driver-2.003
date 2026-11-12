let wakeLockSentinel: WakeLockSentinel | null = null;
let wakeLockEnabled = false;

export const requestScreenWakeLock = async (): Promise<boolean> => {
  wakeLockEnabled = true;
  try {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && navigator.wakeLock) {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    }
  } catch (err) {
    console.debug('PWA Wake Lock unavailable or blocked:', err);
  }
  return false;
};

export const releaseScreenWakeLock = async (): Promise<void> => {
  wakeLockEnabled = false;
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.debug('Error releasing wake lock:', err);
  }
};

export const isWakeLockActive = (): boolean => {
  return Boolean(wakeLockSentinel && !wakeLockSentinel.released);
};

// Automatically re-acquire wake lock when returning to the app
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (wakeLockEnabled && document.visibilityState === 'visible') {
      await requestScreenWakeLock();
    }
  });
}
