import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { WardrobeItemCard } from '@/components/wardrobe/wardrobe-item-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { useWardrobeState } from '@/contexts/wardrobe-context';
import { useTranslation } from '@/contexts/locale-context';
import { StyloveColors } from '@/constants/stylove-theme';

function WardrobePreviewComponent() {
  const t = useTranslation();
  const { stylingItems } = useWardrobeState();
  const preview = useMemo(() => stylingItems.slice(0, 8), [stylingItems]);

  if (preview.length === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader title={t.home.yourWardrobe} subtitle={t.home.wardrobeSubtitle} />
        <EmptyState
          title={t.wardrobe.emptyTitle}
          subtitle={t.wardrobe.emptySubtitle}
          compact
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title={t.home.yourWardrobe}
        subtitle={t.home.wardrobeSubtitle}
        actionLabel={t.common.seeAll}
        onAction={() => router.push('/(tabs)/wardrobe')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {preview.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => router.push('/(tabs)/wardrobe')}>
            <WardrobeItemCard
              item={item}
              categoryLabel={t.wardrobeTypes[item.itemType]}
              size="sm"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export const WardrobePreview = memo(WardrobePreviewComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  row: {
    paddingHorizontal: 24,
    gap: 14,
  },
  item: {
    width: 130,
  },
  itemPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
