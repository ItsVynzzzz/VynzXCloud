import React from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Icon, Portal, Text} from 'react-native-paper';
import GridBackground from './GridBackground';
import GamepadButton from './CustomGamepad/Button';
import {getSettings as getGamepadLayouts} from '../store/gamepadStore';
import {
  VIRTUAL_MACRO_BUTTON_NAME,
  createDefaultMacroLayoutButton,
  ensureMacroLayoutButton,
} from '../utils/virtualMacro';
import {
  VIRTUAL_DPAD_BUTTON_NAME,
  createDefaultVirtualDPadButton,
  ensureVirtualDPadLayoutButton,
} from '../utils/virtualDPad';

export type ButtonConfig = {
  name: string;
  x: number;
  y: number;
  scale?: number;
  show?: boolean;
  width?: number;
  height?: number;
};

export interface VirtualGamepadEditorProps {
  visible: boolean;
  profileName: string;
  onSave: (buttons: ButtonConfig[]) => void;
  onCancel: () => void;
}

const GRID = 10;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

const LABELS: Record<string, string> = {
  LeftTrigger: 'LT',
  RightTrigger: 'RT',
  LeftShoulder: 'LB',
  RightShoulder: 'RB',
  A: 'A',
  B: 'B',
  X: 'X',
  Y: 'Y',
  LeftThumb: 'L3',
  RightThumb: 'R3',
  View: 'View',
  Menu: 'Menu',
  Nexus: 'Xbox',
  DPad: 'D-Pad',
  LeftStick: 'Stick L',
  RightStick: 'Stick R',
  [VIRTUAL_MACRO_BUTTON_NAME]: 'Macro',
};

const isStick = (name: string) => name === 'LeftStick' || name === 'RightStick';

// Ukuran dasar tiap elemen, sama dengan yang digambar saat bermain.
const baseSize = (button: ButtonConfig) => {
  const name = button.name;
  if (name === VIRTUAL_DPAD_BUTTON_NAME) {
    return {w: button.width ?? 160, h: button.height ?? 160};
  }
  if (isStick(name)) {
    return {w: 120, h: 120};
  }
  if (['A', 'B', 'X', 'Y', VIRTUAL_MACRO_BUTTON_NAME].includes(name)) {
    return {w: 60, h: 60};
  }
  if (
    ['LeftTrigger', 'RightTrigger', 'LeftShoulder', 'RightShoulder'].includes(
      name,
    )
  ) {
    return {w: 80, h: 50};
  }
  if (name === 'View' || name === 'Menu') {
    return {w: 40, h: 40};
  }
  if (name === 'Nexus') {
    return {w: 44, h: 44};
  }
  return {w: 50, h: 50};
};

const sizeOf = (button: ButtonConfig) => {
  const base = baseSize(button);
  const scale = isStick(button.name) ? 1 : button.scale ?? 1;
  return {w: base.w * scale, h: base.h * scale};
};

const buildDefaultButtons = (): ButtonConfig[] => {
  const {width, height} = Dimensions.get('window');
  const nexusLeft = width * 0.5 - 20;
  const viewLeft = width * 0.5 - 100;
  const menuLeft = width * 0.5 + 60;
  const dpadSize = 160;

  return [
    {name: 'LeftTrigger', x: 30, y: 40, scale: 1, show: true},
    {name: 'RightTrigger', x: width - 40, y: 40, scale: 1, show: true},
    {name: 'LeftShoulder', x: 30, y: 100, scale: 1, show: true},
    {name: 'RightShoulder', x: width - 40, y: 100, scale: 1, show: true},
    {name: 'A', x: width - 90, y: height - 60, scale: 1, show: true},
    {name: 'B', x: width - 40, y: height - 110, scale: 1, show: true},
    {name: 'X', x: width - 140, y: height - 110, scale: 1, show: true},
    {name: 'Y', x: width - 90, y: height - 160, scale: 1, show: true},
    {name: 'LeftThumb', x: 225, y: height - 80, scale: 1, show: true},
    {name: 'RightThumb', x: width - 235, y: height - 70, scale: 1, show: true},
    {name: 'View', x: viewLeft, y: height - 30, scale: 1, show: true},
    {name: 'Nexus', x: nexusLeft, y: height - 30, scale: 1, show: true},
    {name: 'Menu', x: menuLeft, y: height - 30, scale: 1, show: true},
    createDefaultVirtualDPadButton(15, height - dpadSize - 15, dpadSize, dpadSize),
    {name: 'LeftStick', x: 175, y: height - 205, show: true},
    {name: 'RightStick', x: width - 265, y: height - 195, show: true},
    createDefaultMacroLayoutButton(width, height),
  ];
};

type ItemProps = {
  button: ButtonConfig;
  selected: boolean;
  snap: boolean;
  bounds: {w: number; h: number};
  onSelect: (name: string) => void;
  onMoveEnd: (name: string, x: number, y: number) => void;
};

