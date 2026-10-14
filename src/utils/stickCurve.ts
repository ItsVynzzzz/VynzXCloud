// Kurva respons analog virtual.
// sensitivity > 1: lebih peka pada gerakan kecil (jempol cukup digeser sedikit).
// sensitivity < 1: lebih halus di dekat pusat, bagus untuk membidik.
// Nilai maksimum tetap 1, dan arah gerakan tidak berubah.
export const shapeStick = (x: any, y: any, sensitivity: number) => {
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !sensitivity ||
    sensitivity === 1
  ) {
    return {x, y};
  }
  const magnitude = Math.max(Math.abs(x), Math.abs(y));
  if (magnitude === 0) {
    return {x, y};
  }
  const shaped = Math.pow(Math.min(magnitude, 1), 1 / sensitivity);
  const factor = shaped / magnitude;
  return {x: x * factor, y: y * factor};
};
