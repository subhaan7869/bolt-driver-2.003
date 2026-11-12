export type VoiceCommandType =
  | 'accept'
  | 'decline'
  | 'go_online'
  | 'go_offline'
  | 'next'
  | 'complete';

export interface VoiceSnapshot {
  isMicActive: boolean;
  isListening: boolean;
  levels: number[];
  lastTranscript: string;
  lastCommand: VoiceCommandType | null;
  permissionError: string | null;
}

type SnapshotListener = (snapshot: VoiceSnapshot) => void;
type CommandListener = (command: VoiceCommandType, transcript: string) => void;

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: { transcript: string };
    };
  };
}

class DynamicIslandVoiceManager {
  private static instance: DynamicIslandVoiceManager | null = null;

  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private recognition: SpeechRecognitionInstance | null = null;
  private rafId: number | null = null;

  public isMicActive = false;
  public isListening = false;
  public levels: number[] = [0.15, 0.2, 0.15, 0.2, 0.15];
  public lastTranscript = '';
  public lastCommand: VoiceCommandType | null = null;
  public permissionError: string | null = null;

  private snapshotListeners = new Set<SnapshotListener>();
  private commandListeners = new Set<CommandListener>();
  private lastCommandTime = 0;

  private constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isMicActive) {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
          }
          if (!this.isListening) {
            this.startSpeechRecognition();
          }
        }
      });
    }
  }

  public static getInstance(): DynamicIslandVoiceManager {
    if (!DynamicIslandVoiceManager.instance) {
      DynamicIslandVoiceManager.instance = new DynamicIslandVoiceManager();
    }
    return DynamicIslandVoiceManager.instance;
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  public onCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  public getSnapshot(): VoiceSnapshot {
    return {
      isMicActive: this.isMicActive,
      isListening: this.isListening,
      levels: [...this.levels],
      lastTranscript: this.lastTranscript,
      lastCommand: this.lastCommand,
      permissionError: this.permissionError,
    };
  }

  private updateSnapshot() {
    const snap = this.getSnapshot();
    this.snapshotListeners.forEach((cb) => cb(snap));
  }

  private emitCommand(cmd: VoiceCommandType, transcript: string) {
    const now = Date.now();
    if (now - this.lastCommandTime < 1200) return;
    this.lastCommandTime = now;
    this.lastCommand = cmd;
    this.updateSnapshot();
    this.commandListeners.forEach((cb) => cb(cmd, transcript));
  }

  private parseTranscriptForCommand(text: string) {
    const clean = text.toLowerCase().trim();
    if (!clean) return;
    this.lastTranscript = text.trim();

    if (clean.includes('accept')) {
      this.emitCommand('accept', text);
    } else if (clean.includes('decline') || clean.includes('reject')) {
      this.emitCommand('decline', text);
    } else if (clean.includes('go online') || clean.includes('start shift')) {
      this.emitCommand('go_online', text);
    } else if (clean.includes('go offline') || clean.includes('end shift')) {
      this.emitCommand('go_offline', text);
    } else if (clean.includes('complete') || clean.includes('finish')) {
      this.emitCommand('complete', text);
    } else if (
      clean.includes('next') ||
      clean.includes('arrived') ||
      clean.includes('start trip')
    ) {
      this.emitCommand('next', text);
    } else {
      this.updateSnapshot();
    }
  }

  private startLevelLoop() {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);

    const tick = () => {
      if (!this.isMicActive || !this.analyser) return;
      this.analyser.getByteFrequencyData(data);
      const bars = [2, 5, 9, 14, 20].map((idx) => {
        const val = data[Math.min(data.length - 1, idx)] || 0;
        return Math.max(0.14, Math.min(1, val / 170));
      });
      this.levels = bars;
      this.updateSnapshot();
      this.rafId = requestAnimationFrame(tick);
    };

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(tick);
  }

  private startSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (this.recognition) {
        this.recognition.onend = null;
        this.recognition.stop();
      }
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-GB';

      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (transcript) {
            this.parseTranscriptForCommand(transcript);
          }
        }
      };

      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          this.isListening = false;
          this.updateSnapshot();
        }
      };

      rec.onend = () => {
        this.isListening = false;
        if (this.isMicActive && document.visibilityState === 'visible') {
          setTimeout(() => {
            if (this.isMicActive) this.startSpeechRecognition();
          }, 350);
        } else {
          this.updateSnapshot();
        }
      };

      rec.start();
      this.recognition = rec;
      this.isListening = true;
      this.updateSnapshot();
    } catch {
      this.isListening = false;
    }
  }

  public async startMicSession(): Promise<boolean> {
    this.permissionError = null;
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone audio is not supported in this browser.');
      }

      // 1. Request microphone permission
      let stream = this.mediaStream;
      if (!stream || !stream.active || stream.getAudioTracks()[0]?.readyState === 'ended') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        this.mediaStream = stream;
      }

      // 2. Web Audio analyser + near-silent keep-alive node for Dynamic Island persistence
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume().catch(() => {});
        }
        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        this.analyser = analyser;

        const silentGain = this.audioContext.createGain();
        silentGain.gain.value = 0.00001;
        source.connect(silentGain);
        silentGain.connect(this.audioContext.destination);
        this.silentGain = silentGain;

        this.startLevelLoop();
      }

      // 3. Start speech-to-text recognition
      this.startSpeechRecognition();

      this.isMicActive = true;
      this.isListening = true;
      try {
        localStorage.setItem('hyper_dynamic_island_mic', 'true');
      } catch {
        // Ignore storage errors
      }
      this.updateSnapshot();
      return true;
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      this.permissionError =
        error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser or device settings.'
          : error?.message || 'Could not access microphone.';
      this.stopMicSession();
      return false;
    }
  }

  public stopMicSession(): void {
    this.isMicActive = false;
    this.isListening = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    if (this.silentGain) {
      try {
        this.silentGain.disconnect();
      } catch {
        // Ignore
      }
      this.silentGain = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.levels = [0.15, 0.2, 0.15, 0.2, 0.15];
    try {
      localStorage.setItem('hyper_dynamic_island_mic', 'false');
    } catch {
      // Ignore
    }
    this.updateSnapshot();
  }
}

export const dynamicIslandVoiceManager = DynamicIslandVoiceManager.getInstance();
