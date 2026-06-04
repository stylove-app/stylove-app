import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/contexts/locale-context';
import {
  buildStyleProfile,
  WARDROBE_COLOR_IDS,
  WARDROBE_SEASON_IDS,
  WARDROBE_SLOT_ORDER,
  WARDROBE_STYLE_TAG_IDS,
  WARDROBE_SUBCATEGORIES,
  WARDROBE_USE_CASE_IDS,
  type BuildStyleProfileInput,
  type WardrobeColorId,
  type WardrobeFormalityTag,
  type WardrobeSeasonId,
  type WardrobeSlotId,
  type WardrobeStyleTagId,
  type WardrobeUseCaseId,
} from '@/lib/wardrobe-style-profile';
import { deriveItemTypeFromProfile } from '@/lib/wardrobe-style-profile';
import type { WardrobeItemTypeId } from '@/i18n/types';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

export type WardrobeProfileSelection = {
  name: string;
  itemType: WardrobeItemTypeId;
  styleProfile: ReturnType<typeof buildStyleProfile>;
};

type WardrobeProfilePickerProps = {
  onComplete: (selection: WardrobeProfileSelection) => void;
};

const FORMALITY_OPTIONS: WardrobeFormalityTag[] = [
  'casual',
  'smart_casual',
  'office',
  'elegant',
  'formal',
  'sporty',
];

function toggleInList<T extends string>(list: T[], value: T, max?: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (max && list.length >= max) return list;
  return [...list, value];
}

function WardrobeProfilePickerComponent({ onComplete }: WardrobeProfilePickerProps) {
  const t = useTranslation();
  const [slot, setSlot] = useState<WardrobeSlotId | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [color, setColor] = useState<WardrobeColorId | null>(null);
  const [styleTags, setStyleTags] = useState<WardrobeStyleTagId[]>([]);
  const [season, setSeason] = useState<WardrobeSeasonId | null>(null);
  const [useCases, setUseCases] = useState<WardrobeUseCaseId[]>([]);
  const [formality, setFormality] = useState<WardrobeFormalityTag | null>(null);

  const subtypes = useMemo(
    () => (slot ? [...WARDROBE_SUBCATEGORIES[slot]] : []),
    [slot],
  );

  const canSave =
    slot &&
    subcategory &&
    color &&
    styleTags.length > 0 &&
    season &&
    useCases.length > 0 &&
    formality;

  const emitSave = useCallback(() => {
    if (!canSave || !slot || !subcategory || !color || !season || !formality) return;
    const input: BuildStyleProfileInput = {
      slot,
      subcategory,
      color,
      styleTags,
      season,
      useCases,
      formality,
      isStatementPiece: false,
    };
    const styleProfile = buildStyleProfile(input);
    const itemType = deriveItemTypeFromProfile(styleProfile);
    const name =
      t.wardrobe.profileSubtypes[subcategory] ?? t.wardrobe.profileSlots[slot];
    onComplete({ name, itemType, styleProfile });
  }, [
    canSave,
    slot,
    subcategory,
    color,
    styleTags,
    season,
    useCases,
    formality,
    t,
    onComplete,
  ]);

  return (
    <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t.wardrobe.profileTitle}</Text>

      <Section label={t.wardrobe.profileStepSlot}>
        <ChipGrid>
          {WARDROBE_SLOT_ORDER.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileSlots[id]}
              active={slot === id}
              onPress={() => {
                setSlot(id);
                setSubcategory(null);
              }}
            />
          ))}
        </ChipGrid>
      </Section>

      {slot ? (
        <Section label={t.wardrobe.profileStepSubtype}>
          <ChipGrid>
            {subtypes.map((id) => (
              <Chip
                key={id}
                label={t.wardrobe.profileSubtypes[id] ?? id}
                active={subcategory === id}
                onPress={() => setSubcategory(id)}
              />
            ))}
          </ChipGrid>
        </Section>
      ) : null}

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

      <Section label={t.wardrobe.profileStepStyle}>
        <ChipGrid>
          {WARDROBE_STYLE_TAG_IDS.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileStyleTags[id]}
              active={styleTags.includes(id)}
              onPress={() => setStyleTags((prev) => toggleInList(prev, id, 4))}
            />
          ))}
        </ChipGrid>
      </Section>

      <Section label={t.wardrobe.profileStepSeason}>
        <ChipGrid>
          {WARDROBE_SEASON_IDS.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileSeasons[id]}
              active={season === id}
              onPress={() => setSeason(id)}
            />
          ))}
        </ChipGrid>
      </Section>

      <Section label={t.wardrobe.profileStepUseCase}>
        <ChipGrid>
          {WARDROBE_USE_CASE_IDS.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileUseCases[id]}
              active={useCases.includes(id)}
              onPress={() => setUseCases((prev) => toggleInList(prev, id, 4))}
            />
          ))}
        </ChipGrid>
      </Section>

      <Section label={t.wardrobe.profileStepFormality}>
        <ChipGrid>
          {FORMALITY_OPTIONS.map((id) => (
            <Chip
              key={id}
              label={t.wardrobe.profileFormalities[id]}
              active={formality === id}
              onPress={() => setFormality(id)}
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
