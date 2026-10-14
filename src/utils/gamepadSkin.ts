import {getSettings} from '../store/settingStore';

// Nama gambar native untuk gaya PlayStation (lihat res/drawable/control_button_ps_*).
const PS_BUTTONS: Record<string, string> = {
  A: 'control_button_ps_cross',
  B: 'control_button_ps_circle',
  X: 'control_button_ps_square',
  Y: 'control_button_ps_triangle',
  LeftShoulder: 'control_button_ps_l1',
  RightShoulder: 'control_button_ps_r1',
  LeftTrigger: 'control_button_ps_l2',
  RightTrigger: 'control_button_ps_r2',
  Nexus: 'control_button_ps_home',
};

// Mengembalikan nama gambar sesuai gaya ikon yang dipilih. Tombol yang tidak
// punya versi PlayStation (D-pad, View, Menu, L3/R3) tetap memakai gambar asli.
export const skinButtonName = (logicalName: string, fallback: string) => {
  try {
    if (getSettings().virtual_gamepad_skin === 'ps') {
      return PS_BUTTONS[logicalName] || fallback;
    }
  } catch {}
  return fallback;
};
