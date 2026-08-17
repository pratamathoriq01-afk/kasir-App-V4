/**
 * Web Audio API synthesizer for a rich, warm, elegant POS cashier chime.
 * Uses a brass bell harmonic synthesizer with warm decay & instant 0ms playback.
 */

let cachedCtx: AudioContext | null = null;

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
      ctx.resume().catch(() => {});
    }
  };

  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("click", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true, passive: true });
  window.addEventListener("touchstart", unlock, { capture: true, passive: true });
  window.addEventListener("scroll", unlock, { capture: true, passive: true });
}

export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // --- TONE 1: Warm E5 (659.25 Hz) bell strike ---
    const osc1a = ctx.createOscillator(); // Main Sine
    const osc1b = ctx.createOscillator(); // Harmonic Overtone
    const gain1 = ctx.createGain();

    osc1a.type = "sine";
    osc1a.frequency.setValueAtTime(659.25, now); // E5 fundamental

    osc1b.type = "triangle";
    osc1b.frequency.setValueAtTime(1318.5, now); // E6 2nd harmonic (warm overtone)

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc1a.connect(gain1);
    osc1b.connect(gain1);
    gain1.connect(ctx.destination);

    osc1a.start(now);
    osc1b.start(now);
    osc1a.stop(now + 0.5);
    osc1b.stop(now + 0.5);

    // --- TONE 2: Rich A5 (880 Hz) bell strike (perfect 4th rise) ---
    const startTime2 = now + 0.12;

    const osc2a = ctx.createOscillator(); // Main Sine
    const osc2b = ctx.createOscillator(); // Harmonic Overtone
    const gain2 = ctx.createGain();

    osc2a.type = "sine";
    osc2a.frequency.setValueAtTime(880, startTime2); // A5 fundamental

    osc2b.type = "triangle";
    osc2b.frequency.setValueAtTime(1760, startTime2); // A6 2nd harmonic

    gain2.gain.setValueAtTime(0.35, startTime2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime2 + 0.8);

    osc2a.connect(gain2);
    osc2b.connect(gain2);
    gain2.connect(ctx.destination);

    osc2a.start(startTime2);
    osc2b.start(startTime2);
    osc2a.stop(startTime2 + 0.8);
    osc2b.stop(startTime2 + 0.8);
  } catch (err) {
    console.warn("Audio Context alert notification error:", err);
  }
}
