// Kamera geser layar: gerak jari diubah menjadi output analog kanan.
// Yang diukur adalah KECEPATAN jari, bukan seberapa jauh jari dari titik awal.
// Jadi kamera berputar sesuai gerakan jari dan langsung berhenti saat jari
// berhenti (tidak seperti analog yang terus memutar selama ditahan).

export type LookConfig = {
  sensitivity: number; // pengali kecepatan (1 = bawaan)
  sensitivityY: number; // pengali tambahan untuk sumbu vertikal
  smoothing: number; // 0 = langsung, makin besar makin halus
  invertY: boolean;
};

export type LookState = {
  events: Array<{t: number; dx: number; dy: number}>;
  outX: number;
  outY: number;
};

export const TICK_MS = 16;
// Kecepatan dihitung dari gerakan dalam jendela waktu pendek supaya mulus
// walau jarak antar event sentuh tidak seragam.
export const WINDOW_MS = 48;
// Jarak jari (dp) per 16 ms yang menghasilkan analog penuh pada sensitivitas 1.
export const PX_FULL = 8;
const IDLE_LIMIT = 0.02;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const newLookState = (): LookState => ({events: [], outX: 0, outY: 0});

export const pushDelta = (
  state: LookState,
  t: number,
  dx: number,
  dy: number,
) => {
  state.events.push({t, dx, dy});
};

export const clearDeltas = (state: LookState) => {
  state.events.length = 0;
};

// Dipanggil tiap TICK_MS. Mengembalikan nilai analog (-1..1) untuk dikirim ke game.
// Konvensi sumbu sama dengan analog native: gerak jari ke atas = nilai y negatif.
export const stepLook = (state: LookState, now: number, cfg: LookConfig) => {
  while (state.events.length && now - state.events[0].t > WINDOW_MS) {
    state.events.shift();
  }
  let sumX = 0;
  let sumY = 0;
  for (const e of state.events) {
    sumX += e.dx;
    sumY += e.dy;
  }
  const gain = ((cfg.sensitivity || 1) / PX_FULL) * (TICK_MS / WINDOW_MS);
  const targetX = clamp(sumX * gain, -1, 1);
  const targetY = clamp(sumY * gain * (cfg.sensitivityY || 1), -1, 1);
  const keep = clamp(cfg.smoothing || 0, 0, 0.9);
  state.outX += (targetX - state.outX) * (1 - keep);
  state.outY += (targetY - state.outY) * (1 - keep);
  return {x: state.outX, y: cfg.invertY ? -state.outY : state.outY};
};

export const isLookIdle = (state: LookState) =>
  state.events.length === 0 &&
  Math.abs(state.outX) < IDLE_LIMIT &&
  Math.abs(state.outY) < IDLE_LIMIT;
