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
import { QueueProvider, useQueue } from "@/contexts/QueueContext";

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
      gcTime: 1000 * 60 * 60 * 24,
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24,
      enabled: false,
    },
    mutations: {
      retry: 3,
      gcTime: Infinity,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: process.env.EXPO_PUBLIC_CACHE_KEY,
  throttleTime: 2000,
});

const NetworkHandler = () => {
  const { loadQueueItems } = useQueue();

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const status = !!state.isConnected;
      onlineManager.setOnline(status);

      if (status) {
        loadQueueItems().catch((error) => {
          console.error(
            "Failed to refresh queue items on connection restore:",
            error
          );
        });
      }
    });
  }, []);

  return null;
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts(preloadedFonts);
  const locale = Localization.getLocales()[0]?.languageCode || defaultLocale;

  useEffect(() => {
    dynamicActivate(locale);
  }, [locale]);

  useEffect(() => {
    if (loaded || error) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueueProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          dehydrateOptions: {
            shouldDehydrateQuery: ({ queryKey }) => {
              return queryKey.includes("batchData");
            },
          },
        }}
      >
        <NetworkHandler />
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
