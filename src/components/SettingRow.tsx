import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Icon, Text, useTheme} from 'react-native-paper';

type Props = {
  title: string;
  description?: string;
  icon?: string;
  isFocused?: boolean;
  isLast?: boolean;
  danger?: boolean;
  onPress: () => void;
};

// Satu baris pengaturan bergaya kaca: ikon opsional, judul, deskripsi 1-2 baris, panah.
const SettingRow: React.FC<Props> = React.memo(
  ({title, description, icon, isFocused, isLast, danger, onPress}) => {
    const theme = useTheme();
    const dark = theme.dark;

    const titleColor = danger ? '#FF6B6B' : theme.colors.onSurface;
    const mutedColor = theme.colors.onSurfaceVariant;
    const dividerColor = dark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.08)';
    const tileBg = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
    const tileBorder = dark
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(0, 0, 0, 0.1)';
    const pressedBg = dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';
    const focusedBg = dark
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(0, 0, 0, 0.08)';

    return (
      <View>
        <Pressable
          onPress={onPress}
          style={({pressed}) => [
            styles.row,
            pressed && {backgroundColor: pressedBg},
            isFocused && {
              backgroundColor: focusedBg,
              borderColor: dark ? '#FFFFFF' : theme.colors.primary,
            },
          ]}>
          {icon ? (
            <View
              style={[
                styles.iconTile,
                {backgroundColor: tileBg, borderColor: tileBorder},
              ]}>
              <Icon source={icon} size={20} color={titleColor} />
            </View>
          ) : null}

          <View style={styles.textCol}>
            <Text style={[styles.title, {color: titleColor}]} numberOfLines={2}>
              {title}
            </Text>
            {description ? (
              <Text
                style={[styles.description, {color: mutedColor}]}
                numberOfLines={2}>
                {description}
              </Text>
            ) : null}
          </View>

          <Icon source="chevron-right" size={20} color={mutedColor} />
        </Pressable>

        {!isLast && !isFocused ? (
          <View
            style={[
              styles.divider,
              {backgroundColor: dividerColor, marginLeft: icon ? 66 : 18},
            ]}
          />
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginHorizontal: 3,
    marginVertical: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginRight: 18,
  },
});

export default SettingRow;
