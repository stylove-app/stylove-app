import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AFFILIATE_PLACEHOLDERS } from '@/constants/occasions';
import { SectionHeader } from '@/components/ui/section-header';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/locale-context';

export function CompleteTheLook() {
  const t = useTranslation();

  return (
    <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.container}>
      <SectionHeader title={t.completeLook.title} subtitle={t.completeLook.subtitle} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {AFFILIATE_PLACEHOLDERS.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/premium');
            }}>
            <Animated.View
              entering={FadeInDown.duration(600).delay(300 + index * 80)}
              style={styles.card}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
                <View style={styles.imageOverlay} />
              </View>
              <Text style={styles.label}>{t.completeLook[item.labelKey]}</Text>
              <View style={styles.goldLine} />
            </Animated.View>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  row: {
    paddingHorizontal: 24,
    gap: 14,
  },
  card: {
    width: 148,
    backgroundColor: StyloveColors.cardDark,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.12)',
    ...StyloveShadow.soft,
  },
  imageWrap: {
    height: 168,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,15,0.18)',
  },
  label: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    color: StyloveColors.creamText,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    letterSpacing: 0.3,
  },
  goldLine: {
    width: 24,
    height: 1,
    backgroundColor: StyloveColors.goldMuted,
    marginHorizontal: 14,
    marginBottom: 14,
    opacity: 0.7,
  },
});
