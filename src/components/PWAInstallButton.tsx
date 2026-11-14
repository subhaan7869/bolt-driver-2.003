import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'icon' | 'sidebar' | 'account';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handlePress = () => {
    if (isInstallable) {
      install();
    } else {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS && variant === 'icon') {
    return null;
  }

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <button
          type="button"
          onClick={handlePress}
          aria-label="Install Bolt Driver app"
          title={isIOS ? 'Install on iPhone / iPad' : 'Install Bolt Driver App'}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-[#25B670] active:scale-95 transition-transform"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      );
    }

    if (variant === 'account') {
      return (
        <button
          type="button"
          onClick={handlePress}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Smartphone className="w-4 h-4 text-[#34D186]" />
          <span>{isInstallable ? 'Install App' : isIOS ? 'Install on iPhone' : 'Install App'}</span>
        </button>
      );
    }

    if (!isInstallable && !isIOS) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={handlePress}
        className="w-full h-11 px-3.5 rounded-2xl bg-[#34D186]/15 border border-[#34D186]/40 hover:bg-[#34D186]/25 flex items-center gap-2.5 text-xs font-extrabold text-slate-900 dark:text-white transition-colors"
      >
        <Download className="w-4 h-4 text-[#25B670] shrink-0" />
        <span>{isIOS ? 'Install on iPhone / iPad' : 'Install Bolt Driver App'}</span>
      </button>
    );
  };

  return (
    <>
      {renderTrigger()}

      {showIOSGuide && (
        <div className="fixed inset-0 z-[900] bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/pwa-192x192.png"
                  alt="Bolt Driver"
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white leading-tight">
                    Install Bolt Driver
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add to Home Screen for full-screen driving
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close install instructions"
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#34D186]/20 text-[#25B670] font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="flex items-center gap-1">
                    Tap the <Share className="w-3.5 h-3.5 inline text-sky-500" />{' '}
                    <strong>Share</strong> button in Safari.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#34D186]/20 text-[#25B670] font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Open your browser menu (<strong>⋮</strong> or address bar install icon) and select{' '}
                <strong>Install Bolt Driver</strong> or <strong>Add to Home Screen</strong>.
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
