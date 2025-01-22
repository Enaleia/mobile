import "@expo/metro-runtime";

import "@formatjs/intl-locale/polyfill-force";
import "@formatjs/intl-pluralrules/locale-data/ar";
import "@formatjs/intl-pluralrules/locale-data/el";
import "@formatjs/intl-pluralrules/locale-data/en";
import "@formatjs/intl-pluralrules/polyfill-force";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";

import * as Localization from "expo-localization";

import { defaultLocale, dynamicActivate } from "@/lib/i18n";
import { processQueueItems } from "@/services/queueProcessor";
import { QueueProvider } from "@/contexts/QueueContext";

SplashScreen.preventAutoHideAsync();

const preloadedFonts = {
  "DMSans-Bold": require("../assets/fonts/DMSans-Bold.ttf"),
  "DMSans-Light": require("../assets/fonts/DMSans-Light.ttf"),
  "DMSans-Medium": require("../assets/fonts/DMSans-Medium.ttf"),
  "DMSans-Regular": require("../assets/fonts/DMSans-Regular.ttf"),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
    },
    mutations: {
      retry: 3,
      gcTime: Infinity,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "enaleia-cache-v0",
  throttleTime: 2000,
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts(preloadedFonts);
  const locale = Localization.getLocales()[0]?.languageCode || defaultLocale;

  useEffect(() => {
    dynamicActivate(locale);
  }, [locale]);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const status = !!state.isConnected;
      onlineManager.setOnline(status);

      // If connection restored, try processing queue
      if (status) {
        processQueueItems();
      }
    });
  }, []);

  useEffect(() => {
    if (loaded || error) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Clear AsyncStorage and React Query cache on app startup
  // useEffect(() => {
  //   const clearCaches = async () => {
  //     try {
  //       await AsyncStorage.clear();
  //       console.log("[Cache] AsyncStorage cleared successfully");

  //       queryClient.clear();
  //       console.log("[Cache] React Query cache cleared successfully");
  //     } catch (error) {
  //       console.error("[Cache] Error clearing caches:", error);
  //     }
  //   };

  //   clearCaches();
  // }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueueProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen
            name="attest/new/[type]"
            options={{ headerShown: false }}
          />
        </Stack>
      </PersistQueryClientProvider>
    </QueueProvider>
  );
}
