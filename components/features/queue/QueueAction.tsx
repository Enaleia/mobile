import { useBatchData } from "@/hooks/data/useBatchData";
import { EAS_CONSTANTS } from "@/services/eas";
import { Action } from "@/types/action";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";
import { isProcessingItem } from "@/utils/queue";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import ProcessingPill from "./ProcessingPill";
import { router } from "expo-router";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";

interface QueuedActionProps {
  item: QueueItem;
}

const QueuedAction = ({ item }: QueuedActionProps) => {
  const { actions } = useBatchData();
  const action = actions?.find((a: Action) => a.id === item.actionId);
  const timestamp = item.lastAttempt || item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

  if (!action) return null;
  const isProcessing = isProcessingItem(item);

  return (
    <Pressable
      onPress={() => {
        console.log("Navigating to queue detail with id:", item.localId);
        router.push(`/queue/${item.localId}`);
      }}
      className="bg-white px-6 py-4 border-b border-gray-200 active:opacity-70"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 flex-col gap-1">
          <Text
            className="font-dm-bold text-base tracking-tight"
            numberOfLines={1}
          >
            {action.name}
          </Text>
          <Text className="text-gray-600 text-sm">{formattedTime}</Text>

          {/* Service Status Indicators */}
          <View className="flex-row space-x-3">
            <ServiceStatusIndicator
              status={item.directus?.status || ServiceStatus.PENDING}
              type="directus"
              extraClasses="mr-3"
            />
            <ServiceStatusIndicator
              status={item.eas?.status || ServiceStatus.PENDING}
              type="eas"
              extraClasses="mr-3"
            />
            <ServiceStatusIndicator
              status={item.directus?.linked ? ServiceStatus.COMPLETED : ServiceStatus.PENDING}
              type="linking"
            />
          </View>
        </View>
        {isProcessing && <ProcessingPill />}
      </View>

      {/* Error Messages */}
      {(item.directus?.error || item.eas?.error) &&
        item.status !== QueueItemStatus.COMPLETED && (
          <View className="mt-2">
            {item.directus?.error && (
              <Text className="text-grey-6 text-sm" numberOfLines={2}>
                Database: {item.directus.error}
              </Text>
            )}
            {item.eas?.error && (
              <Text className="text-grey-6 text-sm" numberOfLines={2}>
                Blockchain: {item.eas.error}
              </Text>
            )}
          </View>
        )}

      {/* EAS Transaction Hash */}
      {item.eas?.txHash && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            item.eas?.txHash &&
              Linking.openURL(
                EAS_CONSTANTS.getAttestationUrl(
                  item.eas.txHash,
                  item.eas.network || "sepolia"
                )
              );
          }}
        >
          <Text
            className="text-xs text-blue-500 underline mt-1"
            numberOfLines={1}
          >
            See the attestation on ({item.eas.network || "sepolia"})
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default QueuedAction;
