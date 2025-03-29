import "@expo/metro-runtime";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StatusBar, LogBox, AppState, View, Text, Platform } from "react-native";

import * as Localization from "expo-localization";

import { NetworkProvider } from "@/contexts/NetworkContext";
import { QueueProvider, useQueue } from "@/contexts/QueueContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { defaultLocale, dynamicActivate } from "@/lib/i18n";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";
import { ACTION_ICONS } from "@/constants/action";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";

// Ignore specific warnings that might affect production
LogBox.ignoreLogs([
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
]);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

const preloadedFonts = {
  "DMSans-Bold": require("../assets/fonts/DMSans-Bold.ttf"),
  "DMSans-Light": require("../assets/fonts/DMSans-Light.ttf"),
  "DMSans-Medium": require("../assets/fonts/DMSans-Medium.ttf"),
  "DMSans-Regular": require("../assets/fonts/DMSans-Regular.ttf"),
};

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
  const [error, setError] = useState<Error | null>(null);
  const [fontsLoaded, fontError] = useFonts(preloadedFonts);
  const locale = Localization.getLocales()[0]?.languageCode || defaultLocale;

  useEffect(() => {
    async function prepare() {
      try {
        // Load locale
        await dynamicActivate(locale);
      } catch (e) {
        console.warn("Error loading locale:", e);
        if (e instanceof Error) setError(e);
      }
    }

    prepare();
  }, [locale]);

  useEffect(() => {
    if (fontError) {
      console.warn("Error loading fonts:", fontError);
      setError(fontError);
      setAppIsReady(true);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      // Only hide splash screen when fonts are loaded
      const timer = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("Error hiding splash screen:", e);
        } finally {
          setAppIsReady(true);
        }
      }, Platform.OS === 'ios' ? 200 : 0);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Refresh app state when coming to foreground
        if (!appIsReady) {
          setAppIsReady(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // Show error UI if initialization failed
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F4F2', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#0D0D0D' }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 16, color: '#5C5C61', textAlign: 'center', marginBottom: 10 }}>
          {error.message}
        </Text>
        <Text style={{ fontSize: 14, color: '#8E8E93' }}>
          Please try restarting the app
        </Text>
      </View>
    );
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
