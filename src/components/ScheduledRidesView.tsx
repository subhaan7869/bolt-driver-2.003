import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  KeyRound,
  Navigation,
  Plane,
  RefreshCw,
  Star,
} from 'lucide-react';
import { ScheduledRide } from '../types/driver';
import { formatMiles } from '../utils/units';

interface ScheduledRidesViewProps {
  rides: ScheduledRide[];
  onToggleClaim: (rideId: string) => void;
  onStartScheduledRide: (ride: ScheduledRide) => void;
  onRefreshSchedule: () => void;
}

export const ScheduledRidesView: React.FC<ScheduledRidesViewProps> = ({
  rides,
  onToggleClaim,
  onStartScheduledRide,
  onRefreshSchedule,
}) => {
  const [filter, setFilter] = useState<'all' | 'claimed'>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const claimedCount = rides.filter((r) => r.claimed).length;
  const visibleRides = filter === 'claimed' ? rides.filter((r) => r.claimed) : rides;

  const formatCountdown = (iso: string) => {
    const diffSec = Math.max(0, Math.floor((new Date(iso).getTime() - nowMs) / 1000));
    if (diffSec === 0) return 'Ready now';
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    if (hrs > 0) return `In ${hrs}h ${mins}m`;
    return `In ${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Scheduled Rides
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pre-booked airport transfers &amp; morning reservations you can claim ahead of time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Available ({rides.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('claimed')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  filter === 'claimed'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Claimed ({claimedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={onRefreshSchedule}
              aria-label="Refresh scheduled rides"
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {visibleRides.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No claimed reservations yet
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch to Available to claim upcoming airport and executive pickups with automatic countdown reminders.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleRides.map((ride) => (
              <div
                key={ride.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border space-y-3.5 transition-all ${
                  ride.claimed
                    ? 'border-[#34D186] shadow-lg shadow-[#34D186]/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 text-[#25B670] font-extrabold">
                        {ride.tag === 'Airport Transfer' ? (
                          <Plane className="w-3.5 h-3.5" />
                        ) : (
                          <CalendarClock className="w-3.5 h-3.5" />
                        )}
                        {ride.tag}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ride.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {ride.riderRating.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-base font-extrabold text-slate-950 dark:text-white leading-snug">
                      {ride.pickupTimeLabel} · {ride.riderName}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                      {ride.currency}
                      {ride.estimatedFare.toFixed(2)}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono-num">
                      <Clock className="w-3 h-3" />
                      {formatCountdown(ride.pickupTimeIso)}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    Pickup: {ride.pickupAddress}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 truncate">
                    Dropoff: {ride.dropoffAddress}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 tabular-nums">
                    <span>
                      {formatMiles(ride.tripDistanceKm)} · {ride.tripEtaMin} min · {ride.paymentMethod}
                    </span>
                    {ride.pickupPin && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#25B670] font-bold">
                          <KeyRound className="w-3 h-3" />
                          PIN Required
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {ride.note && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Note: {ride.note}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {ride.claimed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onStartScheduledRide(ride)}
                        className="flex-1 h-11 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Start Pickup Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleClaim(ride.id)}
                        className="px-4 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                      >
                        Release
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleClaim(ride.id)}
                      className="w-full h-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#34D186]" />
                      <span>Claim Reservation</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
