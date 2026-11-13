import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronUp,
  Clock,
  Coffee,
  Compass,
  Gavel,
  KeyRound,
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
import { DriverStatus, RideRequest, ScheduledRide, TaxiRank } from '../types/driver';
import { SlideToConfirm } from './SlideToConfirm';

interface TripPanelsProps {
  status: DriverStatus;
  activeRequest: RideRequest | null;
  queuedOffer: RideRequest | null;
  queuedAccepted: boolean;
  currency: string;
  todayEarnings: number;
  dailyGoal: number;
  todayTripsCount: number;
  shiftElapsedSec: number;
  shiftDistanceKm: number;
  driverScore: number;
  remainingEtaMin: number;
  remainingDistKm: number;
  destinationLabel: string | null;
  unreadChatCount: number;
  openBidJobsCount: number;
  claimedScheduledRide: ScheduledRide | null;
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
  onOpenSchedule: () => void;
  onOpenPreferences: () => void;
  onOpenDestination: () => void;
  onClearDestination: () => void;
  onArrivePickup: () => void;
  onRequestPinInChat: () => void;
  onStartTrip: (waitFeeAccrued: number, pinVerified: boolean) => void;
  onCompleteTrip: () => void;
  onAcceptQueuedOffer: () => void;
  onDeclineQueuedOffer: () => void;
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
  queuedOffer,
  queuedAccepted,
  currency,
  todayEarnings,
  dailyGoal,
  todayTripsCount,
  shiftElapsedSec,
  shiftDistanceKm,
  driverScore,
  remainingEtaMin,
  remainingDistKm,
  destinationLabel,
  unreadChatCount,
  openBidJobsCount,
  claimedScheduledRide,
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
  onOpenSchedule,
  onOpenPreferences,
  onOpenDestination,
  onClearDestination,
  onArrivePickup,
  onRequestPinInChat,
  onStartTrip,
  onCompleteTrip,
  onAcceptQueuedOffer,
  onDeclineQueuedOffer,
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
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [completedStopsCount, setCompletedStopsCount] = useState(0);
  const [showBottomMenu, setShowBottomMenu] = useState(false);

  useEffect(() => {
    if (status !== 'ONLINE_IDLE') {
      setShowBottomMenu(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'ARRIVED_PICKUP') {
      setWaitSeconds(0);
      setPinInput('');
      setPinError(false);
      return;
    }
    const timer = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== 'IN_PROGRESS') {
      setCompletedStopsCount(0);
    }
  }, [status, activeRequest?.id]);

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

  // Daily Goal Ring math
  const goalPct = Math.min(100, Math.round((todayEarnings / Math.max(1, dailyGoal)) * 100));
  const ringR = 16;
  const ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc * (1 - goalPct / 100);
  const shiftHours = Math.max(0.1, shiftElapsedSec / 3600);
  const perHourRate = shiftElapsedSec >= 60 ? todayEarnings / shiftHours : 0;
  const perKmRate = shiftDistanceKm > 0 ? todayEarnings / shiftDistanceKm : 0;

  if (status === 'OFFLINE') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-3.5 pt-2 pb-3 sm:p-5 space-y-2.5 sm:space-y-3.5 max-h-[48dvh] lg:max-h-none overflow-y-auto">
        <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={ringR}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-slate-200 dark:text-slate-800"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={ringR}
                  fill="none"
                  stroke="#34D186"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <span className="absolute text-[9px] font-extrabold font-mono-num text-slate-900 dark:text-white">
                {goalPct}%
              </span>
            </div>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
                You&apos;re offline
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
                Goal: {currency}
                {todayEarnings.toFixed(0)}/{dailyGoal} · {todayTripsCount} trips · Score {driverScore}%
              </p>
            </div>
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

        {claimedScheduledRide && (
          <button
            type="button"
            onClick={onOpenSchedule}
            className="w-full px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 flex items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200 truncate">
              <CalendarClock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              Next reserved: {claimedScheduledRide.pickupTimeLabel} · {claimedScheduledRide.pickupArea}
            </span>
            <span className="text-[11px] font-extrabold text-sky-700 dark:text-sky-300 shrink-0">
              View
            </span>
          </button>
        )}

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
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-3.5 pt-2 pb-3 sm:p-5 space-y-2.5 sm:space-y-3 max-h-[50dvh] lg:max-h-none overflow-y-auto">
        <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={ringR}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-slate-200 dark:text-slate-800"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={ringR}
                  fill="none"
                  stroke="#34D186"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <span className="absolute text-[9px] font-extrabold font-mono-num text-slate-900 dark:text-white">
                {goalPct}%
              </span>
            </div>

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
                Next req in{' '}
                <span className="font-mono-num font-extrabold text-slate-800 dark:text-slate-200">
                  {formatTimer(nextRequestWaitLeft)}
                </span>
                {isRandomWait ? ' (Random)' : ''} · {currency}
                {perHourRate.toFixed(0)}/hr · {currency}
                {perKmRate.toFixed(2)}/km
              </p>
            </div>
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

