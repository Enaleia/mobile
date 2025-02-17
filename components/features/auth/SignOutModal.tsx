import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import ModalBase from "@/components/shared/ModalBase";
import { directus } from "@/utils/directus";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

interface SignOutModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SignOutModal({
  isVisible,
  onClose,
}: SignOutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        directus.logout(),
        queryClient.cancelQueries(),
        queryClient.clear(),
      ]);

      router.replace("/login");
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="px-4 py-6">
        <Text
          className="text-2xl font-dm-bold text-slate-800 tracking-[-0.5px] mb-2"
          accessibilityRole="header"
        >
          Sign Out
        </Text>
        <Text
          className="text-base font-dm-regular text-slate-600 mb-6"
          accessibilityRole="text"
        >
          Are you sure you want to sign out?
        </Text>

        <View className="flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 p-3 border border-slate-200 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Cancel sign out"
            accessibilityHint="Double tap to cancel sign out"
          >
            <Text className="text-center font-dm-medium text-slate-800">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            disabled={isLoading}
            className="flex-1 p-3 bg-blue-ocean rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Confirm sign out"
            accessibilityHint="Double tap to sign out of your account"
            accessibilityState={{ disabled: isLoading }}
          >
            <Text className="text-center font-dm-medium text-white">
              {isLoading ? "Signing out..." : "Sign Out"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}
