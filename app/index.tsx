import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { directus } from "@/utils/directus";
import { ActivityIndicator, View } from "react-native";

const App = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await directus.getToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error("Error checking authentication:", error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/login"} />;
};

export default App;
