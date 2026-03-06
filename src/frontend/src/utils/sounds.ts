/**
 * Tiny Web Audio API sound utilities for Islamic app micro-sounds.
 * All sounds are generated procedurally — no external files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Soft "bead click" — short percussive tick for tasbih counter */
export function playTasbihClick() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const now = ac.currentTime;
    // Oscillator for tone
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    /* ignore */
  }
}

/** Gentle "goal reached" chime — plays when tasbih target is hit */
export function playTasbihGoal() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const now = ac.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5 E5 G5
    for (let i = 0; i < freqs.length; i++) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "sine";
      osc.frequency.value = freqs[i];
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.52);
    }
  } catch {
    /* ignore */
  }
}

/** Soft navigation tap — subtle low-pitched click for nav tabs */
export function playNavTap() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    /* ignore */
  }
}

/** Prayer check-off sound — warm soft tone when a namaz is ticked */
export function playPrayerCheck() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const now = ac.currentTime;
    const freqs = [440, 554.37]; // A4 C#5
    for (let i = 0; i < freqs.length; i++) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "sine";
      osc.frequency.value = freqs[i];
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.42);
    }
  } catch {
    /* ignore */
  }
}

/** Book open — short swish for opening a book/surah */
export function playBookOpen() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const now = ac.currentTime;
    const bufSize = ac.sampleRate * 0.08;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) ** 2 * 0.15;
    }
    const src = ac.createBufferSource();
    const filt = ac.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1800;
    filt.Q.value = 0.8;
    src.buffer = buf;
    src.connect(filt);
    filt.connect(ac.destination);
    src.start(now);
  } catch {
    /* ignore */
  }
}
