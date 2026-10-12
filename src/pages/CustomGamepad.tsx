import React from 'react';
import Orientation from 'react-native-orientation-locker';
import {
  SafeAreaView,
  StyleSheet,
  NativeModules,
  Dimensions,
  View,
} from 'react-native';
import {
  Portal,
  Modal,
  Card,
  List,
  RadioButton,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Draggable from 'react-native-draggable';
import Slider from '@react-native-community/slider';
import GamepadButton from '../components/CustomGamepad/Button';
import GridBackground from '../components/GridBackground';
import {getSettings, saveSettings, deleteSetting} from '../store/gamepadStore';
import {
  getSettings as getUserSettings,
  saveSettings as saveUserSettings,
} from '../store/settingStore';
import {
  createDefaultMacroLayoutButton,
  ensureMacroLayoutButton,
} from '../utils/virtualMacro';
import {useGamepadNavigation} from '../utils/useGamepadNavigation';
import DPadView from '../components/DPadView';
import {
  createDefaultVirtualDPadButton,
  ensureVirtualDPadLayoutButton,
} from '../utils/virtualDPad';
import {defaultLayoutButtons} from '../utils/defaultLayout';

const {FullScreenManager} = NativeModules;

function CustomGamepadScreen({navigation, route}) {
  const {t} = useTranslation();
  const theme = useTheme();
  const [settings, setSettings] = React.useState({});
  const [title, setTitle] = React.useState('');
  const [buttons, setButtons] = React.useState<any>([]);
  const [showActionModal, setActionShowModal] = React.useState(false);
  const [showWarnModal, setShowWarnShowModal] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(false);
  const [reloader, setReloader] = React.useState(Date.now());

  const [currentButton, setCurrentButton] = React.useState('');
  const [currentScale, setCurrentScale] = React.useState(1);
  const [currentShow, setCurrentShow] = React.useState(true);

  useGamepadNavigation({
    priority: 15,
    onBack: () => {
      if (showModal) {
        setShowModal(false);
      } else if (showActionModal) {
        setActionShowModal(false);
      } else if (showWarnModal) {
        setShowWarnShowModal(false);
      } else {
        navigation.goBack();
      }
    },
  });

  React.useEffect(() => {
    const _settings = getSettings();
    let _title = '';
    setSettings(_settings);

    if (route.params?.name) {
      _title = route.params?.name;
      setTitle(route.params?.name);
    }

    // console.log('_settings:', _settings);
    FullScreenManager.immersiveModeOn();
    Orientation.lockToLandscape();
    const timer = setTimeout(() => {
      const {width, height} = Dimensions.get('window');

      const nexusLeft = width * 0.5 - 20;
      const viewLeft = width * 0.5 - 100;
      const menuLeft = width * 0.5 + 60;
      const macroDefaultButton = createDefaultMacroLayoutButton(width, height);

      const _buttons = defaultLayoutButtons(width, height, macroDefaultButton);
      if (_settings[_title]) {
        const exitButtons = _settings[_title];
        setButtons(
          ensureVirtualDPadLayoutButton(
            ensureMacroLayoutButton(exitButtons, macroDefaultButton),
            createDefaultVirtualDPadButton(15, height - 175, 160, 160),
          ),
        );
      } else {
        setButtons(_buttons);
      }
      setShowWarnShowModal(true);
      setShowGrid(true);
    }, 500);

    navigation.addListener('beforeRemove', e => {
      if (e.data.action.type !== 'GO_BACK') {
        navigation.dispatch(e.data.action);
      } else {
        e.preventDefault();
        setActionShowModal(true);
      }
    });

    return () => {
      Orientation.unlockAllOrientations();
      FullScreenManager.immersiveModeOff();
    };
  }, [navigation, route.params?.name]);

  const ABXY = ['A', 'B', 'X', 'Y'];
  const isAbxy = name => name === 'ABXY';

  // Button drag (ABXY digeser sebagai satu kelompok)
  const handleDrag = (name, x, y) => {
    if (isAbxy(name)) {
      const group = buttons.filter(b => ABXY.includes(b.name));
      const dx = Math.round(x) - Math.min(...group.map(b => b.x));
      const dy = Math.round(y) - Math.min(...group.map(b => b.y));
      group.forEach(b => {
        b.x += dx;
        b.y += dy;
      });
    } else {
      buttons.forEach(b => {
        if (b.name === name) {
          b.x = Math.round(x);
          b.y = Math.round(y);
        }
      });
    }
    setButtons([...buttons]);
  };

  // Button size change
  const handleChangeSize = scale => {
    if (isAbxy(currentButton)) {
      const group = buttons.filter(b => ABXY.includes(b.name));
      const oldScale = group[0].scale || 1;
      const cx =
        group.reduce((sum, b) => sum + b.x + 30 * (b.scale || 1), 0) /
        group.length;
      const cy =
        group.reduce((sum, b) => sum + b.y + 30 * (b.scale || 1), 0) /
        group.length;
      group.forEach(b => {
        const bs = b.scale || 1;
        const nx = cx + (b.x + 30 * bs - cx) * (scale / oldScale);
        const ny = cy + (b.y + 30 * bs - cy) * (scale / oldScale);
        b.scale = scale;
        b.x = Math.round(nx - 30 * scale);
        b.y = Math.round(ny - 30 * scale);
      });
    } else {
      buttons.forEach(b => {
        if (b.name === currentButton) {
          b.scale = scale;
        }
      });
    }
    setButtons([...buttons]);
  };

  // Button show change
  const handleChangeShow = value => {
    setCurrentShow(value);
    buttons.forEach(b => {
      if (
        b.name === currentButton ||
        (isAbxy(currentButton) && ABXY.includes(b.name))
      ) {
        b.show = value;
      }
    });
    setButtons([...buttons]);
  };

  const renderAbxyGroup = () => {
    const group = buttons.filter(b => ABXY.includes(b.name));
    if (group.length < 4 || !group[0].show) {
      return null;
    }
    const minX = Math.min(...group.map(b => b.x));
    const minY = Math.min(...group.map(b => b.y));
    const maxX = Math.max(...group.map(b => b.x + 60 * (b.scale || 1)));
    const maxY = Math.max(...group.map(b => b.y + 60 * (b.scale || 1)));
    return (
      <Draggable
        x={minX}
        y={minY}
        key={'ABXY' + reloader}
        onShortPressRelease={() => {
          setCurrentButton('ABXY');
          setCurrentScale(group[0].scale || 1);
          setCurrentShow(true);
          setShowModal(true);
        }}
        onDragRelease={(_, __, bounds) => {
          handleDrag('ABXY', bounds.left, bounds.top);
          setReloader(Date.now());
        }}>
        <View style={{width: maxX - minX, height: maxY - minY}}>
          {group.map(b => (
            <View
              key={b.name}
              style={{position: 'absolute', left: b.x - minX, top: b.y - minY}}>
              <GamepadButton
                name={b.name}
                width={60}
                height={60}
                scale={b.scale}
              />
            </View>
          ))}
        </View>
      </Draggable>
    );
  };

  const background = {
    borderless: false,
    color: 'rgba(255, 255, 255, 0.2)',
    foreground: true,
  };

  const handleSave = () => {
    // console.log('buttons:', buttons);
    saveSettings(title, buttons);
    navigation.navigate('Settings');
  };

  const handleReset = () => {
    const {width, height} = Dimensions.get('window');

    const nexusLeft = width * 0.5 - 20;
    const viewLeft = width * 0.5 - 100;
    const menuLeft = width * 0.5 + 60;
    const macroDefaultButton = createDefaultMacroLayoutButton(width, height);

    const _buttons = defaultLayoutButtons(width, height, macroDefaultButton);
    setButtons([..._buttons]);
  };

  const handleDelete = () => {
    const userSettings = getUserSettings();
    if (userSettings.custom_virtual_gamepad === title) {
      userSettings.custom_virtual_gamepad = '';
      saveUserSettings(userSettings);
    }
    deleteSetting(title);
    navigation.navigate('Settings');
  };

  const renderWarningModal = () => {
    return (
      <Portal>
        <Modal
          visible={showWarnModal}
          onDismiss={() => setShowWarnShowModal(false)}
          contentContainerStyle={styles.modal}>
          <Card>
            <Card.Content>
              <Text>
                TIPS1:{' '}
                {t(
                  'The position of custom virtual buttons may have discrepancies with actual rendering. Please refer to the actual effect for accuracy',
                )}
              </Text>
              <Text>
                TIPS2: {t('Click on an element to set its size and display')}
              </Text>
              <Text>TIPS3: {t('Drag elements to adjust their position')}</Text>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderWarningModal()}

      {showGrid && <GridBackground gridSize={20} />}

      <Portal>
        <Modal
          visible={showActionModal}
          onDismiss={() => setActionShowModal(false)}
          contentContainerStyle={styles.modal}>
          <Card>
            <Card.Content>
              <List.Section>
                <List.Item
                  title={t('Save')}
                  background={background}
                  onPress={() => handleSave()}
                />
                <List.Item
                  title={t('Reset')}
                  background={background}
                  onPress={() => handleReset()}
                />
                {settings[title] && (
                  <List.Item
                    title={t('Delete')}
                    background={background}
                    onPress={() => handleDelete()}
                  />
                )}
                <List.Item
                  title={t('Exit')}
                  background={background}
                  onPress={() => navigation.navigate('VirtualGamepadSettings')}
                />
              </List.Section>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => {
            setShowModal(false);
          }}
          contentContainerStyle={styles.modal}>
          <Card>
            <Card.Content>
              {currentButton !== 'LeftStick' &&
                currentButton !== 'RightStick' && (
                  <>
                    <View style={styles.title}>
                      <Text>
                        {t('Size')}: {currentScale}
                      </Text>
                      <Divider style={styles.divider} />
                    </View>
                    <Slider
                      value={currentScale}
                      minimumValue={0.5}
                      maximumValue={4}
                      step={0.1}
                      onValueChange={val => {
                        const _val = Math.round(val * 10) / 10;
                        setCurrentScale(_val);
                        handleChangeSize(_val);
                      }}
                      lowerLimit={0.5}
                      minimumTrackTintColor={theme.colors.primary}
                      maximumTrackTintColor="grey"
                    />
                  </>
                )}

              <View style={styles.title}>
                <Text>{t('ShowTitle')}</Text>
                <Divider style={styles.divider} />
              </View>
              <RadioButton.Group
                onValueChange={val => handleChangeShow(val === 'true')}
                value={currentShow ? 'true' : 'false'}>
                <RadioButton.Item label={t('Show')} value={'true'} />
                <RadioButton.Item label={t('Hide')} value={'false'} />
              </RadioButton.Group>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      <>
        {buttons.map(button => {
          if (ABXY.includes(button.name)) {
            return null;
          }
          if (button.name === 'DPad') {
            if (!button.show) {
              return null;
            }
            const dw = (button.width ?? 160) * (button.scale ?? 1);
            const dh = (button.height ?? 160) * (button.scale ?? 1);
            return (
              <Draggable
                x={button.x}
                y={button.y}
                key={button.name + reloader}
                onShortPressRelease={() => {
                  setCurrentButton(button.name);
                  setCurrentScale(button.scale || 1);
                  setCurrentShow(button.show || true);
                  setShowModal(true);
                }}
                onDragRelease={(_, __, bounds) => {
                  handleDrag(button.name, bounds.left, bounds.top);
                  setReloader(Date.now());
                }}>
                <DPadView style={{width: dw, height: dh}} pointerEvents="none" />
              </Draggable>
            );
          }
          if (button.name === 'LeftStick' || button.name === 'RightStick') {
            if (!button.show) {
              return null;
            }
            return (
              <Draggable
                x={button.x}
                y={button.y}
                key={button.name + reloader}
                renderSize={120}
                renderColor="white"
                isCircle
                onShortPressRelease={() => {
                  setCurrentButton(button.name);
                  setCurrentScale(1);
                  setCurrentShow(button.show || true);
                  setShowModal(true);
                }}
                onDragRelease={(_, __, bounds) => {
                  handleDrag(button.name, bounds.left, bounds.top);
                  setReloader(Date.now());
                }}
              />
            );
          } else {
            if (!button.show) {
              return null;
            }
            return (
              <Draggable
                x={button.x}
                y={button.y}
                key={button.name + reloader}
                onShortPressRelease={() => {
                  setCurrentButton(button.name);
                  setCurrentScale(button.scale || 1);
                  setCurrentShow(button.show || true);
                  setShowModal(true);
                }}
                onDragRelease={(_, __, bounds) => {
                  handleDrag(button.name, bounds.left, bounds.top);
                  setReloader(Date.now());
                }}>
                <GamepadButton
                  name={button.name}
                  width={button.width}
                  height={button.height}
                  scale={button.scale}
                />
              </Draggable>
            );
          }
        })}
        {renderAbxyGroup()}
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    marginLeft: '35%',
    marginRight: '35%',
  },
  title: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  divider: {
    marginTop: 10,
  },
});

export default CustomGamepadScreen;
