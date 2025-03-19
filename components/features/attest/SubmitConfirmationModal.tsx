import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

interface SubmitConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const SubmitConfirmationModal = ({
  isVisible,
  onClose,
  onProceed,
}: SubmitConfirmationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <View className="flex-row justify-center items-center py-1">
          <Image
            source={require("@/assets/images/animals/SeaHorse.png")}
            className="w-40 h-40"
            accessibilityRole="image"
            accessibilityLabel="ready to attest illustration"
          />
          </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
          Ready to attest?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
          Attestations are permanent and cannot be changed once submitted. Please review all details carefully before proceeding.
        </Text>
        <View className="flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={onClose}
            className="px-4 py-4 rounded-full border border-grey-3 flex-1"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">
              Review
            </Text>
          </Pressable>
          <Pressable
            onPress={onProceed}
            className="px-4 py-4 rounded-full bg-blue-ocean flex-1"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Submit
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}; 