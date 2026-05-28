import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { AuraShareCard, type AuraShareThemeId } from '@/components/share/aura-share-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { useLooks } from '@/contexts/looks-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

const THEMES: AuraShareThemeId[] = ['noir', 'ivory', 'espresso'];

export default function ShareLookScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentLook, ready } = useLooks();
  const { width } = useWindowDimensions();
  const [activeTheme, setActiveTheme] = useState(0);
  const activeCardRef = useRef<View>(null);
  const cardWidth = Math.min(width - 56, 360);
  const themeNames = useMemo(
    () => [t.share.themeNoir, t.share.themeIvory, t.share.themeEspresso],
    [t.share.themeNoir, t.share.themeIvory, t.share.themeEspresso],
  );

  const captureActiveCard = async (): Promise<string> => {
    if (!activeCardRef.current) throw new Error('Share card is not ready');
    const uri = await captureRef(activeCardRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    if (!uri) throw new Error('Share card could not be captured');
    return uri;
  };

  const handleSaveImage = async () => {
    void hapticLight();
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.share.title, t.share.shareError);
        return;
      }
      const uri = await captureActiveCard();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(t.share.title, t.share.savedToGallery);
    } catch {
      Alert.alert(t.share.title, t.share.shareError);
    }
  };

  const handleNativeShare = async () => {
    void hapticLight();
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(t.share.title, t.share.shareUnavailable);
        return;
      }
      const uri = await captureActiveCard();
      await Sharing.shareAsync(uri, {
        dialogTitle: t.share.instagramStory,
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch {
      Alert.alert(t.share.title, t.share.shareError);
    }
  };

  const handleCopyLink = async () => {
    void hapticLight();
    const lookId = currentLook?.id ?? 'current';
    const url = Linking.createURL(`/share-look?look=${encodeURIComponent(lookId)}`);
    await Clipboard.setStringAsync(url);
    Alert.alert(t.share.title, t.share.linkCopied);
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? colors.ivory : colors.wineDeep, paddingTop: insets.top }]}>
      <Pressable
        style={styles.close}
        onPress={() => {
          void hapticLight();
          router.back();
        }}
        hitSlop={12}>
        <Ionicons name="close" size={24} color={colors.creamText} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Animated.View entering={FadeInUp.duration(700)} style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.goldSoft }]}>{t.share.title}</Text>
          <Text style={[styles.title, { color: colors.creamText }]}>{t.share.previewTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.grayLight }]}>{t.share.previewSubtitle}</Text>
        </Animated.View>

        {!ready ? (
          <View style={styles.skeletonWrap}>
            <SkeletonShimmer height={560} borderRadius={34} />
            <SkeletonShimmer height={18} width="60%" borderRadius={8} />
          </View>
        ) : currentLook ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              snapToInterval={width}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                setActiveTheme(Math.round(event.nativeEvent.contentOffset.x / width));
              }}>
              {THEMES.map((theme) => (
                <View key={theme} style={[styles.cardSlide, { width }]}>
                  <ViewShot
                    ref={theme === THEMES[activeTheme] ? activeCardRef : undefined}
                    options={{ format: 'png', quality: 1 }}>
                    <AuraShareCard look={currentLook} theme={theme} width={cardWidth} />
                  </ViewShot>
                </View>
              ))}
            </ScrollView>

            <View style={styles.themeDots}>
              {THEMES.map((theme, index) => (
                <View
                  key={theme}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === activeTheme ? colors.goldSoft : 'rgba(245,237,224,0.24)',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.themeName, { color: colors.goldMuted }]}>
              {t.share.themeLabel} · {themeNames[activeTheme] ?? themeNames[0]}
            </Text>

            <View style={styles.actions}>
              <ShareAction icon="download-outline" label={t.share.saveImage} onPress={handleSaveImage} />
              <ShareAction icon="logo-instagram" label={t.share.instagramStory} onPress={handleNativeShare} />
              <ShareAction icon="link-outline" label={t.share.copyLink} onPress={handleCopyLink} />
            </View>
          </>
        ) : (
          <EmptyState title={t.share.emptyTitle} subtitle={t.share.emptySubtitle} />
        )}
      </ScrollView>
    </View>
  );
}

function ShareAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
      <Ionicons name={icon} size={18} color="#D4B878" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 44,
  },
  header: {
    paddingHorizontal: 28,
    marginBottom: 22,
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 39,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  skeletonWrap: {
    paddingHorizontal: 28,
    gap: 14,
  },
  cardSlide: {
    alignItems: 'center',
  },
  themeDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  themeName: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  actions: {
    paddingHorizontal: 24,
    marginTop: 22,
    gap: 10,
  },
  action: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.18)',
    backgroundColor: 'rgba(255,250,242,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  actionText: {
    color: '#F5EDE0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
