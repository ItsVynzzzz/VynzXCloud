import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {Icon, Text, useTheme} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import {useMMKVNumber, useMMKVString} from 'react-native-mmkv';
import {useTranslation} from 'react-i18next';
import {storage} from '../store/mmkv';
import {useGamepadNavigation} from '../utils/useGamepadNavigation';
import {
  BackgroundArt,
  BG_KEY_DIM,
  BG_KEY_PRESET,
  BG_KEY_URL,
  BG_PRESETS,
} from '../components/AppBackground';

const DIM_LEVELS = [0.3, 0.5, 0.7];
const PAD = 16;
const GAP = 12;

function BackgroundSettingsScreen({navigation}: any) {
  const {t} = useTranslation();
  const theme = useTheme();
  const isFocused = useIsFocused();
  const {width} = useWindowDimensions();
  const dark = theme.dark;

  const [presetId] = useMMKVString(BG_KEY_PRESET, storage);
  const [savedUrl] = useMMKVString(BG_KEY_URL, storage);
  const [dimStored] = useMMKVNumber(BG_KEY_DIM, storage);
  const [draftUrl, setDraftUrl] = React.useState(savedUrl || '');

  const active = presetId || 'glow';
  const dim = typeof dimStored === 'number' ? dimStored : 0.5;
  const tileW = Math.floor((width - PAD * 2 - GAP) / 2);
  const tileH = Math.round(tileW * 0.78);

  useGamepadNavigation({
    enabled: isFocused,
    onBack: () => navigation.goBack(),
  });

  const mutedColor = theme.colors.onSurfaceVariant;
  const cardColors = {
    backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
    borderColor: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
  };

  const applyUrl = () => {
    const value = draftUrl.trim();
    if (!/^https?:\/\/\S+$/i.test(value)) {
      Alert.alert(t('BgInvalid'));
      return;
    }
    storage.set(BG_KEY_URL, value);
    storage.set(BG_KEY_PRESET, 'url');
  };

  const tileFrame = (selected: boolean) => ({
    width: tileW,
    height: tileH,
    borderColor: selected
      ? '#FFFFFF'
      : dark
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(0, 0, 0, 0.12)',
    borderWidth: selected ? 2 : 1,
  });

  const selectedBadge = (
    <View style={styles.check}>
      <Icon source="check" size={14} color="#000000" />
    </View>
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, {color: mutedColor}]}>
        {t('BgPresets')}
      </Text>
      <View style={styles.grid}>
        {BG_PRESETS.map(preset => {
          const selected = active === preset.id;
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="button"
              accessibilityLabel={preset.name}
              onPress={() => storage.set(BG_KEY_PRESET, preset.id)}
              style={[styles.tile, tileFrame(selected)]}>
              <BackgroundArt preset={preset} width={tileW} height={tileH} />
              <Text style={styles.tileName}>{preset.name}</Text>
              {selected ? selectedBadge : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.heading, {color: mutedColor, marginTop: 22}]}>
        {t('BgImage')}
      </Text>
      <View style={[styles.card, cardColors]}>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : '#F4F4F6',
              borderColor: dark
                ? 'rgba(255, 255, 255, 0.22)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}>
          <Icon source="link-variant" size={20} color={mutedColor} />
          <TextInput
            value={draftUrl}
            onChangeText={setDraftUrl}
            placeholder={t('BgImageHint')}
            placeholderTextColor={mutedColor}
            style={[styles.input, {color: theme.colors.onSurface}]}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={applyUrl}
          />
        </View>

        <Pressable
          onPress={applyUrl}
          accessibilityRole="button"
          style={({pressed}) => [
            styles.applyButton,
            {
              borderColor: dark ? '#FFFFFF' : theme.colors.primary,
              backgroundColor: pressed
                ? dark
                  ? 'rgba(255, 255, 255, 0.18)'
                  : 'rgba(0, 0, 0, 0.08)'
                : dark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
            },
          ]}>
          <Text style={[styles.applyText, {color: theme.colors.onSurface}]}>
            {t('BgApply')}
          </Text>
        </Pressable>

        {savedUrl ? (
          <Pressable
            onPress={() => storage.set(BG_KEY_PRESET, 'url')}
            style={[
              styles.urlPreview,
              {
                borderColor:
                  active === 'url'
                    ? '#FFFFFF'
                    : dark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.12)',
                borderWidth: active === 'url' ? 2 : 1,
              },
            ]}>
            <Image
              source={{uri: savedUrl}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {backgroundColor: `rgba(0, 0, 0, ${dim})`},
              ]}
            />
            {active === 'url' ? selectedBadge : null}
          </Pressable>
        ) : null}

        {active === 'url' ? (
          <View style={styles.dimRow}>
            <Text style={[styles.dimLabel, {color: mutedColor}]}>
              {t('BgDim')}
            </Text>
            <View style={styles.dimChips}>
              {DIM_LEVELS.map(level => {
                const on = Math.abs(dim - level) < 0.01;
                return (
                  <Pressable
                    key={level}
                    onPress={() => storage.set(BG_KEY_DIM, level)}
                    style={[
                      styles.chip,
                      {
                        borderColor: on
                          ? '#FFFFFF'
                          : dark
                            ? 'rgba(255, 255, 255, 0.22)'
                            : 'rgba(0, 0, 0, 0.12)',
                        backgroundColor: on
                          ? 'rgba(255, 255, 255, 0.16)'
                          : 'transparent',
                      },
                    ]}>
                    <Text
                      style={[styles.chipText, {color: theme.colors.onSurface}]}>
                      {Math.round(level * 100)}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: PAD,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#000000',
  },
  tileName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    margin: 10,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    paddingVertical: 0,
  },
  applyButton: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  applyText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  urlPreview: {
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 14,
    backgroundColor: '#0A0A0A',
  },
  dimRow: {
    marginTop: 14,
  },
  dimLabel: {
    fontSize: 12.5,
    marginBottom: 8,
  },
  dimChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

export default BackgroundSettingsScreen;
