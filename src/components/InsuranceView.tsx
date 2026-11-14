import React, { useState } from 'react';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Plus,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { DriverProfile, InsuranceCoverage } from '../types/driver';

interface InsuranceViewProps {
  profile: DriverProfile;
  currency: string;
  insuranceDaysLeft: number | null;
  isInsuranceExpired: boolean;
  onChangeCoverage: (cov: InsuranceCoverage) => void;
  onSaveVehicle: (model: string, plate: string) => void;
  onAddDriver: (driverName: string) => void;
  onRemoveDriver: (driverName: string) => void;
  onOpenRenewalChat: () => void;
  onCancelPlan: () => void;
}

export const InsuranceView: React.FC<InsuranceViewProps> = ({
  profile,
  currency,
  insuranceDaysLeft,
  isInsuranceExpired,
  onChangeCoverage,
  onSaveVehicle,
  onAddDriver,
  onRemoveDriver,
  onOpenRenewalChat,
  onCancelPlan,
}) => {
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [vehicleModel, setVehicleModel] = useState(profile.insuredVehicleModel);
  const [vehiclePlate, setVehiclePlate] = useState(profile.insuredVehiclePlate);
  const [newDriverName, setNewDriverName] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const expiryStr = profile.documentExpiries['Vehicle Insurance'];

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleModel.trim() || !vehiclePlate.trim()) return;
    onSaveVehicle(vehicleModel.trim(), vehiclePlate.trim().toUpperCase());
    setEditingVehicle(false);
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim()) return;
    onAddDriver(newDriverName.trim());
    setNewDriverName('');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Hire &amp; Reward Insurance
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage passenger ride &amp; delivery coverage, insured vehicles, and policy renewal
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRenewalChat}
            className="px-5 h-11 rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs inline-flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isInsuranceExpired ? 'Renew Insurance Now' : 'Extend / Renew Policy'}</span>
          </button>
        </div>

        {/* Policy Status Banner */}
        <div
          className={`rounded-3xl p-5 sm:p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isInsuranceExpired
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900'
              : insuranceDaysLeft !== null && insuranceDaysLeft <= 30
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isInsuranceExpired
                  ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300'
                  : insuranceDaysLeft !== null && insuranceDaysLeft <= 30
                  ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300'
                  : 'bg-[#34D186]/15 text-[#25B670]'
              }`}
            >
              {isInsuranceExpired ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-950 dark:text-white">
                {isInsuranceExpired
                  ? 'Policy Expired — Passenger Rides Blocked'
                  : insuranceDaysLeft !== null && insuranceDaysLeft <= 30
                  ? `Expiring in ${insuranceDaysLeft} days`
                  : 'Active Comprehensive Hire & Reward Policy'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
                Policy #ZEG-884120 · Valid through {expiryStr} · Underwritten by Zego Fleet UK
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRenewalChat}
            className={`px-4 h-10 rounded-xl font-bold text-xs shrink-0 ${
              isInsuranceExpired
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
            }`}
          >
            {isInsuranceExpired ? 'Renew Immediately' : 'Manage Billing'}
          </button>
        </div>

        {/* Coverage Plan & Insured Vehicle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage Tier Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
              Coverage plan
            </h2>
            <div className="space-y-2.5">
              {(
                [
                  {
                    id: 'taxi',
                    title: 'Private Hire / Passenger Rides',
                    desc: 'Covers Bolt, Comfort, Bolt Green & XL passenger trips',
                    price: `${currency}44.50 / mo`,
                  },
                  {
                    id: 'food',
                    title: 'Courier & Package Delivery Only',
                    desc: 'Covers parcel & Bolt Send deliveries (no passengers)',
                    price: `${currency}24.00 / mo`,
                  },
                  {
                    id: 'all',
                    title: 'All-in-One Taxi + Delivery',
                    desc: 'Full passenger + delivery Hire & Reward protection',
                    price: `${currency}52.00 / mo`,
                  },
                ] as const
              ).map((plan) => {
                const active = profile.insuranceCoverage === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => onChangeCoverage(plan.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                      active
                        ? 'bg-[#34D186]/12 border-[#34D186]'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                        {plan.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {plan.desc}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold font-mono-num text-slate-900 dark:text-white">
                        {plan.price}
                      </div>
                      {active && (
                        <div className="text-[11px] font-bold text-[#25B670] mt-0.5">Active</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Insured Vehicle & Named Drivers */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Insured vehicle
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingVehicle((v) => !v)}
                  className="text-xs font-bold text-[#25B670] hover:underline"
                >
                  {editingVehicle ? 'Cancel' : 'Update vehicle'}
                </button>
              </div>

              {editingVehicle ? (
                <form onSubmit={handleVehicleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Make & Model"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Registration Plate"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono-num uppercase text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#34D186] text-slate-950 font-extrabold text-xs"
                  >
                    Save Insured Vehicle
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-[#25B670]">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {profile.insuredVehicleModel}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                      Plate: {profile.insuredVehiclePlate}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Named Drivers */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#25B670]" />
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Additional named drivers
                </h2>
              </div>

              <form onSubmit={handleDriverSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Add driver full name..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  aria-label="Add named driver"
                  className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-2">
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between text-xs font-bold">
                  <span>{profile.fullName} (Primary Policyholder)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Covered</span>
                </div>
                {profile.additionalDrivers.map((drv) => (
                  <div
                    key={drv}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between text-xs font-semibold"
                  >
                    <span>{drv}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveDriver(drv)}
                      aria-label={`Remove ${drv}`}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Insurance Policy */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
              Cancel Hire &amp; Reward policy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cancelling immediately marks your Vehicle Insurance as expired and suspends passenger rides until renewed.
            </p>
          </div>

          {!confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="px-4 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold shrink-0"
            >
              Cancel Insurance Plan
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="px-3 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmCancel(false);
                  onCancelPlan();
                }}
                className="px-4 h-10 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Guided Insurance Renewal Chat Modal
interface InsuranceRenewalChatProps {
  profile: DriverProfile;
  currency: string;
  bankBalance: number;
  onCompleteRenewal: (plan: 'monthly' | 'yearly', cost: number, payWithBalance: boolean) => void;
  onClose: () => void;
}

export const InsuranceRenewalChat: React.FC<InsuranceRenewalChatProps> = ({
  profile,
  currency,
  bankBalance,
  onCompleteRenewal,
  onClose,
}) => {
  const [step, setStep] = useState<'verify' | 'choose' | 'payment' | 'done'>('verify');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [customQuestion, setCustomQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'bot' | 'driver'; text: string }[]>([
    {
      sender: 'bot',
      text: `Hi ${profile.fullName.split(' ')[0]}, I'm Bolt Insurance Assist. Let's renew Hire & Reward cover for ${profile.insuredVehicleModel} (${profile.insuredVehiclePlate}) so you can stay online.`,
    },
  ]);

  const planCost = selectedPlan === 'monthly' ? 44.5 : 449.0;
  const canUseWallet = bankBalance >= planCost;

  const handleConfirmVehicle = () => {
    setChatLog((prev) => [
      ...prev,
      { sender: 'driver', text: `Confirmed: ${profile.insuredVehiclePlate} is my active vehicle.` },
      {
        sender: 'bot',
        text: `Great! Choose your renewal term below to update your certificate immediately:`,
      },
    ]);
    setStep('choose');
  };

  const handlePickPlan = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    const cost = plan === 'monthly' ? 44.5 : 449.0;
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'driver',
        text:
          plan === 'monthly'
            ? `Select Monthly Plan (${currency}44.50 / 30 days)`
            : `Select Annual Plan (${currency}449.00 / 365 days)`,
      },
      {
        sender: 'bot',
        text: `Policy total is ${currency}${cost.toFixed(2)}. How would you like to complete payment?`,
      },
    ]);
    setStep('payment');
  };

  const handlePay = (useWallet: boolean) => {
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'driver',
        text: useWallet
          ? `Pay ${currency}${planCost.toFixed(2)} from Driver Earnings Wallet`
          : `Pay ${currency}${planCost.toFixed(2)} with Visa Debit •• 4829`,
      },
      {
        sender: 'bot',
        text: `Payment confirmed! Your Vehicle Insurance certificate has been updated and verified. You are cleared to go online.`,
      },
    ]);
    setStep('done');
    onCompleteRenewal(selectedPlan, planCost, useWallet);
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    const q = customQuestion.trim();
    setCustomQuestion('');
    setChatLog((prev) => [
      ...prev,
      { sender: 'driver', text: q },
      {
        sender: 'bot',
        text: `Your policy covers third-party and Hire & Reward passenger liability across all Bolt categories once renewed.`,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[78vh] sm:h-[580px]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#34D186]/20 text-[#25B670] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                Guided Insurance Renewal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant certificate update
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close renewal chat"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatLog.map((entry, i) => (
            <div
              key={i}
              className={`flex ${entry.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  entry.sender === 'driver'
                    ? 'bg-[#34D186] text-slate-950 font-semibold rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))}

          {/* Interactive Step Actions */}
          {step === 'verify' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Vehicle: {profile.insuredVehicleModel} ({profile.insuredVehiclePlate})</span>
              </div>
              <button
                type="button"
                onClick={handleConfirmVehicle}
                className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs"
              >
                Confirm Vehicle &amp; Continue
              </button>
            </div>
          )}

          {step === 'choose' && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handlePickPlan('monthly')}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-[#34D186] text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Monthly (30d)
                </div>
                <div className="text-lg font-extrabold font-mono-num text-slate-950 dark:text-white mt-0.5">
                  {currency}44.50
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickPlan('yearly')}
                className="p-3.5 rounded-2xl border border-[#34D186] bg-[#34D186]/10 text-left transition-colors"
              >
                <div className="text-xs font-bold text-[#25B670]">Yearly · Save 16%</div>
                <div className="text-lg font-extrabold font-mono-num text-slate-950 dark:text-white mt-0.5">
                  {currency}449.00
                </div>
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-2">
              <button
                type="button"
                disabled={!canUseWallet}
                onClick={() => handlePay(true)}
                className="w-full h-11 rounded-xl bg-[#34D186] disabled:opacity-45 text-slate-950 font-extrabold text-xs px-4 flex items-center justify-between"
              >
                <span>Pay from Driver Balance</span>
                <span className="font-mono-num">
                  ({currency}
                  {bankBalance.toFixed(2)} avail)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePay(false)}
                className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs px-4 flex items-center justify-between"
              >
                <span>Pay with Linked Debit •• 4829</span>
                <span className="font-mono-num">
                  {currency}
                  {planCost.toFixed(2)}
                </span>
              </button>
            </div>
          )}

          {step === 'done' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-12 rounded-2xl bg-[#34D186] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done &amp; Return to Map</span>
            </button>
          )}
        </div>

        <form
          onSubmit={handleAsk}
          className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask about coverage..."
            className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send question"
            className="w-10 h-10 rounded-xl bg-[#34D186] text-slate-950 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
