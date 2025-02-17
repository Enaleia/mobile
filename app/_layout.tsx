import "@expo/metro-runtime";

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

import { NetworkProvider } from "@/contexts/NetworkContext";
import { QueueProvider, useQueue } from "@/contexts/QueueContext";
import { defaultLocale, dynamicActivate } from "@/lib/i18n";
import { getCacheKey } from "@/utils/storage";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";
import { Asset } from "expo-asset";
import { ACTION_ICONS } from "@/constants/action";

SplashScreen.preventAutoHideAsync();

const preloadedFonts = {
  "DMSans-Bold": require("../assets/fonts/DMSans-Bold.ttf"),
  "DMSans-Light": require("../assets/fonts/DMSans-Light.ttf"),
  "DMSans-Medium": require("../assets/fonts/DMSans-Medium.ttf"),
  "DMSans-Regular": require("../assets/fonts/DMSans-Regular.ttf"),
};

const preloadedActionIcons = Object.values(ACTION_ICONS).map(
  (icon) => icon as number
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 60 * 24,
      structuralSharing: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 3,
      gcTime: Infinity,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: getCacheKey(),
  throttleTime: 2000,
});

const QueueNetworkHandler = () => {
  const backgroundManager = BackgroundTaskManager.getInstance();

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const status = !!state.isConnected;
      onlineManager.setOnline(status);

      if (status) {
        backgroundManager.processQueueItems().catch((error) => {
          console.error(
            "Failed to process queue items on connection restore:",
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
    async function prepare() {
      try {
        await Asset.loadAsync(preloadedActionIcons);
      } catch (e) {
        console.warn("Failed to pre-load icons:", e);
      }
    }

    prepare();
  }, []);

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
    <NetworkProvider>
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
          <QueueNetworkHandler />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="attest/new/[slug]"
              options={{ headerShown: false }}
            />
          </Stack>
        </PersistQueryClientProvider>
      </QueueProvider>
    </NetworkProvider>
  );
}
