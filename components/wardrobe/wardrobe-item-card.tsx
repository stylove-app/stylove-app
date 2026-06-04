import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { WardrobeCatalogCard } from '@/components/wardrobe/wardrobe-catalog-card';
import type { WardrobeItem } from '@/lib/outfit-engine';

type WardrobeItemCardProps = {
  item: WardrobeItem;
  categoryLabel: string;
  size?: 'sm' | 'md' | 'lg';
};

function WardrobeItemCardComponent({ item, categoryLabel, size = 'md' }: WardrobeItemCardProps) {
  return (
    <View style={styles.wrap}>
      <WardrobeCatalogCard
        imageUri={item.imageUri}
        name={item.name}
        categoryLabel={categoryLabel}
        size={size}
      />
    </View>
  );
}

export const WardrobeItemCard = memo(WardrobeItemCardComponent);

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
});
