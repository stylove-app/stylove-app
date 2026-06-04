import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useScrollToTop } from '@react-navigation/native';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WardrobeCatalogCard } from '@/components/wardrobe/wardrobe-catalog-card';
import { WardrobeItemCard } from '@/components/wardrobe/wardrobe-item-card';
import {
  WardrobeProfilePicker,
  type WardrobeProfileSelection,
} from '@/components/wardrobe/wardrobe-profile-picker';
import { EmptyState } from '@/components/ui/empty-state';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { LuxuryToast } from '@/components/ui/luxury-toast';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { useWardrobeActions, useWardrobeState } from '@/contexts/wardrobe-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTranslation } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { isWardrobeItemLimitReached } from '@/lib/free-plan-limits';
import { WARDROBE_IMAGE_PICKER_OPTIONS } from '@/lib/wardrobe-image-picker';
import { hapticLight } from '@/lib/haptics';
import { WARDROBE_CATEGORIES, type WardrobeItem } from '@/lib/outfit-engine';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import type { WardrobeCategoryId } from '@/i18n/types';

function WardrobeScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { stylingItems, ready, loadError } = useWardrobeState();
  const { addItem, removeItem, getByCategory, retryLoad } = useWardrobeActions();
  const { recordWardrobeAdd } = useStyleMemory();
  const { isPremium } = usePremium();

  const [filter, setFilter] = useState<WardrobeCategoryId | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [profileLabel, setProfileLabel] = useState<string | null>(null);
  const [limitToastVisible, setLimitToastVisible] = useState(false);

  const scrollRef = useRef<FlatList<WardrobeItem>>(null);
  useScrollToTop(scrollRef);
  const filtered = useMemo(
    () => (filter === 'all' ? stylingItems : getByCategory(filter)),
    [filter, stylingItems, getByCategory],
  );

  const handleRetryLoad = useCallback(async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await retryLoad();
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryLoad]);

  const openPickerResult = useCallback((uri: string) => {
    setPendingUri(uri);
    setProfileLabel(null);
    setModalVisible(true);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.wardrobe.permissionDeniedTitle, t.wardrobe.permissionDeniedBody);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync(WARDROBE_IMAGE_PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      openPickerResult(result.assets[0].uri);
    }
  }, [openPickerResult, t]);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.wardrobe.permissionDeniedTitle, t.wardrobe.permissionDeniedBody);
      return;
    }

    const result = await ImagePicker.launchCameraAsync(WARDROBE_IMAGE_PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      openPickerResult(result.assets[0].uri);
    }
  }, [openPickerResult, t]);

  const showUploadOptions = useCallback(() => {
    if (!isPremium && isWardrobeItemLimitReached(stylingItems.length)) {
      setLimitToastVisible(true);
      return;
    }

    Alert.alert(t.wardrobe.addPiece, undefined, [
      { text: t.wardrobe.takePhoto, onPress: () => void pickFromCamera() },
      { text: t.wardrobe.chooseFromGallery, onPress: () => void pickFromLibrary() },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  }, [isPremium, stylingItems.length, t, pickFromCamera, pickFromLibrary]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setPendingUri(null);
    setIsSaving(false);
    setProfileLabel(null);
  }, []);

  const saveFromProfile = useCallback(
    async (selection: WardrobeProfileSelection) => {
      if (!pendingUri || isSaving) return;
      if (!isPremium && isWardrobeItemLimitReached(stylingItems.length)) {
        setLimitToastVisible(true);
        return;
      }

      Keyboard.dismiss();
      setIsSaving(true);
      setProfileLabel(selection.name);
      try {
        const newItem = await addItem({
          name: selection.name,
          itemType: selection.itemType,
          styleProfile: selection.styleProfile,
          localImageUri: pendingUri,
        });
        recordWardrobeAdd(newItem);
        closeModal();
      } catch {
        Alert.alert(t.profile.account.errorTitle, t.wardrobe.saveError);
      } finally {
        setIsSaving(false);
      }
    },
    [
      pendingUri,
      isSaving,
      isPremium,
      stylingItems.length,
      addItem,
      recordWardrobeAdd,
      closeModal,
      t,
    ],
  );

  const confirmRemove = useCallback(
    (id: string) => {
      Alert.alert(t.wardrobe.removeTitle, t.wardrobe.removeConfirm, [
        { text: t.common.decline, style: 'cancel' },
        {
          text: t.wardrobe.removeAction,
          style: 'destructive',
          onPress: () => {
            void hapticLight();
            void removeItem(id).catch(() => {
              Alert.alert(t.profile.account.errorTitle, t.wardrobe.removeError);
            });
          },
        },
      ]);
    },
    [t, removeItem],
  );

  const renderWardrobeItem = useCallback(
    ({ item }: { item: WardrobeItem }) => (
      <View style={styles.gridItem}>
        <WardrobeItemCard
          item={item}
          categoryLabel={t.wardrobeTypes[item.itemType]}
          size="md"
        />
        <Pressable
          onPress={() => confirmRemove(item.id)}
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deletePressed]}
          hitSlop={8}>
          <Ionicons name="trash-outline" size={15} color={StyloveColors.burgundyRich} />
        </Pressable>
      </View>
    ),
    [confirmRemove, t.wardrobeTypes],
  );

  const listHeader = useMemo(
    () => (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>{t.wardrobe.title}</Text>
          <Text style={styles.subtitle}>{t.wardrobe.subtitle}</Text>
          <View style={styles.collectionNoteWrap}>
            <Text style={styles.collectionGrowing}>{t.wardrobe.collectionGrowing}</Text>
            <Text style={styles.collectionNote}>{t.wardrobe.collectionNote}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          <Pressable
            onPress={() => setFilter('all')}
            style={({ pressed }) => [
              styles.filterChip,
              filter === 'all' && styles.filterActive,
              pressed && styles.chipPressed,
            ]}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t.wardrobe.filterAll}
            </Text>
          </Pressable>
          {WARDROBE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setFilter(cat)}
              style={({ pressed }) => [
                styles.filterChip,
                filter === cat && styles.filterActive,
                pressed && styles.chipPressed,
              ]}>
              <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>
                {t.categories[cat]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.uploadCard, pressed && styles.uploadPressed]}
          onPress={showUploadOptions}>
          <View style={styles.uploadIconWrap}>
            <Ionicons name="add" size={22} color={StyloveColors.goldMuted} />
          </View>
          <Text style={styles.uploadText}>{t.wardrobe.addPiece}</Text>
        </Pressable>

        {!ready ? (
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.gridItem}>
                <SkeletonShimmer height={220} borderRadius={18} />
              </View>
            ))}
          </View>
        ) : loadError ? (
          <EmptyState
            title={t.wardrobe.loadErrorTitle}
            subtitle={t.wardrobe.loadErrorSubtitle}
            actionLabel={t.wardrobe.retryLoad}
            onAction={() => void handleRetryLoad()}
            actionLoading={isRetrying}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={stylingItems.length === 0 ? t.wardrobe.emptyTitle : t.wardrobe.filterEmptyTitle}
            subtitle={
              stylingItems.length === 0 ? t.wardrobe.emptySubtitle : t.wardrobe.filterEmptySubtitle
            }
          />
        ) : null}
      </>
    ),
    [
      t,
      filter,
      ready,
      loadError,
      filtered.length,
      stylingItems.length,
      isRetrying,
      handleRetryLoad,
      showUploadOptions,
    ],
  );

  const listFooter = useMemo(() => <StyloveFooter />, []);

  const screenStyle = useMemo(() => [styles.screen, { paddingTop: insets.top }], [insets.top]);
  const listContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + 100 }),
    [insets.bottom],
  );

  return (
    <View style={screenStyle}>
      <FlatList
        ref={scrollRef}
        data={ready && !loadError ? filtered : []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={renderWardrobeItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={listContentStyle}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss} accessibilityRole="button" />
          <View style={styles.modal}>
            {pendingUri ? (
              <View style={styles.previewWrap}>
                <WardrobeCatalogCard
                  imageUri={pendingUri}
                  size="lg"
                  editorialBackdrop
                  isPreparing={isSaving}
                  categoryLabel={profileLabel ?? undefined}
                />
              </View>
            ) : null}
            <WardrobeProfilePicker onComplete={(selection) => void saveFromProfile(selection)} />
            <View style={styles.modalActions}>
              <LuxuryButton
                label={t.common.cancel}
                variant="ghost"
                onPress={closeModal}
                disabled={isSaving}
              />
            </View>
          </View>
        </View>
      </Modal>
      <LuxuryToast
        visible={limitToastVisible}
        title={t.limits.wardrobeTitle}
        subtitle={t.limits.freeWardrobeLimit}
        onHide={() => setLimitToastVisible(false)}
        durationMs={4200}
      />
    </View>
  );
}

