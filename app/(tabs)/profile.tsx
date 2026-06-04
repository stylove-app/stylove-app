import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalTrustSection } from '@/components/profile/legal-trust-section';
import { AboutStyloveSection } from '@/components/profile/about-stylove-section';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { LuxuryModalFrame } from '@/components/ui/luxury-modal-frame';
import { PremiumCta } from '@/components/ui/premium-cta';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Fonts } from '@/constants/theme';
import { hapticLight } from '@/lib/haptics';
import { deleteOwnAccount } from '@/services/account-deletion';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

function ProfileScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { clearLocalSession } = useAuth();
  const { isPremium } = usePremium();
  const { signature } = useStyleMemory();
  const { displayName, avatarUri, profile } = useUserProfile();
  const { pendingTarget, clearPendingNavigation } = useAppNavigation();
  const scrollRef = useTabScrollToTop();
  const aboutY = useRef(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (pendingTarget !== 'profile-about') return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: aboutY.current, animated: true });
      setAboutOpen(true);
      clearPendingNavigation();
    }, 350);
    return () => clearTimeout(timer);
  }, [pendingTarget, clearPendingNavigation]);

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + 100 }),
    [insets.bottom],
  );
  const screenStyle = useMemo(
    () => [styles.screen, { backgroundColor: colors.ivory, paddingTop: insets.top }],
    [colors.ivory, insets.top],
  );
  const usernameLine = useMemo(
    () => (profile.username.trim() ? `@${profile.username.replace(/^@/, '')}` : t.profile.subtitle),
    [profile.username, t.profile.subtitle],
  );
  const signatureIsReady = signature.phase === 'emerging' || signature.phase === 'complete';
  const signatureEmptyTitle = useMemo(
    () => (signature.phase === 'empty' ? t.profile.signatureEmptyTitle : t.profile.signatureFormingTitle),
    [signature.phase, t.profile.signatureEmptyTitle, t.profile.signatureFormingTitle],
  );
  const signatureEmptyBody = useMemo(
    () => (signature.phase === 'empty' ? t.profile.signatureEmptyBody : t.profile.signatureFormingBody),
    [signature.phase, t.profile.signatureEmptyBody, t.profile.signatureFormingBody],
  );
  const settingsButtonTheme = useMemo(
    () => ({
      backgroundColor: colors.white,
      borderColor: colors.creamMuted,
    }),
    [colors.white, colors.creamMuted],
  );

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
    <View style={screenStyle}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}>
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

        <View style={styles.section}>
          <Pressable
            onPress={() => {
              void hapticLight();
              router.push('/settings');
            }}
            style={({ pressed }) => [
              styles.settingsButton,
              settingsButtonTheme,
              pressed && styles.settingsButtonPressed,
              StyloveShadow.soft,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.profile.settingsTitle}>
            <View style={[styles.settingsIconWrap, { backgroundColor: colors.wineDeep }]}>
              <Ionicons name="settings-outline" size={18} color={colors.goldSoft} />
            </View>
            <Text style={[styles.settingsButtonLabel, { color: colors.black }]}>
              {t.profile.settingsTitle}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
          </Pressable>
        </View>

        <View style={styles.section}>
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

export default memo(ProfileScreen);

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
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  settingsButtonPressed: {
    opacity: 0.92,
  },
  settingsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonLabel: {
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: 17,
    letterSpacing: 0.2,
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
});
