import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { LuxuryButton } from '@/components/ui/luxury-button';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import {
  fetchOfferings,
  isPremiumFromCustomerInfo,
  purchasePackage,
  restoreRevenueCatPurchases,
} from '@/services/revenuecat';

type RevenueCatPaywallProps = {
  /** Satın alma veya restore sonrası çağrılır (ör. ekranı kapat). */
  onPurchaseSuccess?: () => void;
};

/**
 * RevenueCat "current" offering (dashboard'da default olarak işaretlenen) paketlerini listeler.
 * Her paket için "Satın Al" → services/revenuecat.purchasePackage(pkg).
 */
export function RevenueCatPaywall({ onPurchaseSuccess }: RevenueCatPaywallProps) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const offerings = await fetchOfferings();
      const current = offerings?.current ?? null;
      setOfferingId(current?.identifier ?? null);
      setPackages(current?.availablePackages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setBusyPackageId(pkg.identifier);
    try {
      const result = await purchasePackage(pkg);
      if (result.ok) {
        onPurchaseSuccess?.();
        Alert.alert('Başarılı', 'Aboneliğiniz aktif.');
        return;
      }
      if (!result.cancelled) {
        Alert.alert('Satın alma başarısız', result.message ?? 'Bir hata oluştu.');
      }
    } finally {
      setBusyPackageId(null);
    }
  };

  const handleRestore = async () => {
    const { restored, customerInfo } = await restoreRevenueCatPurchases();
    if (restored && isPremiumFromCustomerInfo(customerInfo)) {
      onPurchaseSuccess?.();
      Alert.alert('Geri yüklendi', 'Aboneliğiniz geri yüklendi.');
      return;
    }
    Alert.alert('Geri yükleme', 'Aktif abonelik bulunamadı.');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={StyloveColors.goldSoft} />
        <Text style={styles.loadingText}>Paketler yükleniyor…</Text>
      </View>
    );
  }

  if (packages.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Paket bulunamadı</Text>
        <Text style={styles.emptyText}>
          RevenueCat current offering boş veya yüklenemedi
          {offeringId ? ` (${offeringId})` : ''}.
        </Text>
        <LuxuryButton label="Yeniden dene" variant="gold" onPress={() => void loadPackages()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Stylove Premium</Text>
      {offeringId ? <Text style={styles.subtitle}>Offering: {offeringId}</Text> : null}

      {packages.map((pkg) => {
        const busy = busyPackageId === pkg.identifier;
        return (
          <View key={pkg.identifier} style={[styles.card, StyloveShadow.soft]}>
            <Text style={styles.packageId}>{pkg.identifier}</Text>
            <Text style={styles.productId}>{pkg.product.identifier}</Text>
            <Text style={styles.price}>{pkg.product.priceString}</Text>
            <LuxuryButton
              label={busy ? 'İşleniyor…' : 'Satın Al'}
              variant="gold"
              disabled={busyPackageId !== null}
              onPress={() => void handlePurchase(pkg)}
            />
          </View>
        );
      })}

      <Pressable onPress={() => void handleRestore()} style={styles.restoreLink} accessibilityRole="button">
        <Text style={styles.restoreText}>Satın alımları geri yükle</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: StyloveColors.ivory,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(248,244,237,0.55)',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    color: 'rgba(248,244,237,0.65)',
    fontSize: 13,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: StyloveColors.ivory,
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(248,244,237,0.65)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.35)',
    backgroundColor: 'rgba(196,160,98,0.1)',
    padding: 20,
    gap: 8,
  },
  packageId: {
    color: StyloveColors.goldSoft,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  productId: {
    color: 'rgba(248,244,237,0.55)',
    fontSize: 12,
  },
  price: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    color: StyloveColors.ivory,
    marginBottom: 4,
  },
  restoreLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  restoreText: {
    color: StyloveColors.goldSoft,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
