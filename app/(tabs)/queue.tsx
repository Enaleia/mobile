import QueueSection from "@/components/features/queue/QueueSection";
import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { filterQueueItems, getAttentionCount } from "@/utils/queue";
import { clearOldCache } from "@/utils/queueStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Text, View, ScrollView, Pressable } from "react-native";

const QueueScreen = () => {
  const { queueItems, loadQueueItems, retryItems } = useQueue();
  const navigation = useNavigation();

  const items = queueItems.length > 0 ? queueItems : [];
  const { processingItems, pendingItems, failedItems, completedItems } =
    filterQueueItems(items);
  const attentionCount = getAttentionCount(items);

  useEffect(() => {
    navigation.setOptions({
      tabBarBadge: attentionCount > 0 ? attentionCount : undefined,
    });
  }, [attentionCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const handleClearOldCache = async () => {
    await clearOldCache();
    await loadQueueItems();
  };

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
              <Pressable
                onPress={handleClearOldCache}
                className="mt-8 bg-gray-100 px-4 py-2 rounded-lg"
              >
                <Text className="text-sm text-gray-600">
                  Clear Old Cache Data
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 py-4">
              {processingItems.length > 0 && (
                <QueueSection
                  title="Processing"
                  items={processingItems}
                  onRetry={retryItems}
                  showRetry={false}
                />
              )}

              {pendingItems.length > 0 && (
                <QueueSection
                  title="Pending"
                  items={pendingItems}
                  onRetry={retryItems}
                  showRetry={true}
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

              {completedItems.length > 0 && (
                <QueueSection
                  title="Completed"
                  items={completedItems}
                  onRetry={retryItems}
                  showRetry={false}
                  isCollapsible={true}
                />
              )}

              <Pressable
                onPress={handleClearOldCache}
                className="mt-8 bg-gray-100 px-4 py-2 rounded-lg self-center"
              >
                <Text className="text-sm text-gray-600">
                  Clear Old Cache Data
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaContent>
  );
};

export default QueueScreen;
