import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import * as SplashScreen from "expo-splash-screen";

const App = () => {
  const { isAuthenticated, isLoading, autoLogin } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  useEffect(() => {
    // Try to auto login when the app starts
    autoLogin();
  }, []);

  // Make sure we don't hide the loading screen until we've determined auth state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white-sand">
        <ActivityIndicator size="large" color="#2985D0" />
      </View>
    );
  }

  // If authenticated, go to tabs
  // If not authenticated but offline with stored credentials, autoLogin will handle it
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />;
};

export default App;
