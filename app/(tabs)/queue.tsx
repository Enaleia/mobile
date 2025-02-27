import QueueSection from "@/components/features/queue/QueueSection";
import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { QueueItemStatus } from "@/types/queue";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Text, View, ScrollView } from "react-native";

const QueueScreen = () => {
  const { queueItems, loadQueueItems, retryItems, completedCount } = useQueue();
  const navigation = useNavigation();

  const items = queueItems.length > 0 ? queueItems : [];

  const pendingItems = items.filter(
    (i) => i && i.status === QueueItemStatus.PENDING
  );

  const processingItems = items.filter(
    (i) => i && i.status === QueueItemStatus.PROCESSING
  );

  const failedItems = items.filter(
    (i) => i && i.status === QueueItemStatus.FAILED
  );

  const offlineItems = items.filter(
    (i) => i && i.status === QueueItemStatus.OFFLINE
  );

  const completedItems = items.filter(
    (i) => i && i.status === QueueItemStatus.COMPLETED
  );

  useEffect(() => {
    const numPending = items.filter(
      (i) => i && i.status !== QueueItemStatus.COMPLETED
    ).length;

    navigation.setOptions({
      tabBarBadge: numPending > 0 ? numPending : undefined,
    });
  }, [items]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const hasNoItems = items.length === 0;

  return (
    <SafeAreaContent>
      <View className="flex-1">
        <NetworkStatus />
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {hasNoItems ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color="#4CAF50"
              />
              <Text className="text-lg text-center mt-4 font-medium">
                Queue is Empty
              </Text>
              <Text className="text-sm text-center text-gray-600 mt-2">
                All actions have been processed successfully. Create a new
                action to see it here.
              </Text>
            </View>
          ) : (
            <View className="flex-1 py-4">
              {pendingItems.length > 0 && (
                <QueueSection
                  title="Pending"
                  items={pendingItems}
                  onRetry={retryItems}
                />
              )}

              {processingItems.length > 0 && (
                <QueueSection
                  title="Processing"
                  items={processingItems}
                  onRetry={retryItems}
                />
              )}

              {failedItems.length > 0 && (
                <QueueSection
                  title="Failed"
                  items={failedItems}
                  onRetry={retryItems}
                  showRetry={true}
                />
              )}

              {offlineItems.length > 0 && (
                <QueueSection
                  title="Offline"
                  items={offlineItems}
                  onRetry={retryItems}
                  showRetry={true}
                />
              )}

              {completedItems && completedItems.length > 0 && (
                <QueueSection
                  title="Completed"
                  items={completedItems}
                  onRetry={retryItems}
                  showRetry={false}
                  isCollapsible={true}
                />
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaContent>
  );
};

export default QueueScreen;
