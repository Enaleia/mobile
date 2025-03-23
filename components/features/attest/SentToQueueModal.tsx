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
          accessibilityRole="image"
          accessibilityLabel="Success illustration"
        />
      </View>
      <View className="space-y-2">
        <Text
          className="text-3xl font-dm-bold text-enaleia-black tracking-tighter text-center"
          accessibilityRole="header"
        >
          Attestation queued
        </Text>
        <Text
          className="text-base font-dm-regular text-enaleia-black tracking-tighter text-center"
          accessibilityRole="text"
        >
          Your attestation was sent to the queue for submission.
        </Text>
        <Text
          className="text-sm font-dm-regular text-enaleia-black tracking-tighter text-center"
          accessibilityRole="text"
        >
          <Text className="font-dm-bold">Important:</Text> If working offline, please make sure to get online
          periodically to complete the submission(s).
        </Text>
      </View>
      <View className="flex-row justify-center items-center py-4 gap-2">
        <Pressable
          onPress={() => router.replace("/queue")}
          className="px-2 py-4 rounded-full border border-grey-3 flex-1"
          accessibilityRole="button"
          accessibilityLabel="View queue"
          accessibilityHint="Double tap to go to queue page"
        >
          <Text className="text-base font-dm-medium text-enaleia-black text-center">
            See queue
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="bg-blue-ocean rounded-full p-4 flex-1"
          accessibilityRole="button"
          accessibilityLabel="Go to home"
          accessibilityHint="Double tap to return to home page"
        >
          <Text className="text-white font-dm-regular text-base text-center">
            OK
          </Text>
        </Pressable>
      </View>
    </ModalBase>
  );
};
