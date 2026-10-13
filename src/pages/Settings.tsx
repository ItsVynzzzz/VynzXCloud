import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  View,
  NativeModules,
  ToastAndroid,
  Platform,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import {Icon, Text, useTheme} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import Spinner from '../components/Spinner';
import {getSettings, resetSettings} from '../store/settingStore';
import SettingRow from '../components/SettingRow';
import {useSelector} from 'react-redux';
import RNRestart from 'react-native-restart';
import CookieManager from '@react-native-cookies/cookies';
import {useTranslation} from 'react-i18next';
import {useGamepadNavigation, useGamepadActiveState} from '../utils/useGamepadNavigation';
import GamepadFooterHints from '../components/GamepadFooterHints';
import {debugFactory} from '../utils/debug';
import {clearStreamToken} from '../store/streamTokenStore';
import {clearWebToken} from '../store/webTokenStore';
import {clearXcloudData} from '../store/xcloudStore';
import {clearConsolesData} from '../store/consolesStore';
import {clearServerData} from '../store/serverStore';
import {storage} from '../store/mmkv';

import bases from '../common/settings/bases';
import display from '../common/settings/display';
import gamepad from '../common/settings/gamepad';
import vgamepad from '../common/settings/vgamepad';
import audio from '../common/settings/audio';
import xcloud from '../common/settings/xcloud';
import xhome from '../common/settings/xhome';
import sensor from '../common/settings/sensor';
import server from '../common/settings/server';
import others from '../common/settings/others';

import pkg from '../../package.json';

const {UsbRumbleManager} = NativeModules;

const log = debugFactory('SettingsScreen');

type Row = {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  danger?: boolean;
  onPress: () => void;
};

type Section = {
  key: string;
  title?: string;
  rows: Row[];
};

type Category = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  sections: Section[];
};

const tierLabel = (raw: string) => {
  if (raw === 'Core') {
    return 'Essential';
  }
  if (raw === 'Standard') {
    return 'Premium';
  }
  if (raw === 'FREE' || raw === 'Free') {
    return 'Free';
  }
  return raw;
};

