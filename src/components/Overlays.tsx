import React, { useState } from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  Compass,
  PhoneCall,
  Send,
  Share2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { getCityById } from '../data/worldMapData';
import { ChatMessage, DriverSettings, LatLng, RideCategory } from '../types/driver';

// 1. Enhanced Trip Preferences Sheet (with Insurance Expired passenger ride gating)
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Trip preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter ride types, fare minimums, pickup radius &amp; bidding
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip preferences"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isInsuranceExpired && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-rose-700 dark:text-rose-300">
                INSURANCE EXPIRED
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Passenger ride categories are disabled until Hire &amp; Reward cover is renewed.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInsuranceRenewal();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shrink-0"
            >
              Renew
            </button>
          </div>
        )}

        {/* Ride Categories */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Trip categories
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {availableCategories.map((cat) => {
              const blocked = isInsuranceExpired && cat !== 'Delivery';
              const active = !blocked && settings.enabledCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  disabled={blocked}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl border text-sm font-bold transition-all ${
                    blocked
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/50 text-rose-400 cursor-not-allowed'
                      : active
                      ? 'bg-[#34D186]/15 border-[#34D186] text-slate-950 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="text-left">
                    <span className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      {cat}
                    </span>
                    {blocked && (
                      <div className="text-[10px] font-extrabold text-rose-500 mt-0.5">
                        INSURANCE EXPIRED
                      </div>
                    )}
                  </div>
                  {active && <Check className="w-4 h-4 text-[#25B670]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimum Fare Filter */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Minimum trip fare
            </span>
            <span className="text-xs font-extrabold text-[#25B670] font-mono-num">
              {settings.minFareFilter === 0 ? 'Any fare' : `${currency}${settings.minFareFilter}+`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 8, 12, 18].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onUpdateSettings({ minFareFilter: val })}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Max pickup distance
            </span>
            <span className="text-xs font-extrabold text-[#25B670] font-mono-num">
              Up to {settings.maxPickupKm} km
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[2, 4, 6, 10].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onUpdateSettings({ maxPickupKm: km })}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Minimum rider rating
            </span>
            <span className="text-xs font-extrabold text-amber-500 font-mono-num">
              {settings.minRiderRating === 0 ? 'Any' : `${settings.minRiderRating.toFixed(1)}★+`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 4.5, 4.7, 4.85].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onUpdateSettings({ minRiderRating: rating })}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
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
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center justify-between py-1 cursor-pointer">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Show counter-bid option on offers
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Allow proposing a custom fare on incoming ride requests
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.allowBidOffers}
              onChange={(e) => onUpdateSettings({ allowBidOffers: e.target.checked })}
              className="w-5 h-5 accent-[#34D186] rounded"
            />
          </label>

          <label className="flex items-center justify-between py-1 cursor-pointer">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Auto-accept matching rides
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Automatically accept offers within your fare &amp; distance filters
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoAccept}
              onChange={(e) => onUpdateSettings({ autoAccept: e.target.checked })}
              className="w-5 h-5 accent-[#34D186] rounded"
            />
          </label>

          <label className="flex items-center justify-between py-1 cursor-pointer">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Accept cash payments
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Receive riders paying with cash in addition to card &amp; Apple Pay
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.acceptCash}
              onChange={(e) => onUpdateSettings({ acceptCash: e.target.checked })}
              className="w-5 h-5 accent-[#34D186] rounded"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm"
        >
          Save trip preferences
        </button>
      </div>
    </div>
  );
};

// 2. Destination Filter Modal (World City aware)
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[82vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Driver destination
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Match rides heading toward your chosen {city.name} area
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close destination filter"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${city.name} area or station...`}
          className="w-full h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#34D186]"
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

// 3. In-App Rider Chat Drawer
interface RiderChatModalProps {
  riderName: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export const RiderChatModal: React.FC<RiderChatModalProps> = ({
  riderName,
  messages,
  onSendMessage,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  const quickReplies = ["I've arrived", 'On my way, 2 mins away', 'Stuck in brief traffic'];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[70vh] sm:h-[520px]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              Chat with {riderName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In-app masked messaging
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No messages yet. Tap a quick reply below or type a message.
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
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'driver'
                      ? 'bg-[#34D186] text-slate-950 font-medium rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums">
                  {msg.timestamp}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                type="button"
                onClick={() => onSendMessage(qr)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
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
              placeholder="Write a message..."
              className="flex-1 h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="w-11 h-11 rounded-xl bg-[#34D186] text-slate-950 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
            {isInProgress ? 'End trip early?' : 'Cancel ride?'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Keep ride"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
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
              className="w-full text-left px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
            >
              {reason}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Safety Toolkit Modal
interface SafetyModalProps {
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ onClose }) => {
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Safety toolkit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                24/7 driver assistance &amp; emergency tools
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safety toolkit"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sharedToast && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {sharedToast}
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() =>
              setSharedToast('Live GPS route link copied to share with trusted contacts.')
            }
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3.5 text-left transition-colors"
          >
            <Share2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Share live trip status
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Send your real-time GPS route to family or contacts
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setSharedToast('Connected to Bolt 24/7 Priority Safety Support line.')
            }
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3.5 text-left transition-colors"
          >
            <PhoneCall className="w-5 h-5 text-[#25B670] shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Call Bolt Safety Team
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Direct line for urgent incident support
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setSharedToast('Emergency 999 / 112 call prepared with your exact GPS coordinates.')
            }
            className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 flex items-center gap-3.5 text-left border border-rose-200/70 dark:border-rose-900 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-rose-700 dark:text-rose-300">
                Emergency Assistance
              </div>
              <div className="text-xs text-rose-600/80 dark:text-rose-400/80">
                Shares exact vehicle location with emergency dispatch
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
