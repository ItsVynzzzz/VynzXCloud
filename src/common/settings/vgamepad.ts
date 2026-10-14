import i18next from '../../i18n';

const {t} = i18next;

const vgamepad = [
  {
    name: 'show_virtual_gamead',
    type: 'radio',
    title: t('Virtual gamepad'),
    description: t('Always display the virtual gamepad'),
    data: [
      {value: false, text: t('Disable')},
      {value: true, text: t('Enable')},
    ],
  },
  {
    name: 'virtual_gamepad_opacity',
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.1,
    title: t('Virtual Opacity'),
    description: t('Config opacity of virtual gamepad'),
    data: [],
  },
  {
    name: 'virtual_button_scale',
    type: 'slider',
    min: 0.6,
    max: 1.6,
    step: 0.1,
    title: t('VButtonScale'),
    description: t('VButtonScaleDesc'),
    data: [],
  },
  {
    name: 'virtual_stick_scale',
    type: 'slider',
    min: 0.6,
    max: 1.6,
    step: 0.1,
    title: t('VStickScale'),
    description: t('VStickScaleDesc'),
    data: [],
  },
  {
    name: 'virtual_stick_deadzone',
    type: 'slider',
    min: 0,
    max: 0.4,
    step: 0.05,
    title: t('VDeadzone'),
    description: t('VDeadzoneDesc'),
    data: [],
  },
  {
    name: 'virtual_stick_sens_left',
    type: 'slider',
    min: 0.5,
    max: 2,
    step: 0.1,
    title: t('VSensLeft'),
    description: t('VSensDesc'),
    data: [],
  },
  {
    name: 'virtual_stick_sens_right',
    type: 'slider',
    min: 0.5,
    max: 2,
    step: 0.1,
    title: t('VSensRight'),
    description: t('VSensDesc'),
    data: [],
  },
  {
    name: 'virtual_gamepad_joystick',
    type: 'radio',
    title: t('virtual_joystick_title'),
    description: t('virtual_joystick_desc'),
    tips: t('virtual_joystick_tips'),
    data: [
      {value: 1, text: t('Free')},
      {value: 2, text: t('JoystickJump')},
      {value: 0, text: t('Fixed')},
    ],
  },
  {
    name: 'virtual_gamepad_skin',
    type: 'radio',
    title: t('VSkin'),
    description: t('VSkinDesc'),
    data: [
      {value: 'xbox', text: 'Xbox'},
      {value: 'ps', text: 'PlayStation'},
    ],
  },
];

export default vgamepad;
