// A short synthesised chime for finishing a puzzle-shaped question - two
// ascending sine tones from the Web Audio API, not an audio file. There is
// no sound-asset pipeline anywhere in this product (confirmed while planning
// this feature), so licensed music or sound effects were never an option for
// this pass; a couple of oscillator calls need none.
//
// Muted state is remembered locally per browser only - never sent anywhere,
// never read by anyone but this browser.

const MUTE_KEY = "ascend.assessment.chimeMuted";

export function chimeMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setChimeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private browsing or blocked storage: the toggle just resets on
    // reload, which is a fine way for this to fail - it is decoration.
  }
}

let ctx: AudioContext | null = null;

/** "Nice, that's placed" - not a fanfare. Silent if muted or unsupported;
 * a failure here must never interrupt answering the actual question. */
export function playCompletionChime(): void {
  if (chimeMuted() || typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    ctx ??= new Ctor();
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // Same rule as above: audio is decoration, never a dependency.
  }
}
