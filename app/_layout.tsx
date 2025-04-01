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
import { DevModeProvider } from "@/contexts/DevModeContext";

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
  const [fontsLoaded] = useFonts(preloadedFonts);
  const locale = Localization.getLocales()[0]?.languageCode || defaultLocale;

  useEffect(() => {
    dynamicActivate(locale);
  }, [locale]);

  useEffect(() => {
    async function prepare() {
      try {
        // Load all assets in parallel
        const [assetsLoaded] = await Promise.all([
          Asset.loadAsync(preloadedActionIcons),
          // Add any other asset loading here if needed
        ]);
        
        // Only set app as ready when both fonts and assets are loaded
        if (fontsLoaded && assetsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn("Failed to pre-load assets:", e);
        // Even if asset loading fails, we should still show the app
        if (fontsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NetworkProvider>
      <DevModeProvider>
        <WalletProvider>
          <AuthProvider>
            <QueueProvider>
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
                <Stack.Screen
                  name="queue/[id]"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="settings/wallet"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="settings/queue-test"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
              <StatusBar barStyle="dark-content" />
            </QueueProvider>
          </AuthProvider>
        </WalletProvider>
      </DevModeProvider>
    </NetworkProvider>
  );
}
