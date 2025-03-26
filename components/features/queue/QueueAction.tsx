import { useBatchData } from "@/hooks/data/useBatchData";
import { EAS_CONSTANTS } from "@/services/eas";
import { Action } from "@/types/action";
import { QueueItem, QueueItemStatus, ServiceStatus, PROCESSING_TIMEOUT } from "@/types/queue";
import { isProcessingItem } from "@/utils/queue";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import QueueStatusIndicator from "./QueueStatusIndicator";
import { useEffect, useState } from "react";
import { ProcessingSpinner } from "./ProcessingSpinner";

interface QueueActionProps {
  item: QueueItem;
}

const QueueAction = ({ item }: QueueActionProps) => {
  const { actions } = useBatchData();
  const action = actions?.find((a: Action) => a.id === item.actionId);
  const timestamp = item.lastAttempt || item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp))
    .replace(/(\d+)(?=(,))/, (match) => {
      const num = parseInt(match);
      const suffix = ["th", "st", "nd", "rd"][(num % 10 > 3 || num % 100 - num % 10 == 10) ? 0 : num % 10];
      return num + suffix;
    });

  // Progress bar state
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (item.status === QueueItemStatus.PROCESSING && item.lastAttempt) {
      const startTime = new Date(item.lastAttempt).getTime();
      const updateProgress = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const newProgress = Math.min((elapsed / PROCESSING_TIMEOUT) * 100, 100);
        setProgress(newProgress);
      };

      // Update immediately and then every second
      updateProgress();
      intervalId = setInterval(updateProgress, 1000);
    } else if (item.status === QueueItemStatus.COMPLETED) {
      setProgress(100);
    } else {
      setProgress(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [item.status, item.lastAttempt]);

  if (!action) return null;

  return (
    <Pressable
      onPress={() => {
        console.log("Navigating to queue detail with id:", item.localId);
        router.push(`/queue/${item.localId}`);
      }}
      className="relative"
    >
      <View className="w-full bg-white border-b border-grey-3">
        <View className="pt-3 pb-2 px-3 flex-col gap-6">
          {/* Header Section */}
          <View className="flex-row justify-between items-start">
            <View className="flex-1 h-10 justify-start items-center">
              <View className="w-full h-full flex-row items-center gap-1">
                <View className="w-full h-full flex-col justify-start items-start gap-1">
                  <Text className="text-xl font-dm-bold text-enaleia-black" numberOfLines={1}>
                    {action.name}
                  </Text>
                  <Text className="text-sm font-dm-medium text-grey-6">
                    {formattedTime}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-1 h-[32px] flex-col justify-center items-end gap-1 mt-1">
              <View className="flex-row items-center gap-1">
                <QueueStatusIndicator status={item.status} />
              </View>
            </View>
          </View>

          {/* Service Status Section */}
          <View className="flex-col gap-1 pt-3 pb-2">
            <View className="flex flex-row items-left">
              <ServiceStatusIndicator
                status={item.directus?.status || ServiceStatus.PENDING}
                type="directus"    
                extraClasses="mr-2"           
              />
              <ServiceStatusIndicator
                status={item.eas?.status || ServiceStatus.PENDING}
                type="eas"
                extraClasses="mr-2" 
              />
              <ServiceStatusIndicator
                status={item.directus?.linked ? ServiceStatus.COMPLETED : ServiceStatus.PENDING}
                type="linking"
              />
            </View>

            {/* Error Messages */}
            {(item.directus?.error || item.eas?.error) &&
              item.status !== QueueItemStatus.COMPLETED && (
                <View className="flex-col gap-1">
                  {item.directus?.error && (
                    <Text className="text-rose-500 text-xs font-dm-light">
                      Database: {item.directus.error}
                    </Text>
                  )}
                  {item.eas?.error && (
                    <Text className="text-rose-500 text-xs font-dm-light">
                      Blockchain: {item.eas.error}
                    </Text>
                  )}
                </View>
              )}
          </View>
        </View>

        {/* Progress Bar */}
        <View className="w-full h-1 relative overflow-hidden">
          {/* Background bar */}
          <View className="w-full h-full bg-grey-3" />
          {/* Progress bar */}
          <View 
            className={`h-full absolute left-0 top-0 ${
              item.status === QueueItemStatus.COMPLETED ? 'bg-[#A4C6E1]' :
              item.status === QueueItemStatus.PROCESSING ? 'bg-[#A4C6E1]' :
              'bg-grey-2'
            }`}
            style={{ width: `${progress}%` }}
          />
          {/* Processing Spinner */}
          {item.status === QueueItemStatus.PROCESSING && (
            <View className="absolute right-2 top-1/2 -translate-y-1/2">
              <ProcessingSpinner size={8} color="#A4C6E1" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default QueueAction;
