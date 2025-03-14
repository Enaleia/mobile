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
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
          Are you sure you want to submit with empty fields?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
          Some fields are empty & might be required. If needed, fill them before proceeding.
        </Text>
        <Text className="text-sm font-dm-regular text-neutral-500 italic mb-6 text-center">
          Important: Attestations cannot be modified after submission.
        </Text>
        <View className="flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={onClose}
            className="px-2 py-4 rounded-full border border-grey-3 flex-1"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">
              Go back
            </Text>
          </Pressable>
          <Pressable
            onPress={onSubmitAnyway}
            className="px-3 py-4 rounded-full bg-blue-ocean flex-1"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Submit anyway
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
