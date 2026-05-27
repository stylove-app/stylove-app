import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CuratedLook } from '@/lib/outfit-engine';
import { hapticLight } from '@/lib/haptics';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type CompactLookCardProps = {
  look: CuratedLook;
  onPress?: () => void;
  onDelete?: () => void;
  wide?: boolean;
};

export function CompactLookCard({ look, onPress, onDelete, wide }: CompactLookCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        wide && styles.cardWide,
        look.usesWardrobeImage && styles.cardWardrobe,
        pressed && styles.pressed,
      ]}>
      <Image
        source={{ uri: look.image }}
        style={styles.image}
        contentFit={look.usesWardrobeImage ? 'contain' : 'cover'}
        transition={300}
      />
      {!look.usesWardrobeImage ? <View style={styles.overlay} /> : null}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {look.title}
        </Text>
        <Text style={styles.occasion} numberOfLines={1}>
          {look.occasion}
        </Text>
      </View>
      <View style={styles.score}>
        <Text style={styles.scoreText}>{look.eleganceScore}</Text>
      </View>
      {onDelete ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            void hapticLight();
            onDelete();
          }}
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deletePressed]}
          hitSlop={8}>
          <Ionicons name="trash-outline" size={14} color={StyloveColors.burgundyRich} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: StyloveColors.black,
    ...StyloveShadow.soft,
  },
  cardWardrobe: {
    backgroundColor: StyloveColors.ivory,
  },
  cardWide: {
    width: '100%',
    height: 280,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,20,0.28)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: StyloveColors.ivory,
    letterSpacing: 0.2,
  },
  occasion: {
    fontSize: 11,
    color: 'rgba(248,244,237,0.75)',
    fontStyle: 'italic',
  },
  score: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,247,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
  },
  scoreText: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    color: StyloveColors.burgundy,
  },
  deleteBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,252,247,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
  },
  deletePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
