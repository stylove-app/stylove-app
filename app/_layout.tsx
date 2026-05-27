import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

function RootStack() {
  const { isDark } = useTheme();
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 280 }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen
          name="premium"
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
      <UserProfileProvider>
        <PremiumProvider>
          <AppNavigationProvider>
            <WeatherProvider>
              <StyleMemoryProvider>
                <WardrobeProvider>
                  <LooksProvider>{children}</LooksProvider>
                </WardrobeProvider>
              </StyleMemoryProvider>
            </WeatherProvider>
          </AppNavigationProvider>
        </PremiumProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
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
    backgroundColor: StyloveColors.wineDeep,
  },
  webUnsupportedText: {
    maxWidth: 360,
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 30,
    color: StyloveColors.creamText,
    textAlign: 'center',
  },
});
