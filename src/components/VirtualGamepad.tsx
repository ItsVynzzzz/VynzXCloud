import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import AnalogStick from '../components/AnalogStick';
import ButtonView from './ButtonView';
import DPadView from './DPadView';
import GamepadButton from './GamepadButton';
import {getSettings} from '../store/settingStore';
import {VIRTUAL_MACRO_BUTTON_NAME} from '../utils/virtualMacro';

type Props = {
  opacity: number;
  onPressIn: (name: string | string[]) => any;
  onPressOut: (name: string | string[]) => any;
  onStickMove: (id: string, position: any) => any;
};

const VirtualGamepad: React.FC<Props> = ({
  opacity = 0.7,
  onPressIn,
  onPressOut,
  onStickMove,
}) => {
  const settings = getSettings();

  const handlePressIn = (name: string | string[]) => {
    onPressIn && onPressIn(name);
  };

  const handlePressOut = (name: string | string[]) => {
    onPressOut && onPressOut(name);
  };

  const handleStickMove = (id: string, data: any) => {
    onStickMove && onStickMove(id, data);
  };

  const {width, height} = Dimensions.get('window');

  const nexusLeft = width * 0.5 - 20;
  const viewLeft = width * 0.5 - 100;
  const menuLeft = width * 0.5 + 60;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <ButtonView
        style={[styles.button, styles.lt, {opacity}]}
        buttonName="control_button_lt"
        onPressIn={() => handlePressIn('LeftTrigger')}
        onPressOut={() => handlePressOut('LeftTrigger')}
      />

      <ButtonView
        style={[styles.button, styles.rt, {opacity}]}
        buttonName="control_button_rt"
        onPressIn={() => handlePressIn('RightTrigger')}
        onPressOut={() => handlePressOut('RightTrigger')}
      />

      <ButtonView
        style={[styles.button, styles.lb, {opacity}]}
        buttonName="control_button_lb"
        onPressIn={() => handlePressIn('LeftShoulder')}
        onPressOut={() => handlePressOut('LeftShoulder')}
      />

      <ButtonView
        style={[styles.button, styles.rb, {opacity}]}
        buttonName="control_button_rb"
        onPressIn={() => handlePressIn('RightShoulder')}
        onPressOut={() => handlePressOut('RightShoulder')}
      />

      <ButtonView
        style={[styles.button, styles.a, {opacity}]}
        buttonName="control_button_a"
        onPressIn={() => handlePressIn('A')}
        onPressOut={() => handlePressOut('A')}
      />

      <ButtonView
        style={[styles.button, styles.b, {opacity}]}
        buttonName="control_button_b"
        onPressIn={() => handlePressIn('B')}
        onPressOut={() => handlePressOut('B')}
      />

      <ButtonView
        style={[styles.button, styles.x, {opacity}]}
        buttonName="control_button_x"
        onPressIn={() => handlePressIn('X')}
        onPressOut={() => handlePressOut('X')}
      />

      <ButtonView
        style={[styles.button, styles.y, {opacity}]}
        buttonName="control_button_y"
        onPressIn={() => handlePressIn('Y')}
        onPressOut={() => handlePressOut('Y')}
      />

      <ButtonView
        style={[
          styles.button,
          styles.l3,
          {opacity},
        ]}
        buttonName="control_button_left_joystick_down"
        onPressIn={() => handlePressIn('LeftThumb')}
        onPressOut={() => handlePressOut('LeftThumb')}
      />

      <ButtonView
        style={[
          styles.button,
          styles.r3,
          {opacity},
        ]}
        buttonName="control_button_right_joystick_down"
        onPressIn={() => handlePressIn('RightThumb')}
        onPressOut={() => handlePressOut('RightThumb')}
      />

      <ButtonView
        style={[styles.button, styles.view, {opacity}]}
        buttonName="control_button_view"
        onPressIn={() => handlePressIn('View')}
        onPressOut={() => handlePressOut('View')}
      />

      <ButtonView
        style={[styles.button, styles.nexus, {opacity}]}
        buttonName="control_button_xbox"
        onPressIn={() => handlePressIn('Nexus')}
        onPressOut={() => handlePressOut('Nexus')}
      />

      <ButtonView
        style={[styles.button, styles.menu, {opacity}]}
        buttonName="control_button_menu"
        onPressIn={() => handlePressIn('Menu')}
        onPressOut={() => handlePressOut('Menu')}
      />

      <DPadView
        style={[styles.dpad, {opacity}]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />

      {settings.virtual_macro_enabled && (
        <GamepadButton
          name={VIRTUAL_MACRO_BUTTON_NAME}
          style={[styles.button, styles.macro, {opacity}]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        />
      )}

      {settings.virtual_gamepad_joystick === 1 ? (
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 9,
            opacity,
            width: width * 0.5,
            height: height,
          }}>
          <AnalogStick
            style={{
              width: width * 0.5,
              height: height,
            }}
            radius={80}
            handleRadius={50}
            homeX={0.6}
            homeY={0.77}
            onStickChange={(data: any) => handleStickMove('left', data)}
          />
        </View>
      ) : null}

      {settings.virtual_gamepad_joystick === 1 ? (
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 9,
            opacity,
            width: width * 0.5,
            height: height,
          }}>
          <AnalogStick
            style={{
              width: width * 0.5,
              height: height,
            }}
            radius={80}
            handleRadius={50}
            homeX={0.36}
            homeY={0.775}
            onStickChange={(data: any) => handleStickMove('right', data)}
          />
        </View>
      ) : null}

      {settings.virtual_gamepad_joystick === 0 ? (
        <View style={[styles.button, styles.leftJs, {opacity}]}>
          <AnalogStick
            style={styles.analogStick}
            radius={140}
            handleRadius={80}
            onStickChange={(data: any) => handleStickMove('left', data)}
          />
        </View>
      ) : null}

      {settings.virtual_gamepad_joystick === 0 ? (
        <View style={[styles.button, styles.rightJs, {opacity}]}>
          <AnalogStick
            style={styles.analogStick}
            radius={150}
            handleRadius={100}
            onStickChange={(data: any) => handleStickMove('right', data)}
          />
        </View>
      ) : null}
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
    width: 50,
    height: 50,
    opacity: 0.6,
    position: 'absolute',
    zIndex: 10,
  },
  lt: {
    width: 80,
    height: 50,
    left: '9.2%',
    top: 8,
  },
  rt: {
    width: 80,
    height: 50,
    right: '9.4%',
    top: 9,
  },
  lb: {
    width: 80,
    height: 50,
    left: '21%',
    top: 15,
  },
  rb: {
    width: 80,
    height: 50,
    right: '21.1%',
    top: 23,
  },
  a: {
    width: 54,
    height: 54,
    right: 112,
    bottom: 120,
  },
  b: {
    width: 54,
    height: 54,
    right: 64,
    bottom: 168,
  },
  x: {
    width: 54,
    height: 54,
    right: 160,
    bottom: 168,
  },
  y: {
    width: 54,
    height: 54,
    right: 112,
    bottom: 216,
  },
  l3: {
    left: '28.9%',
    top: 69,
  },
  r3: {
    right: '27.7%',
    top: 69,
  },
  view: {
    width: 40,
    height: 40,
    left: '50%',
    marginLeft: -42,
    bottom: 28,
  },
  nexus: {
    width: 44,
    height: 44,
    left: '50%',
    marginLeft: -22,
    bottom: 70,
  },
  menu: {
    width: 40,
    height: 40,
    left: '50%',
    marginLeft: 2,
    bottom: 28,
  },
  leftJs: {
    left: '22.6%',
    bottom: 23,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  rightJs: {
    right: '24.7%',
    bottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  dpad: {
    position: 'absolute',
    width: 140,
    height: 140,
    left: '9%',
    top: '28.7%',
    zIndex: 10,
  },
  macro: {
    width: 60,
    height: 60,
    left: '50%',
    marginLeft: -30,
    bottom: 120,
  },
  analogStick: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
});

export default VirtualGamepad;
