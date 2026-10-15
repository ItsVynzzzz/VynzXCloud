import React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  LookConfig,
  TICK_MS,
  clearDeltas,
  isLookIdle,
  newLookState,
  pushDelta,
  stepLook,
} from '../utils/touchLook';

type Props = LookConfig & {
  onLook: (x: number, y: number) => void;
  width: number | string;
  height: number | string;
};

// Area transparan di separuh kanan layar. Menggeser jari di sini memutar kamera.
// Berada di bawah tombol (zIndex lebih rendah), jadi menekan tombol tidak memutar kamera.
const TouchLookArea = ({
  onLook,
  width,
  height,
  sensitivity,
  sensitivityY,
  smoothing,
  invertY,
}: Props) => {
  const latest = React.useRef({
    onLook,
    cfg: {sensitivity, sensitivityY, smoothing, invertY},
  });
  latest.current = {
    onLook,
    cfg: {sensitivity, sensitivityY, smoothing, invertY},
  };

  const state = React.useRef(newLookState());
  const activeId = React.useRef<string | number | null>(null);
  const last = React.useRef({x: 0, y: 0});
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = React.useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const tick = React.useCallback(() => {
    const out = stepLook(state.current, Date.now(), latest.current.cfg);
    if (activeId.current === null && isLookIdle(state.current)) {
      state.current.outX = 0;
      state.current.outY = 0;
      latest.current.onLook(0, 0);
      stopTimer();
      return;
    }
    latest.current.onLook(out.x, out.y);
  }, [stopTimer]);

  const startTimer = React.useCallback(() => {
    if (!timer.current) {
      timer.current = setInterval(tick, TICK_MS);
    }
  }, [tick]);

  React.useEffect(
    () => () => {
      stopTimer();
      latest.current.onLook(0, 0);
    },
    [stopTimer],
  );

  const onTouchStart = (e: any) => {
    if (activeId.current !== null) {
      return;
    }
    const touch = e.nativeEvent.changedTouches[0];
    if (!touch) {
      return;
    }
    activeId.current = touch.identifier;
    last.current = {x: touch.pageX, y: touch.pageY};
    clearDeltas(state.current);
    startTimer();
  };

  const onTouchMove = (e: any) => {
    if (activeId.current === null) {
      return;
    }
    const touches = e.nativeEvent.changedTouches as any[];
    const touch = touches.find(item => item.identifier === activeId.current);
    if (!touch) {
      return;
    }
    pushDelta(
      state.current,
      Date.now(),
      touch.pageX - last.current.x,
      touch.pageY - last.current.y,
    );
    last.current = {x: touch.pageX, y: touch.pageY};
  };

  const onTouchEnd = (e: any) => {
    if (activeId.current === null) {
      return;
    }
    const touches = e.nativeEvent.changedTouches as any[];
    if (touches.some(item => item.identifier === activeId.current)) {
      activeId.current = null;
      // Jari diangkat: kamera berhenti, tidak "meluncur" terus.
      clearDeltas(state.current);
    }
  };

  return (
    <View
      collapsable={false}
      style={[styles.area, {width, height}]}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
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
