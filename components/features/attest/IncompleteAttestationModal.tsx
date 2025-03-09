import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View } from "react-native";

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
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="px-4 pt-2 pb-4">
        <Text className="text-xl font-dm-bold text-enaleia-black tracking-[-0.5px] mb-3">
          Missing information?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight">
          We noticed some fields haven't been filled out yet. You can go back to
          add them, or continue if you're sure.
        </Text>
        <Text className="text-sm font-dm-regular text-neutral-500 italic mb-6">
          Note: Attestations cannot be modified after submission.
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onClose}
            className="px-4 py-2 rounded-full border border-grey-3"
          >
            <Text className="text-base font-dm-medium text-enaleia-black">
              Review entries
            </Text>
          </Pressable>
          <Pressable
            onPress={onSubmitAnyway}
            className="px-4 py-2 rounded-full bg-blue-ocean w-[50%]"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Continue
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
