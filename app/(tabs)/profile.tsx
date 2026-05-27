import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/profile/account-section';
import { PremiumPrivilegesSection } from '@/components/profile/premium-privileges-section';
import { ProfileDetailsSection } from '@/components/profile/profile-details-section';
import { LegalTrustSection } from '@/components/profile/legal-trust-section';
import { AboutStyloveSection } from '@/components/profile/about-stylove-section';
import { PremiumCta } from '@/components/ui/premium-cta';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useTranslation } from '@/contexts/locale-context';
import { useLooks } from '@/contexts/looks-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Fonts } from '@/constants/theme';
import type { PremiumPrivilegeId } from '@/lib/premium-privileges';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

export default function ProfileScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleDark } = useTheme();
  const { savedLooks } = useLooks();
  const { signature, memory } = useStyleMemory();
  const { displayName, avatarUri, profile } = useUserProfile();
  const { pendingTarget, clearPendingNavigation } = useAppNavigation();
  const scrollRef = useTabScrollToTop();
  const privilegesY = useRef(0);
  const aboutY = useRef(0);
  const [privilegeToOpen, setPrivilegeToOpen] = useState<PremiumPrivilegeId | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handlePrivilegeOpened = useCallback(() => setPrivilegeToOpen(null), []);

  useEffect(() => {
    if (pendingTarget !== 'profile-fragrance') return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: privilegesY.current, animated: true });
      setPrivilegeToOpen('fragrance');
      clearPendingNavigation();
    }, 350);
    return () => clearTimeout(timer);
  }, [pendingTarget, clearPendingNavigation]);

  useEffect(() => {
    if (pendingTarget !== 'profile-about') return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: aboutY.current, animated: true });
      setAboutOpen(true);
      clearPendingNavigation();
    }, 350);
    return () => clearTimeout(timer);
  }, [pendingTarget, clearPendingNavigation]);

  const usernameLine = profile.username.trim() ? `@${profile.username.replace(/^@/, '')}` : t.profile.subtitle;

  return (
    <View style={[styles.screen, { backgroundColor: colors.ivory, paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.header}>
          <View style={[styles.avatarWrap, !profile.photoUri && styles.avatarWrapEmpty]}>
            <Image
              source={{ uri: avatarUri }}
              style={[styles.avatar, { borderColor: colors.burgundy }]}
              contentFit="cover"
            />
          </View>
          <Text style={[styles.name, { color: colors.black }]}>{displayName}</Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>{usernameLine}</Text>
        </View>

        <AccountSection />

        <ProfileDetailsSection />

        <AboutStyloveSection
          open={aboutOpen}
          onOpenChange={setAboutOpen}
          onLayout={(e) => {
            aboutY.current = e.nativeEvent.layout.y;
          }}
        />

        <View
          style={[
            styles.signatureCard,
            { backgroundColor: colors.wineDeep, borderColor: 'rgba(196,160,98,0.2)' },
            StyloveShadow.editorial,
          ]}>
          <Text style={[styles.signatureLabel, { color: colors.goldMuted }]}>{t.profile.signature}</Text>
          <View style={styles.signatureGrid}>
            <View style={styles.signatureItem}>
              <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.yourSignature}</Text>
              <Text style={[styles.sigValue, { color: colors.creamText }]}>{signature.signature}</Text>
            </View>
            <View style={styles.signatureItem}>
              <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.yourEnergy}</Text>
              <Text style={[styles.sigValue, { color: colors.creamText }]}>{signature.energy}</Text>
            </View>
            <View style={styles.signatureItem}>
              <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.mostWornTones}</Text>
              <Text style={[styles.sigValue, { color: colors.creamText }]}>
                {signature.tones.join(' · ')}
              </Text>
            </View>
            <View style={styles.signatureItem}>
              <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.styleDna}</Text>
              <Text style={[styles.sigValue, { color: colors.creamText, fontStyle: 'italic' }]}>
                {signature.styleDna}
              </Text>
            </View>
          </View>
        </View>

        <PremiumCta label={t.profile.premiumCta} variant="card" />

        <View
          onLayout={(e) => {
            privilegesY.current = e.nativeEvent.layout.y;
          }}>
          <PremiumPrivilegesSection
            openPrivilegeId={privilegeToOpen}
            onPrivilegeOpened={handlePrivilegeOpened}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.profile.theme}</Text>
          <Pressable
            onPress={toggleDark}
            style={[
              styles.themeRow,
              { backgroundColor: colors.white, borderColor: colors.creamMuted },
            ]}>
            <View style={styles.themeLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.burgundy} />
              <Text style={[styles.themeLabel, { color: colors.black }]}>
                {isDark ? t.profile.themeDark : t.profile.themeLight}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.profile.savedLooks}</Text>
          <View style={[styles.statRow, { backgroundColor: colors.white, borderColor: colors.creamMuted }]}>
            <Text style={[styles.statValue, { color: colors.burgundy }]}>{savedLooks.length}</Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>{t.looks.saved}</Text>
            <Text style={[styles.statMeta, { color: colors.grayLight }]}>
              {memory.totalLooksGenerated} {t.profile.statsCurated} · {memory.totalLooksSaved}{' '}
              {t.profile.statsSaved}
            </Text>
          </View>
        </View>

        <LegalTrustSection />

        <StyloveFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  avatarWrap: {
    marginBottom: 8,
  },
  avatarWrapEmpty: {
    padding: 3,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.35)',
    backgroundColor: 'rgba(196,160,98,0.06)',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  signatureCard: {
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    gap: 16,
  },
  signatureLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  signatureGrid: {
    gap: 14,
  },
  signatureItem: {
    gap: 4,
  },
  sigKey: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  sigValue: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeLabel: {
    fontSize: 15,
  },
  statRow: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.serif,
    fontSize: 36,
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statMeta: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
