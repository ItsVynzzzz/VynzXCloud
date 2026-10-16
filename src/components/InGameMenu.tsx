import React from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import {Icon, Text} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {getSettings as getGamepadLayouts} from '../store/gamepadStore';
import {useGamepadNavigation} from '../utils/useGamepadNavigation';
import {LAYOUT_MODES, modeFromProfile} from '../utils/layoutPresets';

type Props = {
  visible: boolean;
  connected: boolean;
  isCloud: boolean;
  showVirtualGamepad: boolean;
  showPerformance: boolean;
  micAvailable: boolean;
  micOn: boolean;
  audioGain: number;
  opacity: number;
  vs: {
    buttonScale: number;
    stickScale: number;
    deadzone: number;
    sensLeft: number;
    sensRight: number;
  };
  look: {
    enabled: boolean;
    sens: number;
    sensY: number;
    smooth: number;
    deadzone: number;
    invertY: boolean;
  };
  joystick: number;
  macroEnabled: boolean;
  profile: string;
  canPowerOff: boolean;
  onClose: () => void;
  onToggleGamepad: () => void;
  onTogglePerformance: () => void;
  onToggleMic: () => void;
  onNexus: () => void;
  onNexusHold: () => void;
  onSendText: () => void;
  onAudioGain: (value: number) => void;
  onChangeSetting: (partial: Record<string, any>) => void;
  skin: string;
  onApplyMode: (mode: string) => void;
  onResetMode: () => void;
  onEditLayout: () => void;
  onSaveExit: () => void;
  onDisconnect: () => void;
  onDisconnectPowerOff: () => void;
};

type Ctl = {
  onPress?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
};

const WHITE = '#FFFFFF';
const MUTED = 'rgba(255, 255, 255, 0.62)';
const LINE = 'rgba(255, 255, 255, 0.16)';
const FILL = 'rgba(255, 255, 255, 0.06)';
const FILL_ON = 'rgba(255, 255, 255, 0.18)';

