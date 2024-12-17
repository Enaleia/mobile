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
import SafeAreaContent from "@/components/SafeAreaContent";

export default function LoginScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ statusBarStyle: "dark" });
  }, [navigation]);

  return (
    <SafeAreaContent>
      <View className="absolute top-36 right-[-30px] bg-white-sand">
        <Image
          source={require("@/assets/images/animals/Turtle.png")}
          className="w-[223px] h-[228px]"
        />
      </View>
      <View className="mb-8">
        <Image
          source={require("@/assets/images/logo-gray.webp")}
          className="w-[86px] h-[89px] rounded-full"
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100}
        className="flex-1 justify-end"
      >
        <AnimatePresence presenceAffectsLayout>
          <MotiText
            className="text-3xl font-dm-bold"
            style={{ letterSpacing: -1, lineHeight: 31.35008 }}
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
        <Text className="text-base font-dm-light">
          Please sign in with the provided credential
        </Text>
        <View className="flex-1">
          <LoginForm />
        </View>
      </KeyboardAvoidingView>
      <Text className="text-sm text-grey-8 font-dm-light">
        <Trans>
          The Enaleia Hub is an invite-only application designed for ecosystem
          partners to securely submit data to the blockchain. If you have lost
          your login information, please click here to contact support.
        </Trans>
      </Text>
    </SafeAreaContent>
  );
}
