import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, Gavel, RefreshCw, Star, X } from 'lucide-react';
import { BidJobOffer } from '../types/driver';

interface BidJobsModalProps {
  jobs: BidJobOffer[];
  onPlaceBid: (jobId: string, amount: number) => void;
  onStartWonJob: (job: BidJobOffer) => void;
  onRefreshJobs: () => void;
  onClose: () => void;
}

export const BidJobsModal: React.FC<BidJobsModalProps> = ({
  jobs,
  onPlaceBid,
  onStartWonJob,
  onRefreshJobs,
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
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#34D186]/20 text-[#25B670] flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Bid jobs &amp; open offers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Name your fare on nearby &amp; scheduled rides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshJobs}
              aria-label="Refresh bid jobs"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close bid jobs"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {jobs.map((job) => {
            const bidVal = customBids[job.id] ?? Math.round(job.suggestedFare + 2);
            return (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>{job.category}</span>
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
                      {job.pickupDistanceKm} km away · Trip {job.tripDistanceKm} km ({job.tripEtaMin} min)
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

                {job.bidStatus === 'open' && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => adjustBid(job, -1)}
                        className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
                      >
                        -1
                      </button>
                      <span className="px-3 text-sm font-extrabold font-mono-num text-slate-950 dark:text-white">
                        {job.currency}
                        {bidVal.toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustBid(job, 1)}
                        className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
                      >
                        +1
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPlaceBid(job.id, bidVal)}
                      className="flex-1 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs hover:opacity-90 transition-opacity"
                    >
                      Send Bid ({job.currency}
                      {bidVal.toFixed(0)})
                    </button>
                  </div>
                )}

                {job.bidStatus === 'pending' && (
                  <div className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-700 dark:text-amber-300">
                    Waiting for {job.riderName} to review your {job.currency}
                    {job.driverBid?.toFixed(2)} bid...
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

                {job.bidStatus === 'declined' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Rider chose another offer — try a lower fare
                    </span>
                    <button
                      type="button"
                      onClick={() => onPlaceBid(job.id, Math.max(job.minBid, Math.round(job.suggestedFare)))}
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