export default memo(WardrobeScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: StyloveColors.ivory,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    color: StyloveColors.black,
  },
  subtitle: {
    fontSize: 12,
    color: StyloveColors.gray,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  collectionNoteWrap: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: StyloveColors.creamRich,
    gap: 4,
  },
  collectionGrowing: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    color: StyloveColors.burgundy,
  },
  collectionNote: {
    fontSize: 12,
    color: StyloveColors.grayLight,
    lineHeight: 18,
  },
  filters: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
    backgroundColor: StyloveColors.white,
  },
  filterActive: {
    backgroundColor: StyloveColors.burgundy,
    borderColor: StyloveColors.burgundy,
  },
  filterText: {
    fontSize: 12,
    color: StyloveColors.gray,
  },
  filterTextActive: {
    color: StyloveColors.ivory,
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  uploadCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    height: 108,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.35)',
    borderStyle: 'dashed',
    backgroundColor: StyloveColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...StyloveShadow.soft,
  },
  uploadPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  uploadIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: StyloveColors.ivory,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 13,
    color: StyloveColors.burgundy,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    gap: 14,
  },
  gridRow: {
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 14,
  },
  gridItem: {
    flex: 1,
    maxWidth: '48%',
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
    zIndex: 2,
  },
  deletePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 5, 9, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  previewWrap: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modal: {
    backgroundColor: StyloveColors.white,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
    ...StyloveShadow.editorial,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
