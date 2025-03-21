import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function App() {
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const [tapCount, setTapCount] = useState(0);
  const [showClearCache, setShowClearCache] = useState(false);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const router = useRouter();

  // Add minimum loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 3000); // Reduced to 3 seconds for better UX

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Reset tap count after 2 seconds of no taps
  useEffect(() => {
    if (tapCount > 0) {
      console.log('Tap count:', tapCount);
      const timer = setTimeout(() => {
        setTapCount(0);
        console.log('Reset tap count');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  // Handle tap
  const handleTap = () => {
    console.log('Tap detected');
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount === 3) {
      console.log('Triple tap detected!');
      setShowClearCache(true);
      setTapCount(0);
    }
  };

  // Clear all stored data
  const clearCache = async () => {
    try {
      console.log('Clearing cache...');
      // Clear SecureStore
      await Promise.all([
        SecureStore.deleteItemAsync("auth_token"),
        SecureStore.deleteItemAsync("refresh_token"),
        SecureStore.deleteItemAsync("user_email"),
        SecureStore.deleteItemAsync("user_password"),
        SecureStore.deleteItemAsync("token_expiry"),
      ]);

      // Clear AsyncStorage
      await AsyncStorage.clear();

      console.log('Cache cleared successfully');
      // Hide the button and continue loading
      setShowClearCache(false);
      
      // Force reload the app
      router.replace("/login");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  };

  // Show loading screen while either auth is loading or minimum time hasn't elapsed
  if (authLoading || !minLoadingComplete) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        onPress={handleTap}
        activeOpacity={0.7}
      >
        <View style={styles.contentContainer}>
          {showClearCache ? (
            <View style={styles.clearCacheContainer}>
              <Text style={styles.clearCacheText} onPress={clearCache}>
                Clear Cache
              </Text>
            </View>
          ) : (
            <>
              <ActivityIndicator size="large" color="#0000ff" />
              {tapCount > 0 && (
                <Text style={styles.tapCountText}>
                  {3 - tapCount} more taps needed
                </Text>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Only redirect after loading is complete
  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Adding background color
  },
  contentContainer: {
    alignItems: 'center',
  },
  clearCacheContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearCacheText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  tapCountText: {
    marginTop: 20,
    color: '#666',
    fontSize: 14,
  },
});
