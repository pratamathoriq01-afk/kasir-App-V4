/**
 * Web Audio API synthesizer for crystal-clear order alert chimes.
 * Uses a pre-warmed singleton AudioContext for 0ms instant hardware sound playback.
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
  getAudioContext();
}

export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Fast 3-tone pleasant chime (E5 -> G5 -> C6) for instant, energetic alert
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1046.5, now + 0.16); // C6
    gain3.gain.setValueAtTime(0.3, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.45);
  } catch (err) {
    console.warn("Audio Context alert notification error:", err);
  }
}
