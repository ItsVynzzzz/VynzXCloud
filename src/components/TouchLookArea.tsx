import React from 'react';
import {StyleSheet, requireNativeComponent} from 'react-native';

// View native (TouchLookView.java): sentuhan ditangkap langsung di sisi Android,
// jadi tetap stabil walau thread JS sedang sibuk.
const RNTouchLook: any = requireNativeComponent('TouchLookView');

type Props = {
  onLook: (x: number, y: number) => void;
  width: number | string;
  height: number | string;
  speed: number;
  speedY: number;
  smoothing: number;
  antiDeadZone: number;
  invertY: boolean;
};

// Area transparan di separuh kanan layar. Menggeser jari di sini memutar kamera.
// Berada di bawah tombol (zIndex lebih rendah), jadi menekan tombol tidak memutar kamera.
const TouchLookArea = ({
  onLook,
  width,
  height,
  speed,
  speedY,
  smoothing,
  antiDeadZone,
  invertY,
}: Props) => {
  const latest = React.useRef(onLook);
  latest.current = onLook;

  const handleChange = React.useCallback((event: any) => {
    latest.current(event.nativeEvent.x, event.nativeEvent.y);
  }, []);

  // Pastikan kamera berhenti kalau area dilepas saat jari masih menyentuh.
  React.useEffect(
    () => () => {
      latest.current(0, 0);
    },
    [],
  );

  return (
    <RNTouchLook
      style={[styles.area, {width, height}]}
      speed={speed}
      speedY={speedY}
      smoothing={smoothing}
      antiDeadZone={antiDeadZone}
      invertY={invertY}
      onTouchLookChange={handleChange}
    />
  );
};

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 9,
  },
});

export default React.memo(TouchLookArea);