        {/* Active Geofenced Airport / Stadium / Station Rank Queue Card */}
        {activeRank && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-sky-900 dark:text-sky-200 truncate">
                Spot #{rankQueuePos ?? activeRank.queueCount} of {activeRank.totalDrivers} · {activeRank.name}
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-300 tabular-nums">
                Est. call ~{Math.max(1, Math.round((rankQueuePos ?? 1) * 0.8))} min · {activeRank.avgFareBoost}
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
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{backgroundRefreshEnabled ? `Synced ${lastRefreshLabel}` : 'Scanning surges'}</span>
          <span className="font-mono-num">
            {currency}
            {todayEarnings.toFixed(0)} / {currency}
            {dailyGoal} goal
          </span>
        </div>
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-[#34D186] rounded-full animate-[pulse_1.6s_ease-in-out_infinite]" />
        </div>

        {/* Compact Bottom Pop-Up Menu Trigger Bar */}
        <button
          type="button"
          onClick={() => setShowBottomMenu(true)}
          aria-expanded={showBottomMenu}
          className="w-full h-11 px-3.5 rounded-xl sm:rounded-2xl bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 active:scale-[0.99] text-white flex items-center justify-between gap-2 transition-all shadow-md"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-extrabold tracking-tight whitespace-nowrap">
              Shift Menu
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-slate-200 whitespace-nowrap">
              Auto: {autoAccept ? 'ON' : 'OFF'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#34D186]/20 text-[10px] font-bold text-[#34D186] whitespace-nowrap">
              Flex ({openBidJobsCount})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300 shrink-0">
            <span className="hidden sm:inline">Break / Offline</span>
            <ChevronUp className="w-4 h-4 text-[#34D186]" />
          </div>
        </button>

        {/* Bottom Pop-Up Menu (Go Offline · Bolt Flex · Take Break · Auto-Accept) */}
        {showBottomMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[425]"
              onClick={() => setShowBottomMenu(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-label="Shift controls menu"
              className="fixed left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:left-5 lg:right-auto lg:bottom-5 lg:w-[410px] z-[430] bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-4 pt-3 pb-4 space-y-3"
            >
              <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Driver Shift Menu
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Manage dispatch, breaks, Bolt Flex bids, or end shift
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBottomMenu(false)}
                  aria-label="Close shift menu"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onToggleAutoAccept}
                  className={`h-12 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors ${
                    autoAccept
                      ? 'bg-[#34D186]/15 border-[#34D186] text-slate-950 dark:text-white'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Zap
                    className={`w-4 h-4 shrink-0 ${
                      autoAccept ? 'text-[#25B670] fill-current' : 'text-slate-400'
                    }`}
                  />
                  <span>Auto-Accept: {autoAccept ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowBottomMenu(false);
                    onStartBreak();
                  }}
                  className="h-12 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Coffee className="w-4 h-4 shrink-0" />
                  <span>Take Break</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowBottomMenu(false);
                    onOpenBidJobs();
                  }}
                  className="h-12 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Gavel className="w-4 h-4 shrink-0 text-[#25B670]" />
                  <span>Bolt Flex ({openBidJobsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowBottomMenu(false);
                    onGoOffline();
                  }}
                  className="h-12 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center justify-center gap-2"
                >
                  <Power className="w-4 h-4 shrink-0" />
                  <span>Go Offline</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowBottomMenu(false);
                    onOpenPreferences();
                  }}
                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Trip Preferences</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBottomMenu(false);
                    onOpenDestination();
                  }}
                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-[#25B670]" />
                  <span>{destinationLabel ? 'Change Dest.' : 'Destination'}</span>
                </button>
              </div>
            </div>
          </>
        )}
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

    // Automatic Paid Waiting-Time Meter: 2 minutes (120s) free, then per-minute wait fee added to fare
    const FREE_WAIT_SEC = 120;
    const freeWaitRemaining = Math.max(0, FREE_WAIT_SEC - waitSeconds);
    const paidWaitSeconds = Math.max(0, waitSeconds - FREE_WAIT_SEC);
    const isPaidWait = paidWaitSeconds > 0;
    const waitRate = activeRequest.waitFeePerMin ?? 0.45;
    const accruedWaitFee = isPaidWait
      ? Number((((paidWaitSeconds / 60) * waitRate)).toFixed(2))
      : 0;

    const noResponseReached = awaitingRiderReply && riderNoResponseSec >= 120;
    const noResponseLeft = Math.max(0, 120 - riderNoResponseSec);

    const requiresPin = Boolean(activeRequest.pickupPin);
    const pinMatches = !requiresPin || pinInput.trim() === activeRequest.pickupPin;

    const totalStops = activeRequest.stops?.length || 0;
    const pendingStop =
      isInProgress && activeRequest.stops && completedStopsCount < totalStops
        ? activeRequest.stops[completedStopsCount]
        : null;

    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:p-5 space-y-3 max-h-[65dvh] lg:max-h-none overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />

        {/* Smart Back-to-Back Queued Ride Banner (when near dropoff) */}
        {isInProgress && queuedOffer && (
          <div className="p-3 rounded-2xl bg-slate-950 text-white border border-[#34D186]/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#34D186]">
                  {queuedAccepted ? 'Next Ride Queued' : 'Back-to-Back Offer Near Dropoff'}
                </div>
                <div className="text-xs font-extrabold truncate">
                  {queuedOffer.currency}
                  {queuedOffer.estimatedFare.toFixed(2)} · {queuedOffer.pickupAddress} →{' '}
                  {queuedOffer.dropoffArea}
                </div>
              </div>
              {queuedAccepted ? (
                <CheckCircle2 className="w-5 h-5 text-[#34D186] shrink-0" />
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onDeclineQueuedOffer}
                    className="px-2.5 h-8 rounded-lg bg-white/10 text-xs font-bold"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={onAcceptQueuedOffer}
                    className="px-3 h-8 rounded-lg bg-[#34D186] text-slate-950 text-xs font-extrabold"
                  >
                    Queue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {isEnRoute && <span>Picking up {activeRequest.riderName}</span>}
              {isArrived && <span>Waiting for {activeRequest.riderName}</span>}
              {isInProgress && (
                <span>
                  On trip · {activeRequest.category}
                  {pendingStop ? ` · Stop ${completedStopsCount + 1}/${totalStops}` : ''}
                </span>
              )}
            </div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white truncate mt-0.5">
              {pendingStop
                ? `Stop ${completedStopsCount + 1}: ${pendingStop.address}`
                : isInProgress
                ? activeRequest.dropoffAddress
                : activeRequest.pickupAddress}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {isArrived ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  {isPaidWait ? (
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                      Paid wait: {formatTimer(paidWaitSeconds)} (+{activeRequest.currency}
                      {accruedWaitFee.toFixed(2)} @ {activeRequest.currency}
                      {waitRate.toFixed(2)}/m)
                    </span>
                  ) : (
                    `Free wait: ${formatTimer(freeWaitRemaining)} remaining`
                  )}
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

        {/* 4-Digit Pickup PIN Verification before starting protected trips */}
        {isArrived && requiresPin && activeRequest.pickupPin && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                <KeyRound className="w-4 h-4 text-[#25B670]" />
                <span>4-Digit Pickup PIN Verification</span>
              </div>
              <button
                type="button"
                onClick={onRequestPinInChat}
                className="text-[11px] font-bold text-[#25B670] hover:underline"
              >
                Ask Rider PIN
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setPinError(false);
                }}
                placeholder="Enter 4-digit PIN"
                className={`flex-1 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border text-sm font-mono-num font-extrabold tracking-widest text-slate-950 dark:text-white focus:outline-none ${
                  pinError
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : pinMatches
                    ? 'border-[#34D186]'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {pinMatches ? (
                <span className="px-2.5 h-10 rounded-xl bg-[#34D186]/15 text-[#25B670] text-xs font-extrabold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                  Passcode: {activeRequest.pickupPin}
                </span>
              )}
            </div>
            {pinError && (
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Enter the passenger&apos;s 4-digit PIN ({activeRequest.pickupPin}) to start the trip.
              </div>
            )}
          </div>
        )}

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
          <SlideToConfirm
            label={requiresPin && !pinMatches ? 'Enter PIN to unlock start' : 'Slide to start trip'}
            onConfirm={() => {
              if (requiresPin && !pinMatches) {
                setPinError(true);
                return;
              }
              onStartTrip(accruedWaitFee, requiresPin);
            }}
            variant="green"
          />
        )}
        {isInProgress && pendingStop && (
          <button
            type="button"
            onClick={() => setCompletedStopsCount((c) => c + 1)}
            className="w-full h-13 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Complete Stop {completedStopsCount + 1} of {totalStops}
            </span>
          </button>
        )}
        {isInProgress && !pendingStop && (
          <SlideToConfirm label="Slide to complete trip" onConfirm={onCompleteTrip} variant="danger" />
        )}
      </div>
    );
  }

  if (status === 'TRIP_COMPLETED' && activeRequest) {
    const waitFee = activeRequest.waitFeeTotal || 0;
    const grossWithWait = Number((activeRequest.estimatedFare + waitFee).toFixed(2));
    const commission = Number((grossWithWait * 0.15).toFixed(2));
    const tipBonus = selectedStars === 5 ? 2.0 : 0;
    const net = Number((grossWithWait - commission + tipBonus).toFixed(2));
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
              Trip completed {queuedAccepted ? '· Next ride queued' : ''}
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
            <span>Base trip fare ({activeRequest.paymentMethod})</span>
            <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-200">
              {activeRequest.currency}
              {activeRequest.estimatedFare.toFixed(2)}
            </span>
          </div>
          {waitFee > 0 && (
            <div className="flex justify-between text-sky-600 dark:text-sky-400">
              <span>Paid wait time meter</span>
              <span className="font-mono-num font-semibold">
                +{activeRequest.currency}
                {waitFee.toFixed(2)}
              </span>
            </div>
          )}
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
          {queuedAccepted ? 'Done · Start Queued Ride' : 'Done & Continue'}
        </button>
      </div>
    );
  }

  return null;
};
