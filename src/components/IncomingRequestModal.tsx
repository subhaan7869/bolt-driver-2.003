import React, { useEffect, useState } from 'react';
import { Banknote, CreditCard, Gavel, Star, X, Zap } from 'lucide-react';
import { RideRequest } from '../types/driver';

interface IncomingRequestModalProps {
  request: RideRequest;
  onAccept: (customFare?: number) => void;
  onDecline: () => void;
}

const REQUEST_TIMEOUT_SEC = 18;

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  request,
  onAccept,
  onDecline,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(REQUEST_TIMEOUT_SEC);
  const [bidExpanded, setBidExpanded] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(() => Math.ceil(request.estimatedFare + 2));
  const [bidState, setBidState] = useState<'idle' | 'sending' | 'rejected'>('idle');

  useEffect(() => {
    setSecondsLeft(REQUEST_TIMEOUT_SEC);
    setBidExpanded(false);
    setBidState('idle');
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
  }, [request.id, request.estimatedFare, onDecline]);

  const progressPct = (secondsLeft / REQUEST_TIMEOUT_SEC) * 100;

  const handleSendCounterBid = () => {
    setBidState('sending');
    setTimeout(() => {
      // Accept bids within ~30% above suggested fare
      if (bidAmount <= request.estimatedFare * 1.32) {
        onAccept(bidAmount);
      } else {
        setBidState('rejected');
      }
    }, 850);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      {/* Countdown Progress Strip */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-[#34D186] transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Category, Surge & Countdown */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span>{request.category}</span>
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

        {/* Counter-Bid Option */}
        {request.allowBid && (
          <div className="space-y-2">
            {!bidExpanded ? (
              <button
                type="button"
                onClick={() => setBidExpanded(true)}
                className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Gavel className="w-3.5 h-3.5 text-[#25B670]" />
                <span>Offer your own fare (Counter-Bid)</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Your counter-offer</span>
                  {bidState === 'rejected' && (
                    <span className="text-rose-600 dark:text-rose-400">
                      Too high — try closer to {request.currency}
                      {request.estimatedFare.toFixed(0)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setBidState('idle');
                        setBidAmount((b) => Math.max(5, b - 1));
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                    >
                      -1
                    </button>
                    <span className="px-2.5 text-sm font-extrabold font-mono-num">
                      {request.currency}
                      {bidAmount}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBidState('idle');
                        setBidAmount((b) => b + 1);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBidState('idle');
                        setBidAmount((b) => b + 2);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                    >
                      +2
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={bidState === 'sending'}
                    onClick={handleSendCounterBid}
                    className="flex-1 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs"
                  >
                    {bidState === 'sending' ? 'Sending...' : 'Send Bid'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accept Action */}
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
      </div>
    </div>
  );
};
