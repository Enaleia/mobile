import LoginForm from "@/components/LoginForm";
import SafeAreaContent from "@/components/SafeAreaContent";
import { Trans } from "@lingui/react/macro";
import { AnimatePresence, MotiText } from "moti";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

const KEYBOARD_OFFSET = Platform.OS === "ios" ? 0 : 500;
const KEYBOARD_BEHAVIOR = Platform.OS === "ios" ? "padding" : "height";

export default function LoginScreen() {
  return (
    <SafeAreaContent>
      <View className="absolute top-36 right-[-30px] bg-white-sand">
        <Image
          source={require("@/assets/images/animals/Turtle.png")}
          className="w-[223px] h-[228px]"
          accessibilityLabel="Decorative turtle illustration"
          accessibilityRole="image"
        />
      </View>
      <KeyboardAvoidingView
        behavior={KEYBOARD_BEHAVIOR}
        keyboardVerticalOffset={KEYBOARD_OFFSET}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
          }}
        >
          <View className="mb-8 relative">
            <Image
              source={require("@/assets/images/logo-gray.webp")}
              className="w-[86px] h-[89px] rounded-full"
              accessibilityLabel="Enaleia Hub logo"
              accessibilityRole="image"
            />
          </View>
          <View className="">
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
            <Text className="text-base font-dm-light mb-3">
              Please sign in with the provided credential
            </Text>
            <LoginForm />
            <Text className="text-sm text-grey-8 font-dm-light mt-6 leading-[16.8px]">
              {/* TODO: Add link to support. example: */}
              {/* <Link
                href="/support"
                className="text-blue-ocean font-dm-bold"
                accessibilityLabel="Link to support"
                accessibilityRole="link"
              >
                <Trans>Contact support</Trans>
              </Link> */}
              <Trans>
                The Enaleia Hub is an invite-only application designed for
                ecosystem partners to securely submit data to the blockchain. If
                you have lost your login information, please click here to
                contact support.
              </Trans>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaContent>
  );
}
