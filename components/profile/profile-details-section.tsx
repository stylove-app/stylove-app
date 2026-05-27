import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';

import { FormLabel } from '@/components/ui/form-label';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { DEFAULT_AVATAR_URI } from '@/constants/default-avatar';
import { useTranslation } from '@/contexts/locale-context';
import { useUserProfile, type UserProfile } from '@/contexts/user-profile-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

export function ProfileDetailsSection() {
  const t = useTranslation();
  const { colors } = useTheme();
  const { profile, saveProfile } = useUserProfile();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setDraft((prev) => ({ ...prev, photoUri: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      await saveProfile({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        username: draft.username.trim(),
        photoUri: draft.photoUri,
      });
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(t.profile.details.savedTitle, t.profile.details.savedMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.profile.details.title}</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.white, borderColor: colors.creamMuted },
          StyloveShadow.soft,
        ]}>
        <Pressable onPress={pickPhoto} style={styles.photoRow}>
          <Image
            source={{ uri: draft.photoUri ?? DEFAULT_AVATAR_URI }}
            style={[styles.photo, { borderColor: colors.goldMuted }]}
            contentFit="cover"
          />
          <View style={styles.photoCopy}>
            <Text style={[styles.photoLabel, { color: colors.burgundy }]}>{t.profile.details.changePhoto}</Text>
            <Text style={[styles.photoHint, { color: colors.gray }]}>{t.profile.details.photoHint}</Text>
          </View>
          <Ionicons name="camera-outline" size={18} color={colors.goldMuted} />
        </Pressable>

        <View style={styles.field}>
          <FormLabel color={colors.grayLight}>{t.profile.details.firstName}</FormLabel>
          <TextInput
            value={draft.firstName}
            onChangeText={(firstName) => setDraft((prev) => ({ ...prev, firstName }))}
            placeholder={t.profile.details.firstNamePlaceholder}
            placeholderTextColor={colors.grayLight}
            style={[styles.input, { borderColor: colors.creamMuted, color: colors.black, backgroundColor: colors.ivory }]}
          />
        </View>

        <View style={styles.field}>
          <FormLabel color={colors.grayLight}>{t.profile.details.lastName}</FormLabel>
          <TextInput
            value={draft.lastName}
            onChangeText={(lastName) => setDraft((prev) => ({ ...prev, lastName }))}
            placeholder={t.profile.details.lastNamePlaceholder}
            placeholderTextColor={colors.grayLight}
            style={[styles.input, { borderColor: colors.creamMuted, color: colors.black, backgroundColor: colors.ivory }]}
          />
        </View>

        <View style={styles.field}>
          <FormLabel color={colors.grayLight}>{t.profile.details.username}</FormLabel>
          <TextInput
            value={draft.username}
            onChangeText={(username) => setDraft((prev) => ({ ...prev, username }))}
            placeholder={t.profile.details.usernamePlaceholder}
            placeholderTextColor={colors.grayLight}
            autoCapitalize="none"
            style={[styles.input, { borderColor: colors.creamMuted, color: colors.black, backgroundColor: colors.ivory }]}
          />
        </View>

        <LuxuryButton label={t.common.save} onPress={handleSave} variant="gold" disabled={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 4,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  photoCopy: {
    flex: 1,
    gap: 2,
  },
  photoLabel: {
    fontFamily: Fonts.serif,
    fontSize: 15,
  },
  photoHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.serif,
  },
});
