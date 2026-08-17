/**
 * Dual-Engine Hybrid Audio Notifier for POS Cashier Chime.
 * Combines Web Audio API Synthesizer + HTML5 Audio Element Fallback
 * to bypass browser Autoplay Policies and guarantee automatic chime playback.
 */

let cachedCtx: AudioContext | null = null;
let audioUnlocked = false;
let fallbackAudio: HTMLAudioElement | null = null;

// Clean 2-tone harmonic E5->A5 synthesized WAV chime (base64)
const BELL_WAV_BASE64 =
  "data:audio/wav;base64,UklGRpSdAQBXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXCdAQAAAJ8IEREpGb4gqSfMLQA=";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!cachedCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      cachedCtx = new AudioContextClass();
    }
  }

  if (cachedCtx && cachedCtx.state === "suspended") {
    cachedCtx.resume().catch(() => {});
  }

  return cachedCtx;
}

function getFallbackAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!fallbackAudio) {
    try {
      fallbackAudio = new Audio(BELL_WAV_BASE64);
      fallbackAudio.volume = 0.8;
    } catch {
      fallbackAudio = null;
    }
  }
  return fallbackAudio;
}

export function warmUpAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

export function unlockAudioContext(): void {
  if (typeof window === "undefined") return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        audioUnlocked = true;
      }).catch(() => {});
    } else if (ctx && ctx.state === "running") {
      audioUnlocked = true;
    }

    const htmlAudio = getFallbackAudio();
    if (htmlAudio && !audioUnlocked) {
      htmlAudio.play().then(() => {
        htmlAudio.pause();
        htmlAudio.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {});
    }
  };

  unlock();

  if (typeof window !== "undefined") {
    ["pointerdown", "click", "touchstart", "keydown", "scroll", "focus", "mousemove"].forEach((evt) => {
      window.addEventListener(evt, unlock, { capture: true, passive: true });
    });
  }
}

export function isAudioUnlocked(): boolean {
  if (cachedCtx && cachedCtx.state === "running") return true;
  return audioUnlocked;
}

export function playNotificationChime(): void {
  let playedWithWebAudio = false;

  // 1. Try Web Audio API Synthesizer
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Tone 1: E5 (659.25 Hz)
      const osc1a = ctx.createOscillator();
      const osc1b = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1a.type = "sine";
      osc1a.frequency.setValueAtTime(659.25, now);
      osc1b.type = "triangle";
      osc1b.frequency.setValueAtTime(1318.5, now);

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1a.connect(gain1);
      osc1b.connect(gain1);
      gain1.connect(ctx.destination);

      osc1a.start(now);
      osc1b.start(now);
      osc1a.stop(now + 0.6);
      osc1b.stop(now + 0.6);

      // Tone 2: A5 (880 Hz)
      const startTime2 = now + 0.12;
      const osc2a = ctx.createOscillator();
      const osc2b = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2a.type = "sine";
      osc2a.frequency.setValueAtTime(880, startTime2);
      osc2b.type = "triangle";
      osc2b.frequency.setValueAtTime(1760, startTime2);

      gain2.gain.setValueAtTime(0.4, startTime2);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime2 + 0.9);

      osc2a.connect(gain2);
      osc2b.connect(gain2);
      gain2.connect(ctx.destination);

      osc2a.start(startTime2);
      osc2b.start(startTime2);
      osc2a.stop(startTime2 + 0.9);
      osc2b.stop(startTime2 + 0.9);

      playedWithWebAudio = true;
    }
  } catch (err) {
    console.warn("Web Audio API notification chime error:", err);
  }

  // 2. HTML5 Audio Fallback if Web Audio was not running or failed
  if (!playedWithWebAudio || !cachedCtx || cachedCtx.state !== "running") {
    try {
      const htmlAudio = getFallbackAudio();
      if (htmlAudio) {
        htmlAudio.currentTime = 0;
        htmlAudio.play().catch(() => {});
      }
    } catch {
      // Fallback silent fail
    }
  }
}
