import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  StatusBar,
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
  // Get the current status bar height to add proper padding
  const statusBarHeight = StatusBar.currentHeight || 0;
  const isIOS = Platform.OS === "ios";

  // Add extra padding for iOS devices
  const iosPaddingTop = isIOS ? 10 : 0;

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent={true}
      animationType="fade"
      accessibilityViewIsModal={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-slate-950/75"
        style={{
          paddingTop: isIOS ? statusBarHeight + iosPaddingTop : 16,
          paddingHorizontal: 12,
          paddingBottom: 12,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
          accessibilityRole="none"
        >
          <View
            className="bg-slate-50 p-3 rounded-lg relative"
            accessibilityRole="alert"
            accessibilityLabel="Modal dialog"
            style={{
              maxHeight: isIOS ? "90%" : undefined,
            }}
          >
            {children}

            {canClose && (
              <Pressable
                onPress={onClose}
                className={`h-10 w-10 absolute right-2 ${
                  isIOS ? "top-4" : "top-3"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                accessibilityHint="Double tap to close this dialog"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
