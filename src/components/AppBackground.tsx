import React from 'react';
import {Image, StyleSheet, View, useWindowDimensions} from 'react-native';
import Svg, {Defs, Ellipse, RadialGradient, Stop} from 'react-native-svg';
import {useMMKVNumber, useMMKVString} from 'react-native-mmkv';
import {storage} from '../store/mmkv';

export const BG_KEY_PRESET = 'ui.bg_preset';
export const BG_KEY_URL = 'ui.bg_url';
export const BG_KEY_DIM = 'ui.bg_dim';

type Glow = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
};

export type BgPreset = {
  id: string;
  name: string;
  base: string;
  glows: Glow[];
};

// Semua preset gelap dan hemat: warna dasar + cahaya radial tipis (tanpa blur).
export const BG_PRESETS: BgPreset[] = [
  {
    id: 'glow',
    name: 'Glow',
    base: '#000000',
    glows: [
      {x: 0.85, y: 0.08, rx: 0.75, ry: 0.22, color: '#FFFFFF', opacity: 0.14},
      {x: 0.1, y: 0.9, rx: 0.7, ry: 0.2, color: '#FFFFFF', opacity: 0.09},
    ],
  },
  {id: 'black', name: 'Black', base: '#000000', glows: []},
  {
    id: 'aurora',
    name: 'Aurora',
    base: '#02070A',
    glows: [
      {x: 0.15, y: 0.1, rx: 0.9, ry: 0.28, color: '#2DD4BF', opacity: 0.22},
      {x: 0.9, y: 0.6, rx: 0.8, ry: 0.3, color: '#8B5CF6', opacity: 0.2},
    ],
  },
  {
    id: 'ember',
    name: 'Ember',
    base: '#080303',
    glows: [
      {x: 0.9, y: 0.08, rx: 0.8, ry: 0.26, color: '#F97316', opacity: 0.22},
      {x: 0.1, y: 0.88, rx: 0.8, ry: 0.26, color: '#DC2626', opacity: 0.2},
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    base: '#020611',
    glows: [
      {x: 0.1, y: 0.1, rx: 0.85, ry: 0.26, color: '#38BDF8', opacity: 0.2},
      {x: 0.9, y: 0.85, rx: 0.85, ry: 0.28, color: '#2563EB', opacity: 0.22},
    ],
  },
  {
    id: 'forest',
    name: 'Forest',
    base: '#030804',
    glows: [
      {x: 0.85, y: 0.1, rx: 0.8, ry: 0.26, color: '#4ADE80', opacity: 0.18},
      {x: 0.1, y: 0.82, rx: 0.8, ry: 0.28, color: '#16A34A', opacity: 0.2},
    ],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    base: '#07040B',
    glows: [
      {x: 0.1, y: 0.12, rx: 0.85, ry: 0.26, color: '#F472B6', opacity: 0.18},
      {x: 0.9, y: 0.8, rx: 0.85, ry: 0.3, color: '#7C3AED', opacity: 0.24},
    ],
  },
];

type ArtProps = {
  preset: BgPreset;
  width: number;
  height: number;
};

// Menggambar satu preset pada ukuran tertentu (dipakai layar penuh dan miniatur).
export const BackgroundArt = React.memo(({preset, width, height}: ArtProps) => (
  <View
    pointerEvents="none"
    style={[StyleSheet.absoluteFill, {backgroundColor: preset.base}]}>
    {preset.glows.length > 0 ? (
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={StyleSheet.absoluteFill}>
        <Defs>
          {preset.glows.map((g, i) => (
            <RadialGradient
              key={`def_${i}`}
              id={`bg_${preset.id}_${i}`}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%">
              <Stop offset="0" stopColor={g.color} stopOpacity={g.opacity} />
              <Stop
                offset="0.5"
                stopColor={g.color}
                stopOpacity={g.opacity * 0.35}
              />
              <Stop offset="1" stopColor={g.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {preset.glows.map((g, i) => (
          <Ellipse
            key={`glow_${i}`}
            cx={width * g.x}
            cy={height * g.y}
            rx={width * g.rx}
            ry={height * g.ry}
            fill={`url(#bg_${preset.id}_${i})`}
          />
        ))}
      </Svg>
    ) : null}
  </View>
));

type Props = {
  isLight: boolean;
};

// Latar belakang seluruh aplikasi. Pilihan disimpan di MMKV dan langsung
// berubah di semua layar begitu diganti dari Pengaturan > Latar belakang.
const AppBackground = ({isLight}: Props) => {
  const {width, height} = useWindowDimensions();
  const [presetId] = useMMKVString(BG_KEY_PRESET, storage);
  const [url] = useMMKVString(BG_KEY_URL, storage);
  const [dimStored] = useMMKVNumber(BG_KEY_DIM, storage);
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);

  if (isLight) {
    return null;
  }

  const dim = typeof dimStored === 'number' ? dimStored : 0.5;

  if (presetId === 'url' && url && failedUrl !== url) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={{uri: url}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailedUrl(url)}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: `rgba(0, 0, 0, ${dim})`},
          ]}
        />
      </View>
    );
  }

  const preset = BG_PRESETS.find(p => p.id === presetId) || BG_PRESETS[0];
  return <BackgroundArt preset={preset} width={width} height={height} />;
};

export default React.memo(AppBackground);
