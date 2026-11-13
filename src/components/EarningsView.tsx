import React, { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Receipt,
  X,
} from 'lucide-react';
import { getTodayDayKey } from '../data/worldMapData';
import { CompletedTrip } from '../types/driver';

interface EarningsViewProps {
  trips: CompletedTrip[];
  weeklySeries: { day: string; amount: number; trips: number; hours: number }[];
  payoutBalance: number;
  currency: string;
  onCashOut: (amount: number) => void;
}

export const EarningsView: React.FC<EarningsViewProps> = ({
  trips,
  weeklySeries,
  payoutBalance,
  currency,
  onCashOut,
}) => {
  const todayKey = getTodayDayKey();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [selectedTrip, setSelectedTrip] = useState<CompletedTrip | null>(null);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutSuccess, setCashOutSuccess] = useState<number | null>(null);

  const todayTrips = trips.filter((t) => t.dayKey === todayKey);
  const todayTotal = todayTrips.reduce((sum, t) => sum + t.netEarnings, 0);
  const weekTotal = weeklySeries.reduce((sum, d) => sum + d.amount, 0);
  const monthTotal = weekTotal;

  const displayedTotal =
    timeframe === 'today' ? todayTotal : timeframe === 'week' ? weekTotal : monthTotal;

  const displayedTripsCount =
    timeframe === 'today'
      ? todayTrips.length
      : timeframe === 'week'
      ? weeklySeries.reduce((s, d) => s + d.trips, 0)
      : trips.length;

  const maxDayAmount = Math.max(50, ...weeklySeries.map((d) => d.amount));
  const activeDayObj =
    weeklySeries.find((d) => d.day === selectedDay) ||
    weeklySeries.find((d) => d.day === todayKey) ||
    weeklySeries[0];

  const handleConfirmCashOut = () => {
    if (payoutBalance <= 0) return;
    const paid = payoutBalance;
    onCashOut(paid);
    setShowCashOutModal(false);
    setCashOutSuccess(paid);
    setTimeout(() => setCashOutSuccess(null), 4500);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Header & Segmented Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Earnings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Net driver payouts matched to today&apos;s completed trips
            </p>
          </div>

          <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl self-start">
            {(['today', 'week', 'month'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`min-h-[40px] px-3 sm:px-4 py-2 text-xs font-bold rounded-lg capitalize transition-colors whitespace-nowrap text-center ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf === 'today' ? 'Today' : tf === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {cashOutSuccess !== null && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#25B670] shrink-0" />
            <span>
              {currency}
              {cashOutSuccess.toFixed(2)} sent via Faster Payments to HSBC UK •• 4829.
            </span>
          </div>
        )}

        {/* Top Summary + Payout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {timeframe === 'today'
                    ? `Today (${todayKey}) net earnings`
                    : timeframe === 'week'
                    ? 'This week net earnings'
                    : 'This month net earnings'}
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-mono-num mt-1">
                  {currency}
                  {displayedTotal.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                  {displayedTripsCount} completed trips · Avg {currency}
                  {displayedTripsCount > 0
                    ? (displayedTotal / displayedTripsCount).toFixed(2)
                    : '0.00'}
                  /trip
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Selected day ({activeDayObj.day})
                </div>
                <div className="text-lg font-extrabold text-[#25B670] font-mono-num">
                  {currency}
                  {activeDayObj.amount.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400 tabular-nums">
                  {activeDayObj.trips} trips · {activeDayObj.hours.toFixed(1)}h online
                </div>
              </div>
            </div>

            {/* Interactive Weekly Bar Chart */}
            <div className="pt-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-36">
                {weeklySeries.map((d) => {
                  const isSelected = d.day === selectedDay;
                  const pct = d.amount > 0 ? Math.max(12, (d.amount / maxDayAmount) * 100) : 5;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => setSelectedDay(d.day)}
                      className="flex flex-col items-center gap-2 h-full justify-end group focus-visible:outline-none"
                    >
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          style={{ height: `${pct}%` }}
                          className={`w-full max-w-[38px] rounded-t-xl transition-all duration-200 ${
                            d.amount === 0
                              ? 'bg-slate-100 dark:bg-slate-800'
                              : isSelected
                              ? 'bg-[#34D186]'
                              : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-[#34D186]/60'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-slate-950 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {d.day}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Available Balance & Cash Out Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Available to cash out
                </span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                {currency}
                {payoutBalance.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Starts at {currency}0.00 and increases automatically after each completed ride.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={payoutBalance <= 0}
                onClick={() => setShowCashOutModal(true)}
                className="w-full h-12 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Cash Out Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <div className="text-[11px] text-center text-slate-400">
                Instant payout fee: {currency}0.50 (Free on Mondays)
              </div>
            </div>
          </div>
        </div>

        {/* Completed Trips Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
              Recent trips
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {trips.length} trips recorded
            </span>
          </div>

          {trips.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-1.5">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No completed trips yet today
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Go online on the Drive map and complete a ride to start building today&apos;s earnings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => setSelectedTrip(trip)}
                  className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {trip.dayKey} {trip.completedAt}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{trip.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {trip.distanceKm} km / {trip.durationMin} min
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {trip.pickupAddress} → {trip.dropoffAddress}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-950 dark:text-white font-mono-num">
                        {currency}
                        {trip.netEarnings.toFixed(2)}
                      </div>
                      {trip.tip > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
                          +{currency}
                          {trip.tip.toFixed(2)} tip
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trip Receipt Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Receipt className="w-5 h-5 text-[#25B670] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white truncate">
                    Trip receipt · {selectedTrip.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {selectedTrip.dayKey} at {selectedTrip.completedAt} · {selectedTrip.riderName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                aria-label="Close receipt"
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Pickup:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTrip.pickupAddress}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Dropoff:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTrip.dropoffAddress}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {selectedTrip.durationMin} min · {selectedTrip.distanceKm} km ·{' '}
                  {selectedTrip.paymentMethod}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-b border-slate-100 dark:border-slate-800 py-3">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Trip fare</span>
                <span className="font-mono-num">
                  {currency}
                  {selectedTrip.grossFare.toFixed(2)}
                </span>
              </div>
              {selectedTrip.surgeBonus > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Surge included</span>
                  <span className="font-mono-num">
                    {currency}
                    {selectedTrip.surgeBonus.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Bolt service fee (15%)</span>
                <span className="font-mono-num text-rose-600 dark:text-rose-400">
                  -{currency}
                  {selectedTrip.boltCommission.toFixed(2)}
                </span>
              </div>
              {selectedTrip.tip > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Rider tip</span>
                  <span className="font-mono-num">
                    +{currency}
                    {selectedTrip.tip.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Net payout
              </span>
              <span className="text-2xl font-extrabold text-[#25B670] font-mono-num">
                {currency}
                {selectedTrip.netEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cash Out Confirmation Modal */}
      {showCashOutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Instant cash out
              </h3>
              <button
                type="button"
                onClick={() => setShowCashOutModal(false)}
                aria-label="Close cash out"
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Available balance</span>
                <span className="font-bold font-mono-num text-slate-900 dark:text-white">
                  {currency}
                  {payoutBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Instant transfer fee</span>
                <span className="font-mono-num text-slate-600 dark:text-slate-300">
                  -{currency}0.50
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-extrabold">
                <span className="text-slate-950 dark:text-white">You receive</span>
                <span className="font-mono-num text-[#25B670]">
                  {currency}
                  {Math.max(0, payoutBalance - 0.5).toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Destination: HSBC UK · Sort code 40-05-15 · Account ••••4829
            </p>

            <button
              type="button"
              onClick={handleConfirmCashOut}
              className="w-full h-13 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-sm"
            >
              Confirm transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
