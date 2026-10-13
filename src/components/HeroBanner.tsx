import React from 'react';
import {FlatList, Image, Pressable, StyleSheet, View} from 'react-native';
import {Icon, Text} from 'react-native-paper';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

const formatUrl = (u: any): string | null => {
  if (!u || typeof u !== 'string') {
    return null;
  }
  const trimmed = u.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith('http') ? trimmed : `https:${trimmed}`;
};

const HERO_PURPOSES = ['SuperHeroArt', 'TitledHeroArt', 'Hero', 'BrandedKeyArt'];

// Gambar lebar (landscape) untuk banner. Judul tanpa gambar seperti ini dilewati.
export const getHeroUrl = (item: any): string | null => {
  if (!item) {
    return null;
  }
  const raw =
    item.Image_Hero?.URL ||
    item.image_urls?.hero ||
    item.details?.heroUrl ||
    (Array.isArray(item.Images)
      ? item.Images.find((img: any) => HERO_PURPOSES.includes(img?.ImagePurpose))
          ?.URL
      : null);
  return formatUrl(raw);
};

const getName = (item: any): string =>
  item?.ProductTitle || item?.titleName || item?.Title || '';

const getPublisher = (item: any): string =>
  item?.PublisherName ||
  item?.publisherName ||
  item?.Publisher ||
  item?.DeveloperName ||
  '';

type Props = {
  titles: any[];
  width: number;
  onPress: (item: any) => void;
  onPlayPress: (item: any) => void;
};

const HeroBanner = ({titles, width, onPress, onPlayPress}: Props) => {
  const [index, setIndex] = React.useState(0);
  const height = Math.round(width * 0.62);

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      const name = getName(item);
      const publisher = getPublisher(item);
      return (
        <Pressable
          onPress={() => onPress(item)}
          style={[styles.card, {width, height}]}>
          <Image
            source={{uri: getHeroUrl(item) as string}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="heroScrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.4" stopColor="#000000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.88" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroScrim)" />
          </Svg>
          <View style={styles.caption}>
            <View style={styles.captionText}>
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
              {publisher ? (
                <Text style={styles.publisher} numberOfLines={1}>
                  {publisher}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => onPlayPress(item)}
              accessibilityRole="button"
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              style={styles.playButton}>
              <Icon source="play" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [width, height, onPress, onPlayPress],
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        horizontal
        data={titles}
        extraData={width}
        keyExtractor={(item, i) =>
          String(item?.productId || item?.XCloudTitleId || item?.titleId || i)
        }
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({length: width, offset: width * i, index: i})}
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        style={{width}}
      />
      {titles.length > 1 ? (
        <View style={styles.dots}>
          {titles.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 26,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'flex-end',
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
  },
  captionText: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  publisher: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 3,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
});

export default HeroBanner;
