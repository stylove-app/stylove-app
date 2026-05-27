import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persisted flag: first-launch onboarding has been completed. */
export const ONBOARDING_KEY = '@stylove/onboarding-complete';

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function clearOnboardingComplete(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

/** Alias for onboardingCompleted persistence. */
export const setOnboardingCompleted = setOnboardingComplete;
export const isOnboardingCompleted = isOnboardingComplete;
export const clearOnboardingCompleted = clearOnboardingComplete;
