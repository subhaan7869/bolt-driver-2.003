import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface BootScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

const SPEED_STREAKS = [
  { top: '26%', delay: 0.1, duration: 1.05, width: 'w-44 sm:w-64', opacity: 0.32 },
  { top: '39%', delay: 0.28, duration: 0.9, width: 'w-56 sm:w-80', opacity: 0.5 },
  { top: '52%', delay: 0.05, duration: 1.15, width: 'w-48 sm:w-72', opacity: 0.42 },
  { top: '65%', delay: 0.42, duration: 0.95, width: 'w-40 sm:w-60', opacity: 0.28 },
];

export const BootScreen: React.FC<BootScreenProps> = ({ isVisible, onComplete }) => {
  const prefersReducedMotion = useReducedMotion();
  const [phaseLabel, setPhaseLabel] = useState('Starting driver companion...');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isVisible) return;

    const totalMs = prefersReducedMotion ? 650 : 2150;
    const midTimer = window.setTimeout(() => {
      setPhaseLabel('Syncing live dispatch map...');
    }, Math.round(totalMs * 0.48));

    const doneTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, totalMs);

    return () => {
      window.clearTimeout(midTimer);
      window.clearTimeout(doneTimer);
    };
  }, [isVisible, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="bolt-boot-screen"
          initial={{ opacity: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0, transition: { duration: 0.2 } }
              : {
                  opacity: 0,
                  scale: 1.04,
                  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                }
          }
          onClick={onComplete}
          role="status"
          aria-live="polite"
          aria-label="Loading Bolt Driver"
          className="fixed inset-0 z-[999] h-dvh w-screen overflow-hidden bg-[#050709] text-white flex flex-col items-center justify-between px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2.25rem,env(safe-area-inset-bottom))] select-none cursor-pointer"
        >
          {/* Ambient Emerald Radial Aura */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0.35 } : { opacity: 0, scale: 0.72 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.35 }
                  : {
                      opacity: [0.18, 0.48, 0.32],
                      scale: [0.82, 1.12, 1.0],
                    }
              }
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] sm:w-[520px] sm:h-[520px] rounded-full bg-[radial-gradient(circle,rgba(52,209,134,0.38)_0%,rgba(0,255,59,0.12)_38%,rgba(5,7,9,0)_72%)]"
            />

            {/* Animated Electric Speed Streaks */}
            {!prefersReducedMotion &&
              SPEED_STREAKS.map((streak, idx) => (
                <motion.div
                  key={idx}
                  style={{ top: streak.top }}
                  initial={{ x: '-40vw', opacity: 0 }}
                  animate={{
                    x: '125vw',
                    opacity: [0, streak.opacity, 0],
                  }}
                  transition={{
                    duration: streak.duration,
                    delay: streak.delay,
                    repeat: Infinity,
                    repeatDelay: 0.55,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute left-0 h-[2px] ${streak.width} rounded-full bg-gradient-to-r from-transparent via-[#34D186] to-[#8BFFB5]`}
                />
              ))}
          </div>

          {/* Top subtle brand spacing */}
          <div className="h-6" />

          {/* Hero Logo Emblem Lockup */}
          <div className="relative flex flex-col items-center">
            {/* Expanding electric shockwave ring */}
            {!prefersReducedMotion && (
              <motion.div
                initial={{ scale: 0.75, opacity: 0.75 }}
                animate={{ scale: 1.55, opacity: 0 }}
                transition={{
                  duration: 1.35,
                  delay: 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 sm:w-40 sm:h-40 rounded-[32px] sm:rounded-[38px] border border-[#34D186]/70"
              />
            )}

            {/* Main Logo Container */}
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 0.76, y: 14 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 20,
                mass: 0.85,
              }}
              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[28px] sm:rounded-[34px] overflow-hidden bg-[#070B0E] border border-white/15 shadow-[0_0_55px_rgba(52,209,134,0.34)]"
            >
              <img
                src="/assets/aistudio/image_adf30014.png"
                alt="Bolt Driver logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover block"
              />

              {/* Specular light sweep across the icon */}
              {!prefersReducedMotion && (
                <motion.div
                  initial={{ x: '-140%', opacity: 0 }}
                  animate={{ x: '160%', opacity: [0, 0.55, 0] }}
                  transition={{
                    duration: 0.95,
                    delay: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              )}
            </motion.div>

            {/* Typography lockup */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : 0.25 }}
              className="mt-6 text-center space-y-1.5"
            >
              <div className="inline-flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Bolt
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#34D186]">
                  Driver
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-400">
                Partner Dispatch &amp; Navigation
              </p>
            </motion.div>
          </div>

          {/* Bottom Progress Bar & Status */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.3 }}
            className="w-full max-w-[240px] sm:max-w-xs flex flex-col items-center gap-3"
          >
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ scaleX: prefersReducedMotion ? 1 : 0.08 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.3 : 1.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#25B670] via-[#34D186] to-[#7BFFB6]"
              />
            </div>
            <div className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-400">
              <span>{phaseLabel}</span>
              <span className="text-slate-500">Tap to enter</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
