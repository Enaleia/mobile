import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View } from "react-native";

interface LeaveAttestationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
}

export const LeaveAttestationModal = ({
  isVisible,
  onClose,
  onConfirmLeave,
}: LeaveAttestationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="px-4 pt-2 pb-4">
        <Text
          className="text-xl font-dm-bold text-enaleia-black tracking-[-0.5px] mb-3"
          accessibilityRole="header"
        >
          Leave without saving?
        </Text>
        <Text
          className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight"
          accessibilityRole="text"
        >
          You have unsaved changes. Are you sure you want to leave? Your entries
          will be lost.
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onClose}
            className="px-4 py-2 rounded-full border border-grey-3"
            accessibilityRole="button"
            accessibilityLabel="Keep editing"
            accessibilityHint="Double tap to continue editing"
          >
            <Text className="text-base font-dm-medium text-enaleia-black">
              Keep editing
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirmLeave}
            className="px-4 py-2 rounded-full bg-red-500"
            accessibilityRole="button"
            accessibilityLabel="Leave without saving"
            accessibilityHint="Double tap to discard changes and leave"
          >
            <Text className="text-base font-dm-medium text-white">Leave</Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
