// Real Web Audio API navigation chimes and layered ride-dispatch sound effects
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface ToneSpec {
  freq: number;
  delay: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function playToneSequence(notes: ToneSpec[]) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    notes.forEach(({ freq, delay, duration, type = 'sine', gain = 0.1 }) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3400, now + delay);

      g.gain.setValueAtTime(0.0001, now + delay);
      g.gain.linearRampToValueAtTime(gain, now + delay + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.03);
    });
  } catch {
    // Ignore autoplay restrictions
  }
}

export function playHyperSound(kind: 'complete' | 'order' | 'message', enabled = true): void {
  if (!enabled) return;
  if (kind === 'order') {
    playDispatchChime(true);
  } else if (kind === 'complete') {
    playBidAcceptedTone(true);
  } else {
    playToneSequence([
      { freq: 783.99, delay: 0, duration: 0.12, type: 'sine', gain: 0.09 },
      { freq: 1046.5, delay: 0.07, duration: 0.18, type: 'triangle', gain: 0.08 },
    ]);
  }
}

// Rich, modern two-phrase harmonic ride-offer ping (clearly audible without harshness)
export function playDispatchChime(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    // First rising fifth + octave chime
    { freq: 523.25, delay: 0.0, duration: 0.22, type: 'triangle', gain: 0.11 },
    { freq: 783.99, delay: 0.0, duration: 0.22, type: 'sine', gain: 0.07 },
    { freq: 659.25, delay: 0.09, duration: 0.24, type: 'triangle', gain: 0.11 },
    { freq: 987.77, delay: 0.18, duration: 0.34, type: 'sine', gain: 0.12 },
    { freq: 1318.5, delay: 0.18, duration: 0.34, type: 'sine', gain: 0.05 },

    // Second confirmation pulse (distinctive driver offer cadence)
    { freq: 659.25, delay: 0.46, duration: 0.2, type: 'triangle', gain: 0.1 },
    { freq: 987.77, delay: 0.55, duration: 0.22, type: 'sine', gain: 0.1 },
    { freq: 1318.5, delay: 0.64, duration: 0.42, type: 'sine', gain: 0.12 },
    { freq: 659.25, delay: 0.64, duration: 0.42, type: 'sine', gain: 0.06 },
  ]);
}

export function playNavigationTurnPing(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 698.46, delay: 0, duration: 0.13, type: 'triangle', gain: 0.08 },
    { freq: 932.33, delay: 0.08, duration: 0.18, type: 'sine', gain: 0.09 },
  ]);
}

export function playBidAcceptedTone(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 523.25, delay: 0, duration: 0.16, type: 'sine', gain: 0.1 },
    { freq: 659.25, delay: 0.09, duration: 0.16, type: 'sine', gain: 0.1 },
    { freq: 783.99, delay: 0.18, duration: 0.24, type: 'sine', gain: 0.11 },
    { freq: 1046.5, delay: 0.28, duration: 0.34, type: 'triangle', gain: 0.12 },
  ]);
}

export function playArrivalChime(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 659.25, delay: 0, duration: 0.2, type: 'triangle', gain: 0.1 },
    { freq: 880.0, delay: 0.16, duration: 0.28, type: 'sine', gain: 0.1 },
  ]);
}

export function playSuccessTone(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 523.25, delay: 0, duration: 0.18, type: 'triangle', gain: 0.09 },
    { freq: 659.25, delay: 0.08, duration: 0.24, type: 'sine', gain: 0.1 },
  ]);
}
