import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Gavel,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  Star,
  UserX,
  X,
} from 'lucide-react';
import { BidJobOffer } from '../types/driver';
import { formatMiles } from '../utils/units';

interface BidJobsModalProps {
  jobs: BidJobOffer[];
  boltFlexEnabled: boolean;
  onPlaceBid: (jobId: string, amount: number) => void;
  onCancelBid: (jobId: string) => void;
  onAcceptCounterBid: (jobId: string) => void;
  onStartWonJob: (job: BidJobOffer) => void;
  onRefreshJobs: () => void;
  onOpenPreferences: () => void;
  onClose: () => void;
}

export const BidJobsModal: React.FC<BidJobsModalProps> = ({
  jobs,
  boltFlexEnabled,
  onPlaceBid,
  onCancelBid,
  onAcceptCounterBid,
  onStartWonJob,
  onRefreshJobs,
  onOpenPreferences,
  onClose,
}) => {
  const [customBids, setCustomBids] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    jobs.forEach((j) => {
      initial[j.id] = j.driverBid || Math.round(j.suggestedFare + 2);
    });
    return initial;
  });

  const adjustBid = (job: BidJobOffer, delta: number) => {
    const current = customBids[job.id] ?? Math.round(job.suggestedFare);
    const next = Math.max(job.minBid, Math.min(job.maxBid, current + delta));
    setCustomBids((prev) => ({ ...prev, [job.id]: next }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[380px] sm:max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[76dvh] sm:max-h-[86dvh]">
        <div className="px-3.5 py-2.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#34D186]/20 text-[#25B670] flex items-center justify-center shrink-0">
              <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-extrabold text-slate-950 dark:text-white truncate leading-tight">
                Bolt Flex · Bid Jobs
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Bid your fare &amp; wait for reply
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onRefreshJobs}
              aria-label="Refresh bid jobs"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close bid jobs"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3">
          {!boltFlexEnabled && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <span className="font-extrabold">Bolt Flex is turned off</span> in Trip Preferences.
                Enable it to receive live Flex bid dispatches.
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreferences();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shrink-0 inline-flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Enable</span>
              </button>
            </div>
          )}

          {jobs.map((job) => {
            const bidVal = customBids[job.id] ?? Math.round(job.suggestedFare + 2);
            return (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span
                        className={
                          job.category === 'Bolt City'
                            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                            : 'text-[#25B670] font-extrabold'
                        }
                      >
                        {job.category}
                      </span>
                      {job.category === 'Bolt City' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                          <Globe className="w-3 h-3" />
                          Out of City
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5 text-[#25B670]" />
                        {job.scheduledFor}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {job.riderRating.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-950 dark:text-white mt-1">
                      {job.pickupAddress} → {job.dropoffAddress}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      {formatMiles(job.pickupDistanceKm)} away · Trip {formatMiles(job.tripDistanceKm)} ({job.tripEtaMin} min)
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-slate-400">Suggested</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono-num">
                      {job.currency}
                      {job.suggestedFare.toFixed(2)}
                    </div>
                  </div>
                </div>

                {(job.bidStatus === 'open' || job.bidStatus === 'cancelled') && (
                  <div className="space-y-2 pt-1">
                    {job.bidStatus === 'cancelled' && (
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        You cancelled your previous bid. Place a new offer below:
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center justify-between sm:justify-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => adjustBid(job, -1)}
                          className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
                        >
                          -1
                        </button>
                        <span className="px-3 text-sm font-extrabold font-mono-num text-slate-950 dark:text-white">
                          {job.currency}
                          {bidVal.toFixed(0)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustBid(job, 1)}
                            className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustBid(job, 5)}
                            className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 text-xs"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onPlaceBid(job.id, bidVal)}
                        className="w-full sm:flex-1 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs hover:opacity-90 transition-opacity"
                      >
                        Send Bid ({job.currency}
                        {bidVal.toFixed(0)})
                      </button>
                    </div>
                  </div>
                )}

                {job.bidStatus === 'pending' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/70 flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        Waiting for {job.riderName} on {job.currency}
                        {job.driverBid?.toFixed(2)}...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCancelBid(job.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-extrabold shrink-0"
                    >
                      Cancel Bid
                    </button>
                  </div>
                )}

                {job.bidStatus === 'countered' && job.customerCounterFare !== undefined && (
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2.5">
                    <div className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
                      {job.riderName} counter-bid: {job.currency}
                      {job.customerCounterFare.toFixed(2)} (accept quickly before another driver takes it)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAcceptCounterBid(job.id)}
                        className="flex-1 h-10 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs"
                      >
                        Accept {job.currency}
                        {job.customerCounterFare.toFixed(2)}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancelBid(job.id)}
                        className="px-3 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {job.bidStatus === 'accepted' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Bid accepted at {job.currency}
                      {job.driverBid?.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onStartWonJob(job)}
                      className="px-4 h-10 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs"
                    >
                      Start Pickup Now
                    </button>
                  </div>
                )}

                {job.bidStatus === 'taken_by_other' && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900 flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                    <UserX className="w-4 h-4 shrink-0" />
                    <span>
                      {job.statusNote || 'Another driver accepted this job before confirmation.'}
                    </span>
                  </div>
                )}

                {job.bidStatus === 'declined' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Offer declined — try closer to suggested fare
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onPlaceBid(job.id, Math.max(job.minBid, Math.round(job.suggestedFare)))
                      }
                      className="px-3 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      Re-bid {job.currency}
                      {Math.round(job.suggestedFare)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
