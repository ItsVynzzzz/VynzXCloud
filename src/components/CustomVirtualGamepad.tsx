import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import GamepadButton from './CustomGamepad/GamepadButton';
import DPadView from './DPadView';
import AnalogStick from '../components/AnalogStick';
import {getSettings as getLocalSettings} from '../store/settingStore';
import {getSettings} from '../store/gamepadStore';
import {
  createDefaultMacroLayoutButton,
  ensureMacroLayoutButton,
  VIRTUAL_MACRO_BUTTON_NAME,
} from '../utils/virtualMacro';
import {defaultLayoutButtons} from '../utils/defaultLayout';
import {
  createDefaultVirtualDPadButton,
  ensureVirtualDPadLayoutButton,
} from '../utils/virtualDPad';

type Props = {
  title: string;
  opacity: number;
  onPressIn: (name: string | string[]) => any;
  onPressOut: (name: string | string[]) => any;
  onStickMove: (id: string, position: any) => any;
  refreshKey?: number;
};

const CustomVirtualGamepad: React.FC<Props> = ({
  title,
  opacity = 0.7,
  onPressIn,
  onPressOut,
  onStickMove,
  refreshKey = 0,
}) => {
  const [buttons, setButtons] = React.useState<any>([]);
  const localSettings = getLocalSettings();

  const {width: clientW, height: clientH} = Dimensions.get('window');
  const buttonScale = localSettings.virtual_button_scale ?? 1;
  const stickScaleBase = localSettings.virtual_stick_scale ?? 1;
  const deadZone = localSettings.virtual_stick_deadzone ?? 0.1;
  const scaleStyle = {transform: [{scale: buttonScale}]};

  React.useEffect(() => {
    const _settings = getSettings();
    const {width, height} = Dimensions.get('window');

    const nexusLeft = width * 0.5 - 20;
    const viewLeft = width * 0.5 - 100;
    const menuLeft = width * 0.5 + 60;
    const dpadDefaultButton = createDefaultVirtualDPadButton(15, height - 175, 160, 160);

    const macroDefaultButton = createDefaultMacroLayoutButton(width, height);
    const _buttons = defaultLayoutButtons(width, height, macroDefaultButton);
    if (_settings[title]) {
      const exitButtons = _settings[title];
      setButtons(
        ensureVirtualDPadLayoutButton(
          ensureMacroLayoutButton(exitButtons, macroDefaultButton),
          dpadDefaultButton,
        ),
      );
    } else {
      setButtons(_buttons);
    }
  }, [title, refreshKey]);

  const handlePressIn = (name: string | string[]) => {
    onPressIn && onPressIn(name);
  };

  const handlePressOut = (name: string | string[]) => {
    onPressOut && onPressOut(name);
  };

  const handleStickMove = (id: string, data: any) => {
    onStickMove && onStickMove(id, data);
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {buttons.map((button: any) => {
        if (!button.show) {
          return null;
        }
        if (
          button.name === VIRTUAL_MACRO_BUTTON_NAME &&
          !localSettings.virtual_macro_enabled
        ) {
          return null;
        }
        if (button.name === 'DPad') {
          const width = (button.width ?? 160) * (button.scale ?? 1);
          const height = (button.height ?? 160) * (button.scale ?? 1);
          return (
            <DPadView
              key={button.name}
              style={[
                styles.button,
                {top: button.y, left: button.x, width, height},
                {opacity},
                scaleStyle,
              ]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
          );
        }
        if (button.name === 'LeftStick') {
          const stickScale = stickScaleBase * (button.scale ?? 1);
          if (
            localSettings.virtual_gamepad_joystick === 1 ||
            localSettings.virtual_gamepad_joystick === 2
          ) {
            return (
              <View
                key={button.name}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  zIndex: 9,
                  opacity,
                  width: clientW * 0.5,
                  height: clientH,
                }}>
                <AnalogStick
                  style={{
                    width: clientW * 0.5,
                    height: clientH,
                  }}
                  radius={90 * stickScale}
                  handleRadius={48 * stickScale}
                  followFinger={localSettings.virtual_gamepad_joystick !== 2}
                  deadZone={deadZone}
                  homeX={Math.min(
                    Math.max((button.x + 60) / (clientW * 0.5), 0.05),
                    0.95,
                  )}
                  homeY={Math.min(Math.max((button.y + 60) / clientH, 0.05), 0.95)}
                  onStickChange={(data: any) => handleStickMove('left', data)}
                />
              </View>
            );
          } else {
            return (
              <View
                key={button.name}
                style={[
                  styles.button,
                  {top: button.y, left: button.x},
                  {opacity},
                  {transform: [{scale: stickScale}]},
                ]}>
                <View style={styles.leftJs}>
                  <AnalogStick
                    style={styles.analogStick}
                    radius={140}
                    handleRadius={80}
                    deadZone={deadZone}
                    onStickChange={(data: any) => handleStickMove('left', data)}
                  />
                </View>
              </View>
            );
          }
        } else if (button.name === 'RightStick') {
          const stickScale = stickScaleBase * (button.scale ?? 1);
          if (
            localSettings.virtual_gamepad_joystick === 1 ||
            localSettings.virtual_gamepad_joystick === 2
          ) {
            return (
              <View
                key={button.name}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  zIndex: 9,
                  opacity,
                  width: clientW * 0.5,
                  height: clientH,
                }}>
                <AnalogStick
                  style={{
                    width: clientW * 0.5,
                    height: clientH,
                  }}
                  radius={90 * stickScale}
                  handleRadius={48 * stickScale}
                  followFinger={localSettings.virtual_gamepad_joystick !== 2}
                  deadZone={deadZone}
                  homeX={Math.min(
                    Math.max(
                      (button.x + 60 - clientW * 0.5) / (clientW * 0.5),
                      0.05,
                    ),
                    0.95,
                  )}
                  homeY={Math.min(Math.max((button.y + 60) / clientH, 0.05), 0.95)}
                  onStickChange={(data: any) => handleStickMove('right', data)}
                />
              </View>
            );
          } else {
            return (
              <View
                key={button.name}
                style={[
                  styles.button,
                  {top: button.y, left: button.x},
                  {opacity},
                  {transform: [{scale: stickScale}]},
                ]}>
                <View style={styles.rightJs}>
                  <AnalogStick
                    style={styles.analogStick}
                    radius={140}
                    handleRadius={80}
                    deadZone={deadZone}
                    onStickChange={(data: any) =>
                      handleStickMove('right', data)
                    }
                  />
                </View>
              </View>
            );
          }
        } else {
          return (
            <GamepadButton
              key={button.name}
              name={button.name}
              scale={button.scale}
              style={[
                styles.button,
                {opacity},
                {top: button.y, left: button.x},
                scaleStyle,
              ]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
          );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    // backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 9,
  },
  button: {
    opacity: 0.5,
    position: 'absolute',
    zIndex: 10,
  },
  leftJs: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  rightJs: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  analogStick: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, .5)',
    overflow: 'hidden',
  },
});

export default CustomVirtualGamepad;
