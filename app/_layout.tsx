import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { PremiumProvider } from '@/contexts/premium-context';
import { AppNavigationProvider } from '@/contexts/app-navigation-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { LooksProvider } from '@/contexts/looks-context';
import { StyleMemoryProvider } from '@/contexts/style-memory-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import { UserProfileProvider } from '@/contexts/user-profile-context';
import { WardrobeProvider } from '@/contexts/wardrobe-context';
import { WeatherProvider } from '@/contexts/weather-context';
import { AnalyticsProvider } from '@/contexts/analytics-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { EditorialOnboardingColors } from '@/constants/editorial-onboarding-theme';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { isSentryEnabled, sentryNavigationIntegration, withSentryRoot } from '@/lib/sentry';

function RootStack() {
  const { isDark } = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 180,
          freezeOnBlur: true,
        }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="premium"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="weekly-summary"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="share-look"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <UserProfileProvider>
          <PremiumProvider>
            <AppNavigationProvider>
              <NotificationsProvider>
                <WeatherProvider>
                  <StyleMemoryProvider>
                    <WardrobeProvider>
                      <LooksProvider>{children}</LooksProvider>
                    </WardrobeProvider>
                  </StyleMemoryProvider>
                </WeatherProvider>
              </NotificationsProvider>
            </AppNavigationProvider>
          </PremiumProvider>
        </UserProfileProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
}

function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (Platform.OS !== 'web' && isSentryEnabled) {
      sentryNavigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  if (Platform.OS === 'web') {
    return <WebUnsupported />;
  }

  return (
    <LocaleProvider>
      <ThemeProvider>
        <AppProviders>
          <RootStack />
        </AppProviders>
      </ThemeProvider>
    </LocaleProvider>
  );
}

export default withSentryRoot(RootLayout);

function WebUnsupported() {
  return (
    <View style={styles.webUnsupported}>
      <Text style={styles.webUnsupportedText}>
        Stylove şu anda yalnızca mobil uygulama olarak destekleniyor.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webUnsupported: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: EditorialOnboardingColors.background,
  },
  webUnsupportedText: {
    maxWidth: 360,
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 30,
    color: EditorialOnboardingColors.burgundy,
    textAlign: 'center',
  },
});
