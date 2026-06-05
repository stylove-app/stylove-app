import { memo, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/contexts/locale-context';
import type { WardrobeItemTypeId } from '@/i18n/types';
import {
  buildStyleProfileFromUpload,
  deriveItemTypeFromProfile,
  WARDROBE_COLOR_IDS,
  WARDROBE_UPLOAD_PRODUCT_ORDER,
  WARDROBE_UPLOAD_USE_CASE_ORDER,
  type WardrobeColorId,
  type WardrobeStyleProfile,
  type WardrobeUseCaseId,
} from '@/lib/wardrobe-style-profile';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

export type WardrobeProfileSelection = {
  name: string;
  itemType: WardrobeItemTypeId;
  styleProfile: WardrobeStyleProfile;
};

type WardrobeProfilePickerProps = {
  onComplete: (selection: WardrobeProfileSelection) => void;
};

function toggleInList<T extends string>(list: T[], value: T): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

function productTypeLabel(subcategory: string, t: ReturnType<typeof useTranslation>): string {
  return t.wardrobe.profileUploadProducts[subcategory] ?? t.wardrobe.profileSubtypes[subcategory] ?? subcategory;
}

function WardrobeProfilePickerComponent({ onComplete }: WardrobeProfilePickerProps) {
  const t = useTranslation();
  const [productType, setProductType] = useState<string | null>(null);
  const [color, setColor] = useState<WardrobeColorId | null>(null);
  const [useCases, setUseCases] = useState<WardrobeUseCaseId[]>([]);

  const canSave = productType && color && useCases.length > 0;

  const emitSave = useCallback(() => {
    if (!canSave || !productType || !color) return;
    const styleProfile = buildStyleProfileFromUpload({
      subcategory: productType,
      color,
      useCases,
    });
    const itemType = deriveItemTypeFromProfile(styleProfile);
    const name = productTypeLabel(productType, t);
    onComplete({ name, itemType, styleProfile });
  }, [canSave, productType, color, useCases, t, onComplete]);

  return (
    <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t.wardrobe.profileTitle}</Text>

      <Section label={t.wardrobe.profileStepProductType}>
        <ChipGrid>
          {WARDROBE_UPLOAD_PRODUCT_ORDER.map((id) => (
            <Chip
              key={id}
              label={productTypeLabel(id, t)}
              active={productType === id}
              onPress={() => setProductType(id)}
            />
          ))}
        </ChipGrid>
      </Section>

      <Section label={t.wardrobe.profileStepColor}>
        <ChipGrid>
          {WARDROBE_COLOR_IDS.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileColors[id]}
              active={color === id}
              onPress={() => setColor(id)}
            />
          ))}
        </ChipGrid>
      </Section>

      <Section label={t.wardrobe.profileStepUseCase}>
        <ChipGrid>
          {WARDROBE_UPLOAD_USE_CASE_ORDER.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileUseCases[id]}
              active={useCases.includes(id)}
              onPress={() => setUseCases((prev) => toggleInList(prev, id))}
            />
          ))}
        </ChipGrid>
      </Section>

      <Pressable
        onPress={emitSave}
        disabled={!canSave}
        style={({ pressed }) => [
          styles.saveBtn,
          !canSave && styles.saveBtnDisabled,
          pressed && canSave && styles.saveBtnPressed,
        ]}>
        <Text style={styles.saveBtnText}>{t.wardrobe.profileSave}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipGrid}>{children}</View>;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export const WardrobeProfilePicker = memo(WardrobeProfilePickerComponent);

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 420,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: StyloveColors.burgundy,
    marginBottom: 12,
  },
  section: {
    marginBottom: 14,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: StyloveColors.grayLight,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
    backgroundColor: StyloveColors.ivory,
  },
  chipActive: {
    backgroundColor: StyloveColors.burgundy,
    borderColor: StyloveColors.burgundy,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipText: {
    fontSize: 12,
    color: StyloveColors.gray,
  },
  chipTextActive: {
    color: StyloveColors.ivory,
  },
  saveBtn: {
    backgroundColor: StyloveColors.burgundy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnText: {
    color: StyloveColors.ivory,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
