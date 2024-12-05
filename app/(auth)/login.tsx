import LoginForm from "@/components/LoginForm";
import { useNavigation } from "expo-router";
import { AnimatePresence, MotiText } from "moti";
import React, { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { Trans } from "@lingui/react/macro";

export default function LoginScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ statusBarStyle: "dark" });
  }, [navigation]);

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
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 100,
              delay: 200,
            }}
          >
            <Trans>Welcome to Enaleia Hub</Trans>
          </MotiText>
        </AnimatePresence>
        <LoginForm />
        <Text
          className="text-sm text-gray-600 font-dm-regular"
          style={{ letterSpacing: 0.025 }}
        >
          <Trans>
            Enaleia Hub is invite-only for ecosystem partners. Need help logging
            in? Contact support.
          </Trans>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
