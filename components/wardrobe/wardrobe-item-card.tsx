import { StyleSheet, Text, View } from 'react-native';

import { WardrobeCatalogCard } from '@/components/wardrobe/wardrobe-catalog-card';
import { WardrobeImageProcessing } from '@/components/wardrobe/wardrobe-image-processing';
import { useTranslation } from '@/contexts/locale-context';
import type { WardrobeItem } from '@/lib/outfit-engine';
import {
  getWardrobeDisplayUri,
  isWardrobeCutout,
  isWardrobeProcessing,
  isWardrobeProcessingFailed,
} from '@/lib/wardrobe-display';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type WardrobeItemCardProps = {
  item: WardrobeItem;
  categoryLabel: string;
  size?: 'sm' | 'md' | 'lg';
};

export function WardrobeItemCard({ item, categoryLabel, size = 'md' }: WardrobeItemCardProps) {
  const t = useTranslation();
  const processing = isWardrobeProcessing(item);
  const failed = isWardrobeProcessingFailed(item);
  const displayUri = getWardrobeDisplayUri(item);

  return (
    <View style={styles.wrap}>
      <WardrobeCatalogCard
        imageUri={displayUri}
        name={item.name}
        categoryLabel={categoryLabel}
        size={size}
        cutout={isWardrobeCutout(item)}
      />
      {processing ? (
        <WardrobeImageProcessing
          visible
          messages={[t.wardrobe.silhouetteCleaning, ...t.wardrobe.preparingBackground]}
          intervalMs={2200}
        />
      ) : null}
      {failed ? (
        <View style={styles.failedBanner}>
          <Text style={styles.failedText}>{t.wardrobe.backgroundRetryLater}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  failedBanner: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  failedText: {
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    color: StyloveColors.burgundy,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
  },
});