// Satu elemen yang bisa digeser. Posisi dihitung di sini (tanpa render ulang
// saat menggeser), jadi geserannya mulus dan tidak berkedip.
const EditorItem = React.memo(
  ({button, selected, snap, bounds, onSelect, onMoveEnd}: ItemProps) => {
    const {w, h} = sizeOf(button);
    const hidden = button.show === false;
    const round = isStick(button.name);

    const pan = React.useRef(
      new Animated.ValueXY({x: button.x, y: button.y}),
    ).current;
    const latest = React.useRef({button, w, h, snap, bounds, onSelect, onMoveEnd});
    latest.current = {button, w, h, snap, bounds, onSelect, onMoveEnd};
    const start = React.useRef({x: button.x, y: button.y});

    React.useEffect(() => {
      pan.setValue({x: button.x, y: button.y});
    }, [button.x, button.y, pan]);

    const responder = React.useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const cur = latest.current;
          start.current = {x: cur.button.x, y: cur.button.y};
          cur.onSelect(cur.button.name);
        },
        onPanResponderMove: (_e, g) => {
          pan.setValue({x: start.current.x + g.dx, y: start.current.y + g.dy});
        },
        onPanResponderRelease: (_e, g) => finish(g.dx, g.dy),
        onPanResponderTerminate: (_e, g) => finish(g.dx, g.dy),
      }),
    ).current;

    function finish(dx: number, dy: number) {
      const cur = latest.current;
      // Ketukan singkat = hanya memilih, jangan geser/rapikan posisinya.
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        pan.setValue(start.current);
        return;
      }
      const toGrid = (v: number) =>
        cur.snap ? Math.round(v / GRID) * GRID : Math.round(v);
      const maxX = Math.max(0, cur.bounds.w - cur.w);
      const maxY = Math.max(0, cur.bounds.h - cur.h);
      const nx = Math.min(maxX, Math.max(0, toGrid(start.current.x + dx)));
      const ny = Math.min(maxY, Math.max(0, toGrid(start.current.y + dy)));
      pan.setValue({x: nx, y: ny});
      cur.onMoveEnd(cur.button.name, nx, ny);
    }

    const ringRadius = round ? w / 2 + 5 : 16;

    return (
      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.item,
          {
            width: w,
            height: h,
            zIndex: selected ? 20 : 1,
            opacity: hidden ? 0.4 : 1,
            transform: pan.getTranslateTransform(),
          },
        ]}>
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            selected
              ? styles.ringSelected
              : hidden
                ? styles.ringHidden
                : styles.ringIdle,
            {borderRadius: ringRadius},
          ]}
        />
        <View pointerEvents="none" style={styles.preview}>
          {round ? (
            <View
              style={[
                styles.stick,
                {width: w, height: h, borderRadius: w / 2},
              ]}>
              <View style={styles.stickInner} />
              <Text style={styles.stickText}>{LABELS[button.name]}</Text>
            </View>
          ) : (
            <GamepadButton
              name={button.name}
              width={button.width ?? 50}
              height={button.height ?? 50}
              scale={button.scale ?? 1}
            />
          )}
        </View>
      </Animated.View>
    );
  },
);

type ChipProps = {
  label: string;
  onPress: () => void;
  active?: boolean;
  primary?: boolean;
  icon?: string;
};

const Chip = ({label, onPress, active, primary, icon}: ChipProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={({pressed}) => [
      styles.chip,
      active && styles.chipActive,
      primary && styles.chipPrimary,
      pressed && !primary && styles.chipPressed,
    ]}>
    {icon ? (
      <Icon
        source={icon}
        size={16}
        color={primary ? '#000000' : '#FFFFFF'}
      />
    ) : null}
    <Text
      style={[
        styles.chipText,
        primary && {color: '#000000'},
        icon ? {marginLeft: 6} : null,
      ]}>
      {label}
    </Text>
  </Pressable>
);

