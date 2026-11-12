import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Coffee,
  Compass,
  Gavel,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Power,
  SlidersHorizontal,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { DriverStatus, RideRequest, TaxiRank } from '../types/driver';
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
  nextRequestWaitLeft: number;
  isRandomWait?: boolean;
  autoAccept: boolean;
  activeRank: TaxiRank | null;
  rankQueuePos: number | null;
  awaitingRiderReply: boolean;
  riderNoResponseSec: number;
  noResponseFeeAmount: number;
  onGoOnline: () => void;
  onGoOffline: () => void;
  onStartBreak: () => void;
  onResumeFromBreak: () => void;
  onToggleAutoAccept: () => void;
  onLeaveRank: () => void;
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
  onWaitLongerNoResponse: () => void;
  onCancelNoResponseCollectFee: () => void;
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
  nextRequestWaitLeft,
  isRandomWait,
  autoAccept,
  activeRank,
  rankQueuePos,
  awaitingRiderReply,
  riderNoResponseSec,
  noResponseFeeAmount,
  onGoOnline,
  onGoOffline,
  onStartBreak,
  onResumeFromBreak,
  onToggleAutoAccept,
  onLeaveRank,
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
  onWaitLongerNoResponse,
  onCancelNoResponseCollectFee,
  onSubmitRating,
}) => {
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
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
    if (status !== 'ON_BREAK') {
      setBreakSeconds(0);
      return;
    }
    const timer = setInterval(() => setBreakSeconds((s) => s + 1), 1000);
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
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-3.5 pt-2 pb-3 sm:p-5 space-y-2.5 sm:space-y-3.5 max-h-[46dvh] lg:max-h-none overflow-y-auto">
        <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
              You&apos;re offline
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
              Today: {currency}
              {todayEarnings.toFixed(2)} · {todayTripsCount} trips · Score {driverScore}%
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPreferences}
            aria-label="Trip preferences"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Destination Mode Shortcut */}
        {destinationLabel ? (
          <div className="flex items-center justify-between gap-2 pl-3 pr-1 py-1 min-h-[38px] sm:min-h-[44px] rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                Destination: {destinationLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearDestination}
              aria-label="Clear destination filter"
              className="w-8 h-8 flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenDestination}
            className="w-full min-h-[38px] sm:min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
          >
            <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              <Compass className="w-4 h-4 text-slate-500" />
              Set destination filter
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Optional</span>
          </button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onOpenBidJobs}
            className="col-span-1 h-11 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-900 dark:text-white font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <Gavel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25B670]" />
            <span>Bolt Flex ({openBidJobsCount})</span>
          </button>

          <button
            type="button"
            onClick={onGoOnline}
            className="col-span-2 h-11 sm:h-14 rounded-xl sm:rounded-2xl bg-[#34D186] hover:bg-[#29BE77] active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#34D186]/25 transition-all"
          >
            <Power className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>Go Online</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'ON_BREAK') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-amber-200 dark:border-amber-900/60 px-4 pt-3 pb-4 sm:p-5 space-y-3.5">
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white truncate">
                Break active · Paused
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5 truncate">
                Break: {formatTimer(breakSeconds)} · Score protected
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onResumeFromBreak}
            className="col-span-2 h-13 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] active:scale-[0.98] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#34D186]/20 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Driving</span>
          </button>
          <button
            type="button"
            onClick={onGoOffline}
            className="col-span-1 h-13 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <Power className="w-4 h-4" />
            <span>Offline</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'ONLINE_IDLE') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-3.5 pt-2 pb-3 sm:p-5 space-y-2.5 sm:space-y-3 max-h-[48dvh] lg:max-h-none overflow-y-auto">
        <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight">
                Looking for rides
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Online
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
              Next request in{' '}
              <span className="font-mono-num font-extrabold text-slate-800 dark:text-slate-200">
                {formatTimer(nextRequestWaitLeft)}
              </span>
              {isRandomWait ? ' (Random)' : ''} ·{' '}
              {backgroundRefreshEnabled ? `Synced ${lastRefreshLabel}` : 'Scanning surges'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenDestination}
              aria-label="Destination filter"
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors ${
                destinationLabel
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Destination Filter"
            >
              <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenPreferences}
              aria-label="Trip preferences"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
              title="Trip Preferences"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Active Taxi Rank Queue Card */}
        {activeRank && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-sky-900 dark:text-sky-200 truncate">
                Rank Queue #{rankQueuePos ?? 1} · {activeRank.name}
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-300">
                {activeRank.avgFareBoost} · Priority dispatch active
              </div>
            </div>
            <button
              type="button"
              onClick={onLeaveRank}
              className="px-2.5 min-h-[34px] rounded-lg bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0"
            >
              Leave
            </button>
          </div>
        )}

        {/* Searching bar */}
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-[#34D186] rounded-full animate-[pulse_1.6s_ease-in-out_infinite]" />
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleAutoAccept}
            className={`h-9 sm:h-11 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-colors ${
              autoAccept
                ? 'bg-[#34D186]/15 border-[#34D186] text-slate-950 dark:text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${autoAccept ? 'text-[#25B670] fill-current' : 'text-slate-400'}`} />
            <span>Auto-Accept: {autoAccept ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onStartBreak}
            className="h-9 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] sm:text-xs hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Take Break</span>
          </button>

          <button
            type="button"
            onClick={onOpenBidJobs}
            className="h-9 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Gavel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25B670]" />
            <span>Bolt Flex ({openBidJobsCount})</span>
          </button>

          <button
            type="button"
            onClick={onGoOffline}
            className="h-9 sm:h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900 font-bold text-[11px] sm:text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center justify-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Go Offline</span>
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
    const noResponseReached = awaitingRiderReply && riderNoResponseSec >= 120;
    const noResponseLeft = Math.max(0, 120 - riderNoResponseSec);

    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:p-5 space-y-3.5 max-h-[60dvh] lg:max-h-none overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
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

        {/* 2-Minute Customer No-Response Alert & Cancel/Wait Choices */}
        {awaitingRiderReply && !isInProgress && (
          <div
            className={`p-3 rounded-2xl border space-y-2 ${
              noResponseReached
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
            }`}
          >
            {!noResponseReached ? (
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                <span>Waiting for customer reply...</span>
                <span className="font-mono-num font-extrabold text-amber-600 dark:text-amber-400">
                  {formatTimer(noResponseLeft)}
                </span>
              </div>
            ) : (
              <>
                <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  Customer hasn&apos;t responded within 2:00
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onWaitLongerNoResponse}
                    className="h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    Wait Longer
                  </button>
                  <button
                    type="button"
                    onClick={onCancelNoResponseCollectFee}
                    className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold"
                  >
                    Cancel (+{activeRequest.currency}
                    {noResponseFeeAmount.toFixed(2)})
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:p-5 space-y-3.5 max-h-[75dvh] lg:max-h-none overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
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
