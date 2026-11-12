import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Compass,
  Gavel,
  MapPin,
  MessageSquare,
  Phone,
  Power,
  SlidersHorizontal,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { DriverStatus, RideRequest } from '../types/driver';
import { SlideToConfirm } from './SlideToConfirm';

interface TripPanelsProps {
  status: DriverStatus;
  activeRequest: RideRequest | null;
  currency: string;
  todayEarnings: number;
  todayTripsCount: number;
  driverScore: number;
  remainingEtaMin: number;
  remainingDistKm: number;
  destinationLabel: string | null;
  unreadChatCount: number;
  openBidJobsCount: number;
  lastRefreshLabel: string;
  backgroundRefreshEnabled: boolean;
  onGoOnline: () => void;
  onGoOffline: () => void;
  onSimulateRequest: () => void;
  onOpenBidJobs: () => void;
  onOpenPreferences: () => void;
  onOpenDestination: () => void;
  onClearDestination: () => void;
  onArrivePickup: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onOpenChat: () => void;
  onCallRider: () => void;
  onOpenCancelModal: () => void;
  onSubmitRating: (rating: number, tipBonus: number) => void;
}

export const TripPanels: React.FC<TripPanelsProps> = ({
  status,
  activeRequest,
  currency,
  todayEarnings,
  todayTripsCount,
  driverScore,
  remainingEtaMin,
  remainingDistKm,
  destinationLabel,
  unreadChatCount,
  openBidJobsCount,
  lastRefreshLabel,
  backgroundRefreshEnabled,
  onGoOnline,
  onGoOffline,
  onSimulateRequest,
  onOpenBidJobs,
  onOpenPreferences,
  onOpenDestination,
  onClearDestination,
  onArrivePickup,
  onStartTrip,
  onCompleteTrip,
  onOpenChat,
  onCallRider,
  onOpenCancelModal,
  onSubmitRating,
}) => {
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [selectedStars, setSelectedStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Polite']);

  useEffect(() => {
    if (status !== 'ARRIVED_PICKUP') {
      setWaitSeconds(0);
      return;
    }
    const timer = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'TRIP_COMPLETED') {
      setSelectedStars(5);
      setSelectedTags(['Polite']);
    }
  }, [status]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const rem = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  if (status === 'OFFLINE') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
              You&apos;re offline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              Today: {currency}
              {todayEarnings.toFixed(2)} · {todayTripsCount} trips · Score {driverScore}%
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPreferences}
            aria-label="Trip preferences"
            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Destination Mode Shortcut */}
        {destinationLabel ? (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                Destination: {destinationLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearDestination}
              aria-label="Clear destination filter"
              className="p-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenDestination}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Compass className="w-4 h-4 text-slate-500" />
              Set destination filter
            </span>
            <span className="text-xs font-semibold text-slate-400">Optional</span>
          </button>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onOpenBidJobs}
            className="col-span-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <Gavel className="w-4 h-4 text-[#25B670]" />
            <span>Bid Jobs ({openBidJobsCount})</span>
          </button>

          <button
            type="button"
            onClick={onGoOnline}
            className="col-span-2 h-14 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] active:scale-[0.99] text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#34D186]/25 transition-all"
          >
            <Power className="w-5 h-5 stroke-[2.5]" />
            <span>Go Online</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'ONLINE_IDLE') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight">
                Looking for rides
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {backgroundRefreshEnabled
                ? `Background refresh active · Updated ${lastRefreshLabel}`
                : 'Scanning nearby demand zones'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDestination}
              aria-label="Destination filter"
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                destinationLabel
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Destination Filter"
            >
              <Compass className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenPreferences}
              aria-label="Trip preferences"
              className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
              title="Trip Preferences"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Searching bar */}
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-[#34D186] rounded-full animate-[pulse_1.6s_ease-in-out_infinite]" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onOpenBidJobs}
            className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Gavel className="w-4 h-4 text-[#25B670]" />
            <span>Bids ({openBidJobsCount})</span>
          </button>

          <button
            type="button"
            onClick={onSimulateRequest}
            className="h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-[#34D186]" />
            <span>New Offer</span>
          </button>

          <button
            type="button"
            onClick={onGoOffline}
            className="h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Power className="w-4 h-4" />
            <span>Offline</span>
          </button>
        </div>
      </div>
    );
  }

  if (
    (status === 'EN_ROUTE_PICKUP' ||
      status === 'ARRIVED_PICKUP' ||
      status === 'IN_PROGRESS') &&
    activeRequest
  ) {
    const isEnRoute = status === 'EN_ROUTE_PICKUP';
    const isArrived = status === 'ARRIVED_PICKUP';
    const isInProgress = status === 'IN_PROGRESS';

    const freeWaitRemaining = Math.max(0, 180 - waitSeconds);
    const isPaidWait = waitSeconds > 180;

    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {isEnRoute && <span>Picking up {activeRequest.riderName}</span>}
              {isArrived && <span>Waiting for {activeRequest.riderName}</span>}
              {isInProgress && <span>On trip · {activeRequest.category}</span>}
            </div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white truncate mt-0.5">
              {isInProgress ? activeRequest.dropoffAddress : activeRequest.pickupAddress}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {isArrived ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  {isPaidWait
                    ? `Paid waiting: ${formatTimer(waitSeconds - 180)}`
                    : `Free wait: ${formatTimer(freeWaitRemaining)} remaining`}
                </span>
              ) : (
                <span>
                  {remainingEtaMin} min · {remainingDistKm.toFixed(1)} km · {activeRequest.currency}
                  {activeRequest.estimatedFare.toFixed(2)} ({activeRequest.paymentMethod})
                </span>
              )}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{activeRequest.riderRating.toFixed(2)}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {activeRequest.riderTrips} rides
            </div>
          </div>
        </div>

        {activeRequest.note && !isInProgress && (
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#34D186] shrink-0 mt-0.5" />
            <span>&ldquo;{activeRequest.note}&rdquo;</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onCallRider}
            className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="relative h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#34D186] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCancelModal}
            className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{isInProgress ? 'End Early' : 'Cancel'}</span>
          </button>
        </div>

        {isEnRoute && (
          <SlideToConfirm label="Slide to arrive at pickup" onConfirm={onArrivePickup} variant="green" />
        )}
        {isArrived && (
          <SlideToConfirm label="Slide to start trip" onConfirm={onStartTrip} variant="green" />
        )}
        {isInProgress && (
          <SlideToConfirm label="Slide to complete trip" onConfirm={onCompleteTrip} variant="danger" />
        )}
      </div>
    );
  }

  if (status === 'TRIP_COMPLETED' && activeRequest) {
    const commission = Number((activeRequest.estimatedFare * 0.15).toFixed(2));
    const tipBonus = selectedStars === 5 ? 2.0 : 0;
    const net = Number((activeRequest.estimatedFare - commission + tipBonus).toFixed(2));
    const feedbackTags = ['Polite', 'Ready on time', 'Great conversation', 'Clean'];

    const toggleTag = (tag: string) => {
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    };

    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Trip completed
            </span>
            <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono-num mt-0.5">
              {activeRequest.currency}
              {net.toFixed(2)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#34D186]/15 text-[#25B670] flex items-center justify-center">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Gross fare ({activeRequest.paymentMethod})</span>
            <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-200">
              {activeRequest.currency}
              {activeRequest.estimatedFare.toFixed(2)}
            </span>
          </div>
          {activeRequest.surgeBonus > 0 && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Surge multiplier ({activeRequest.surgeMultiplier.toFixed(1)}x)</span>
              <span className="font-mono-num font-semibold">
                Included (+{activeRequest.currency}
                {activeRequest.surgeBonus.toFixed(2)})
              </span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Bolt service fee (15%)</span>
            <span className="font-mono-num">
              -{activeRequest.currency}
              {commission.toFixed(2)}
            </span>
          </div>
          {tipBonus > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Rider tip</span>
              <span className="font-mono-num font-semibold">
                +{activeRequest.currency}
                {tipBonus.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-bold text-slate-900 dark:text-white text-center">
            Rate {activeRequest.riderName}
          </p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStars(star)}
                aria-label={`Rate ${star} stars`}
                className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= selectedStars
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {feedbackTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSubmitRating(selectedStars, tipBonus)}
          className="w-full h-13 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-base transition-colors"
        >
          Done &amp; Continue
        </button>
      </div>
    );
  }

  return null;
};
