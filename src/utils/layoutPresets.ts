import {createDefaultVirtualDPadButton} from './virtualDPad';
import {createDefaultMacroLayoutButton} from './virtualMacro';
import {defaultLayoutButtons} from './defaultLayout';

export type LayoutMode = 'normal' | 'playstation' | 'fps' | 'racing';

export const LAYOUT_MODES: LayoutMode[] = [
  'normal',
  'playstation',
  'fps',
  'racing',
];

// Tiap mode disimpan sebagai profil tata letak sendiri, jadi tidak menimpa
// profil buatan pengguna dan tetap bisa diatur lewat editor.
export const MODE_PROFILE: Record<LayoutMode, string> = {
  normal: 'Mode Normal',
  playstation: 'Mode PlayStation',
  fps: 'Mode FPS',
  racing: 'Mode Balap',
};

export const modeFromProfile = (profile: string): LayoutMode | null => {
  const found = LAYOUT_MODES.find(mode => MODE_PROFILE[mode] === profile);
  return found || null;
};

// Pengaturan yang ikut diterapkan saat sebuah mode dipilih.
export const MODE_SETTINGS: Record<LayoutMode, Record<string, any>> = {
  normal: {
    virtual_gamepad_skin: 'xbox',
    virtual_touch_look: false,
    virtual_gamepad_joystick: 1,
    virtual_stick_deadzone: 0.1,
    virtual_stick_sens_left: 1,
    virtual_stick_sens_right: 1,
  },
  playstation: {
    virtual_gamepad_skin: 'ps',
    virtual_touch_look: false,
    virtual_gamepad_joystick: 1,
    virtual_stick_deadzone: 0.1,
    virtual_stick_sens_left: 1,
    virtual_stick_sens_right: 1,
  },
  // Kamera diputar dengan menggeser layar (tanpa analog kanan). Analog kiri
  // memakai mode Pindah seperti game mobile pada umumnya.
  fps: {
    virtual_touch_look: true,
    virtual_gamepad_joystick: 2,
    virtual_stick_deadzone: 0.05,
    virtual_stick_sens_left: 1,
    virtual_stick_sens_right: 1.3,
  },
  // Kemudi dengan analog kiri tetap di tempatnya.
  racing: {
    virtual_touch_look: false,
    virtual_gamepad_joystick: 0,
    virtual_stick_deadzone: 0.1,
    virtual_stick_sens_left: 1,
    virtual_stick_sens_right: 1,
  },
};

const r = (v: number) => Math.round(v);

const btn = (name: string, x: number, y: number, scale = 1) => ({
  name,
  x: r(x),
  y: r(y),
  scale,
  show: true,
});

// Empat tombol ABXY berbentuk wajik di sekitar titik tengah (cx, cy).
const faceCluster = (cx: number, cy: number, d: number, scale: number) => {
  const h = 30 * scale;
  return [
    btn('A', cx - h, cy + d - h, scale),
    btn('B', cx + d - h, cy - h, scale),
    btn('X', cx - d - h, cy - h, scale),
    btn('Y', cx - h, cy - d - h, scale),
  ];
};

const dpad = (x: number, y: number, size: number) =>
  createDefaultVirtualDPadButton(r(x), r(y), size, size);

// Posisi analog dihitung dari titik tengahnya (kotak 120).
const stick = (name: string, cx: number, cy: number) =>
  btn(name, cx - 60, cy - 60);

const playstation = (W: number, H: number): any[] => {
  const m = 24;
  return [
    btn('LeftTrigger', m, 8),
    btn('RightTrigger', W - m - 80, 8),
    btn('LeftShoulder', m, 64),
    btn('RightShoulder', W - m - 80, 64),
    dpad(W * 0.035, H * 0.33, 120),
    ...faceCluster(W - 134, H * 0.46, 46, 0.9),
    stick('LeftStick', W * 0.32, H - 92),
    stick('RightStick', Math.min(W * 0.68, W - 230), H - 92),
    btn('LeftThumb', W * 0.32 - 25, H - 92 - 60 - 56),
    btn('RightThumb', Math.min(W * 0.68, W - 230) - 25, H - 92 - 60 - 56),
    btn('View', W / 2 - 90, 12),
    btn('Menu', W / 2 + 50, 12),
    btn('Nexus', W / 2 - 22, H * 0.7 - 22),
    {...createDefaultMacroLayoutButton(W, H), x: r(W / 2 - 30), y: r(H * 0.3)},
  ];
};

const fps = (W: number, H: number): any[] => {
  const m = 24;
  return [
    btn('LeftTrigger', m, 8, 1.2),
    btn('RightTrigger', W - m - 96, 8, 1.2),
    btn('LeftShoulder', m, 78),
    btn('RightShoulder', W - m - 80, 78),
    dpad(W * 0.33, H - 110, 80),
    ...faceCluster(W - 112, H * 0.6, 44, 0.9),
    stick('LeftStick', W * 0.15, H - 88),
    stick('RightStick', W * 0.62, H - 88),
    btn('LeftThumb', W * 0.15 + 66, H - 88 - 25),
    btn('RightThumb', W * 0.62 - 25, H - 88 - 60 - 56),
    btn('View', W / 2 - 70, 10),
    btn('Nexus', W / 2 - 22, 10),
    btn('Menu', W / 2 + 30, 10),
    {...createDefaultMacroLayoutButton(W, H), x: r(W / 2 - 30), y: r(H * 0.42)},
  ];
};

const racing = (W: number, H: number): any[] => {
  const m = 24;
  return [
    btn('LeftShoulder', m, 8),
    btn('RightShoulder', W - m - 80, 8),
    btn('LeftTrigger', W - 312, H - 118, 1.4),
    btn('RightTrigger', W - m - 144, H - 138, 1.8),
    dpad(m, H * 0.22, 110),
    ...faceCluster(W - 112, H * 0.38, 40, 0.8),
    stick('LeftStick', W * 0.17, H - 100),
    stick('RightStick', W * 0.4, H - 100),
    btn('LeftThumb', W * 0.17 + 60, H - 100 - 60 - 53),
    btn('RightThumb', W * 0.4 - 25, H - 100 - 60 - 56),
    btn('View', W / 2 - 70, 10),
    btn('Nexus', W / 2 - 22, 10),
    btn('Menu', W / 2 + 30, 10),
    {...createDefaultMacroLayoutButton(W, H), x: r(W / 2 - 30), y: r(H * 0.4)},
  ];
};

export const buildPresetLayout = (
  mode: LayoutMode,
  width: number,
  height: number,
): any[] => {
  switch (mode) {
    case 'playstation':
      return playstation(width, height);
    case 'fps':
      return fps(width, height);
    case 'racing':
      return racing(width, height);
    default:
      return defaultLayoutButtons(
        width,
        height,
        createDefaultMacroLayoutButton(width, height),
      );
  }
};
