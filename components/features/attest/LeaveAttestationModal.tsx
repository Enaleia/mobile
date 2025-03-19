import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

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
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-3 pb-4">
      <View className="flex-row justify-center items-center py-1">
        <Image
          source={require("@/assets/images/animals/FishFin.png")}
          className="w-40 h-40"
          accessibilityRole="image"
          accessibilityLabel="Success illustration"
        />
        </View>
        <Text
          className="text-3xl font-dm-bold text-enaleia-black tracking-[-0.5px] mb-3 text-center"
          accessibilityRole="header"
        >
          Going back to home page?
        </Text>
        <Text
          className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center"
          accessibilityRole="text"
        >
          You have unsaved changes. Doing so means you will loose all your currently entered data.
        </Text>
        <View className="flex-row items-center gap-2">     
          <Pressable
            onPress={onConfirmLeave}
            className="px-4 py-3 rounded-full border-[1.5px] border-grey-3 bg-white flex-1"
            accessibilityRole="button"
            accessibilityLabel="Leave without saving"
            accessibilityHint="Double tap to discard changes and leave"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">Leave</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="px-4 py-3 rounded-full bg-blue-ocean flex-1"
            accessibilityRole="button"
            accessibilityLabel="Keep editing"
            accessibilityHint="Double tap to continue editing"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Keep editing
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