function SettingsScreen({navigation, route}: any) {
  const {t, i18n} = useTranslation();
  const theme = useTheme();
  const isFocused = useIsFocused();
  const authentication = useSelector((state: any) => state.authentication);
  const dark = theme.dark;

  const categoryId: string | undefined = route?.params?.category;

  const [isGamepadActive, setIsGamepadActive] = useGamepadActiveState();
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const scrollViewRef = React.useRef<ScrollView>(null);

  const currentLanguage = i18n.language;

  const [loading, setLoading] = React.useState(false);

  const sisuToken = authentication._tokenStore.getSisuToken();
  const userToken = authentication._tokenStore.getUserToken();

  let isAuthed = false;
  let user = '';

  if (sisuToken && sisuToken.data && sisuToken.data.AuthorizationToken) {
    isAuthed = true;

    if (sisuToken.data.AuthorizationToken.DisplayClaims) {
      try {
        user = sisuToken.data.AuthorizationToken.DisplayClaims.xui[0].mgt;
      } catch (e) {}
    }
  }

  if (userToken && userToken.data && userToken.data.access_token) {
    isAuthed = true;
  }

  const gamertag = storage.getString('user.gamertag') || user || '';
  const gamerpic = storage.getString('user.gamerpic') || '';
  const rawTier = storage.getString('user.account_tier') || '';

  const handleClearCache = () => {
    clearXcloudData();
    clearConsolesData();
    clearServerData();
    resetSettings();
    ToastAndroid.show(t('Success'), ToastAndroid.SHORT);
    setTimeout(() => {
      RNRestart.restart();
    }, 1000);
  };

  const handleItemPress = async (id: any) => {
    if (id === 'logout') {
      Alert.alert(t('Warning'), t('Do you want to logout?'), [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Confirm'),
          style: 'default',
          onPress: () => {
            setLoading(true);
            clearStreamToken();
            clearWebToken();
            clearXcloudData();
            clearConsolesData();
            clearServerData();
            authentication._tokenStore.clear();
            CookieManager.clearAll();
            try {
              storage.delete('user.account_tier');
              storage.delete('user.account_tier_owner');
              storage.delete('user.gamertag');
              storage.delete('user.gamerpic');
            } catch {}
            setTimeout(() => {
              RNRestart.restart();
            }, 1000);
          },
        },
      ]);
    } else if (id === 'maping') {
      const settings = getSettings();
      const hasValidUsbDevice = await UsbRumbleManager.getHasValidUsbDevice();
      const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;
      if (isUsbMode) {
        Alert.alert(
          t(
            'After replacing the Android controller driver, controller button mapping is temporarily not supported',
          ),
        );
        return;
      }
      if (settings.gamepad_kernal === 'Web') {
        navigation.navigate('GameMap');
      } else {
        navigation.navigate('NativeGameMap');
      }
    } else if (id === 'debug') {
      navigation.navigate('Debug');
    } else {
      navigation.navigate('SettingDetail', {
        id,
      });
    }
  };

  const fromMeta = (list: any[]): Row[] =>
    list.map((meta, idx) => ({
      key: meta.name || `meta_${idx}`,
      title: meta.title,
      description: meta.description,
      onPress: () => handleItemPress(meta.name),
    }));

  const openDisplay = () => {
    const settings = getSettings();
    if (settings.render_engine === 'native' || settings.render_engine === 'nano') {
      Alert.alert(t('Display settings is not working in native render engine.'));
      return;
    }
    navigation.navigate('Display');
  };

  const isChinese = currentLanguage === 'zh' || currentLanguage === 'zht';

  const categories: Category[] = [
    {
      id: 'general',
      icon: 'tune-variant',
      title: t('CatGeneral'),
      subtitle: t('CatGeneralDesc'),
      sections: [
        {
          key: 'appearance',
          title: t('BgSection'),
          rows: [
            {
              key: 'background',
              title: t('BgTitle'),
              description: t('BgDesc'),
              onPress: () => navigation.navigate('Background'),
            },
          ],
        },
        {key: 'bases', title: t('BasesSettings'), rows: fromMeta(bases)},
        {key: 'others', title: t('Others'), rows: fromMeta(others)},
      ],
    },
    {
      id: 'stream',
      icon: 'monitor',
      title: t('CatStream'),
      subtitle: t('CatStreamDesc'),
      sections: [
        {
          key: 'display',
          title: t('DisplaySettings'),
          rows: [
            ...fromMeta(display),
            {
              key: 'display_custom',
              title: t('Display'),
              description: t('Set parameters such as screen clarity and saturation'),
              onPress: openDisplay,
            },
          ],
        },
        {key: 'xcloud', title: t('XcloudSettings'), rows: fromMeta(xcloud)},
      ],
    },
    {
      id: 'audio',
      icon: 'volume-high',
      title: t('CatAudio'),
      subtitle: t('CatAudioDesc'),
      sections: [{key: 'audio', rows: fromMeta(audio)}],
    },
    {
      id: 'input',
      icon: 'gamepad-variant-outline',
      title: t('CatInput'),
      subtitle: t('CatInputDesc'),
      sections: [
        {
          key: 'gamepad',
          title: t('GamepadSettings'),
          rows: [
            ...fromMeta(gamepad),
            {
              key: 'gamepad_test',
              title: t('GamepadTestTitle'),
              description: t('GamepadTestDescription'),
              onPress: () => navigation.navigate('GamepadTest'),
            },
          ],
        },
        {
          key: 'vgamepad',
          title: t('vGamepadSettings'),
          rows: [
            ...fromMeta(vgamepad),
            {
              key: 'vgamepad_custom',
              title: t('Customize virtual buttons'),
              description: t('Customize buttons of virtual gamepad'),
              onPress: () => navigation.navigate('VirtualGamepadSettings'),
            },
            {
              key: 'vgamepad_hold',
              title: t('Auto toggle hold buttons'),
              description: t('Select what buttons become toggle holdable'),
              onPress: () => navigation.navigate('HoldButtons'),
            },
            {
              key: 'vgamepad_macro',
              title: t('Virtual macro settings'),
              description: t('Enable macro button and edit its action sequence'),
              onPress: () => navigation.navigate('VirtualMacroSettings'),
            },
          ],
        },
        {key: 'sensor', title: t('SensorSettings'), rows: fromMeta(sensor)},
        {
          key: 'dualsense',
          title: t('DualSense'),
          rows: [
            {
              key: 'ds5_left',
              title: t('DualSense_adaptive_trigger_left'),
              description: `${t('DualSense_adaptive_trigger_left_desc')}`,
              onPress: () =>
                navigation.navigate({name: 'Ds5', params: {type: 'left'}}),
            },
            {
              key: 'ds5_right',
              title: t('DualSense_adaptive_trigger_right'),
              description: `${t('DualSense_adaptive_trigger_right_desc')}`,
              onPress: () =>
                navigation.navigate({name: 'Ds5', params: {type: 'right'}}),
            },
          ],
        },
      ],
    },
    {
      id: 'advanced',
      icon: 'flask-outline',
      title: t('CatAdvanced'),
      subtitle: t('CatAdvancedDesc'),
      sections: [
        {key: 'xhome', title: t('XchomeSettings'), rows: fromMeta(xhome)},
        {
          key: 'server',
          title: t('TurnServerSettings'),
          rows: [
            ...fromMeta(server),
            {
              key: 'turn_server',
              title: t('TURN server'),
              description: t('Custom TURN server'),
              onPress: () => navigation.navigate('Server'),
            },
          ],
        },
        {
          key: 'tools',
          rows: [
            {
              key: 'clear_cache',
              title: t('Clear Cache'),
              description: t('Clear XStreaming Cache Data(Keep login data)'),
              onPress: () => handleClearCache(),
            },
            {
              key: 'transfer',
              title: t('ConfigTransfer'),
              description: t('ConfigTransferDescription'),
              onPress: () => navigation.navigate('Transfer'),
            },
            {
              key: 'device_infos',
              title: t('Device testing'),
              description: t('Testing current device and controller'),
              onPress: () => navigation.navigate('DeviceInfos'),
            },
            ...(__DEV__
              ? [
                  {
                    key: 'debug',
                    title: 'DEBUG',
                    description: 'Enter debug',
                    onPress: () => handleItemPress('debug'),
                  },
                ]
              : []),
          ],
        },
      ],
    },
    {
      id: 'about',
      icon: 'information-outline',
      title: t('About'),
      subtitle: t('CatAboutDesc'),
      sections: [
        {
          key: 'about',
          rows: [
            {
              key: 'about',
              title: t('About'),
              description: `${t('About XStreaming')}`,
              onPress: () => navigation.navigate(isChinese ? 'AboutZh' : 'About'),
            },
            ...(isChinese
              ? [
                  {
                    key: 'feedback',
                    title: '支持及交流',
                    description: '支持开发或交流使用心得',
                    onPress: () => navigation.navigate('Feedback'),
                  },
                ]
              : []),
            {
              key: 'history',
              title: t('HistoryTitle'),
              description: `${t('HistoryDesc')}`,
              onPress: () => navigation.navigate('History'),
            },
            {
              key: 'thanks',
              title: t('Thanks'),
              onPress: () => navigation.navigate('Thanks'),
            },
          ],
        },
      ],
    },
  ];

  const activeCategory = categories.find(c => c.id === categoryId);
  const trimmedQuery = query.trim().toLowerCase();

  // Hasil pencarian lintas kategori
  const searchRows: Row[] = React.useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    const result: Row[] = [];
    categories.forEach(cat => {
      cat.sections.forEach(section => {
        section.rows.forEach(row => {
          const haystack = `${row.title} ${row.description || ''}`.toLowerCase();
          if (haystack.includes(trimmedQuery)) {
            result.push({
              ...row,
              key: `${cat.id}_${section.key}_${row.key}`,
              description: row.description
                ? `${cat.title} · ${row.description}`
                : cat.title,
            });
          }
        });
      });
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, currentLanguage, navigation]);

  const logoutRow: Row | null = isAuthed
    ? {
        key: 'logout',
        title: t('Logout'),
        description: gamertag ? `${t('Current user')}: ${gamertag}` : undefined,
        icon: 'logout',
        danger: true,
        onPress: () => handleItemPress('logout'),
      }
    : null;

  const categoryRows: Row[] = categories.map(cat => ({
    key: cat.id,
    title: cat.title,
    description: cat.subtitle,
    icon: cat.icon,
    onPress: () => navigation.push('Settings', {category: cat.id}),
  }));

  // Daftar baris yang bisa difokuskan (untuk gamepad/TV), urutannya sama dengan tampilan
  let flatRows: Row[] = [];
  if (activeCategory) {
    flatRows = activeCategory.sections.flatMap(s => s.rows);
  } else if (trimmedQuery) {
    flatRows = searchRows;
  } else {
    flatRows = logoutRow ? [...categoryRows, logoutRow] : categoryRows;
  }

  React.useEffect(() => {
    if (activeCategory) {
      navigation.setOptions({title: activeCategory.title});
    }
  }, [navigation, activeCategory?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setFocusedIndex(0);
  }, [trimmedQuery, categoryId]);

  useGamepadNavigation({
    enabled: isFocused,
    onUp: () => {
      setFocusedIndex(prev => Math.max(0, prev - 1));
    },
    onDown: () => {
      setFocusedIndex(prev => Math.min(flatRows.length - 1, prev + 1));
    },
    onSelect: () => {
      if (flatRows[focusedIndex]) {
        flatRows[focusedIndex].onPress();
      }
    },
    onBack: () => {
      navigation.goBack();
    },
  });

  const itemLayouts = React.useRef<
    Record<number, {y: number; height: number; card: string}>
  >({});
  const cardOffsets = React.useRef<Record<string, number>>({});
  const scrollViewHeight = React.useRef<number>(0);

  const scrollToFocused = React.useCallback((index: number) => {
    const layout = itemLayouts.current[index];
    if (layout && scrollViewRef.current) {
      const viewH = scrollViewHeight.current || 600;
      const absoluteY = (cardOffsets.current[layout.card] || 0) + layout.y;
      const targetY = Math.max(0, absoluteY - (viewH - layout.height) / 2);
      scrollViewRef.current.scrollTo({y: targetY, animated: true});
    }
  }, []);

  React.useEffect(() => {
    if (isGamepadActive || Platform.isTV) {
      scrollToFocused(focusedIndex);
    }
  }, [focusedIndex, isGamepadActive, scrollToFocused]);

  React.useEffect(() => {
    log.info('settings page show');
  }, [navigation]);

  const cardStyle = {
    backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
    borderColor: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
  };
  const mutedColor = theme.colors.onSurfaceVariant;

  let rowCounter = 0;
  const renderCard = (cardKey: string, rows: Row[]) => (
    <View
      key={cardKey}
      style={[styles.card, cardStyle]}
      onLayout={e => {
        cardOffsets.current[cardKey] = e.nativeEvent.layout.y;
      }}>
      {rows.map((row, i) => {
        const index = rowCounter++;
        const focused =
          (isGamepadActive || Platform.isTV) && focusedIndex === index;
        return (
          <View
            key={row.key}
            onLayout={e => {
              const l = e.nativeEvent.layout;
              itemLayouts.current[index] = {
                y: l.y,
                height: l.height,
                card: cardKey,
              };
              if (focused) {
                scrollToFocused(index);
              }
            }}>
            <SettingRow
              title={row.title}
              description={row.description}
              icon={row.icon}
              danger={row.danger}
              isFocused={focused}
              isLast={i === rows.length - 1}
              onPress={row.onPress}
            />
          </View>
        );
      })}
    </View>
  );

  const renderSearchBox = () => (
    <View
      style={[
        styles.searchBox,
        {
          backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
          borderColor: dark
            ? 'rgba(255, 255, 255, 0.22)'
            : 'rgba(0, 0, 0, 0.1)',
        },
      ]}>
      <Icon source="magnify" size={20} color={mutedColor} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('SettingsSearch')}
        placeholderTextColor={mutedColor}
        style={[styles.searchInput, {color: theme.colors.onSurface}]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {query.length > 0 ? (
        <Pressable
          onPress={() => setQuery('')}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Icon source="close-circle" size={18} color={mutedColor} />
        </Pressable>
      ) : null}
    </View>
  );

  const renderProfile = () => (
    <View style={[styles.profileCard, cardStyle]}>
      {gamerpic ? (
        <Image
          source={{uri: gamerpic}}
          style={[
            styles.avatar,
            {borderColor: dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.12)'},
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarFallback,
            {
              backgroundColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              borderColor: dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.12)',
            },
          ]}>
          <Text style={[styles.avatarInitial, {color: theme.colors.onSurface}]}>
            {(gamertag || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.profileInfo}>
        <Text
          style={[styles.profileName, {color: theme.colors.onSurface}]}
          numberOfLines={1}>
          {isAuthed ? gamertag || t('Current user') : t('NoLogin')}
        </Text>
        {isAuthed && rawTier ? (
          <Text style={[styles.profileTier, {color: mutedColor}]} numberOfLines={1}>
            {tierLabel(rawTier)}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const renderBody = () => {
    if (activeCategory) {
      const nodes: React.ReactNode[] = [];
      activeCategory.sections.forEach(section => {
        if (section.title) {
          nodes.push(
            <Text
              key={`${section.key}_title`}
              style={[styles.sectionHeading, {color: mutedColor}]}>
              {section.title}
            </Text>,
          );
        }
        nodes.push(renderCard(section.key, section.rows));
      });
      return nodes;
    }

    if (trimmedQuery) {
      return searchRows.length > 0 ? (
        renderCard('search', searchRows)
      ) : (
        <Text style={[styles.empty, {color: mutedColor}]}>
          {t('SettingsNoResult')}
        </Text>
      );
    }

    return (
      <>
        {renderProfile()}
        {renderCard('categories', categoryRows)}
        {logoutRow ? renderCard('logout', [logoutRow]) : null}
        <View style={styles.version}>
          <Text style={[styles.versionText, {color: mutedColor}]}>
            {t('Version')}: v{pkg.version}
          </Text>
          <Text style={[styles.versionText, {color: mutedColor}]}>
            © 2024-{new Date().getFullYear()} Geocld
          </Text>
        </View>
      </>
    );
  };

  return (
    <View
      style={styles.container}
      onTouchStart={() => {
        if (!Platform.isTV) {
          setIsGamepadActive(false);
        }
      }}>
      <Spinner loading={loading} text={t('Loading...')} />

      <ScrollView
        ref={scrollViewRef}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        onLayout={e => {
          scrollViewHeight.current = e.nativeEvent.layout.height;
        }}
        contentContainerStyle={[
          styles.content,
          {paddingBottom: isGamepadActive || Platform.isTV ? 160 : 32},
        ]}>
        {!activeCategory ? renderSearchBox() : null}
        {renderBody()}
      </ScrollView>

      <GamepadFooterHints
        visible={isGamepadActive || Platform.isTV}
        hints={[
          {button: 'A', label: t('Select')},
          {button: 'B', label: t('Back')},
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileTier: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 4,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 8,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 48,
    fontSize: 14,
  },
  version: {
    paddingTop: 14,
    paddingBottom: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12.5,
    paddingTop: 4,
  },
});

export default SettingsScreen;