const MODE_LABEL: Record<string, string> = {
  normal: 'ModeNormal',
  playstation: 'ModePlayStation',
  fps: 'ModeFPS',
  racing: 'ModeRacing',
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const InGameMenu = (props: Props) => {
  const {visible, onClose} = props;
  const {t} = useTranslation();
  const {width, height} = useWindowDimensions();

  const [page, setPage] = React.useState<'main' | 'controls'>('main');
  const [focusIndex, setFocusIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const contentRef = React.useRef<View>(null);
  const itemRefs = React.useRef<Record<number, View | null>>({});
  const scrollOnFocus = React.useRef(false);
  const ctlsRef = React.useRef<Ctl[]>([]);
  const closingRef = React.useRef(false);

  const slide = React.useRef(new Animated.Value(0)).current;

  const panelW = Math.min(380, Math.round(width * 0.52));
  const panelH = Math.max(220, height - 24);

  React.useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setPage('main');
      setFocusIndex(0);
      slide.setValue(0);
      Animated.timing(slide, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide]);

  const requestClose = React.useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    Animated.timing(slide, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, slide]);

  const goBackOrClose = React.useCallback(() => {
    if (page === 'controls') {
      setPage('main');
      setFocusIndex(0);
    } else {
      requestClose();
    }
  }, [page, requestClose]);

  // Tombol back HP: kembali satu halaman, lalu tutup menu.
  React.useEffect(() => {
    if (!visible) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBackOrClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, goBackOrClose]);

  useGamepadNavigation({
    enabled: visible,
    onUp: () => {
      scrollOnFocus.current = true;
      setFocusIndex(i => Math.max(0, i - 1));
    },
    onDown: () => {
      scrollOnFocus.current = true;
      setFocusIndex(i => Math.min(ctlsRef.current.length - 1, i + 1));
    },
    onLeft: () => ctlsRef.current[focusIndex]?.onLeft?.(),
    onRight: () => ctlsRef.current[focusIndex]?.onRight?.(),
    onSelect: () => ctlsRef.current[focusIndex]?.onPress?.(),
    onBack: goBackOrClose,
  });

  React.useEffect(() => {
    if (!scrollOnFocus.current) {
      return;
    }
    scrollOnFocus.current = false;
    const node = itemRefs.current[focusIndex];
    const parent = findNodeHandle(contentRef.current);
    if (node && parent) {
      node.measureLayout(
        parent,
        (_x, y, _w, h) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - (panelH - 120 - h) / 2),
            animated: true,
          });
        },
        () => {},
      );
    }
  }, [focusIndex, panelH]);

  const profiles = React.useMemo(() => {
    if (!visible) {
      return [] as string[];
    }
    try {
      return Object.keys(getGamepadLayouts() || {});
    } catch {
      return [] as string[];
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  // ---- daftar kontrol yang bisa difokuskan (gamepad/TV), sesuai urutan tampilan ----
  const ctls: Ctl[] = [];
  const reg = (ctl: Ctl) => {
    ctls.push(ctl);
    return ctls.length - 1;
  };
  ctlsRef.current = ctls;
  const setRef = (index: number) => (el: View | null) => {
    itemRefs.current[index] = el;
  };

  const tile = (
    key: string,
    icon: string,
    label: string,
    onPress: () => void,
    active = false,
  ) => {
    const index = reg({onPress});
    const focused = focusIndex === index;
    return (
      <View key={key} ref={setRef(index)} collapsable={false} style={styles.tileCell}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({pressed}) => [
            styles.tile,
            active && styles.tileOn,
            pressed && styles.pressed,
            focused && styles.focused,
          ]}>
          <Icon source={icon} size={22} color={WHITE} />
          <Text style={styles.tileLabel} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      </View>
    );
  };

  const row = (
    key: string,
    icon: string,
    label: string,
    onPress: () => void,
    opts: {desc?: string; danger?: boolean; chevron?: boolean} = {},
  ) => {
    const index = reg({onPress});
    const focused = focusIndex === index;
    const color = opts.danger ? '#FF6B6B' : WHITE;
    return (
      <View key={key} ref={setRef(index)} collapsable={false}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({pressed}) => [
            styles.row,
            pressed && styles.pressed,
            focused && styles.focused,
          ]}>
          <View style={styles.rowIcon}>
            <Icon source={icon} size={20} color={color} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, {color}]} numberOfLines={2}>
              {label}
            </Text>
            {opts.desc ? (
              <Text style={styles.rowDesc} numberOfLines={2}>
                {opts.desc}
              </Text>
            ) : null}
          </View>
          {opts.chevron ? (
            <Icon source="chevron-right" size={20} color={MUTED} />
          ) : null}
        </Pressable>
      </View>
    );
  };

  const toggleRow = (
    key: string,
    label: string,
    on: boolean,
    onPress: () => void,
  ) => {
    const index = reg({onPress, onLeft: on ? onPress : undefined, onRight: on ? undefined : onPress});
    const focused = focusIndex === index;
    return (
      <View key={key} ref={setRef(index)} collapsable={false}>
        <Pressable
          onPress={onPress}
          accessibilityRole="switch"
          accessibilityState={{checked: on}}
          style={({pressed}) => [
            styles.row,
            pressed && styles.pressed,
            focused && styles.focused,
          ]}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{label}</Text>
          </View>
          <View style={[styles.switchTrack, on && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, on && styles.switchThumbOn]} />
          </View>
        </Pressable>
      </View>
    );
  };

  const stepper = (
    key: string,
    label: string,
    valueText: string,
    onMinus: () => void,
    onPlus: () => void,
  ) => {
    const index = reg({onLeft: onMinus, onRight: onPlus});
    const focused = focusIndex === index;
    return (
      <View key={key} ref={setRef(index)} collapsable={false}>
        <View style={[styles.row, focused && styles.focused]}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{label}</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable onPress={onMinus} style={styles.stepBtn} hitSlop={6}>
              <Icon source="minus" size={18} color={WHITE} />
            </Pressable>
            <Text style={styles.stepValue}>{valueText}</Text>
            <Pressable onPress={onPlus} style={styles.stepBtn} hitSlop={6}>
              <Icon source="plus" size={18} color={WHITE} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const segment = (
    key: string,
    label: string,
    options: Array<{value: any; text: string}>,
    value: any,
    onChange: (value: any) => void,
  ) => {
    const at = Math.max(0, options.findIndex(o => o.value === value));
    const index = reg({
      onLeft: () => onChange(options[Math.max(0, at - 1)].value),
      onRight: () => onChange(options[Math.min(options.length - 1, at + 1)].value),
    });
    const focused = focusIndex === index;
    return (
      <View key={key} ref={setRef(index)} collapsable={false}>
        <View style={[styles.segmentBlock, focused && styles.focused]}>
          <Text style={styles.rowLabel}>{label}</Text>
          <View style={styles.segmentWrap}>
            {options.map(option => {
              const on = option.value === value;
              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => onChange(option.value)}
                  style={[styles.segment, on && styles.segmentOn]}>
                  <Text
                    style={[styles.segmentText, on && styles.segmentTextOn]}
                    numberOfLines={1}>
                    {option.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const section = (key: string, title: string) => (
    <Text key={key} style={styles.section}>
      {title}
    </Text>
  );

  // ---- halaman ----
  const body: React.ReactNode[] = [];

  if (page === 'main') {
    if (props.connected) {
      body.push(section('s_quick', t('IgmQuick')));
      const tiles: React.ReactNode[] = [
        tile('t_pad', 'gamepad-variant-outline', t('IgmGamepad'), props.onToggleGamepad, props.showVirtualGamepad),
        tile('t_perf', 'speedometer', t('IgmPerf'), props.onTogglePerformance, props.showPerformance),
      ];
      if (props.micAvailable) {
        tiles.push(
          tile('t_mic', props.micOn ? 'microphone' : 'microphone-off', t('IgmMic'), props.onToggleMic, props.micOn),
        );
      }
      tiles.push(tile('t_xbox', 'microsoft-xbox', t('IgmXbox'), props.onNexus));
      if (!props.isCloud) {
        tiles.push(tile('t_xbox_hold', 'microsoft-xbox', t('IgmXboxHold'), props.onNexusHold));
        tiles.push(tile('t_text', 'keyboard-outline', t('Send text'), props.onSendText));
      }
      body.push(
        <View key="grid" style={styles.grid}>
          {tiles}
        </View>,
      );

      body.push(section('s_sound', t('IgmSound')));
      body.push(
        stepper(
          'volume',
          t('Volume'),
          `${Math.round(props.audioGain * 100)}%`,
          () => props.onAudioGain(props.audioGain - 1),
          () => props.onAudioGain(props.audioGain + 1),
        ),
      );

      body.push(section('s_controls', t('IgmControls')));
      body.push(
        row('controls', 'tune-variant', t('IgmControls'), () => {
          setPage('controls');
          setFocusIndex(0);
        }, {desc: t('IgmControlsDesc'), chevron: true}),
      );
    }

    body.push(section('s_exit', t('IgmExit')));
    if (props.connected && props.isCloud) {
      body.push(
        row('save_exit', 'content-save-outline', t('Save session & disconnect'), props.onSaveExit),
      );
    }
    if (props.connected && props.canPowerOff) {
      body.push(
        row('power_off', 'power', t('Disconnect and power off'), props.onDisconnectPowerOff),
      );
    }
    body.push(
      row('disconnect', 'logout', t('Disconnect'), props.onDisconnect, {danger: true}),
    );
  } else {
    const vs = props.vs;
    const adjust = (
      key: string,
      current: number,
      delta: number,
      min: number,
      max: number,
    ) => {
      const next = clamp(Math.round((current + delta) * 100) / 100, min, max);
      props.onChangeSetting({[key]: next});
    };
    const pct = (value: number) => `${Math.round(value * 100)}%`;
    const mult = (value: number) => `${value.toFixed(1)}\u00d7`;

    body.push(section('s_display', t('IgmSectionDisplay')));
    body.push(
      toggleRow('show_pad', t('IgmShowPad'), props.showVirtualGamepad, props.onToggleGamepad),
    );
    body.push(
      stepper(
        'opacity',
        t('IgmOpacity'),
        pct(props.opacity),
        () => adjust('virtual_gamepad_opacity', props.opacity, -0.1, 0.1, 1),
        () => adjust('virtual_gamepad_opacity', props.opacity, 0.1, 0.1, 1),
      ),
    );
    body.push(
      stepper(
        'button_scale',
        t('VButtonScale'),
        pct(vs.buttonScale),
        () => adjust('virtual_button_scale', vs.buttonScale, -0.1, 0.6, 1.6),
        () => adjust('virtual_button_scale', vs.buttonScale, 0.1, 0.6, 1.6),
      ),
    );

    body.push(section('s_stick', t('IgmSectionStick')));
    body.push(
      segment(
        'joystick',
        t('IgmJoystick'),
        [
          {value: 1, text: t('Free')},
          {value: 2, text: t('JoystickJump')},
          {value: 0, text: t('Fixed')},
        ],
        props.joystick,
        value => props.onChangeSetting({virtual_gamepad_joystick: value}),
      ),
    );
    body.push(
      stepper(
        'stick_scale',
        t('VStickScale'),
        pct(vs.stickScale),
        () => adjust('virtual_stick_scale', vs.stickScale, -0.1, 0.6, 1.6),
        () => adjust('virtual_stick_scale', vs.stickScale, 0.1, 0.6, 1.6),
      ),
    );
    body.push(
      stepper(
        'deadzone',
        t('VDeadzone'),
        pct(vs.deadzone),
        () => adjust('virtual_stick_deadzone', vs.deadzone, -0.05, 0, 0.4),
        () => adjust('virtual_stick_deadzone', vs.deadzone, 0.05, 0, 0.4),
      ),
    );
    body.push(
      stepper(
        'sens_left',
        t('VSensLeft'),
        mult(vs.sensLeft),
        () => adjust('virtual_stick_sens_left', vs.sensLeft, -0.1, 0.5, 2),
        () => adjust('virtual_stick_sens_left', vs.sensLeft, 0.1, 0.5, 2),
      ),
    );
    body.push(
      stepper(
        'sens_right',
        t('VSensRight'),
        mult(vs.sensRight),
        () => adjust('virtual_stick_sens_right', vs.sensRight, -0.1, 0.5, 2),
        () => adjust('virtual_stick_sens_right', vs.sensRight, 0.1, 0.5, 2),
      ),
    );

    body.push(section('s_look', t('IgmSectionLook')));
    body.push(
      toggleRow('touch_look', t('IgmTouchLook'), props.look.enabled, () =>
        props.onChangeSetting({virtual_touch_look: !props.look.enabled}),
      ),
    );
    body.push(
      stepper(
        'look_sens',
        t('IgmLookSens'),
        mult(props.look.sens),
        () => adjust('virtual_look_speed', props.look.sens, -0.1, 0.5, 4),
        () => adjust('virtual_look_speed', props.look.sens, 0.1, 0.5, 4),
      ),
    );
    body.push(
      stepper(
        'look_sens_y',
        t('IgmLookSensY'),
        mult(props.look.sensY),
        () => adjust('virtual_look_sens_y', props.look.sensY, -0.1, 0.5, 1.5),
        () => adjust('virtual_look_sens_y', props.look.sensY, 0.1, 0.5, 1.5),
      ),
    );
    body.push(
      stepper(
        'look_smooth',
        t('IgmLookSmooth'),
        pct(props.look.smooth),
        () => adjust('virtual_look_smooth', props.look.smooth, -0.1, 0, 0.8),
        () => adjust('virtual_look_smooth', props.look.smooth, 0.1, 0, 0.8),
      ),
    );
    body.push(
      stepper(
        'look_deadzone',
        t('IgmLookDeadzone'),
        pct(props.look.deadzone),
        () => adjust('virtual_look_deadzone', props.look.deadzone, -0.05, 0, 0.5),
        () => adjust('virtual_look_deadzone', props.look.deadzone, 0.05, 0, 0.5),
      ),
    );
    body.push(
      toggleRow('look_invert', t('IgmLookInvert'), props.look.invertY, () =>
        props.onChangeSetting({virtual_look_invert_y: !props.look.invertY}),
      ),
    );

    body.push(section('s_layout', t('IgmSectionLayout')));
    body.push(
      segment(
        'mode',
        t('IgmMode'),
        LAYOUT_MODES.map(mode => ({value: mode, text: t(MODE_LABEL[mode])})),
        modeFromProfile(props.profile) || '',
        value => props.onApplyMode(value),
      ),
    );
    body.push(
      segment(
        'skin',
        t('IgmSkin'),
        [
          {value: 'xbox', text: 'Xbox'},
          {value: 'ps', text: 'PlayStation'},
        ],
        props.skin,
        value => props.onChangeSetting({virtual_gamepad_skin: value}),
      ),
    );
    body.push(
      toggleRow('macro', t('IgmMacro'), props.macroEnabled, () =>
        props.onChangeSetting({virtual_macro_enabled: !props.macroEnabled}),
      ),
    );
    body.push(
      segment(
        'profile',
        t('IgmProfile'),
        [
          {value: '', text: t('IgmProfileClassic')},
          ...profiles
            .filter(name => !modeFromProfile(name))
            .map(name => ({
            value: name,
            text: name === 'LiveLayout' ? t('IgmProfileMain') : name,
          })),
        ],
        props.profile,
        value => props.onChangeSetting({custom_virtual_gamepad: value}),
      ),
    );
    body.push(
      row('edit_layout', 'cursor-move', t('IgmEditLayout'), props.onEditLayout, {
        desc: t('IgmEditLayoutDesc'),
        chevron: true,
      }),
    );
    if (modeFromProfile(props.profile)) {
      body.push(
        row('reset_mode', 'restore', t('IgmResetMode'), props.onResetMode, {
          desc: t('IgmResetModeDesc'),
        }),
      );
    }
    body.push(
      row(
        'reset_controls',
        'restore',
        t('IgmResetControls'),
        () =>
          props.onChangeSetting({
            virtual_button_scale: 1,
            virtual_stick_scale: 1,
            virtual_stick_deadzone: 0.1,
            virtual_stick_sens_left: 1,
            virtual_stick_sens_right: 1,
            virtual_look_speed: 1.5,
            virtual_look_sens_y: 1,
            virtual_look_smooth: 0.1,
            virtual_look_deadzone: 0.25,
            virtual_look_invert_y: false,
          }),
        {desc: t('IgmResetControlsDesc')},
      ),
    );
  }

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [panelW + 24, 0],
  });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, {opacity: slide}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {width: panelW, height: panelH, transform: [{translateX}]},
        ]}>
        <View style={styles.header}>
          {page === 'controls' ? (
            <Pressable
              onPress={goBackOrClose}
              accessibilityLabel={t('Back')}
              style={styles.headBtn}>
              <Icon source="chevron-left" size={22} color={WHITE} />
            </Pressable>
          ) : null}
          <View style={styles.headText}>
            <Text style={styles.headTitle} numberOfLines={1}>
              {page === 'controls' ? t('IgmControls') : t('IgmTitle')}
            </Text>
            {page === 'main' ? (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: props.connected ? '#4ADE80' : '#FBBF24'},
                  ]}
                />
                <Text style={styles.statusText}>
                  {props.connected ? t('IgmConnected') : t('IgmConnecting')}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={requestClose}
            accessibilityLabel={t('Cancel')}
            style={styles.headBtn}>
            <Icon source="close" size={20} color={WHITE} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View ref={contentRef} collapsable={false}>
            {body}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    elevation: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  panel: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(12, 12, 12, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LINE,
  },
  headText: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headTitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: MUTED,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  section: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tileCell: {
    width: '50%',
    padding: 4,
  },
  tile: {
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FILL,
    borderWidth: 1,
    borderColor: LINE,
  },
  tileOn: {
    backgroundColor: FILL_ON,
    borderColor: WHITE,
  },
  tileLabel: {
    color: WHITE,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 5,
    paddingHorizontal: 6,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  focused: {
    borderColor: WHITE,
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: FILL,
    borderWidth: 1,
    borderColor: LINE,
  },
  rowIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    color: WHITE,
    fontSize: 14.5,
    fontWeight: '600',
  },
  rowDesc: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: LINE,
  },
  switchTrackOn: {
    backgroundColor: WHITE,
    borderColor: WHITE,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  switchThumbOn: {
    backgroundColor: '#000000',
    transform: [{translateX: 18}],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  stepValue: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
  segmentBlock: {
    padding: 12,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: FILL,
    borderWidth: 1,
    borderColor: LINE,
  },
  segmentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  segment: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  segmentOn: {
    backgroundColor: WHITE,
    borderColor: WHITE,
  },
  segmentText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextOn: {
    color: '#000000',
  },
});

export default InGameMenu;
