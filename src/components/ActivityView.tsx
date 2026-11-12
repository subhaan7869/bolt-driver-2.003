import React from 'react';
import { Award, CheckCircle2, Flame, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { CampaignQuest } from '../types/driver';

interface ActivityViewProps {
  driverScore: number;
  acceptanceRate: number;
  completionRate: number;
  riderRating: number;
  campaigns: CampaignQuest[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  driverScore,
  acceptanceRate,
  completionRate,
  riderRating,
  campaigns,
}) => {
  const scoreStrokeDash = 2 * Math.PI * 44;
  const scoreOffset = scoreStrokeDash * (1 - driverScore / 100);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Driver Activity
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Performance metrics, Bolt tier status, and weekly bonus quests
          </p>
        </div>

        {/* Driver Score & Metrics Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#34D186"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={scoreStrokeDash}
                  strokeDashoffset={scoreOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                  {driverScore}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25B670]">
                <Award className="w-4 h-4" />
                <span>Gold Partner Tier</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Driver Score
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Keep your score above 85% to unlock airport priority queues and weekly bonus quests.
              </p>
            </div>
          </div>

          {/* Key Ratios */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Rider Rating
              </div>
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                <span>{riderRating.toFixed(2)}</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-xs text-slate-400">Last 500 trips</div>
            </div>

            <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Acceptance
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                {acceptanceRate}%
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Excellent
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Completion
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                {completionRate}%
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Low cancellations
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns & Bonus Quests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Active campaigns</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Updates automatically on trip completion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((quest) => {
              const pct = Math.min(100, (quest.completedTrips / quest.targetTrips) * 100);
              const done = quest.completedTrips >= quest.targetTrips;
              return (
                <div
                  key={quest.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {quest.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-extrabold text-[#25B670] font-mono-num">
                        +£{quest.rewardAmount}
                      </span>
                      <div className="text-[11px] text-slate-400">{quest.endsIn}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#34D186] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>
                        {quest.completedTrips} of {quest.targetTrips} trips
                      </span>
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Bonus unlocked
                        </span>
                      ) : (
                        <span>{quest.targetTrips - quest.completedTrips} remaining</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driving Insights */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#25B670]" />
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
              Telematics &amp; safety insights
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Smooth braking
              </div>
              <div className="text-xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                98 / 100
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Top 5% of London drivers
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Speed compliance
              </div>
              <div className="text-xl font-extrabold text-slate-950 dark:text-white font-mono-num">
                99.2%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                20 mph zone adherence
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Phone handling
              </div>
              <div className="flex items-center gap-1.5 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span>Mounted</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Zero handheld alerts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
