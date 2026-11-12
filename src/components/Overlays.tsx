import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  Clock,
  Compass,
  Gavel,
  Globe,
  Mic,
  PhoneCall,
  Send,
  Share2,
  ShieldAlert,
  Square,
  Video,
  X,
} from 'lucide-react';
import { getCityById } from '../data/worldMapData';
import {
  ChatMessage,
  DriverSettings,
  IncidentReport,
  LatLng,
  RideCategory,
} from '../types/driver';

// 1. Enhanced Trip Preferences Sheet (Bolt Flex, Bolt City, 1-5 min Job Timer, Daily Goal, Insurance Gating)
interface PreferencesModalProps {
  settings: DriverSettings;
  currency: string;
  availableCategories: RideCategory[];
  isInsuranceExpired: boolean;
  onOpenInsuranceRenewal: () => void;
  onUpdateSettings: (next: Partial<DriverSettings>) => void;
  onClose: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  settings,
  currency,
  availableCategories,
  isInsuranceExpired,
  onOpenInsuranceRenewal,
  onUpdateSettings,
  onClose,
}) => {
  const toggleCategory = (cat: RideCategory) => {
    if (isInsuranceExpired && cat !== 'Delivery') {
      return;
    }
    const exists = settings.enabledCategories.includes(cat);
    const updated = exists
      ? settings.enabledCategories.filter((c) => c !== cat)
      : [...settings.enabledCategories, cat];
    if (updated.length === 0) return;
    onUpdateSettings({ enabledCategories: updated });
  };

  const getCategoryMeta = (cat: RideCategory) => {
    if (cat === 'Bolt Flex') {
      return { subtitle: 'Bid jobs & negotiate fare', icon: <Gavel className="w-4 h-4 shrink-0" /> };
    }
    if (cat === 'Bolt City') {
      return { subtitle: 'Out-of-city high pay', icon: <Globe className="w-4 h-4 shrink-0" /> };
    }
    return { subtitle: null, icon: <Car className="w-4 h-4 shrink-0" /> };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center sm:items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[380px] sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[78dvh] sm:max-h-[86dvh]">
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
              Trip preferences
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              Categories, timers, goals &amp; filters
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip preferences"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
          {isInsuranceExpired && (
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2.5">
              <div>
                <div className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300">
                  INSURANCE EXPIRED
                </div>
                <div className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                  Passenger rides paused until renewed.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInsuranceRenewal();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold shrink-0"
              >
                Renew
              </button>
            </div>
          )}

          {/* Ride Categories */}
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Trip categories
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {availableCategories.map((cat) => {
                const blocked = isInsuranceExpired && cat !== 'Delivery';
                const active = !blocked && settings.enabledCategories.includes(cat);
                const meta = getCategoryMeta(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={blocked}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center justify-between px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                      blocked
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/50 text-rose-400 cursor-not-allowed'
                        : active
                        ? 'bg-[#34D186]/15 border-[#34D186] text-slate-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-left min-w-0">
                      <span className="flex items-center gap-1.5">
                        {meta.icon}
                        <span className="truncate">{cat}</span>
                      </span>
                      {blocked ? (
                        <div className="text-[9px] font-extrabold text-rose-500 mt-0.5">
                          EXPIRED
                        </div>
                      ) : meta.subtitle ? (
                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {meta.subtitle}
                        </div>
                      ) : null}
                    </div>
                    {active && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25B670] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Earnings Goal */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Daily earnings goal
              </span>
              <span className="text-xs font-extrabold text-[#25B670] font-mono-num">
                {currency}
                {settings.dailyGoal}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[100, 150, 200, 300].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => onUpdateSettings({ dailyGoal: goal })}
                  className={`h-8 sm:h-9 rounded-lg sm:rounded-xl text-xs font-bold border transition-colors ${
                    settings.dailyGoal === goal
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {currency}
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Wait for Next Job Timer */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Wait for next job (1–5 min)
                </span>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Delay after ride completion or decline
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#25B670] font-mono-num">
                {settings.dispatchWaitSec === 0
                  ? 'Random (1–5m)'
                  : `${Math.round(settings.dispatchWaitSec / 60)} min`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {([0, 60, 120, 180, 300] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateSettings({ dispatchWaitSec: sec })}
                  className={`h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs font-bold border transition-colors ${
                    settings.dispatchWaitSec === sec
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sec === 0 ? 'Random' : `${sec / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Fare Filter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Minimum trip fare
              </span>
              <span className="text-xs font-extrabold text-[#25B670] font-mono-num">
                {settings.minFareFilter === 0 ? 'Any fare' : `${currency}${settings.minFareFilter}+`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[0, 8, 12, 18].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onUpdateSettings({ minFareFilter: val })}
                  className={`h-8 sm:h-9 rounded-lg sm:rounded-xl text-xs font-bold border transition-colors ${
                    settings.minFareFilter === val
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {val === 0 ? 'Any' : `${currency}${val}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Max Pickup Distance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Max pickup distance
              </span>
              <span className="text-xs font-extrabold text-[#25B670] font-mono-num">
                Up to {settings.maxPickupKm} km
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[2, 4, 6, 10].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => onUpdateSettings({ maxPickupKm: km })}
                  className={`h-8 sm:h-9 rounded-lg sm:rounded-xl text-xs font-bold border transition-colors ${
                    settings.maxPickupKm === km
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rider Rating */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Minimum rider rating
              </span>
              <span className="text-xs font-extrabold text-amber-500 font-mono-num">
                {settings.minRiderRating === 0 ? 'Any' : `${settings.minRiderRating.toFixed(1)}★+`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[0, 4.5, 4.7, 4.85].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onUpdateSettings({ minRiderRating: rating })}
                  className={`h-8 sm:h-9 rounded-lg sm:rounded-xl text-xs font-bold border transition-colors ${
                    settings.minRiderRating === rating
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {rating === 0 ? 'Any' : `${rating}★+`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between py-0.5 cursor-pointer gap-2">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Counter-bid on Bolt Flex offers
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Propose a custom fare on incoming requests
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowBidOffers}
                onChange={(e) => onUpdateSettings({ allowBidOffers: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 accent-[#34D186] rounded shrink-0"
              />
            </label>

            <label className="flex items-center justify-between py-0.5 cursor-pointer gap-2">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Auto-accept matching rides
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Accept offers within fare &amp; distance filters
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAccept}
                onChange={(e) => onUpdateSettings({ autoAccept: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 accent-[#34D186] rounded shrink-0"
              />
            </label>

            <label className="flex items-center justify-between py-0.5 cursor-pointer gap-2">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Accept cash payments
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Receive cash alongside card &amp; Apple Pay
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.acceptCash}
                onChange={(e) => onUpdateSettings({ acceptCash: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 accent-[#34D186] rounded shrink-0"
              />
            </label>
          </div>
        </div>

        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs sm:text-sm"
          >
            Save trip preferences
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Destination Filter Modal
interface DestinationModalProps {
  cityId: string;
  currentTargetLabel: string | null;
  onSelect: (coords: LatLng, label: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  cityId,
  currentTargetLabel,
  onSelect,
  onClear,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const city = getCityById(cityId);
  const filtered = city.landmarks.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.area.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[380px] sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 max-h-[74dvh] sm:max-h-[82dvh] flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
              Driver destination
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Match rides toward your {city.name} area
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close destination filter"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${city.name} area or station...`}
          className="w-full h-9 sm:h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#34D186]"
        />

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((lm) => {
            const active = lm.name === currentTargetLabel;
            return (
              <button
                key={lm.name}
                type="button"
                onClick={() => {
                  onSelect({ lat: lm.lat, lng: lm.lng }, lm.name);
                  onClose();
                }}
                className="w-full py-3 px-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4 text-[#25B670]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {lm.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {lm.area}
                    </div>
                  </div>
                </div>
                {active && <Check className="w-4 h-4 text-[#34D186] shrink-0" />}
              </button>
            );
          })}
        </div>

        {currentTargetLabel && (
          <button
            type="button"
            onClick={() => {
              onClear();
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-sm font-bold"
          >
            Remove active destination
          </button>
        )}
      </div>
    </div>
  );
};

// 3. Full-Screen Rider Chat Drawer
interface RiderChatModalProps {
  riderName: string;
  messages: ChatMessage[];
  currency: string;
  awaitingRiderReply: boolean;
  riderNoResponseSec: number;
  noResponseFeeAmount: number;
  onSendMessage: (text: string) => void;
  onWaitLonger: () => void;
  onCancelCollectFee: () => void;
  onClose: () => void;
}

export const RiderChatModal: React.FC<RiderChatModalProps> = ({
  riderName,
  messages,
  currency,
  awaitingRiderReply,
  riderNoResponseSec,
  noResponseFeeAmount,
  onSendMessage,
  onWaitLonger,
  onCancelCollectFee,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  const quickReplies = ["I've arrived", 'On my way, 2 mins away', 'Are you at the pickup pin?'];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  const noResponseReached = awaitingRiderReply && riderNoResponseSec >= 120;
  const remainingSec = Math.max(0, 120 - riderNoResponseSec);
  const mm = Math.floor(remainingSec / 60)
    .toString()
    .padStart(2, '0');
  const ss = (remainingSec % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[750] w-screen h-dvh bg-white dark:bg-slate-950 flex flex-col">
      <div className="px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#34D186]/15 text-[#25B670] font-extrabold text-sm flex items-center justify-center shrink-0">
            {riderName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white truncate leading-tight">
              {riderName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Masked Bolt customer chat · 2-min response protection
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {awaitingRiderReply && (
        <div
          className={`px-4 py-3 border-b text-xs shrink-0 ${
            noResponseReached
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="max-w-2xl mx-auto">
            {!noResponseReached ? (
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Waiting for {riderName} to reply...
                </span>
                <span className="font-mono-num font-extrabold text-amber-600 dark:text-amber-400">
                  {mm}:{ss}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-extrabold text-amber-900 dark:text-amber-200">
                  No response within 2 minutes — choose to wait or cancel for {currency}
                  {noResponseFeeAmount.toFixed(2)}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onWaitLonger}
                    className="h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white"
                  >
                    Wait Longer
                  </button>
                  <button
                    type="button"
                    onClick={onCancelCollectFee}
                    className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold"
                  >
                    Cancel (+{currency}
                    {noResponseFeeAmount.toFixed(2)})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400">
              No messages yet. Tap a quick reply below or message {riderName}.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'driver' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'driver'
                      ? 'bg-[#34D186] text-slate-950 font-semibold rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 px-1 tabular-nums">
                  {msg.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-2xl mx-auto space-y-2.5">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                type="button"
                onClick={() => onSendMessage(qr)}
                className="px-3.5 min-h-[38px] py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                {qr}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${riderName}...`}
              className="flex-1 min-w-0 h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="w-12 h-12 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 flex items-center justify-center shrink-0 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// 4. Cancel Ride Reason Modal
interface CancelRideModalProps {
  isInProgress: boolean;
  onConfirmCancel: (reason: string) => void;
  onClose: () => void;
}

export const CancelRideModal: React.FC<CancelRideModalProps> = ({
  isInProgress,
  onConfirmCancel,
  onClose,
}) => {
  const reasons = isInProgress
    ? ['Rider requested early drop-off', 'Safety concern', 'Vehicle issue']
    : [
        'Rider did not show up',
        'Cannot reach pickup safely',
        'Too many passengers / luggage',
        'Accepted by mistake',
      ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[380px] sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 max-h-[74dvh] sm:max-h-[82dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white">
            {isInProgress ? 'End trip early?' : 'Cancel ride?'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Keep ride"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a reason so we can keep your acceptance &amp; completion metrics accurate.
        </p>
        <div className="space-y-2">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onConfirmCancel(reason)}
              className="w-full min-h-[48px] text-left px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
            >
              {reason}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Upgraded Safety Toolkit Modal (SOS Share-Location Card, Audio Clip Note, Incident Report attached to trip)
interface SafetyModalProps {
  driverPos: LatLng;
  vehicleLabel: string;
  vehiclePlate: string;
  activeTripLabel?: string;
  activeTripId?: string;
  riderName?: string;
  incidents: IncidentReport[];
  onSaveIncident: (entry: Omit<IncidentReport, 'id' | 'createdAtLabel' | 'createdAtMs'>) => void;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({
  driverPos,
  vehicleLabel,
  vehiclePlate,
  activeTripLabel,
  activeTripId,
  riderName,
  incidents,
  onSaveIncident,
  onClose,
}) => {
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentReport['type']>('Vehicle / Dashcam');
  const [summary, setSummary] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasAudioNote, setHasAudioNote] = useState(false);
  const [audioSec, setAudioSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  const handleShareSosLocation = async () => {
    const shareText = `BOLT DRIVER SOS / LIVE LOCATION\nVehicle: ${vehicleLabel} (${vehiclePlate})\nCoords: ${driverPos.lat.toFixed(
      5
    )}, ${driverPos.lng.toFixed(5)}\nMaps: https://maps.google.com/?q=${driverPos.lat},${
      driverPos.lng
    }${activeTripLabel ? `\nTrip: ${activeTripLabel}` : ''}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Bolt Driver Live Location', text: shareText });
        setSharedToast('Emergency location card shared via device share sheet.');
      } else {
        await navigator.clipboard.writeText(shareText);
        setSharedToast('Emergency location card copied to clipboard.');
      }
    } catch {
      setSharedToast('Emergency location card ready: GPS coordinates captured.');
    }
  };

  const toggleAudioRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setIsRecording(false);
      setHasAudioNote(true);
      setSharedToast(`Audio safety clip attached (${audioSec || 1}s).`);
      return;
    }

    setAudioSec(0);
    setIsRecording(true);
    recordTimerRef.current = window.setInterval(() => {
      setAudioSec((s) => s + 1);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      // Graceful fallback audio clip note timer if mic blocked
    }
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() && !hasAudioNote) return;
    onSaveIncident({
      type: incidentType,
      summary: (summary.trim() || 'Audio / Dashcam safety clip captured').slice(0, 300),
      hasAudioNote,
      audioDurationSec: hasAudioNote ? Math.max(1, audioSec) : undefined,
      coords: driverPos,
      tripId: activeTripId,
      riderName,
      vehiclePlate,
    });
    setSummary('');
    setHasAudioNote(false);
    setAudioSec(0);
    setSharedToast(
      `Incident saved & attached to ${activeTripId ? `trip ${activeTripId}` : 'your shift log'}.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[390px] sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 max-h-[82dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
                Safety &amp; SOS Toolkit
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                SOS share card, dashcam clip &amp; incident log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safety toolkit"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {sharedToast && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {sharedToast}
          </div>
        )}

        {/* Emergency Share-Location Card */}
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold text-rose-700 dark:text-rose-300">
                LIVE SOS LOCATION CARD
              </div>
              <div className="text-[11px] text-rose-800/80 dark:text-rose-300/80 font-mono-num">
                {driverPos.lat.toFixed(5)}, {driverPos.lng.toFixed(5)} · {vehiclePlate}
              </div>
            </div>
            <button
              type="button"
              onClick={handleShareSosLocation}
              className="px-3 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share SOS</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setSharedToast('Emergency 999 / 112 dispatch prepared with live vehicle GPS.')
              }
              className="h-9 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Call 999 / 112</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setSharedToast('Connected to Bolt 24/7 Priority Safety Support line.')
              }
              className="h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#25B670]" />
              <span>Safety Team</span>
            </button>
          </div>
        </div>

        {/* Dashcam / Audio Clip & Incident Log Attached to Trip */}
        <form
          onSubmit={handleSubmitIncident}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#25B670]" />
              Log Incident / Dashcam Clip
            </span>
            {activeTripId && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Trip #{activeTripId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(['Vehicle / Dashcam', 'Rider Safety', 'Traffic Incident', 'SOS / Emergency'] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIncidentType(type)}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    incidentType === type
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>

          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Describe what happened or note dashcam timestamp..."
            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAudioRecording}
              className={`px-3 h-10 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-500'
                  : hasAudioNote
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop ({audioSec}s)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>{hasAudioNote ? `Clip Attached (${audioSec}s)` : 'Audio Note'}</span>
                </>
              )}
            </button>

            <button
              type="submit"
              className="flex-1 h-10 rounded-xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs"
            >
              Attach Incident
            </button>
          </div>
        </form>

        {incidents.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Recent safety logs ({incidents.length})
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {incidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-[11px] flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                      {inc.type} {inc.tripId ? `· ${inc.tripId}` : ''}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 truncate">{inc.summary}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{inc.createdAtLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
