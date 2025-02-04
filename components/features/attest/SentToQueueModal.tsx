import ModalBase from "@/components/shared/ModalBase";
import { router } from "expo-router";
import { View } from "moti";
import { Image, Pressable, Text } from "react-native";

export const SentToQueueModal = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="flex-row justify-center items-center py-4">
        <Image
          source={require("@/assets/images/animals/Fish.png")}
          className="w-[133px] h-[134px]"
        />
      </View>
      <View className="space-y-2">
        <Text className="text-xl font-dm-bold text-enaleia-black tracking-tighter text-center">
          Attestation queued successfully
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter text-center">
          Your attestation was sent to the queue for submission.
        </Text>
        <Text className="text-sm font-dm-regular text-enaleia-black tracking-tighter text-center">
          Important: If working offline, please make sure to get online
          periodically to complete the submission(s).
        </Text>
      </View>
      <View className="flex-row justify-center items-center py-4 gap-2">
        <Pressable
          onPress={() => router.replace("/queue")}
          className="border border-blue-ocean rounded-full bg-slate-50 p-3 flex-1"
        >
          <Text className="text-blue-ocean font-dm-regular text-base text-center">
            See queue
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="bg-blue-ocean rounded-full p-3 flex-1"
        >
          <Text className="text-white font-dm-regular text-base text-center">
            Go home
          </Text>
        </Pressable>
      </View>
    </ModalBase>
  );
};
