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
import { memo, useEffect, useMemo, useState } from "react";

import { i18n } from "@lingui/core";
import { I18nProvider, TransRenderProps } from "@lingui/react";
import { Text } from "react-native";

import * as Localization from "expo-localization";

import { defaultLocale, dynamicActivate } from "@/lib/i18n";

SplashScreen.preventAutoHideAsync();

const preloadedFonts = {
  "DMSans-Bold": require("../assets/fonts/DMSans-Bold.ttf"),
  "DMSans-Light": require("../assets/fonts/DMSans-Light.ttf"),
  "DMSans-Medium": require("../assets/fonts/DMSans-Medium.ttf"),
  "DMSans-Regular": require("../assets/fonts/DMSans-Regular.ttf"),
};

const DefaultComponent = memo((props: TransRenderProps) => {
  return <Text>{props.children}</Text>;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 3,
      gcTime: Infinity,
    },
  },
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts(preloadedFonts);

  const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "enaleia-cache-v0",
    throttleTime: 2000,
  });

  const locale = Localization.getLocales()[0]?.languageCode || defaultLocale;

  const stackScreens = useMemo(
    () => (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="attest/new/[type]" />
      </Stack>
    ),
    []
  );

  useEffect(() => {
    dynamicActivate(locale);
  }, [locale]);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const status = !!state.isConnected;
      onlineManager.setOnline(status);
    });
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
      onSuccess={() =>
        queryClient
          .resumePausedMutations()
          .then(() => queryClient.invalidateQueries())
      }
    >
      <I18nProvider i18n={i18n} defaultComponent={DefaultComponent}>
        {stackScreens}
      </I18nProvider>
    </PersistQueryClientProvider>
  );
}
