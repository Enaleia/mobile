import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

interface IncompleteAttestationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmitAnyway: () => void;
}

export const IncompleteAttestationModal = ({
  isVisible,
  onClose,
  onSubmitAnyway,
}: IncompleteAttestationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <View className="items-center mb-4">
          <Image
            source={require("@/assets/images/empty_fields.webp")}
            className="w-[88px] h-[88px]"
            accessibilityLabel="Empty fields illustration"
            accessibilityRole="image"
          />
        </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
          Are you sure you want to submit with empty fields?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
          Some fields are empty & might be required. If needed, fill them before proceeding.
        </Text>
        <Text className="text-sm font-dm-regular text-enaleia-black italic mb-6 text-center">
          <Text className="font-dm-bold">Important:</Text> Attestations cannot be modified once submitted.
        </Text>
        <View className="flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={onClose}
            className="px-2 py-4 rounded-full border border-grey-3 flex-1"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">
              Review
            </Text>
          </Pressable>
          <Pressable
            onPress={onSubmitAnyway}
            className="px-5 py-4 rounded-full bg-blue-ocean flex-1"
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