const VirtualGamepadEditor: React.FC<VirtualGamepadEditorProps> = ({
  visible,
  profileName,
  onSave,
  onCancel,
}) => {
  const {t} = useTranslation();
  const [buttons, setButtons] = React.useState<ButtonConfig[]>([]);
  const [initial, setInitial] = React.useState('[]');
  const [defaults, setDefaults] = React.useState<ButtonConfig[]>([]);
  const [selected, setSelected] = React.useState('');
  const [snap, setSnap] = React.useState(true);
  const [bounds, setBounds] = React.useState(() => {
    const {width, height} = Dimensions.get('window');
    return {w: width, h: height};
  });

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    const {width, height} = Dimensions.get('window');
    setBounds({w: width, h: height});
    const defaultList = buildDefaultButtons();
    setDefaults(defaultList);
    const layout = getGamepadLayouts()[profileName];
    let loaded: ButtonConfig[];
    if (layout && Array.isArray(layout)) {
      const withDPad = ensureVirtualDPadLayoutButton(
        layout,
        createDefaultVirtualDPadButton(15, height - 175, 160, 160),
      );
      loaded = ensureMacroLayoutButton(
        withDPad,
        createDefaultMacroLayoutButton(width, height),
      ).map((button: ButtonConfig) => ({...button}));
    } else {
      loaded = defaultList.map(button => ({...button}));
    }
    setButtons(loaded);
    setInitial(JSON.stringify(loaded));
    setSelected('');
    setSnap(true);
  }, [visible, profileName]);

  const dirty = JSON.stringify(buttons) !== initial;

  const requestCancel = React.useCallback(() => {
    if (!dirty) {
      onCancel();
      return;
    }
    Alert.alert(t('Warning'), t('EdDiscard'), [
      {text: t('Cancel'), style: 'cancel'},
      {text: t('Confirm'), style: 'destructive', onPress: onCancel},
    ]);
  }, [dirty, onCancel, t]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestCancel();
      return true;
    });
    return () => sub.remove();
  }, [visible, requestCancel]);

  const handleMoveEnd = React.useCallback(
    (name: string, x: number, y: number) => {
      setButtons(prev =>
        prev.map(button => (button.name === name ? {...button, x, y} : button)),
      );
    },
    [],
  );

  const current = buttons.find(button => button.name === selected);

  const changeScale = (delta: number) => {
    if (!current) {
      return;
    }
    const next = Math.round(((current.scale ?? 1) + delta) * 10) / 10;
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    setButtons(prev =>
      prev.map(button =>
        button.name === current.name ? {...button, scale: clamped} : button,
      ),
    );
  };

  const toggleShow = () => {
    if (!current) {
      return;
    }
    setButtons(prev =>
      prev.map(button =>
        button.name === current.name
          ? {...button, show: button.show === false}
          : button,
      ),
    );
  };

  const handleReset = () => {
    Alert.alert(t('Warning'), t('EdResetConfirm'), [
      {text: t('Cancel'), style: 'cancel'},
      {
        text: t('Confirm'),
        style: 'destructive',
        onPress: () => {
          setButtons(defaults.map(button => ({...button})));
          setSelected('');
        },
      },
    ]);
  };

  const handleSave = () => {
    onSave(
      buttons.map(button => ({
        ...button,
        x: Math.round(button.x),
        y: Math.round(button.y),
      })),
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <View style={styles.root}>
        {snap ? (
          <GridBackground
            gridSize={20}
            gridColor="rgba(255, 255, 255, 0.07)"
          />
        ) : null}

        {buttons.map(button => (
          <EditorItem
            key={button.name}
            button={button}
            selected={button.name === selected}
            snap={snap}
            bounds={bounds}
            onSelect={setSelected}
            onMoveEnd={handleMoveEnd}
          />
        ))}

        <View pointerEvents="box-none" style={styles.topWrap}>
          <View style={styles.bar}>
            <View style={styles.titleBox}>
              <Text style={styles.title}>{t('EdTitle')}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {profileName}
              </Text>
            </View>
            <Chip
              label={t('EdGrid')}
              icon="grid"
              active={snap}
              onPress={() => setSnap(v => !v)}
            />
            <Chip label={t('Reset')} icon="restore" onPress={handleReset} />
            <Chip label={t('Cancel')} onPress={requestCancel} />
            <Chip label={t('Save')} primary onPress={handleSave} />
          </View>

          <View style={styles.dock}>
            {current ? (
              <>
                <View style={styles.nameTag}>
                  <Text style={styles.nameText}>
                    {LABELS[current.name] || current.name}
                  </Text>
                </View>

                {isStick(current.name) ? (
                  <Text style={styles.fixedText}>{t('EdSizeFixed')}</Text>
                ) : (
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => changeScale(-SCALE_STEP)}
                      accessibilityLabel={t('Size')}
                      style={styles.stepBtn}>
                      <Icon source="minus" size={20} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.stepValue}>
                      {(current.scale ?? 1).toFixed(1)}×
                    </Text>
                    <Pressable
                      onPress={() => changeScale(SCALE_STEP)}
                      accessibilityLabel={t('Size')}
                      style={styles.stepBtn}>
                      <Icon source="plus" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                )}

                <Pressable onPress={toggleShow} style={styles.eyeBtn}>
                  <Icon
                    source={
                      current.show === false ? 'eye-off-outline' : 'eye-outline'
                    }
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.eyeText}>
                    {current.show === false ? t('Show') : t('Hide')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.hint}>{t('EdHint')}</Text>
            )}
          </View>
        </View>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  item: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ringSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ringHidden: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  ringIdle: {},
  stick: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickInner: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  stickText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  topWrap: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 28,
    backgroundColor: 'rgba(14, 14, 14, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  titleBox: {
    paddingHorizontal: 12,
    maxWidth: 150,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
  },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  chipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: '#FFFFFF',
  },
  chipPrimary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  dock: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 14, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 10,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12.5,
    paddingHorizontal: 12,
  },
  nameTag: {
    height: 30,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  stepValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 54,
    textAlign: 'center',
  },
  fixedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12.5,
  },
  eyeBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  eyeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default VirtualGamepadEditor;
