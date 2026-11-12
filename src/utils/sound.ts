// Real Web Audio API navigation chimes and dispatch tones
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

function playToneSequence(
  notes: { freq: number; delay: number; duration: number; type?: OscillatorType; gain?: number }[]
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    notes.forEach(({ freq, delay, duration, type = 'sine', gain = 0.11 }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);

      g.gain.setValueAtTime(0.001, now + delay);
      g.gain.exponentialRampToValueAtTime(gain, now + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
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
      { freq: 880, delay: 0, duration: 0.12, type: 'sine', gain: 0.09 },
      { freq: 1046.5, delay: 0.09, duration: 0.16, type: 'sine', gain: 0.09 },
    ]);
  }
}

export function playDispatchChime(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 587.33, delay: 0, duration: 0.22, type: 'sine', gain: 0.13 },
    { freq: 880.0, delay: 0.11, duration: 0.22, type: 'sine', gain: 0.13 },
    { freq: 1174.66, delay: 0.22, duration: 0.34, type: 'sine', gain: 0.14 },
  ]);
}

export function playNavigationTurnPing(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 740, delay: 0, duration: 0.14, type: 'triangle', gain: 0.09 },
    { freq: 987.77, delay: 0.09, duration: 0.18, type: 'triangle', gain: 0.09 },
  ]);
}

export function playBidAcceptedTone(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 523.25, delay: 0, duration: 0.16, type: 'sine', gain: 0.11 },
    { freq: 659.25, delay: 0.09, duration: 0.16, type: 'sine', gain: 0.11 },
    { freq: 783.99, delay: 0.18, duration: 0.24, type: 'sine', gain: 0.12 },
    { freq: 1046.5, delay: 0.28, duration: 0.32, type: 'sine', gain: 0.13 },
  ]);
}

export function playArrivalChime(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 659.25, delay: 0, duration: 0.2, type: 'triangle', gain: 0.1 },
    { freq: 659.25, delay: 0.2, duration: 0.26, type: 'triangle', gain: 0.1 },
  ]);
}

export function playSuccessTone(enabled: boolean): void {
  if (!enabled) return;
  playToneSequence([
    { freq: 523.25, delay: 0, duration: 0.18, type: 'triangle', gain: 0.09 },
    { freq: 659.25, delay: 0.08, duration: 0.24, type: 'triangle', gain: 0.1 },
  ]);
}
