import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

interface SignOutModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SignOutModal({
  isVisible,
  onClose,
}: SignOutModalProps) {
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-xl w-[90%] max-w-[350px]">
          <Text className="text-xl font-dm-bold mb-4">Sign Out</Text>
          <Text className="text-base font-dm-light mb-6">
            Are you sure you want to sign out? You will need an internet
            connection to sign back in.
          </Text>
          <View className="flex-row justify-end gap-4">
            <Pressable onPress={onClose} className="py-2 px-4 rounded-full">
              <Text className="text-blue-ocean font-dm-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSignOut}
              className="bg-red-500 py-2 px-4 rounded-full"
            >
              <Text className="text-white font-dm-medium">Sign Out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
