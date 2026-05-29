import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/locale-context';

const INPUT_HEIGHT = 96;

type StylingIntentProps = {
  onIntentChange?: (text: string) => void;
  onReveal: (intent: string) => void;
  isGenerating?: boolean;
  wardrobeLoading?: boolean;
  wardrobeEmpty?: boolean;
  presetIntent?: string;
};

function StylingIntentComponent({
  onIntentChange,
  onReveal,
  isGenerating,
  wardrobeLoading,
  wardrobeEmpty,
  presetIntent,
}: StylingIntentProps) {
  const t = useTranslation();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!presetIntent) return;
    setValue(presetIntent);
    onIntentChange?.(presetIntent);
  }, [presetIntent, onIntentChange]);

  const commitValue = useCallback(
    (next: string) => {
      setValue(next);
      onIntentChange?.(next);
    },
    [onIntentChange],
  );

  const handleReveal = useCallback(() => {
    Keyboard.dismiss();
    onReveal(value.trim());
  }, [onReveal, value]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.accentLineWrap}>
          <GoldShimmerLine width={200} />
        </View>
        <Text style={styles.title}>{t.intent.title}</Text>
        <Text style={styles.subtitle}>{t.intent.subtitle}</Text>

        <View style={styles.inputFrame}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={t.intent.placeholder}
            placeholderTextColor={StyloveColors.grayLight}
            style={styles.input}
            multiline
            scrollEnabled
            blurOnSubmit={false}
            returnKeyType="default"
            textAlignVertical="top"
            onBlur={() => onIntentChange?.(value)}
            onSubmitEditing={handleReveal}
          />
        </View>

        <LuxuryButton
          label={t.home.revealLook}
          onPress={handleReveal}
          variant="gold"
          disabled={isGenerating || wardrobeLoading || wardrobeEmpty}
        />
        {wardrobeLoading ? (
          <Text style={styles.loadingHint}>{t.home.wardrobeLoadingHint}</Text>
        ) : wardrobeEmpty ? (
          <Text style={styles.loadingHint}>{t.home.emptyWardrobeHint}</Text>
        ) : null}

        <Text style={styles.suggestionsLabel}>{t.intent.suggestionsLabel}</Text>
        <View style={styles.suggestions}>
          {t.intent.suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
                commitValue(suggestion);
              }}
              style={styles.suggestion}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export const StylingIntent = memo(StylingIntentComponent);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: StyloveColors.white,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
    overflow: 'hidden',
    ...StyloveShadow.editorial,
  },
  accentLineWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 0,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: StyloveColors.black,
    letterSpacing: 0.2,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: StyloveColors.gray,
    fontStyle: 'italic',
    marginBottom: 22,
  },
  inputFrame: {
    backgroundColor: StyloveColors.ivory,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
    marginBottom: 20,
    height: INPUT_HEIGHT,
  },
  input: {
    height: INPUT_HEIGHT,
    padding: 18,
    fontSize: 16,
    lineHeight: 24,
    color: StyloveColors.black,
    fontFamily: Fonts.serif,
  },
  suggestionsLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: StyloveColors.grayLight,
    marginTop: 22,
    marginBottom: 10,
  },
  loadingHint: {
    marginTop: 10,
    fontSize: 12,
    color: StyloveColors.grayLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  suggestions: {
    gap: 8,
  },
  suggestion: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: StyloveColors.ivory,
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
  },
  suggestionText: {
    fontSize: 13,
    color: StyloveColors.gray,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});
