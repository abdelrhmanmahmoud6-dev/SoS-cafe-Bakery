"use client";

/* ============================================================================
   NEW-ORDER CHIME

   Synthesised with the Web Audio API so no audio asset has to ship or load.

   Browsers refuse to start an AudioContext until the page has had a user
   gesture, which is exactly why the admin header has an explicit toggle: the
   click that enables the alert is also the gesture that unlocks playback.
   Calling `unlockChime()` from that handler primes the context so later,
   non-gesture calls (a poll finding a new order) are allowed to make sound.
   ========================================================================== */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    return ctx;
  } catch {
    return null; // Web Audio unavailable — the board still works, silently
  }
}

/** Call from a click handler to satisfy the autoplay policy. */
export function unlockChime(): void {
  const audio = getContext();
  if (audio && audio.state === "suspended") void audio.resume();
}

/** Two-tone bell. Safe to call when audio is blocked — it just does nothing. */
export function playChime(): void {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();

  try {
    [880, 1320].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      const start = audio.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });
  } catch {
    /* never let a failed alert break the order board */
  }
}
