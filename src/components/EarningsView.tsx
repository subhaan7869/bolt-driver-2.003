import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Fuel,
  KeyRound,
  Plus,
  Printer,
  Receipt,
  Share2,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { getTodayDayKey } from '../data/worldMapData';
import {
  CompletedTrip,
  ExpenseCategory,
  ExpenseRecord,
  IncidentReport,
} from '../types/driver';
import { formatMiles, kmToMi } from '../utils/units';

interface EarningsViewProps {
  trips: CompletedTrip[];
  weeklySeries: { day: string; amount: number; trips: number; hours: number }[];
  payoutBalance: number;
  currency: string;
  dailyGoal: number;
  onUpdateDailyGoal: (goal: number) => void;
  shiftElapsedSec: number;
  shiftDistanceKm: number;
  expenses: ExpenseRecord[];
  onAddExpense: (exp: Omit<ExpenseRecord, 'id' | 'dateIso' | 'dayKey' | 'createdAtMs'>) => void;
  onDeleteExpense: (id: string) => void;
  incidents: IncidentReport[];
  driverName?: string;
  vehicleLabel?: string;
  vehiclePlate?: string;
  onCashOut: (amount: number) => void;
  onReportLostItem?: (tripId: string, item: string, creditReturnFee: boolean) => void;
  onSubmitCleaningClaim?: (tripId: string, amount: number, reason: string) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fuel',
  'EV Charging',
  'Car Wash',
  'Toll',
  'Parking',
];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const EarningsView: React.FC<EarningsViewProps> = ({
  trips,
  weeklySeries,
  payoutBalance,
  currency,
  dailyGoal,
  onUpdateDailyGoal,
  shiftElapsedSec,
  shiftDistanceKm,
  expenses,
  onAddExpense,
  onDeleteExpense,
  incidents,
  driverName = 'Bolt Partner Driver',
  vehicleLabel = 'Approved Bolt Vehicle',
  vehiclePlate = 'BLT 01',
  onCashOut,
  onReportLostItem,
  onSubmitCleaningClaim,
}) => {
  const todayKey = getTodayDayKey();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutSuccess, setCashOutSuccess] = useState<number | null>(null);
  const [receiptActionNote, setReceiptActionNote] = useState<string | null>(null);
  const [lostItemText, setLostItemText] = useState('');
  const [lostReturnFee, setLostReturnFee] = useState(true);
  const [cleaningTier, setCleaningTier] = useState<40 | 80 | 120>(80);
  const [cleaningReason, setCleaningReason] = useState('');

  const selectedTrip = useMemo(
    () => (selectedTripId ? trips.find((t) => t.id === selectedTripId) || null : null),
    [selectedTripId, trips]
  );

  // Expense quick form
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('EV Charging');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expNote, setExpNote] = useState<string>('');

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

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.dayKey === todayKey).reduce((sum, e) => sum + e.amount, 0),
    [expenses, todayKey]
  );
  const trueNetProfit = Number(
    (displayedTotal - (timeframe === 'today' ? todayExpenses : totalExpenses)).toFixed(2)
  );

  // Shift efficiency stats
  const shiftHours = shiftElapsedSec > 0 ? shiftElapsedSec / 3600 : 0;
  const effectiveHours =
    shiftHours >= 0.05
      ? shiftHours
      : todayTrips.reduce((sum, t) => sum + t.durationMin, 0) / 60;
  const effectiveMi = kmToMi(
    shiftDistanceKm > 0
      ? shiftDistanceKm
      : todayTrips.reduce((sum, t) => sum + t.distanceKm, 0)
  );

  const earningsPerHour = effectiveHours > 0 ? todayTotal / effectiveHours : 0;
  const earningsPerMile = effectiveMi > 0 ? todayTotal / effectiveMi : 0;

  // Daily goal progress ring
  const safeGoal = Math.max(20, dailyGoal || 150);
  const goalProgress = Math.min(1, todayTotal / safeGoal);
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - goalProgress);

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

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(expAmount);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 5000) return;
    onAddExpense({
      category: expCategory,
      amount: Number(numeric.toFixed(2)),
      note: expNote.trim().slice(0, 140),
    });
    setExpAmount('');
    setExpNote('');
  };

  // CSV Tax Summary Export
  const handleExportCsvTaxSummary = () => {
    const headers = [
      'RecordType',
      'ID',
      'Date/Day',
      'Category',
      'Description',
      'DistanceMi',
      'DurationMin',
      'GrossAmount',
      'SurgeBonus',
      'WaitFee',
      'BoltCommission',
      'Tip',
      'NetImpact',
    ];
    const tripRows = trips.map((t) => [
      'TRIP_INCOME',
      t.id,
      `${t.dayKey} ${t.completedAt}`,
      t.category,
      `"${t.pickupAddress.replace(/"/g, '""')} -> ${t.dropoffAddress.replace(/"/g, '""')}"`,
      kmToMi(t.distanceKm).toFixed(1),
      String(t.durationMin),
      t.grossFare.toFixed(2),
      t.surgeBonus.toFixed(2),
      (t.waitFee || 0).toFixed(2),
      (-t.boltCommission).toFixed(2),
      t.tip.toFixed(2),
      t.netEarnings.toFixed(2),
    ]);
    const expRows = expenses.map((ex) => [
      'BUSINESS_EXPENSE',
      ex.id,
      ex.dateIso,
      ex.category,
      `"${(ex.note || ex.category).replace(/"/g, '""')}"`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      (-ex.amount).toFixed(2),
    ]);
    const summaryRow = [
      'TAX_SUMMARY',
      'NET_TOTAL',
      new Date().toISOString().slice(0, 10),
      'Summary',
      '"Total Net Profit After Expenses"',
      kmToMi(trips.reduce((s, t) => s + t.distanceKm, 0)).toFixed(1),
      String(trips.reduce((s, t) => s + t.durationMin, 0)),
      trips.reduce((s, t) => s + t.grossFare, 0).toFixed(2),
      trips.reduce((s, t) => s + t.surgeBonus, 0).toFixed(2),
      trips.reduce((s, t) => s + (t.waitFee || 0), 0).toFixed(2),
      (-trips.reduce((s, t) => s + t.boltCommission, 0)).toFixed(2),
      trips.reduce((s, t) => s + t.tip, 0).toFixed(2),
      (trips.reduce((s, t) => s + t.netEarnings, 0) - totalExpenses).toFixed(2),
    ];

    const csvContent = [headers, ...tripRows, ...expRows, summaryRow]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolt-driver-tax-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute itemized receipt values reliably (backfills older trips cleanly)
  const getTripBreakdown = (trip: CompletedTrip) => {
    const waitFee = Number((trip.waitFee || 0).toFixed(2));
    const tollFee = Number((trip.tollFee || 0).toFixed(2));
    const surge = Number((trip.surgeBonus || 0).toFixed(2));
    const commission = Number((trip.boltCommission || 0).toFixed(2));
    const tip = Number((trip.tip || 0).toFixed(2));
    const baseFare =
      trip.baseFare !== undefined
        ? Number(trip.baseFare.toFixed(2))
        : Number(Math.min(3.2, Math.max(0, trip.grossFare - surge - waitFee)).toFixed(2));
    const remainingFare = Math.max(0, trip.grossFare - baseFare - surge - waitFee);
    const distanceFare =
      trip.distanceFare !== undefined
        ? Number(trip.distanceFare.toFixed(2))
        : Number((remainingFare * 0.68).toFixed(2));
    const timeFare =
      trip.timeFare !== undefined
        ? Number(trip.timeFare.toFixed(2))
        : Number(Math.max(0, remainingFare - distanceFare).toFixed(2));
    const attachedIncident = incidents.find((inc) => inc.tripId === trip.id);

    return {
      baseFare,
      distanceFare,
      timeFare,
      surge,
      waitFee,
      tollFee,
      commission,
      tip,
      attachedIncident,
    };
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPrintableReceipt = (trip: CompletedTrip) => {
    const bd = getTripBreakdown(trip);
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Bolt Driver Receipt - ${escapeHtml(trip.id)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
  .sheet { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .brand span { color: #25B670; }
  .meta { font-size: 12px; color: #475569; text-align: right; line-height: 1.5; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 16px 0 8px; }
  .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 13px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
  td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  td.val { text-align: right; font-family: ui-monospace, SFMono-Regular, monospace; font-weight: 700; }
  .neg { color: #dc2626; }
  .pos { color: #16a34a; }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 2px solid #0f172a; font-size: 18px; font-weight: 800; }
  .total-val { font-family: ui-monospace, SFMono-Regular, monospace; color: #16a34a; font-size: 24px; }
  .footer { margin-top: 22px; font-size: 11px; color: #64748b; text-align: center; }
  @media print { body { background: #fff; padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">Bolt <span>Driver</span> Receipt</div>
        <div style="font-size:12px;color:#475569;margin-top:4px;">Partner Statement &amp; Tax Breakdown</div>
      </div>
      <div class="meta">
        <strong>Receipt #${escapeHtml(trip.id)}</strong><br/>
        ${escapeHtml(trip.dayKey)} · ${escapeHtml(trip.completedAt)}<br/>
        Driver: ${escapeHtml(driverName)}<br/>
        Vehicle: ${escapeHtml(vehicleLabel)} (${escapeHtml(vehiclePlate)})
      </div>
    </div>
    <div class="section-title">Trip Details</div>
    <div class="box">
      <strong>Passenger:</strong> ${escapeHtml(trip.riderName)} · ${escapeHtml(trip.category)} · ${escapeHtml(trip.paymentMethod)}<br/>
      <strong>Pickup:</strong> ${escapeHtml(trip.pickupAddress)}<br/>
      <strong>Dropoff:</strong> ${escapeHtml(trip.dropoffAddress)}<br/>
      <strong>Metrics:</strong> ${formatMiles(trip.distanceKm)} · ${trip.durationMin} min${trip.stopsCount ? ` · ${trip.stopsCount} intermediate stop(s)` : ''}${trip.pickupPinVerified ? ' · 4-Digit PIN Verified' : ''}
    </div>
    <div class="section-title">Itemized Fare &amp; Commission Breakdown</div>
    <table>
      <tr><td>Base fare</td><td class="val">${escapeHtml(currency)}${bd.baseFare.toFixed(2)}</td></tr>
      <tr><td>Distance fare (${formatMiles(trip.distanceKm)})</td><td class="val">${escapeHtml(currency)}${bd.distanceFare.toFixed(2)}</td></tr>
      <tr><td>Time fare (${trip.durationMin} min)</td><td class="val">${escapeHtml(currency)}${bd.timeFare.toFixed(2)}</td></tr>
      ${bd.surge > 0 ? `<tr><td>Dynamic surge bonus</td><td class="val pos">+${escapeHtml(currency)}${bd.surge.toFixed(2)}</td></tr>` : ''}
      ${bd.waitFee > 0 ? `<tr><td>Paid pickup wait time</td><td class="val pos">+${escapeHtml(currency)}${bd.waitFee.toFixed(2)}</td></tr>` : ''}
      ${bd.tollFee > 0 ? `<tr><td>${escapeHtml(trip.tollLabel || 'Toll / Airport pass-through')} (0% fee)</td><td class="val pos">+${escapeHtml(currency)}${bd.tollFee.toFixed(2)}</td></tr>` : ''}
      <tr><td><strong>Gross passenger fare</strong></td><td class="val">${escapeHtml(currency)}${trip.grossFare.toFixed(2)}</td></tr>
      <tr><td>Bolt service commission (15%)</td><td class="val neg">-${escapeHtml(currency)}${bd.commission.toFixed(2)}</td></tr>
      ${bd.tip > 0 ? `<tr><td>Rider tip (0% fee)</td><td class="val pos">+${escapeHtml(currency)}${bd.tip.toFixed(2)}</td></tr>` : ''}
    </table>
    <div class="total-row">
      <span>Net Driver Payout</span>
      <span class="total-val">${escapeHtml(currency)}${trip.netEarnings.toFixed(2)}</span>
    </div>
    <div class="footer">Generated by Bolt Driver Partner Statement System · Retain for tax records</div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolt-receipt-${trip.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setReceiptActionNote('Printable HTML receipt downloaded.');
    setTimeout(() => setReceiptActionNote(null), 3000);
  };

  const handleShareReceipt = async (trip: CompletedTrip) => {
    const bd = getTripBreakdown(trip);
    const summary = [
      `BOLT DRIVER TRIP RECEIPT (${trip.id})`,
      `${trip.dayKey} ${trip.completedAt} · ${trip.category} · ${trip.paymentMethod}`,
      `Pickup: ${trip.pickupAddress}`,
      `Dropoff: ${trip.dropoffAddress}`,
      `Distance/Time: ${formatMiles(trip.distanceKm)} · ${trip.durationMin} min`,
      `Base Fare: ${currency}${bd.baseFare.toFixed(2)}`,
      `Distance & Time: ${currency}${(bd.distanceFare + bd.timeFare).toFixed(2)}`,
      ...(bd.surge > 0 ? [`Surge Bonus: +${currency}${bd.surge.toFixed(2)}`] : []),
      ...(bd.waitFee > 0 ? [`Wait Fee: +${currency}${bd.waitFee.toFixed(2)}`] : []),
      ...(bd.tollFee > 0 ? [`${trip.tollLabel || 'Toll Pass-Through'}: +${currency}${bd.tollFee.toFixed(2)}`] : []),
      `Bolt Fee (15%): -${currency}${bd.commission.toFixed(2)}`,
      ...(bd.tip > 0 ? [`Tip: +${currency}${bd.tip.toFixed(2)}`] : []),
      `NET PAYOUT: ${currency}${trip.netEarnings.toFixed(2)}`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: `Trip Receipt ${trip.id}`, text: summary });
        setReceiptActionNote('Receipt summary shared.');
      } else {
        await navigator.clipboard.writeText(summary);
        setReceiptActionNote('Breakdown copied to clipboard.');
      }
    } catch {
      setReceiptActionNote('Receipt breakdown prepared.');
    }
    setTimeout(() => setReceiptActionNote(null), 3000);
  };

  const selectedBreakdown = selectedTrip ? getTripBreakdown(selectedTrip) : null;

  return (
    <>
      <div className="no-print w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Header & Segmented Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Earnings &amp; Tax Ledger
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Daily goal tracker, shift efficiency, fuel/EV expenses &amp; printable receipts
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

          {/* Daily Goal Ring + Live Shift Efficiency Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="relative w-[72px] h-[72px] shrink-0 flex items-center justify-center">
                <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r={ringRadius}
                    fill="none"
                    stroke="#34D186"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-xs font-extrabold text-slate-950 dark:text-white font-mono-num">
                  {Math.round(goalProgress * 100)}%
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Target className="w-3.5 h-3.5 text-[#25B670]" />
                  <span>Daily goal</span>
                </div>
                <div className="text-lg font-extrabold text-slate-950 dark:text-white font-mono-num">
                  {currency}
                  {todayTotal.toFixed(2)}{' '}
                  <span className="text-xs font-semibold text-slate-400">
                    / {currency}
                    {safeGoal}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[100, 150, 200, 300].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateDailyGoal(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-colors ${
                        safeGoal === preset
                          ? 'bg-[#34D186] text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {currency}
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#25B670]" />
                  Shift efficiency
                </span>
                <span className="font-mono-num">
                  {Math.floor(shiftElapsedSec / 3600)}h{' '}
                  {Math.floor((shiftElapsedSec % 3600) / 60)}m online
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Hourly rate
                  </div>
                  <div className="text-lg font-extrabold text-slate-950 dark:text-white font-mono-num">
                    {currency}
                    {earningsPerHour.toFixed(2)}/h
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Per mile
                  </div>
                  <div className="text-lg font-extrabold text-slate-950 dark:text-white font-mono-num">
                    {currency}
                    {earningsPerMile.toFixed(2)}/mi
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>True net profit</span>
                <span className="text-rose-600 dark:text-rose-400 font-mono-num">
                  -{currency}
                  {(timeframe === 'today' ? todayExpenses : totalExpenses).toFixed(2)} costs
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[#25B670] font-mono-num mt-1">
                {currency}
                {trueNetProfit.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                After deducting logged fuel, EV charging, washes &amp; tolls
              </div>
            </div>
          </div>

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

          {/* Expense & Fuel / EV Charging Log + CSV Tax Export */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-[#25B670]" />
                  Fuel, EV Charging &amp; Shift Expenses
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Logged costs reduce taxable profit · Total logged:{' '}
                  <span className="font-bold font-mono-num text-rose-600 dark:text-rose-400">
                    {currency}
                    {totalExpenses.toFixed(2)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCsvTaxSummary}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#34D186] dark:text-[#25B670]" />
                <span>Export CSV Tax Summary</span>
              </button>
            </div>

            <form
              onSubmit={handleSubmitExpense}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
            >
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                aria-label="Expense category"
                className="sm:col-span-3 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="5000"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder={`Amount (${currency})`}
                className="sm:col-span-3 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                required
              />
              <input
                type="text"
                maxLength={140}
                value={expNote}
                onChange={(e) => setExpNote(e.target.value)}
                placeholder="Note (e.g. Gridserve 45kWh, Congestion fee)"
                className="sm:col-span-4 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
              />
              <button
                type="submit"
                className="sm:col-span-2 h-11 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Log Cost</span>
              </button>
            </form>

            {expenses.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {exp.category === 'EV Charging' ? (
                          <Zap className="w-3.5 h-3.5 text-[#25B670]" />
                        ) : (
                          <Fuel className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>{exp.category}</span>
                        <span className="text-slate-400 font-normal">· {exp.dateIso}</span>
                      </div>
                      {exp.note && (
                        <div className="text-slate-500 dark:text-slate-400 truncate pl-5">
                          {exp.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-extrabold font-mono-num text-rose-600 dark:text-rose-400">
                        -{currency}
                        {exp.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        aria-label="Remove expense"
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Trips Ledger */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Recent trips &amp; breakdown receipts
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tap any trip to view fare breakdown, print PDF receipt, or share
                </p>
              </div>
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
                  Go online on the Drive map and complete a ride to generate itemized PDF receipts.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setLostItemText('');
                      setCleaningReason('');
                    }}
                    className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {trip.dayKey} {trip.completedAt}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{trip.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {formatMiles(trip.distanceKm)} / {trip.durationMin} min
                        </span>
                        {(trip.stopsCount || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                            +{trip.stopsCount} stop
                          </span>
                        )}
                        {trip.pickupPinVerified && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#25B670] text-[10px] font-bold">
                            PIN
                          </span>
                        )}
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
      </div>

      {/* Interactive Breakdown & Print-Friendly Receipt Modal */}
      {selectedTrip && selectedBreakdown && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Receipt className="w-5 h-5 text-[#25B670] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white truncate">
                    Trip breakdown · {selectedTrip.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {selectedTrip.dayKey} at {selectedTrip.completedAt} · {selectedTrip.riderName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTripId(null)}
                aria-label="Close receipt"
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiptActionNote && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{receiptActionNote}</span>
              </div>
            )}

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
              <div className="flex flex-wrap items-center gap-2 text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedTrip.durationMin} min · {formatMiles(selectedTrip.distanceKm)} ·{' '}
                  {selectedTrip.paymentMethod}
                </span>
                {selectedTrip.pickupPinVerified && (
                  <span className="inline-flex items-center gap-1 text-[#25B670] font-bold">
                    <KeyRound className="w-3 h-3" />
                    PIN Verified
                  </span>
                )}
                {(selectedTrip.stopsCount || 0) > 0 && (
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    · {selectedTrip.stopsCount} intermediate stop(s)
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Fare Breakdown */}
            <div className="space-y-2 text-xs sm:text-sm border-t border-b border-slate-100 dark:border-slate-800 py-3">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base fare</span>
                <span className="font-mono-num">
                  {currency}
                  {selectedBreakdown.baseFare.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Distance fare ({formatMiles(selectedTrip.distanceKm)})</span>
                <span className="font-mono-num">
                  {currency}
                  {selectedBreakdown.distanceFare.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Time fare ({selectedTrip.durationMin} min)</span>
                <span className="font-mono-num">
                  {currency}
                  {selectedBreakdown.timeFare.toFixed(2)}
                </span>
              </div>
              {selectedBreakdown.surge > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                  <span>Dynamic surge bonus</span>
                  <span className="font-mono-num">
                    +{currency}
                    {selectedBreakdown.surge.toFixed(2)}
                  </span>
                </div>
              )}
              {selectedBreakdown.waitFee > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Paid pickup wait fee</span>
                  <span className="font-mono-num">
                    +{currency}
                    {selectedBreakdown.waitFee.toFixed(2)}
                  </span>
                </div>
              )}
              {selectedBreakdown.tollFee > 0 && (
                <div className="flex justify-between text-sky-600 dark:text-sky-400 font-semibold">
                  <span>{selectedTrip.tollLabel || 'Toll / Airport pass-through'}</span>
                  <span className="font-mono-num">
                    +{currency}
                    {selectedBreakdown.tollFee.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Gross passenger fare</span>
                <span className="font-mono-num">
                  {currency}
                  {selectedTrip.grossFare.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Bolt service fee (15%)</span>
                <span className="font-mono-num text-rose-600 dark:text-rose-400">
                  -{currency}
                  {selectedBreakdown.commission.toFixed(2)}
                </span>
              </div>
              {selectedBreakdown.tip > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Rider tip (100% yours)</span>
                  <span className="font-mono-num">
                    +{currency}
                    {selectedBreakdown.tip.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {selectedBreakdown.attachedIncident && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                <div className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Attached Safety Log ({selectedBreakdown.attachedIncident.type})
                </div>
                <div className="text-amber-900/90 dark:text-amber-200">
                  {selectedBreakdown.attachedIncident.summary}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Net driver payout
              </span>
              <span className="text-2xl font-extrabold text-[#25B670] font-mono-num">
                {currency}
                {selectedTrip.netEarnings.toFixed(2)}
              </span>
            </div>

            {/* Post-Trip Lost Property & Cleaning Fee Claims */}
            {(onReportLostItem || onSubmitCleaningClaim) && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                <div className="font-extrabold text-slate-900 dark:text-white">
                  Post-Trip Claims &amp; Found Property
                </div>

                {selectedTrip.lostItemReport ? (
                  <div className="px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">
                    Found Item Logged: {selectedTrip.lostItemReport.item}
                    {selectedTrip.lostItemReport.returnFeeCredited
                      ? ` (+${currency}${selectedTrip.lostItemReport.returnFeeCredited} return fee)`
                      : ''}
                  </div>
                ) : (
                  onReportLostItem && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={lostItemText}
                          onChange={(e) => setLostItemText(e.target.value)}
                          placeholder="Found item (e.g. Black iPhone, keys)"
                          className="flex-1 h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!lostItemText.trim()) return;
                            onReportLostItem(selectedTrip.id, lostItemText.trim(), lostReturnFee);
                            setLostItemText('');
                          }}
                          className="px-3 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-[11px] shrink-0"
                        >
                          Log Found Item
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lostReturnFee}
                          onChange={(e) => setLostReturnFee(e.target.checked)}
                          className="accent-[#34D186]"
                        />
                        <span>Request +{currency}15.00 return trip fee</span>
                      </label>
                    </div>
                  )
                )}

                {selectedTrip.cleaningFeeClaim ? (
                  <div className="px-2.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold">
                    Cleaning Claim ({currency}
                    {selectedTrip.cleaningFeeClaim.amount}) · {selectedTrip.cleaningFeeClaim.status.toUpperCase()} — {selectedTrip.cleaningFeeClaim.reason}
                  </div>
                ) : (
                  onSubmitCleaningClaim && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Cleaning Fee Claim:
                        </span>
                        <div className="flex gap-1">
                          {([40, 80, 120] as const).map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setCleaningTier(tier)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-extrabold ${
                                cleaningTier === tier
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {currency}
                              {tier}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={cleaningReason}
                          onChange={(e) => setCleaningReason(e.target.value)}
                          placeholder="Reason (e.g. spilled drink on rear seat)"
                          className="flex-1 h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!cleaningReason.trim()) return;
                            onSubmitCleaningClaim(selectedTrip.id, cleaningTier, cleaningReason.trim());
                            setCleaningReason('');
                          }}
                          className="px-3 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0"
                        >
                          Submit Claim
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Print-Friendly Summary Generator & Sharing Controls */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="h-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPrintableReceipt(selectedTrip)}
                className="h-11 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareReceipt(selectedTrip)}
                className="h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Formal Receipt Sheet (Activated on Print / Save PDF) */}
      {selectedTrip && selectedBreakdown && (
        <div className="print-only-receipt p-6 bg-white text-slate-950">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <div className="text-2xl font-extrabold tracking-tight">
                Bolt <span className="text-[#25B670]">Driver</span> Official Receipt
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Partner Trip Fare, Surge &amp; Commission Statement
              </div>
            </div>
            <div className="text-right text-xs text-slate-700 leading-relaxed">
              <div className="font-extrabold">Receipt #{selectedTrip.id}</div>
              <div>
                {selectedTrip.dayKey} · {selectedTrip.completedAt}
              </div>
              <div>Driver: {driverName}</div>
              <div>
                {vehicleLabel} ({vehiclePlate})
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 mb-5 text-xs space-y-1.5">
            <div>
              <strong>Passenger:</strong> {selectedTrip.riderName} ({selectedTrip.category} ·{' '}
              {selectedTrip.paymentMethod})
            </div>
            <div>
              <strong>Pickup:</strong> {selectedTrip.pickupAddress}
            </div>
            <div>
              <strong>Dropoff:</strong> {selectedTrip.dropoffAddress}
            </div>
            <div>
              <strong>Distance &amp; Time:</strong> {formatMiles(selectedTrip.distanceKm)} ·{' '}
              {selectedTrip.durationMin} min
              {(selectedTrip.stopsCount || 0) > 0
                ? ` · ${selectedTrip.stopsCount} intermediate stop(s)`
                : ''}
              {selectedTrip.pickupPinVerified ? ' · 4-Digit PIN Verified' : ''}
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-5">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
                <th className="py-2">Component</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2">Base fare</td>
                <td className="py-2 text-right font-mono">
                  {currency}
                  {selectedBreakdown.baseFare.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Distance fare ({formatMiles(selectedTrip.distanceKm)})</td>
                <td className="py-2 text-right font-mono">
                  {currency}
                  {selectedBreakdown.distanceFare.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Time fare ({selectedTrip.durationMin} min)</td>
                <td className="py-2 text-right font-mono">
                  {currency}
                  {selectedBreakdown.timeFare.toFixed(2)}
                </td>
              </tr>
              {selectedBreakdown.surge > 0 && (
                <tr>
                  <td className="py-2">Surge multiplier bonus</td>
                  <td className="py-2 text-right font-mono">
                    +{currency}
                    {selectedBreakdown.surge.toFixed(2)}
                  </td>
                </tr>
              )}
              {selectedBreakdown.waitFee > 0 && (
                <tr>
                  <td className="py-2">Paid pickup wait time</td>
                  <td className="py-2 text-right font-mono">
                    +{currency}
                    {selectedBreakdown.waitFee.toFixed(2)}
                  </td>
                </tr>
              )}
              {selectedBreakdown.tollFee > 0 && (
                <tr>
                  <td className="py-2">{selectedTrip.tollLabel || 'Toll / Airport pass-through'}</td>
                  <td className="py-2 text-right font-mono">
                    +{currency}
                    {selectedBreakdown.tollFee.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="font-bold">
                <td className="py-2">Gross passenger fare</td>
                <td className="py-2 text-right font-mono">
                  {currency}
                  {selectedTrip.grossFare.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-2">Bolt platform commission (15%)</td>
                <td className="py-2 text-right font-mono">
                  -{currency}
                  {selectedBreakdown.commission.toFixed(2)}
                </td>
              </tr>
              {selectedBreakdown.tip > 0 && (
                <tr>
                  <td className="py-2">Passenger tip (0% commission)</td>
                  <td className="py-2 text-right font-mono">
                    +{currency}
                    {selectedBreakdown.tip.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t-2 border-slate-900 pt-3">
            <span className="text-base font-extrabold">Net Driver Payout</span>
            <span className="text-2xl font-extrabold font-mono">
              {currency}
              {selectedTrip.netEarnings.toFixed(2)}
            </span>
          </div>

          {selectedBreakdown.attachedIncident && (
            <div className="mt-4 p-3 border border-slate-300 rounded-lg text-xs">
              <strong>Attached Safety Note ({selectedBreakdown.attachedIncident.type}):</strong>{' '}
              {selectedBreakdown.attachedIncident.summary}
            </div>
          )}

          <p className="mt-8 text-[11px] text-slate-500 text-center">
            Generated by Bolt Driver Tax &amp; Receipt Generator · Retain for accounting records.
          </p>
        </div>
      )}

      {/* Cash Out Confirmation Modal */}
      {showCashOutModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
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
    </>
  );
};
