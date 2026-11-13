import React, { useState } from 'react';
import {
  ArrowLeft,
  Car,
  Check,
  CheckCircle2,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { WORLD_CITIES, getFutureIsoDate } from '../data/worldMapData';
import { DriverDocument, DriverProfile, RideCategory, Vehicle } from '../types/driver';

interface AccountCreationModalProps {
  initialName?: string;
  initialEmail?: string;
  initialUid?: string;
  onCompleteRegistration: (payload: {
    profile: DriverProfile;
    vehicle: Vehicle;
    documents: DriverDocument[];
  }) => void;
  onClose: () => void;
}

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  initialName = '',
  initialEmail = '',
  initialUid,
  onCompleteRegistration,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phoneCode, setPhoneCode] = useState('+44');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cityId, setCityId] = useState('london');
  const [driverType, setDriverType] = useState<'Independent' | 'Fleet'>('Independent');
  const [referralCode, setReferralCode] = useState('');

  const [makeModel, setMakeModel] = useState('');
  const [year, setYear] = useState(2024);
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('Pearl White');
  const [fuelType, setFuelType] = useState<'Electric' | 'Hybrid' | 'Petrol'>('Electric');

  const [docFiles, setDocFiles] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requiredDocs = [
    { id: 'dl', title: 'Full Driving Licence', subtitle: 'Front & back photo' },
    { id: 'phv', title: 'Private Hire / Taxi Driver Badge', subtitle: 'Municipal licence' },
    { id: 'ins', title: 'Hire & Reward Insurance', subtitle: 'Valid certificate PDF/JPG' },
    { id: 'mot', title: 'Vehicle Inspection / MOT', subtitle: 'Passed safety check' },
  ];

  const handleFileChange = (docId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setDocFiles((prev) => ({ ...prev, [docId]: fileList[0].name }));
    setErrorMsg(null);
  };

  const handleQuickFillDemo = () => {
    if (step === 1) {
      if (!fullName.trim()) setFullName('David Okafor');
      if (!email.trim()) setEmail('david.okafor@boltpartner.co');
      setPhoneNumber('7700 900412');
    } else if (step === 2) {
      setMakeModel('Kia Niro EV');
      setYear(2024);
      setPlate('EV24 BLT');
      setColor('Midnight Black');
      setFuelType('Electric');
    } else {
      setDocFiles({
        dl: 'uk_driving_licence_front.jpg',
        phv: 'tfl_phv_badge_2027.pdf',
        ins: 'zego_hire_reward_policy.pdf',
        mot: 'vehicle_inspection_cert.pdf',
      });
    }
    setErrorMsg(null);
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
        setErrorMsg('Please enter your full name, email, and phone number.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!makeModel.trim() || !plate.trim()) {
        setErrorMsg('Please enter your vehicle make/model and licence plate.');
        return;
      }
      setStep(3);
      return;
    }

    const missing = requiredDocs.filter((d) => !docFiles[d.id]);
    if (missing.length > 0) {
      setErrorMsg(`Please upload: ${missing.map((m) => m.title).join(', ')}`);
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Please accept the Bolt Driver Partner Agreement to finish.');
      return;
    }

    const categories: RideCategory[] =
      fuelType === 'Electric'
        ? ['Bolt', 'Comfort', 'Bolt Green', 'Bolt Flex', 'Bolt City', 'Pets', 'Delivery']
        : fuelType === 'Hybrid'
        ? ['Bolt', 'Bolt Green', 'Bolt Flex', 'Bolt City', 'XL', 'Delivery']
        : ['Bolt', 'Bolt Flex', 'Bolt City', 'Delivery'];

    const insExpiry = getFutureIsoDate(365);
    const cleanPlate = plate.trim().toUpperCase();
    const cleanModel = makeModel.trim();

    const profile: DriverProfile = {
      uid: initialUid,
      id: initialUid || `drv-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: `${phoneCode} ${phoneNumber.trim()}`,
      cityId,
      driverType,
      avatarUrl: '/src/assets/images/driver_avatar_1794515088292.jpg',
      isVerified: true,
      joinedLabel: 'New Partner · Verified',
      bankBalance: 0,
      insuranceCoverage: 'taxi',
      documentExpiries: {
        'Vehicle Insurance': insExpiry,
        'PHV Licence': getFutureIsoDate(730),
        'Driving Licence': getFutureIsoDate(1460),
        'Vehicle MOT': getFutureIsoDate(365),
      },
      insuredVehiclePlate: cleanPlate,
      insuredVehicleModel: cleanModel,
      additionalDrivers: [],
      documentsUploaded: true,
      faceVerified: true,
    };

    const maxRange = fuelType === 'Electric' ? 420 : fuelType === 'Hybrid' ? 680 : 620;
    const vehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      makeModel: cleanModel,
      plate: cleanPlate,
      color,
      year,
      fuelType,
      categories,
      imageUrl: '/src/assets/images/vehicle_sedan_1794515087800.jpg',
      isActive: true,
      rangeKm: maxRange,
      maxRangeKm: maxRange,
      odometerKm: 12000,
      nextServiceKm: 22000,
      tyreCheckKm: 18000,
    };

    const documents: DriverDocument[] = requiredDocs.map((d) => ({
      id: `doc-${d.id}`,
      title: d.title,
      subtitle: docFiles[d.id],
      expiryDate: d.id === 'ins' ? insExpiry : getFutureIsoDate(365),
      status: 'Verified',
      fileName: docFiles[d.id],
    }));

    onCompleteRegistration({ profile, vehicle, documents });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[380px] sm:max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[78dvh] sm:max-h-[88dvh]">
        <div className="px-3.5 py-2.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                aria-label="Previous step"
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shadow-sm shrink-0">
                <img
                  src="/assets/aistudio/image_adf30014.png"
                  alt="Bolt Driver logo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-extrabold text-slate-950 dark:text-white truncate leading-tight">
                Become a Bolt Driver
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Step {step} of 3 ·{' '}
                {step === 1
                  ? 'Personal details'
                  : step === 2
                  ? 'Vehicle details'
                  : 'Documents'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-3.5 sm:px-5 pt-2.5 shrink-0">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 sm:h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-[#34D186]' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-2.5 sm:space-y-3.5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleQuickFillDemo}
              className="text-[11px] sm:text-xs font-bold text-[#25B670] hover:underline"
            >
              Auto-fill step {step}
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Full legal name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. David Okafor"
                  className="w-full h-9 sm:h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@email.com"
                  className="w-full h-9 sm:h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Mobile number
                </label>
                <div className="flex gap-1.5 sm:gap-2">
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="h-9 sm:h-11 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="+44">UK +44</option>
                    <option value="+372">EE +372</option>
                    <option value="+49">DE +49</option>
                    <option value="+33">FR +33</option>
                    <option value="+48">PL +48</option>
                    <option value="+971">AE +971</option>
                    <option value="+1">US +1</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="7700 900412"
                    className="flex-1 min-w-0 h-9 sm:h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Operating city
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full h-9 sm:h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {WORLD_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}, {c.country} ({c.currency.trim()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Driver registration type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Independent', 'Fleet'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDriverType(t)}
                      className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                        driverType === t
                          ? 'bg-[#34D186]/15 border-[#34D186] text-slate-950 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-extrabold">{t}</div>
                      <div className="text-[10px] opacity-80 truncate">
                        {t === 'Independent' ? 'Own vehicle' : 'Fleet partner'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Referral or fleet code (optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="BOLT2026"
                  className="w-full h-9 sm:h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 flex items-center gap-3">
                <Car className="w-5 h-5 text-[#25B670] shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Your fuel type &amp; model year automatically determine eligible categories (Bolt Green, Comfort, XL).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Vehicle make &amp; model
                </label>
                <input
                  type="text"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  placeholder="e.g. Kia Niro EV / Toyota Prius"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Licence plate
                  </label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="EV24 BLT"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono-num uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#34D186]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Model year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Pearl White"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Powertrain
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) =>
                      setFuelType(e.target.value as 'Electric' | 'Hybrid' | 'Petrol')
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Electric">Electric (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Petrol">Petrol / Diesel</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {requiredDocs.map((doc) => {
                const uploadedName = docFiles[doc.id];
                return (
                  <label
                    key={doc.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      uploadedName
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-[#34D186]'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          uploadedName
                            ? 'bg-[#34D186] text-slate-950'
                            : 'bg-white dark:bg-slate-900 text-slate-500'
                        }`}
                      >
                        {uploadedName ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {uploadedName ? uploadedName : doc.subtitle}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#25B670] shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadedName ? 'Change' : 'Upload'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(doc.id, e.target.files)}
                      className="sr-only"
                    />
                  </label>
                );
              })}

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#34D186]"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  I confirm all submitted documents are authentic and agree to the Bolt Partner Terms &amp; Privacy Policy.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-[#34D186] hover:bg-[#29BE77] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {step < 3 ? (
              <span>Continue</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Create Driver Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
