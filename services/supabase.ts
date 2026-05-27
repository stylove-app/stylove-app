import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = 'https://pdiekeuwsnwokagorshl.supabase.co';

const supabaseKey = 'sb_publishable_XAQVgGhyyYuPSTFVJJU9Kw_QRZ-dvjk';

const isServer = typeof window === 'undefined';

const authStorage =
  isServer
    ? {
        getItem: async () => null,
        setItem: async () => undefined,
        removeItem: async () => undefined,
      }
    : Platform.OS === 'web'
      ? {
          getItem: async (key: string) => window.localStorage.getItem(key),
          setItem: async (key: string, value: string) => {
            window.localStorage.setItem(key, value);
          },
          removeItem: async (key: string) => {
            window.localStorage.removeItem(key);
          },
        }
      : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (!isServer) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
