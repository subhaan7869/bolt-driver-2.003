import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-5 lg:translate-x-0 z-[500] flex items-center gap-2 rounded-full bg-amber-500 text-slate-950 px-3.5 py-1.5 text-xs font-extrabold shadow-xl whitespace-nowrap"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Cached app active</span>
    </div>
  );
};
