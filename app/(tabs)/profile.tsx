import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSection } from '@/components/profile/account-section';
import { PremiumPrivilegesSection } from '@/components/profile/premium-privileges-section';
import { ProfileDetailsSection } from '@/components/profile/profile-details-section';
import { LegalTrustSection } from '@/components/profile/legal-trust-section';
import { AboutStyloveSection } from '@/components/profile/about-stylove-section';
import { PushNotificationsSetting } from '@/components/profile/push-notifications-setting';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { LuxuryModalFrame } from '@/components/ui/luxury-modal-frame';
import { PremiumCta } from '@/components/ui/premium-cta';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { LOCALES } from '@/i18n';
import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { useLocale, useTranslation } from '@/contexts/locale-context';
import { useLooks } from '@/contexts/looks-context';
import { usePremium } from '@/contexts/premium-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Fonts } from '@/constants/theme';
import type { Locale } from '@/i18n/types';
import type { PremiumPrivilegeId } from '@/lib/premium-privileges';
import { deleteOwnAccount } from '@/services/account-deletion';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

const PROFILE_LANGUAGES = LOCALES.filter((language) =>
  ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru'].includes(language.id),
);

export default function ProfileScreen() {
  const t = useTranslation();
  const { locale, setLocale } = useLocale();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleDark } = useTheme();
  const { clearLocalSession } = useAuth();
  const { savedLooks } = useLooks();
  const { isPremium } = usePremium();
  const { signature, memory } = useStyleMemory();
  const { displayName, avatarUri, profile } = useUserProfile();
  const { pendingTarget, clearPendingNavigation } = useAppNavigation();
  const scrollRef = useTabScrollToTop();
  const privilegesY = useRef(0);
  const aboutY = useRef(0);
  const [privilegeToOpen, setPrivilegeToOpen] = useState<PremiumPrivilegeId | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
  const signatureIsReady = signature.phase === 'emerging' || signature.phase === 'complete';
  const signatureEmptyTitle =
    signature.phase === 'empty' ? t.profile.signatureEmptyTitle : t.profile.signatureFormingTitle;
  const signatureEmptyBody =
    signature.phase === 'empty' ? t.profile.signatureEmptyBody : t.profile.signatureFormingBody;

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteOwnAccount();
      await clearLocalSession();
      setDeleteConfirmVisible(false);
      router.replace('/');
    } catch {
      Alert.alert(t.profile.deleteAccount, t.profile.deleteAccountError);
    } finally {
      setDeletingAccount(false);
    }
  };

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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.profile.settingsTitle}</Text>
          <View
            style={[
              styles.membershipCard,
              { backgroundColor: colors.wineDeep, borderColor: 'rgba(196,160,98,0.22)' },
              StyloveShadow.editorial,
            ]}>
            <View style={styles.membershipGlow} />
            <View style={styles.membershipHeader}>
              <View>
                <Text style={[styles.membershipEyebrow, { color: colors.goldMuted }]}>
                  {t.profile.premiumStatus}
                </Text>
                <Text style={[styles.membershipTitle, { color: colors.creamText }]}>
                  {isPremium ? t.profile.premiumActive : t.profile.premiumFree}
                </Text>
              </View>
              <Ionicons name="diamond-outline" size={24} color={colors.goldSoft} />
            </View>
            <Text style={[styles.membershipCopy, { color: 'rgba(245,237,224,0.74)' }]}>
              {isPremium ? t.profile.premiumPlan : t.profile.freePlan}
            </Text>
            {!isPremium ? (
              <Pressable onPress={() => router.push('/premium')} style={styles.membershipCta}>
                <Text style={styles.membershipCtaText}>{t.profile.premiumCta}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.settingsCard, { backgroundColor: colors.white, borderColor: colors.creamMuted }]}>
            <Text style={[styles.settingsLabel, { color: colors.grayLight }]}>{t.profile.language}</Text>
            <View style={styles.languageGrid}>
              {PROFILE_LANGUAGES.map((language) => {
                const selected = language.id === locale;
                return (
                  <Pressable
                    key={language.id}
                    onPress={() => void setLocale(language.id as Locale)}
                    style={[
                      styles.languageChip,
                      {
                        backgroundColor: selected ? colors.cream : colors.ivory,
                        borderColor: selected ? colors.burgundy : colors.creamMuted,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.languageText,
                        { color: selected ? colors.burgundy : colors.black },
                      ]}>
                      {language.native}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={15} color={colors.burgundy} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <PushNotificationsSetting />

        </View>

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
          {signatureIsReady ? (
            <View style={styles.signatureGrid}>
              <View style={styles.signatureItem}>
                <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.yourSignature}</Text>
                <Text style={[styles.sigValue, { color: colors.creamText }]}>
                  {signature.signature ?? t.profile.signaturePending}
                </Text>
              </View>
              <View style={styles.signatureItem}>
                <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.yourEnergy}</Text>
                <Text style={[styles.sigValue, { color: colors.creamText }]}>
                  {signature.energy ?? t.profile.signaturePending}
                </Text>
              </View>
              <View style={styles.signatureItem}>
                <Text style={[styles.sigKey, { color: colors.grayLight }]}>
                  {t.profile.mostWornTones}
                </Text>
                <Text style={[styles.sigValue, { color: colors.creamText }]}>
                  {signature.tones.length > 0
                    ? signature.tones.join(' · ')
                    : t.profile.signaturePending}
                </Text>
              </View>
              <View style={styles.signatureItem}>
                <Text style={[styles.sigKey, { color: colors.grayLight }]}>{t.profile.styleDna}</Text>
                <Text style={[styles.sigValue, { color: colors.creamText, fontStyle: 'italic' }]}>
                  {signature.styleDna ?? t.profile.signaturePending}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.signatureEmpty}>
              <Ionicons name="sparkles-outline" size={22} color={colors.goldSoft} />
              <Text style={[styles.signatureEmptyTitle, { color: colors.creamText }]}>
                {signatureEmptyTitle}
              </Text>
              <Text style={[styles.signatureEmptyBody, { color: 'rgba(245,237,224,0.72)' }]}>
                {signatureEmptyBody}
              </Text>
            </View>
          )}
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
          <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.profile.preferences}</Text>
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

        <View style={styles.section}>
          <Pressable
            onPress={() => setDeleteConfirmVisible(true)}
            disabled={deletingAccount}
            style={[styles.deleteRow, { borderColor: colors.creamMuted, backgroundColor: colors.white }]}>
            <Ionicons name="trash-outline" size={17} color={colors.burgundy} />
            <Text style={[styles.deleteText, { color: colors.burgundy }]}>{t.profile.deleteAccount}</Text>
          </Pressable>
        </View>

        <StyloveFooter />
      </ScrollView>

      <LuxuryModalFrame
        visible={deleteConfirmVisible}
        onClose={() => {
          if (!deletingAccount) setDeleteConfirmVisible(false);
        }}
        dismissOnBackdrop={!deletingAccount}
        align="center">
        <View style={[styles.deleteModal, { backgroundColor: colors.white, borderColor: colors.creamRich }]}>
          <View style={[styles.deleteIconWrap, { backgroundColor: colors.wineDeep }]}>
            <Ionicons name="warning-outline" size={24} color={colors.goldSoft} />
          </View>
          <Text style={[styles.deleteModalTitle, { color: colors.black }]}>
            {t.profile.deleteAccountConfirmTitle}
          </Text>
          <Text style={[styles.deleteModalBody, { color: colors.gray }]}>
            {t.profile.deleteAccountConfirmBody}
          </Text>
          <LuxuryButton
            label={deletingAccount ? t.profile.deleteAccountDeleting : t.profile.deleteAccountConfirmCta}
            onPress={() => void handleDeleteAccount()}
            variant="primary"
            disabled={deletingAccount}
          />
          <Pressable
            disabled={deletingAccount}
            onPress={() => setDeleteConfirmVisible(false)}
            style={styles.deleteCancel}>
            <Text style={[styles.deleteCancelText, { color: colors.gray }]}>
              {t.profile.deleteAccountCancel}
            </Text>
          </Pressable>
        </View>
      </LuxuryModalFrame>
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
  membershipCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    overflow: 'hidden',
  },
  membershipGlow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(196,160,98,0.13)',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  membershipEyebrow: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  membershipTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },
  membershipCopy: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  membershipCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#A88850',
  },
  membershipCtaText: {
    color: '#1F0509',
    fontWeight: '600',
    fontSize: 13,
  },
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...StyloveShadow.soft,
  },
  settingsLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
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
  signatureEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  signatureEmptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  signatureEmptyBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageChip: {
    minWidth: '45%',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: Fonts.serif,
  },
  deleteModal: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'stretch',
    gap: 14,
    ...StyloveShadow.editorial,
  },
  deleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 2,
  },
  deleteModalTitle: {
    fontFamily: Fonts.serif,
    fontSize: 23,
    lineHeight: 29,
    textAlign: 'center',
  },
  deleteModalBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  deleteCancel: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteCancelText: {
    fontSize: 13,
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
