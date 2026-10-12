import {createDefaultVirtualDPadButton} from './virtualDPad';

// Posisi (kiri-atas, dp) tombol kontroler virtual mengikuti desain referensi.
export const defaultLayoutButtons = (
  width: number,
  height: number,
  macroButton: any,
): any[] => {
  const r = (v: number) => Math.round(v);
  const btn = (name: string, x: number, y: number, scale = 1) => ({
    name,
    x: r(x),
    y: r(y),
    scale,
    show: true,
  });
  const cx = width * 0.827;
  const cy = height * 0.46;
  const d = 48;
  const h = 27; // setengah kotak ABXY (60 * 0.9 / 2)
  return [
    btn('LeftTrigger', width * 0.092, 8),
    btn('LeftShoulder', width * 0.21, 15),
    btn('RightShoulder', width * 0.786 - 78, 23),
    btn('RightTrigger', width * 0.903 - 78, 9),
    btn('LeftThumb', width * 0.32 - 25, height * 0.26 - 25),
    btn('RightThumb', width * 0.692 - 25, height * 0.2625 - 25),
    btn('A', cx - h, cy + d - h, 0.9),
    btn('B', cx + d - h, cy - h, 0.9),
    btn('X', cx - d - h, cy - h, 0.9),
    btn('Y', cx - h, cy - d - h, 0.9),
    btn('View', width * 0.473 - 20, height * 0.865 - 20),
    btn('Nexus', width * 0.5 - 22, height * 0.746 - 22),
    btn('Menu', width * 0.527 - 20, height * 0.865 - 20),
    createDefaultVirtualDPadButton(
      r(width * 0.09),
      r(height * 0.287),
      140,
      140,
    ),
    btn('LeftStick', width * 0.3 - 60, height * 0.77 - 60),
    btn('RightStick', width * 0.68 - 60, height * 0.775 - 60),
    macroButton,
  ];
};
