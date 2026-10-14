import React from 'react';
import {View} from 'react-native';
import ButtonView from '../ButtonView';
import {SvgXml} from 'react-native-svg';
import {useTheme} from 'react-native-paper';
import icons from '../../common/virtualgp';
import {skinButtonName} from '../../utils/gamepadSkin';
import {VIRTUAL_MACRO_BUTTON_NAME} from '../../utils/virtualMacro';
import {colorizeMacroIconXml, normalizeHexColor} from '../../utils/themeColor';

const mapping: any = {
  LeftTrigger: 'control_button_lt',
  RightTrigger: 'control_button_rt',
  LeftShoulder: 'control_button_lb',
  RightShoulder: 'control_button_rb',
  A: 'control_button_a',
  B: 'control_button_b',
  X: 'control_button_x',
  Y: 'control_button_y',
  LeftThumb: 'control_button_left_joystick_down',
  RightThumb: 'control_button_right_joystick_down',
  View: 'control_button_view',
  Nexus: 'control_button_xbox',
  Menu: 'control_button_menu',
  DPadUp: 'control_button_up',
  DPadLeft: 'control_button_left',
  DPadDown: 'control_button_down',
  DPadRight: 'control_button_right',
};

type Props = {
  name: string;
  width: number;
  height: number;
  scale: number;
  style?: any;
};

const GamepadButton: React.FC<Props> = ({
  name,
  width = 50,
  height = 50,
  scale = 1,
  style,
}) => {
  const theme = useTheme();
  const primaryColor = normalizeHexColor(theme.colors.primary);
  if (['A', 'B', 'X', 'Y'].indexOf(name) > -1) {
    width = 60;
    height = 60;
  }
  if (name === VIRTUAL_MACRO_BUTTON_NAME) {
    width = 60;
    height = 60;
  }
  if (
    ['LeftTrigger', 'RightTrigger', 'LeftShoulder', 'RightShoulder'].indexOf(
      name,
    ) > -1
  ) {
    width = 80;
    height = 50;
  }
  if (name === 'View' || name === 'Menu') {
    width = 40;
    height = 40;
  }
  if (name === 'Nexus') {
    width = 44;
    height = 44;
  }

  if (mapping[name]) {
    return (
      <View style={style} pointerEvents="none">
        <ButtonView
          buttonName={skinButtonName(name, mapping[name])}
          style={{width: width * scale, height: height * scale}}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <SvgXml
        xml={
          name === VIRTUAL_MACRO_BUTTON_NAME
            ? colorizeMacroIconXml(icons[name], primaryColor)
            : icons[name]
        }
        width={width * scale}
        height={height * scale}
      />
    </View>
  );
};

export default GamepadButton;
