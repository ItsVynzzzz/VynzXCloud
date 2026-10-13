import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Icon, Text} from 'react-native-paper';

export type BottomTab = {
  key: string;
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
};

type Props = {
  tabs: BottomTab[];
};

// Bilah navigasi bawah berbentuk pil melayang: hanya tab aktif yang menampilkan label.
const BottomNavBar = ({tabs}: Props) => (
  <View pointerEvents="box-none" style={styles.wrap}>
    <View style={styles.bar}>
      {tabs.map(tab => (
        <Pressable
          key={tab.key}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          onPress={tab.onPress}
          style={({pressed}) => [
            styles.tab,
            tab.active && styles.tabActive,
            pressed && !tab.active && styles.tabPressed,
          ]}>
          <Icon
            source={tab.icon}
            size={22}
            color={tab.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
          />
          {tab.active ? <Text style={styles.label}>{tab.label}</Text> : null}
        </Pressable>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 32,
    backgroundColor: 'rgba(14, 14, 14, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 8,
  },
  tab: {
    height: 48,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  tabPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BottomNavBar;
