import { useEffect } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";

const App = () => {
  const { isAuthenticated, isLoading, autoLogin } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  useEffect(() => {
    // Try to auto login when the app starts
    autoLogin();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If authenticated, go to tabs
  // If not authenticated but offline with stored credentials, autoLogin will handle it
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/login"} />;
};

export default App;
