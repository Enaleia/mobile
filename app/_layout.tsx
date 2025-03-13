import "@expo/metro-runtime";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StatusBar } from "react-native";

import * as Localization from "expo-localization";

import { NetworkProvider } from "@/contexts/NetworkContext";
import { QueueProvider, useQueue } from "@/contexts/QueueContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { defaultLocale, dynamicActivate } from "@/lib/i18n";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";
import { Asset } from "expo-asset";
import { ACTION_ICONS } from "@/constants/action";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";

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

const QueueNetworkHandler = () => {
  const backgroundManager = BackgroundTaskManager.getInstance();
  const { wallet } = useWallet();
  const { loadQueueItems } = useQueue();

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected;

      if (isOnline) {
        // Just load queue items, let QueueContext handle processing
        loadQueueItems().catch((error) => {
          console.error("Failed to load queue items:", error);
        });
      }
    });
  }, [wallet]);

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
      <WalletProvider>
        <AuthProvider>
          <QueueProvider>
            <QueueNetworkHandler />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "white" },
                navigationBarHidden: true,
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(auth)/login"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="attest/new/[slug]"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
            <StatusBar barStyle="dark-content" />
          </QueueProvider>
        </AuthProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}
