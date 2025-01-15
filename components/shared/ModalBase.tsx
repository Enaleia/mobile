import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

interface ModalBaseProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  canClose?: boolean;
}

export default function ModalBase({
  isVisible,
  onClose,
  children,
  canClose = true,
}: ModalBaseProps) {
  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent={true}
      animationType="fade"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-slate-950/75 p-3"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-slate-50 p-3 rounded-lg relative">
            {children}

            {canClose && (
              <Pressable
                onPress={onClose}
                className="h-10 w-10 absolute right-0 top-3"
              >
                <Ionicons name="close" size={24} color="gray" />
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
