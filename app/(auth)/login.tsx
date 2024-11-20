import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence, MotiText } from "moti";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Implement authentication logic here
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-neutral-50"
    >
      <View className="flex-1 justify-end px-5 space-y-4 pb-8">
        <View className="relative mb-16">
          <Image
            source={require("@/assets/images/icon.png")}
            className="w-24 h-24 rounded-full mb-15"
          />
        </View>
        <AnimatePresence presenceAffectsLayout>
          <MotiText
            className="text-5xl font-dm-bold mb-5"
            style={{ letterSpacing: -2.25, lineHeight: 48 }}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
          >
            Welcome to Enaleia Hub
          </MotiText>
        </AnimatePresence>
        <View>
          <Text className="font-dm-medium mb-1">Email</Text>
          <TextInput
            className="h-12 border border-neutral-300 rounded-lg px-4 text-base bg-gray-50"
            value={email}
            onChangeText={setEmail}
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View className="mt-2">
          <Text className="font-dm-medium mb-1">Password</Text>
          <TextInput
            className="h-12 border border-neutral-300 rounded-lg px-4 text-base bg-gray-50"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <Pressable
          className={`h-12 rounded-lg justify-center items-center mt-2 ${
            isLoading ? "bg-gray-400" : "bg-primary-dark-blue"
          }`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text
            className="text-white text-lg font-dm-bold"
            style={{ letterSpacing: -0.02 }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </Pressable>

        <Text
          className="text-sm text-gray-600 font-dm-regular"
          style={{ letterSpacing: 0.04 }}
        >
          Enaleia Hub is invite-only for ecosystem partners. Need help logging
          in? Contact support.
        </Text>
      </View>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
