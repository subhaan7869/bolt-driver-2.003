import React, { useEffect, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Gavel,
  Globe,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { RideRequest } from '../types/driver';

interface IncomingRequestModalProps {
  request: RideRequest;
  onAccept: (customFare?: number) => void;
  onDecline: () => void;
}

const REQUEST_ACCEPT_WINDOW_SEC = 25;

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  request,
  onAccept,
  onDecline,
}) => {
  const safeTimeout = REQUEST_ACCEPT_WINDOW_SEC;
  const [secondsLeft, setSecondsLeft] = useState(safeTimeout);
  const [bidExpanded, setBidExpanded] = useState(request.category === 'Bolt Flex');
  const [bidAmount, setBidAmount] = useState<number>(() => Math.ceil(request.estimatedFare + 2));
  const [bidState, setBidState] = useState<
    'idle' | 'waiting' | 'countered' | 'taken_by_other' | 'accepted'
  >('idle');
  const [customerCounterFare, setCustomerCounterFare] = useState<number | null>(null);

  useEffect(() => {
    setSecondsLeft(safeTimeout);
    setBidExpanded(request.category === 'Bolt Flex');
    setBidState('idle');
    setCustomerCounterFare(null);
    setBidAmount(Math.ceil(request.estimatedFare + 2));

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [request.id, request.estimatedFare, request.category, safeTimeout, onDecline]);

  // If driver is waiting on a bid or counter-offer and doesn't act, another driver can take it
  useEffect(() => {
    if (bidState !== 'waiting' && bidState !== 'countered') return;
    if (bidState === 'waiting') {
      const t = setTimeout(() => {
        const ratio = bidAmount / request.estimatedFare;
        if (ratio <= 1.22) {
          setBidState('accepted');
          setTimeout(() => onAccept(bidAmount), 650);
        } else if (ratio <= 1.45) {
          const counter = Number(
            ((request.estimatedFare + bidAmount) / 2).toFixed(2)
          );
          setCustomerCounterFare(counter);
          setBidState('countered');
        } else {
          setBidState('taken_by_other');
        }
      }, 2400);
      return () => clearTimeout(t);
    }

    if (bidState === 'countered') {
      const claimTimer = setTimeout(() => {
        setBidState('taken_by_other');
      }, 15000);
      return () => clearTimeout(claimTimer);
    }
  }, [bidState, bidAmount, request.estimatedFare, onAccept]);

  const progressPct = (secondsLeft / safeTimeout) * 100;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[76dvh] lg:max-h-none flex flex-col">
      {/* Accept Window Progress Strip */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 shrink-0">
        <div
          className="h-full bg-[#34D186] transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-4 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 space-y-3.5 overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto lg:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span
                className={
                  request.category === 'Bolt City'
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                    : request.category === 'Bolt Flex'
                    ? 'text-[#25B670] font-extrabold'
                    : ''
                }
              >
                {request.category}
              </span>
              {request.isOutOfCity && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  <Globe className="w-3 h-3" />
                  Out of City
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{request.riderRating.toFixed(2)}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                {request.paymentMethod === 'Cash' ? (
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                {request.paymentMethod}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white font-mono-num">
                {request.currency}
                {request.estimatedFare.toFixed(2)}
              </span>
              {request.surgeMultiplier > 1 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {request.surgeMultiplier.toFixed(1)}x Surge
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline ride request"
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Timeline */}
        <div className="relative pl-6 space-y-3.5 py-1">
          <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="relative">
            <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#34D186] ring-4 ring-white dark:ring-slate-900" />
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {request.pickupEtaMin} min ({request.pickupDistanceKm} km) away
            </div>
            <div className="text-[15px] font-bold text-slate-900 dark:text-white truncate">
              {request.pickupAddress}
            </div>
          </div>

          <div className="relative">
            <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-[3px] bg-slate-900 dark:bg-white ring-4 ring-white dark:ring-slate-900" />
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              Trip: {request.tripEtaMin} min ({request.tripDistanceKm} km)
            </div>
            <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 truncate">
              {request.dropoffAddress}
            </div>
          </div>
        </div>

        {/* Bolt Flex Bid Negotiation Section */}
        {request.allowBid && (
          <div className="space-y-2">
            {bidState === 'waiting' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Waiting for {request.riderName} ({request.currency}
                    {bidAmount})...
                  </span>
                  <button
                    type="button"
                    onClick={() => setBidState('idle')}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-extrabold"
                  >
                    Cancel Bid
                  </button>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  Customer can accept or counter-bid. Another driver may take the job if unconfirmed.
                </p>
              </div>
            )}

            {bidState === 'countered' && customerCounterFare !== null && (
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2.5">
                <div className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
                  Customer counter-bid: {request.currency}
                  {customerCounterFare.toFixed(2)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAccept(customerCounterFare)}
                    className="flex-1 h-10 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs"
                  >
                    Accept {request.currency}
                    {customerCounterFare.toFixed(2)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBidState('idle')}
                    className="px-3 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {bidState === 'taken_by_other' && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Another driver accepted this job first.
                </span>
                <button
                  type="button"
                  onClick={onDecline}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {bidState === 'accepted' && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Customer accepted your {request.currency}
                {bidAmount} bid! Starting navigation...
              </div>
            )}

            {bidState === 'idle' && (
              <>
                {!bidExpanded ? (
                  <button
                    type="button"
                    onClick={() => setBidExpanded(true)}
                    className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Gavel className="w-3.5 h-3.5 text-[#25B670]" />
                    <span>Bolt Flex · Propose Custom Fare</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Bolt Flex bid</span>
                      <span className="text-[11px] text-slate-400">
                        Customer can accept or counter
                      </span>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setBidAmount((b) => Math.max(5, b - 1))}
                          className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                        >
                          -1
                        </button>
                        <span className="px-2.5 text-sm font-extrabold font-mono-num">
                          {request.currency}
                          {bidAmount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBidAmount((b) => b + 1)}
                          className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => setBidAmount((b) => b + 5)}
                          className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                        >
                          +5
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setBidState('waiting')}
                        className="flex-1 min-w-[110px] h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs"
                      >
                        Send Bid
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Accept Action */}
        {bidState !== 'taken_by_other' && bidState !== 'accepted' && (
          <button
            type="button"
            onClick={() => onAccept()}
            className="w-full h-14 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] active:scale-[0.99] text-slate-950 font-extrabold text-base flex items-center justify-between px-5 shadow-lg shadow-[#34D186]/25 transition-all"
          >
            <span>Accept Ride</span>
            <span className="font-mono-num text-sm bg-slate-950/15 px-2.5 py-1 rounded-lg">
              {secondsLeft}s
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
